/**
 * googleAuth.ts — thin wrapper around @capgo/capacitor-social-login for Google.
 *
 * Flow (native Android):
 *   1. App boot: initGoogleAuth() calls SocialLogin.initialize({google:{webClientId}})
 *   2. User taps "Continue with Google" in LoginScreen
 *   3. signInWithGoogle() → SocialLogin.login({provider:'google'})
 *   4. Native Google account picker (Play Services); user picks account
 *   5. Plugin returns { idToken, profile: {email, name, ...} }
 *   6. Caller passes idToken to supabase.auth.signInWithIdToken({provider:'google', token})
 *   7. Supabase verifies the token against the same Web Client ID configured
 *      in its Google Auth provider, creates/authenticates the user
 *
 * Web preview (npm run dev): SocialLogin.login throws PluginNotImplementedError
 * on the web fallback. isGoogleSignInAvailable() returns false so LoginScreen
 * hides the button entirely — no broken affordance.
 *
 * Config: VITE_GOOGLE_WEB_CLIENT_ID env var (baked in at build time).
 * When empty, the button is also hidden — safe to ship the code before
 * the Google Cloud setup is done.
 *
 * Owner setup: store-assets/google-signin-setup.md walks through the
 * Google Cloud Console + Supabase provider config.
 */
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';

const WEB_CLIENT_ID = (import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined) ?? '';

let initialized = false;
let initPromise: Promise<void> | null = null;

/**
 * True when the plugin is usable end-to-end:
 *   - Running on a native platform (Android; iOS not shipped)
 *   - Web Client ID is set at build time (non-empty)
 *   - Plugin is registered in the runtime bridge
 * When false, LoginScreen hides the Google button entirely so users never
 * tap something that would fail silently.
 */
export function isGoogleSignInAvailable(): boolean {
    try {
        if (!Capacitor.isNativePlatform()) return false;
        if (!WEB_CLIENT_ID || WEB_CLIENT_ID.trim() === '') return false;
        return Capacitor.isPluginAvailable('SocialLogin');
    } catch {
        return false;
    }
}

/**
 * Initialize the plugin ONCE. Called lazily on first signInWithGoogle().
 * Idempotent — safe to call multiple times; init only runs once.
 */
async function ensureInitialized(): Promise<void> {
    if (initialized) return;
    if (initPromise) return initPromise;
    initPromise = (async () => {
        await SocialLogin.initialize({
            google: {
                webClientId: WEB_CLIENT_ID,
            },
        });
        initialized = true;
    })();
    return initPromise;
}

/** Result shape we care about downstream — plugin returns more but Supabase only needs the idToken. */
export interface GoogleSignInResult {
    idToken: string;
    email:   string | null;
    name:    string | null;
}

/**
 * Launch the native Google Sign-In flow and return an ID token the caller
 * can hand to supabase.auth.signInWithIdToken(). Throws on cancel / network
 * failure / misconfigured client ID — LoginScreen catches and shows an
 * i18n'd error line.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
    await ensureInitialized();
    const login = await SocialLogin.login({
        provider: 'google',
        options: {
            scopes: ['profile', 'email'],
            // forceRefreshToken:true ensures we always get a fresh idToken,
            // not a cached one that might already have been consumed.
            forceRefreshToken: true,
        },
    });
    // The plugin's typed result shape narrows by provider; for 'google' it
    // returns { profile, idToken, accessToken, ... } on the `result` field.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = (login as any)?.result ?? login;
    const idToken: string | undefined = r?.idToken;
    if (!idToken || typeof idToken !== 'string') {
        throw new Error('google-signin-no-id-token');
    }
    return {
        idToken,
        email: r?.profile?.email ?? null,
        name : r?.profile?.name  ?? null,
    };
}

/**
 * Sign out from the Google client (revokes the local Google session but does
 * NOT invalidate the Supabase session — call supabase.auth.signOut separately
 * for a full app logout). Wired into authFlow.logout() so a subsequent login
 * prompts the account picker rather than silently reusing the last account.
 */
export async function signOutFromGoogle(): Promise<void> {
    if (!isGoogleSignInAvailable()) return;
    try { await SocialLogin.logout({ provider: 'google' }); } catch { /* nothing to sign out of */ }
}
