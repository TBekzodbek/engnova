import { useState } from 'react';
import { getSavedTrack, saveTrack, clearTrack, type Track } from './lib/tracks';
import ChooserScreen from './screens/ChooserScreen';
import ProductScreen from './products/ProductScreen';

/**
 * Engnova shell. First run (or after "switch track") shows the chooser; once a
 * track is picked, its live site takes over via ProductScreen's in-app webview.
 */
export default function App() {
  const [track, setTrack] = useState<Track | null>(() => getSavedTrack());

  const choose = (t: Track) => { saveTrack(t); setTrack(t); };
  const switchTrack = () => { clearTrack(); setTrack(null); };

  if (!track) return <ChooserScreen onChoose={choose} />;
  return <ProductScreen track={track} onSwitchTrack={switchTrack} />;
}
