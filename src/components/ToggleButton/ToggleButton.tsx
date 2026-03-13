import styles from './ToggleButton.module.css';

interface Props {
  isRunning: boolean;
  onToggle: () => void;
}

export function ToggleButton({ isRunning: running, onToggle }: Props) {
  return (
    <button
      className={`${styles.toggleBtn} ${running ? styles.running : ''}`}
      onClick={onToggle}
    >
      {running ? 'Stop' : 'Start'}
    </button>
  );
}
