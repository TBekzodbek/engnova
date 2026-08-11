import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeftRight, ExternalLink } from 'lucide-react';
import { TRACKS, type Track } from '../lib/tracks';
import { isNative, openTrackWebView } from '../lib/webview';
import './ProductScreen.css';

/**
 * Path A product host. On a device the chosen track's live site opens in a
 * full-screen in-app webview (payment routes blocked); this screen sits under
 * it as the fallback if the webview is closed or fails. In the web preview the
 * native plugin no-ops, so we explain and offer to open the real site.
 */
export default function ProductScreen({ track, onSwitchTrack }: { track: Track; onSwitchTrack: () => void }) {
  const t = TRACKS[track];
  const [native] = useState(isNative);
  const cleanupRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    if (!native) return;
    let disposed = false;
    openTrackWebView(track)
      .then((fn) => { if (disposed) fn(); else cleanupRef.current = fn; })
      .catch(() => { /* device-tuned later */ });
    return () => { disposed = true; cleanupRef.current?.(); cleanupRef.current = null; };
  }, [native, track]);

  return (
    <div className="pscreen" style={{ '--accent': t.accent } as CSSProperties}>
      <h1 className="pscreen-name">{t.name}</h1>
      {native ? (
        <p className="pscreen-msg">Ochilmoqda…</p>
      ) : (
        <>
          <p className="pscreen-msg">
            Ilovada {t.name} shu yerda to'liq ekranda ochiladi. (Brauzer preview jonli saytni ko'rsata olmaydi.)
          </p>
          <a className="pscreen-open" href={t.url} target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> {t.url.replace('https://', '')} ni ochish
          </a>
        </>
      )}
      <button className="pscreen-switch" onClick={onSwitchTrack}>
        <ArrowLeftRight size={16} /> Yo'nalishni almashtirish
      </button>
    </div>
  );
}
