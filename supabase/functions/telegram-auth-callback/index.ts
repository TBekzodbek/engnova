/**
 * telegram-auth-callback — Supabase Edge Function.
 *
 * Receives Telegram Bot API webhook updates from @<TG_BOT_USERNAME>.
 * Handles the app-side Telegram Login flow end-to-end:
 *
 *   1. User taps "Telegram bilan davom etish" in EngnovaLoginScreen
 *      → app opens tg://resolve?domain=<BOT>&start=login_<nonce>
 *   2. Telegram delivers "/start login_<nonce>" to bot → we receive here
 *      → we stage a row (nonce, tg_user_id) in telegram_sessions
 *      → we reply with a "Share your phone" Contact-request keyboard
 *   3. User taps Share → Telegram delivers a Contact update → we receive here
 *      → we generate a Supabase magic-link token for tg-<phone>@engnova.uz
 *      → we fill the staged row with { email, token, phone, first_name }
 *      → we tell the user "Success — return to Engnova app"
 *   4. Meanwhile the app is polling `poll_telegram_session(nonce)` every ~2s
 *      → once the row is populated, RPC returns { email, token }
 *      → app calls supabase.auth.verifyOtp({ type:'magiclink', token_hash,
 *        email }) → session established → SetPasswordScreen
 *
 * Deploy:  supabase functions deploy telegram-auth-callback --no-verify-jwt
 * Secrets: supabase secrets set TG_BOT_TOKEN=... TG_WEBHOOK_SECRET=...
 * Webhook: POST https://api.telegram.org/bot<TOKEN>/setWebhook
 *              body: { url: '<function-url>', secret_token: '<TG_WEBHOOK_SECRET>' }
 *
 * SECURITY:
 *   - `--no-verify-jwt` is REQUIRED — Telegram doesn't send a Supabase JWT.
 *   - The `x-telegram-bot-api-secret-token` header is our anti-spoof check:
 *     we set it when registering the webhook, and Telegram echoes it on every
 *     call. Reject requests that don't match.
 *   - Never log the bot token or the raw update body (which contains phone).
 */

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Config from Edge Function secrets ────────────────────────────────────────
const BOT_TOKEN                 = Deno.env.get('TG_BOT_TOKEN') ?? ''
const WEBHOOK_SECRET            = Deno.env.get('TG_WEBHOOK_SECRET') ?? ''
const SUPABASE_URL              = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
})

// ── Bot API wrapper ──────────────────────────────────────────────────────────
async function tg(method: string, body: Record<string, unknown>) {
    return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
    })
}

// ── Copy (Uzbek, house voice) ────────────────────────────────────────────────
const COPY = {
    askPhone:   "Xush kelibsiz! Engnova'ga kirish uchun quyidagi tugmani bosib telefon raqamingizni ulashing.",
    shareBtn:   "📱 Telefonimni ulashish",
    noNonce:    "Iltimos, avval Engnova ilovasidan \"Telegram bilan davom etish\" tugmasini bosing, keyin bu botga qayting.",
    ok:         "Muvaffaqiyatli! Endi Engnova ilovasiga qayting — sizni avtomatik kiritamiz.",
    error:      "Xato yuz berdi. Bir daqiqadan keyin qayta urinib ko'ring.",
} as const

