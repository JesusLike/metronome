import styles from './ToggleButton.module.css';

interface Props {
  running: boolean;
  onToggle: () => void;
}

export function ToggleButton({ running, onToggle }: Props) {
  return (
    <button
      className={`${styles.toggleBtn} ${running ? styles.running : ''}`}
      onClick={onToggle}
    >
      {running ? 'Stop' : 'Start'}
    </button>
  );
}
