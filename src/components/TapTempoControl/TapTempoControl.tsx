import { useState, useEffect, useRef, useCallback } from 'react';
import { MIN_BPM, MAX_BPM } from '../../audio';
import { clamp } from '../../utils';
import styles from './TapTempoControl.module.css';

const RESET_TIMEOUT_MS = 3000;

type TapState = 'idle' | 'measuring' | 'disabled';

interface Props {
  isRunning: boolean;
  onTempoChange: (tempo: number) => void;
}

export function TapTempoControl({ isRunning, onTempoChange }: Props) {
  const [tapState, setTapState] = useState<TapState>('idle');
  const [tapped, setTapped] = useState(false);
  const tapsRef = useRef<number[]>([]);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tappedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    tapsRef.current = [];
    if (resetTimerRef.current !== null) clearTimeout(resetTimerRef.current);
    setTapState(isRunning ? 'disabled' : 'idle');
  }, [isRunning]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) clearTimeout(resetTimerRef.current);
      if (tappedTimerRef.current !== null) clearTimeout(tappedTimerRef.current);
    };
  }, []);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const taps = tapsRef.current;

    if (taps.length > 0 && now - taps[taps.length - 1] > RESET_TIMEOUT_MS) {
      taps.length = 0;
    }

    taps.push(now);
    setTapState('measuring');

    if (taps.length >= 2) {
      let total = 0;
      for (let i = 1; i < taps.length; i++) total += taps[i] - taps[i - 1];
      const tempo = clamp(Math.round(60000 / (total / (taps.length - 1))), MIN_BPM, MAX_BPM);
      onTempoChange(tempo);
    }

    setTapped(true);
    if (tappedTimerRef.current !== null) clearTimeout(tappedTimerRef.current);
    tappedTimerRef.current = setTimeout(() => setTapped(false), 150);

    if (resetTimerRef.current !== null) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      tapsRef.current = [];
      setTapState('idle');
    }, RESET_TIMEOUT_MS);
  }, [onTempoChange]);

  return (
    <button
      className={`${styles.tapBtn} ${styles[tapState]}${tapped ? ` ${styles.tapped}` : ''}`}
      onClick={handleTap}
      disabled={tapState === 'disabled'}
      aria-label="Tap Tempo"
    >
      TAP
    </button>
  );
}