// ── HTTP handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
    // Anti-spoof: reject anything that doesn't come from Telegram with our
    // pre-shared secret. Not a full replacement for HMAC but Telegram's
    // documented webhook security mechanism.
    if (WEBHOOK_SECRET) {
        const header = req.headers.get('x-telegram-bot-api-secret-token')
        if (header !== WEBHOOK_SECRET) {
            return new Response('unauthorized', { status: 401 })
        }
    }

    let update: Record<string, unknown>
    try {
        update = await req.json() as Record<string, unknown>
    } catch {
        return new Response('bad request', { status: 400 })
    }

    // Only handle direct messages (not channel posts, callback queries, etc.)
    const msg = (update as { message?: TelegramMessage }).message
    if (!msg || !msg.from || !msg.chat) return new Response('ok')

    try {
        // ── Case 1: /start login_<nonce> ────────────────────────────────
        if (typeof msg.text === 'string' && msg.text.startsWith('/start ')) {
            const startParam = msg.text.slice(7).trim()
            if (!startParam.startsWith('login_')) return new Response('ok')
            const nonce = startParam.slice('login_'.length)

            // Stage the nonce with the requester's tg_user_id so we can
            // match the Contact share back to this nonce later.
            const { error } = await supabase
                .from('telegram_sessions')
                .upsert({ nonce, tg_user_id: msg.from.id }, { onConflict: 'nonce' })
            if (error) {
                console.error('stage nonce failed', error.message)
                await tg('sendMessage', { chat_id: msg.chat.id, text: COPY.error })
                return new Response('ok')
            }

            await tg('sendMessage', {
                chat_id: msg.chat.id,
                text:    COPY.askPhone,
                reply_markup: {
                    keyboard: [[{ text: COPY.shareBtn, request_contact: true }]],
                    resize_keyboard:  true,
                    one_time_keyboard: true,
                },
            })
            return new Response('ok')
        }

        // ── Case 2: Contact shared ──────────────────────────────────────
        if (msg.contact) {
            const phoneRaw = msg.contact.phone_number
            const phone    = phoneRaw.startsWith('+') ? phoneRaw : `+${phoneRaw}`
            const tgUserId = msg.from.id

            // Find the freshest pending nonce for this tg_user_id. Bounded
            // by 5 min so we don't sign in against a stale session.
            const { data: pending } = await supabase
                .from('telegram_sessions')
                .select('nonce')
                .eq('tg_user_id', tgUserId)
                .is('email', null)
                .gte('created_at', new Date(Date.now() - 5 * 60_000).toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (!pending) {
                await tg('sendMessage', { chat_id: msg.chat.id, text: COPY.noNonce })
                return new Response('ok')
            }

            // Derive a stable email keyed by phone so re-logins land on the
            // same auth.users row. Digits only, prefixed to avoid collision
            // with real email signups.
            const digits = phone.replace(/[^0-9]/g, '')
            const email  = `tg-${digits}@engnova.uz`

            // Create the user if they don't exist (idempotent-ish). If exists,
            // admin.createUser returns an error we swallow — the subsequent
            // generateLink call still works against the existing user.
            const createRes = await supabase.auth.admin.createUser({
                email,
                phone,
                email_confirm: true,
                user_metadata: {
                    telegram_user_id:    tgUserId,
                    telegram_first_name: msg.from.first_name ?? null,
                    telegram_username:   msg.from.username   ?? null,
                    tg_phone:            phone,
                },
            })
            if (createRes.error && !/already registered|already exists/i.test(createRes.error.message)) {
                console.error('createUser unexpected error', createRes.error.message)
                await tg('sendMessage', { chat_id: msg.chat.id, text: COPY.error })
                return new Response('ok')
            }

            // Generate a magic-link token the app can verify to sign in.
            // `hashed_token` is the value the client passes to verifyOtp
            // with type: 'magiclink'.
            const linkRes = await supabase.auth.admin.generateLink({
                type:  'magiclink',
                email,
            })
            if (linkRes.error || !linkRes.data?.properties?.hashed_token) {
                console.error('generateLink failed', linkRes.error?.message)
                await tg('sendMessage', { chat_id: msg.chat.id, text: COPY.error })
                return new Response('ok')
            }
            const tokenHash = linkRes.data.properties.hashed_token

            // Fill the staged row — the app's poll will now succeed.
            await supabase
                .from('telegram_sessions')
                .update({
                    email,
                    token:         tokenHash,
                    tg_phone:      phone,
                    tg_first_name: msg.from.first_name ?? null,
                })
                .eq('nonce', pending.nonce)

            await tg('sendMessage', {
                chat_id: msg.chat.id,
                text:    COPY.ok,
                reply_markup: { remove_keyboard: true },
            })
            return new Response('ok')
        }

        return new Response('ok')
    } catch (e) {
        console.error('handler exception', e instanceof Error ? e.message : String(e))
        try { await tg('sendMessage', { chat_id: msg.chat.id, text: COPY.error }) } catch { /* ignore */ }
        return new Response('ok')
    }
})

// ── Types (minimal, only what we actually read) ──────────────────────────────
interface TelegramMessage {
    message_id: number
    from:       { id: number; first_name?: string; username?: string }
    chat:       { id: number }
    text?:      string
    contact?:   { phone_number: string; user_id?: number; first_name?: string }
}
