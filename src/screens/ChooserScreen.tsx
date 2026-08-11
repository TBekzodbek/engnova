import type { CSSProperties } from 'react';
import { GraduationCap, Globe2 } from 'lucide-react';
import { TRACKS, type Track } from '../lib/tracks';
import './ChooserScreen.css';

export default function ChooserScreen({ onChoose }: { onChoose: (t: Track) => void }) {
  return (
    <div className="chooser">
      <header className="chooser-head">
        <h1 className="chooser-brand">Engnova</h1>
        <p className="chooser-sub">Yo'nalishni tanlang</p>
      </header>

      <div className="chooser-cards">
        <button
          className="track-card"
          style={{ '--accent': TRACKS.cefr.accent } as CSSProperties}
          onClick={() => onChoose('cefr')}
        >
          <GraduationCap size={40} />
          <span className="track-name">{TRACKS.cefr.name}</span>
          <span className="track-tag">{TRACKS.cefr.tagline}</span>
        </button>

        <button
          className="track-card"
          style={{ '--accent': TRACKS.ielts.accent } as CSSProperties}
          onClick={() => onChoose('ielts')}
        >
          <Globe2 size={40} />
          <span className="track-name">{TRACKS.ielts.name}</span>
          <span className="track-tag">{TRACKS.ielts.tagline}</span>
        </button>
      </div>

      <p className="chooser-foot">Keyinchalik almashtirishingiz mumkin</p>
    </div>
  );
}
