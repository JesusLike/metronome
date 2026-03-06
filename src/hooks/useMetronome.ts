import { useState, useRef, useCallback } from 'react';
import { start, stop, updateTempo, MIN_BPM, MAX_BPM } from '../audio';
import { clamp } from '../utils';

export function useMetronome() {
  const [tempo, setTempoState] = useState(120);
  const [running, setRunning] = useState(false);
  const tempoRef = useRef(120);
  const runningRef = useRef(false);

  const setTempo = useCallback((val: number) => {
    const clamped = clamp(Math.round(val), MIN_BPM, MAX_BPM);
    tempoRef.current = clamped;
    setTempoState(clamped);
    updateTempo(clamped);
  }, []);

  const toggle = useCallback(() => {
    if (runningRef.current) {
      stop();
      runningRef.current = false;
      setRunning(false);
    } else {
      start(tempoRef.current);
      runningRef.current = true;
      setRunning(true);
    }
  }, []);

  return { tempo, running, setTempo, toggle };
}
