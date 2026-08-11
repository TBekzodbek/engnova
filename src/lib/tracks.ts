import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ── The two independent products Engnova hosts ───────────────────────────────
// Path A (webview): each track loads its LIVE site in a full-screen in-app
// webview. The app talks ONLY to the chosen track. Nothing is shared.

export type Track = 'cefr' | 'ielts';

export interface TrackDef {
  id: Track;
  name: string;
  tagline: string;
  /** Live site loaded in the in-app webview for this track. */
  url: string;
  /** Where an unpaid user is sent to activate — opened in the SYSTEM browser,
   *  never as an in-app purchase (Google Play billing-policy compliance).
   *  Kept as the site root (safest re: "steering to external payment"); can be
   *  pointed at /pricing later if we decide that's acceptable. */
  activateUrl: string;
  /** URL fragments that must NEVER open inside the app webview (pricing /
   *  checkout / payment gateways). A hit is bounced out to the system browser.
   *  Starting set — tuned on-device against real navigation. */
  blockedPatterns: string[];
  accent: string;
}

export const TRACKS: Record<Track, TrackDef> = {
  cefr: {
    id: 'cefr',
    name: 'CEFR Academy',
    tagline: "0 dan C1 gacha — ingliz tili",
    url: 'https://cefracademy.uz',
    activateUrl: 'https://cefracademy.uz',
    blockedPatterns: ['/pricing', 'paycom', 'click.uz'],
    accent: '#5B50E8',
  },
  ielts: {
    id: 'ielts',
    name: 'IELTS Level',
    tagline: 'IELTS 9.0 gacha tayyorgarlik',
    url: 'https://ieltslevel.uz',
    activateUrl: 'https://ieltslevel.uz',
    blockedPatterns: ['/pricing', 'stripe.com', 'paycom', 'click.uz'],
    accent: '#0EA5E9',
  },
};

// ── Per-track Supabase client ────────────────────────────────────────────────
// RESERVED for native-only integrations (e.g. push-token registration, a native
// login bridge). The webview flow does NOT use this — the live site handles its
// own auth/data inside the webview. Kept so those features have a home later.

const ENV: Record<Track, { url?: string; key?: string }> = {
  cefr: {
    url: import.meta.env.VITE_CEFR_SUPABASE_URL,
    key: import.meta.env.VITE_CEFR_SUPABASE_ANON_KEY,
  },
  ielts: {
    url: import.meta.env.VITE_IELTS_SUPABASE_URL,
    key: import.meta.env.VITE_IELTS_SUPABASE_ANON_KEY,
  },
};

const clients: Partial<Record<Track, SupabaseClient>> = {};

export function getSupabase(track: Track): SupabaseClient {
  const cached = clients[track];
  if (cached) return cached;
  const { url, key } = ENV[track];
  if (!url || !key) {
    throw new Error(`Missing Supabase env for "${track}" — set VITE_${track.toUpperCase()}_SUPABASE_URL and _ANON_KEY.`);
  }
  const client = createClient(url, key, {
    auth: { storageKey: `engnova.${track}.auth`, persistSession: true, autoRefreshToken: true },
  });
  clients[track] = client;
  return client;
}

// ── Remembered track choice (switchable, not hardcoded at install) ───────────

const TRACK_KEY = 'engnova.track';

export function getSavedTrack(): Track | null {
  try {
    const t = localStorage.getItem(TRACK_KEY);
    return t === 'cefr' || t === 'ielts' ? t : null;
  } catch {
    return null;
  }
}

export function saveTrack(t: Track): void {
  try { localStorage.setItem(TRACK_KEY, t); } catch { /* ignore */ }
}

export function clearTrack(): void {
  try { localStorage.removeItem(TRACK_KEY); } catch { /* ignore */ }
}
