import styles from './ToggleButton.module.css';

interface Props {
  isRunning: boolean;
  onToggle: () => void;
}

export function ToggleButton({ isRunning: isRunning, onToggle }: Props) {
  return (
    <button
      className={`${styles.toggleBtn} ${isRunning ? styles.running : ''}`}
      onClick={onToggle}
    >
      {isRunning ? 'Stop' : 'Start'}
    </button>
  );
}
