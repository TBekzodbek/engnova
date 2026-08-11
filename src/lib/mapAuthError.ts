/**
 * mapAuthError.ts — English Supabase SDK errors → shell i18n keys.
 *
 * supabase-js returns AuthApiError with .message strings that:
 *   - are ALWAYS in English (Supabase does not localise them);
 *   - CHANGE between versions (Supabase has quietly rewritten these several
 *     times in the last two years).
 * So we string-match loosely. If nothing matches we fall through to a generic
 * "something went wrong" key — never surface the raw English to a UZ user.
 *
 * The 'network' kind is special: on a real network failure supabase-js THROWS
 * rather than returning an error object. The caller MUST wrap
 * signInWithPassword in try/catch and pass the caught error through here as
 * well, so both branches produce a mappable kind.
 *
 * Ported from D:\cefrprep\src\pages\Login.tsx:355-370 (verified pattern).
 */
export type AuthErrorKind =
    | 'invalid_credentials'
    | 'email_not_confirmed'
    | 'rate_limit'
    | 'network'
    | 'unknown';

export type AuthErrorI18nKey =
    | 'auth.err.invalid_credentials'
    | 'auth.err.email_not_confirmed'
    | 'auth.err.rate_limit'
    | 'auth.err.network'
    | 'auth.err.unknown';

interface Mapped {
    kind: AuthErrorKind;
    i18nKey: AuthErrorI18nKey;
}

const KEY_FOR: Record<AuthErrorKind, AuthErrorI18nKey> = {
    invalid_credentials: 'auth.err.invalid_credentials',
    email_not_confirmed: 'auth.err.email_not_confirmed',
    rate_limit:          'auth.err.rate_limit',
    network:             'auth.err.network',
    unknown:             'auth.err.unknown',
};

export function mapAuthError(err: unknown): Mapped {
    // Native fetch / TypeError → network. supabase-js throws these on
    // total failure (DNS, offline, cert error, Cloudflare block).
    if (err instanceof TypeError) return { kind: 'network', i18nKey: KEY_FOR.network };
    // Some browsers wrap it in Error("Failed to fetch") without the TypeError class.
    const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
    const msg = raw.toLowerCase();
    if (!msg) return { kind: 'unknown', i18nKey: KEY_FOR.unknown };

    if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed')) {
        return { kind: 'network', i18nKey: KEY_FOR.network };
    }
    // "Invalid login credentials" (2023) → "invalid_credentials" (2024+ error code).
    if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials') ||
        msg.includes('invalid credentials')) {
        return { kind: 'invalid_credentials', i18nKey: KEY_FOR.invalid_credentials };
    }
    if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed') ||
        msg.includes('not confirmed')) {
        return { kind: 'email_not_confirmed', i18nKey: KEY_FOR.email_not_confirmed };
    }
    if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('over_email_send_rate_limit')) {
        return { kind: 'rate_limit', i18nKey: KEY_FOR.rate_limit };
    }
    return { kind: 'unknown', i18nKey: KEY_FOR.unknown };
}
