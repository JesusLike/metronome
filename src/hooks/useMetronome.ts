import { useState, useRef, useCallback } from 'react';
import { start, stop, updateTempo, MIN_BPM, MAX_BPM } from '../audio';
import { clamp } from '../utils';

export function useMetronome() {
  const [tempo, setTempoState] = useState(120);
  const [running, setRunning] = useState(false);
  const tempoRef = useRef(120);

  const setTempo = useCallback((val: number) => {
    const clamped = clamp(Math.round(val), MIN_BPM, MAX_BPM);
    tempoRef.current = clamped;
    setTempoState(clamped);
    updateTempo(clamped);
  }, []);

  const toggle = useCallback(() => {
    setRunning((prev) => {
      if (prev) {
        stop();
        return false;
      } else {
        start(tempoRef.current);
        return true;
      }
    });
  }, []);

  return { tempo, running, setTempo, toggle };
}
