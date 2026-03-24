import { useMetronome } from './hooks/useMetronome';
import { TempoControl } from './components/TempoControl/TempoControl';
import { ToggleButton } from './components/ToggleButton/ToggleButton';
import { MIN_BPM, MAX_BPM } from './audio';
import styles from './App.module.css';

export default function App() {
  const { tempo, isRunning: running, setTempo, start, stop } = useMetronome();

  return (
    <>
      <div className={styles.card}>
        <h1 className={styles.title}>Metronome</h1>
        <TempoControl tempo={tempo} min={MIN_BPM} max={MAX_BPM} onChange={setTempo} />
        <ToggleButton isRunning={running} onToggle={running ? stop : start} />
      </div>
      <span className={styles.version}>{__APP_VERSION__}</span>
    </>
  );
}
