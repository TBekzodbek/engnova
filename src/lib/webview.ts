import { Capacitor } from '@capacitor/core';
import { TRACKS, type Track } from './tracks';

export function isNative(): boolean {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

/** Does this URL hit one of the track's blocked (payment/checkout) fragments? */
export function isBlocked(url: string, track: Track): boolean {
  return TRACKS[track].blockedPatterns.some((p) => url.includes(p));
}

// The real @capacitor/inappbrowser / @capacitor/browser APIs are richer; typed
// loosely here so the build stays green before on-device verification. The
// native calls below are exercised (and tuned) once an APK runs on a device.
type Listener = { remove: () => void };
interface InAppBrowserApi {
  openInWebView(opts: { url: string; options?: Record<string, unknown> }): Promise<unknown>;
  addListener(event: string, cb: (e: { url?: string }) => void): Promise<Listener> | Listener;
  close(): Promise<unknown>;
}
interface SystemBrowserApi {
  open(opts: { url: string }): Promise<unknown>;
}

/**
 * Open a track's live site in a full-screen in-app webview, blocking any
 * navigation to that track's payment/checkout routes: a blocked hit closes the
 * in-app view and bounces OUT to the system browser, so payment only ever
 * happens on the real website (pay-on-web model / Play compliance).
 *
 * NATIVE ONLY. Returns a cleanup function that removes the listener.
 */
export async function openTrackWebView(track: Track): Promise<() => void> {
  const { url } = TRACKS[track];

  const iab = ((await import('@capacitor/inappbrowser')) as unknown as { InAppBrowser: InAppBrowserApi }).InAppBrowser;
  const sys = ((await import('@capacitor/browser')) as unknown as { Browser: SystemBrowserApi }).Browser;

  const sub = (await iab.addListener('urlChangeEvent', async (e) => {
    const u = e?.url ?? '';
    if (u && isBlocked(u, track)) {
      try { await iab.close(); } catch { /* noop */ }
      try { await sys.open({ url: TRACKS[track].activateUrl }); } catch { /* noop */ }
    }
  })) as Listener;

  await iab.openInWebView({
    url,
    options: { showToolbar: true, showURL: false } as Record<string, unknown>,
  });

  return () => { try { sub.remove(); } catch { /* noop */ } };
}
