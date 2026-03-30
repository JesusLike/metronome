import { useRef } from 'react';
import { BeatType } from '../../audio';
import styles from './BeatPatternControl.module.css';

interface Props {
  pattern: BeatType[];
  activeBeat: number | null;
  onChange: (pattern: BeatType[]) => void;
}

const CYCLE: BeatType[] = [BeatType.Strong, BeatType.Medium, BeatType.Weak, BeatType.Muted];
const LONG_PRESS_MS = 500;

function nextBeatType(current: BeatType): BeatType {
  return CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
}

function prevBeatType(current: BeatType): BeatType {
  return CYCLE[(CYCLE.indexOf(current) - 1 + CYCLE.length) % CYCLE.length];
}

function MutedIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
  );
}

export function BeatPatternControl({ pattern, activeBeat, onChange }: Props) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const cycleForward = (index: number) => {
    const next = [...pattern];
    next[index] = nextBeatType(next[index]);
    onChange(next);
  };

  const cycleBackward = (index: number) => {
    const next = [...pattern];
    next[index] = prevBeatType(next[index]);
    onChange(next);
  };

  const handleClick = (index: number) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    cycleForward(index);
  };

  const handleContextMenu = (event: React.MouseEvent, index: number) => {
    event.preventDefault();
    cycleBackward(index);
  };

  const handleTouchStart = (index: number) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      cycleBackward(index);
    }, LONG_PRESS_MS);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const splitAt = pattern.length >= 9 ? Math.ceil(pattern.length / 2) : pattern.length;
  const rows: BeatType[][] = pattern.length >= 9
    ? [pattern.slice(0, splitAt), pattern.slice(splitAt)]
    : [pattern];

  return (
    <div className={styles.container}>
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className={styles.row}>
          {row.map((beat, colIdx) => {
            const beatIdx = rowIdx === 0 ? colIdx : splitAt + colIdx;
            return (
              <button
                key={beatIdx}
                className={`${styles.beatBtn} ${styles[beat]}${beatIdx === activeBeat ? ` ${styles.active}` : ''}`}
                aria-label={`Beat ${beatIdx + 1}: ${beat}`}
                onClick={() => handleClick(beatIdx)}
                onContextMenu={(e) => handleContextMenu(e, beatIdx)}
                onTouchStart={() => handleTouchStart(beatIdx)}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
              >
                {beat === BeatType.Muted && <MutedIcon />}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
