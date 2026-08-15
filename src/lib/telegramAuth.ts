/**
 * telegramAuth.ts — Telegram Login flow for Engnova.
 *
 * How it works end-to-end (documented so future-you knows what to wire):
 *
 *   1. User taps "Telegram bilan davom etish" in EngnovaLoginScreen.
 *   2. We open tg://resolve?domain={BOT}&start=login_{nonce} — Telegram app
 *      opens directly to the bot's start command with our nonce.
 *   3. The bot (@EngnovaAuthBot, owner-managed) responds with a Contact
 *      Request keyboard: "Share your phone number to continue".
 *   4. User taps Share. Telegram sends the phone to the bot via a Contact
 *      update. The bot POSTs { nonce, phone, tg_user_id, first_name } to
 *      our Supabase Edge Function `telegram-auth-callback`.
 *   5. The Edge Function verifies the sender IS our bot (bot token secret
 *      compare) and either:
 *        - upserts the auth.users row with phone as identifier
 *        - creates a one-time magic link via supabase.auth.admin.generateLink
 *      and stores the link keyed by nonce.
 *   6. Meanwhile the app polls a public RPC `poll_telegram_session(nonce)`
 *      every 2s; once the link exists, RPC returns it and the app calls
 *      signInWithOtp / verifyOtp to establish the Supabase session.
 *
 * NONE of steps 3-6 exist yet — owner must:
 *   - Create the bot with @BotFather
 *   - Deploy the Edge Function (`supabase/functions/telegram-auth-callback/`)
 *   - Create the poll RPC + a small `telegram_sessions` table (nonce, link,
 *     created_at, consumed_at)
 *   - Set VITE_ENGNOVA_TG_BOT_USERNAME in .env.local
 *
 * Until the env var is set, isTelegramAuthAvailable() returns false and the
 * button is hidden in the login screen — the same "no broken affordances"
 * discipline we use for Google.
 */
import { Browser } from '@capacitor/browser';

const BOT = (import.meta.env.VITE_ENGNOVA_TG_BOT_USERNAME as string | undefined) ?? '';

export function isTelegramAuthAvailable(): boolean {
    return !!BOT && BOT.trim() !== '' && BOT !== 'REPLACE_ME';
}

/**
 * Kick off the Telegram flow. Opens tg:// deep link that jumps to the bot
 * with a nonce. Returns the nonce so the caller can start polling.
 *
 * Fallback: on desktop / web preview where tg:// doesn't resolve, we open
 * https://t.me/<BOT>?start=login_<nonce> in a Browser (Custom Tab on
 * Android), which then hands off to the installed Telegram app.
 */
export function launchTelegramLogin(): { nonce: string } {
    if (!isTelegramAuthAvailable()) {
        throw new Error('telegram-not-configured');
    }
    const nonce = generateNonce();
    const startParam = 'login_' + nonce;
    // Prefer the tg:// scheme (jumps straight into Telegram if installed).
    // Browser.open falls through to the system browser if tg:// isn't
    // registered as a scheme handler.
    const tgUrl  = 'tg://resolve?domain=' + encodeURIComponent(BOT) + '&start=' + encodeURIComponent(startParam);
    const httpUrl = 'https://t.me/' + encodeURIComponent(BOT) + '?start=' + encodeURIComponent(startParam);
    // Try tg:// first; if it fails (no Telegram app), fall back to https://.
    Browser.open({ url: tgUrl }).catch(() => Browser.open({ url: httpUrl }).catch(() => {
        window.open(httpUrl, '_blank', 'noopener,noreferrer');
    }));
    return { nonce };
}

/**
 * Poll our Supabase RPC for a magic link keyed by this nonce. Returns null
 * until the bot has completed its side. Caller should poll every ~2s.
 *
 * WARNING: this depends on the `poll_telegram_session` RPC + Edge Function
 * being deployed. Until then it returns null forever — the login screen
 * should time out after 60s and show a "check Telegram — did you tap
 * Share?" hint.
 */
export async function pollTelegramSession(
    getEngnovaSupabase: () => import('@supabase/supabase-js').SupabaseClient,
    nonce: string,
): Promise<{ email: string; token: string } | null> {
    try {
        const client = getEngnovaSupabase();
        // Server returns a magic-link-style email OTP the app can verify.
        // Shape: { email: 'tg-<phone>@engnova.uz', token: 'xxxxxx' } or null.
        const { data, error } = await client.rpc('poll_telegram_session', { p_nonce: nonce });
        if (error || !data) return null;
        return data as { email: string; token: string };
    } catch {
        return null;
    }
}

// ── nonce ────────────────────────────────────────────────────────────────────
function generateNonce(): string {
    // 128 bits of randomness; hex-encoded so it's URL-safe as-is.
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}
