/**
 * telegramAuth.ts — Telegram Login flow for Engnova.
 *
 * End-to-end:
 *   1. User taps "Telegram bilan davom etish" in EngnovaLoginScreen.
 *   2. launchTelegramLogin() opens tg://resolve?domain={BOT}&start=login_{nonce}.
 *   3. Bot receives /start login_<nonce> → Edge Function stages the nonce,
 *      replies with Contact-request keyboard.
 *   4. User taps Share → Edge Function receives phone, creates auth.users
 *      row, generates a magic-link token via admin.generateLink, writes
 *      { email, token } into telegram_sessions keyed by nonce.
 *   5. App polls public.poll_telegram_session(nonce). RPC returns a table,
 *      so supabase-js hands back Array<{ email, token }> (0 or 1 rows).
 *   6. App calls verifyOtp({ type:'magiclink', token_hash, email }) →
 *      session established.
 *
 * Server-side pieces live at:
 *   - supabase/migrations/20260816130500_telegram_sessions.sql
 *   - supabase/functions/telegram-auth-callback/index.ts
 *
 * Until VITE_ENGNOVA_TG_BOT_USERNAME is set the button stays hidden — same
 * "no broken affordances" discipline as Google.
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
 * Poll poll_telegram_session(nonce). Returns null while the bot hasn't
 * finished; caller polls every ~2s and times out after 60s.
 *
 * The RPC is `returns table(email text, token text)`, so supabase-js hands
 * back `Array<{email, token}>` with 0 or 1 rows. `token` is the magic-link
 * `hashed_token` produced by admin.generateLink server-side — pass it to
 * verifyOtp as `token_hash`, NOT `token`.
 */
export async function pollTelegramSession(
    getEngnovaSupabase: () => import('@supabase/supabase-js').SupabaseClient,
    nonce: string,
): Promise<{ email: string; token: string } | null> {
    try {
        const client = getEngnovaSupabase();
        const { data, error } = await client.rpc('poll_telegram_session', { p_nonce: nonce });
        if (error) return null;
        const rows = data as Array<{ email: string; token: string }> | null;
        if (!rows || rows.length === 0) return null;
        return rows[0];
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
