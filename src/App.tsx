import { useMetronome } from './hooks/useMetronome';
import { TempoControl } from './components/TempoControl/TempoControl';
import { ToggleButton } from './components/ToggleButton/ToggleButton';
import { MuteButton } from './components/MuteButton/MuteButton';
import { BeatsPerBarControl } from './components/BeatsPerBarControl/BeatsPerBarControl';
import { BeatPatternControl } from './components/BeatPatternControl/BeatPatternControl';
import { MIN_BPM, MAX_BPM } from './audio';
import styles from './App.module.css';

export default function App() {
  const {
    tempo, isRunning: running, isMuted, beatsPerBar, beatPattern, activeBeat,
    setTempo, start, stop, mute, unmute, setBeatsPerBar, setBeatPattern,
  } = useMetronome();

  return (
    <>
      <div className={styles.card}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Metronome</h1>
          <MuteButton isMuted={isMuted} onToggle={isMuted ? unmute : mute} />
        </div>
        <TempoControl tempo={tempo} min={MIN_BPM} max={MAX_BPM} onChange={setTempo} />
        <ToggleButton isRunning={running} onToggle={running ? stop : start} />
        <div className={styles.barControls}>
          <BeatsPerBarControl value={beatsPerBar} onChange={setBeatsPerBar} />
        </div>
        <BeatPatternControl pattern={beatPattern} activeBeat={activeBeat} onChange={setBeatPattern} />
      </div>
      <span className={styles.version}>{__APP_VERSION__}</span>
    </>
  );
}
