import { useMetronome } from './hooks/useMetronome';
import { TempoControl } from './components/TempoControl/TempoControl';
import { ToggleButton } from './components/ToggleButton/ToggleButton';
import { MIN_BPM, MAX_BPM } from './audio';
import styles from './App.module.css';

export default function App() {
  const { tempo, running, setTempo, toggle } = useMetronome();

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Metronome</h1>
      <TempoControl tempo={tempo} min={MIN_BPM} max={MAX_BPM} onChange={setTempo} />
      <ToggleButton running={running} onToggle={toggle} />
    </div>
  );
}
