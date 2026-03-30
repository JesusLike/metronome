import { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { audioControls, BeatType } from '../audio';
import { metronomeReducer, INITIAL_STATE, MetronomeState, applyAudioEffects } from './metronomeState';

export function useMetronome() {
  const [state, dispatch] = useReducer(metronomeReducer, INITIAL_STATE);
  const prevState = useRef<MetronomeState>(INITIAL_STATE);

  useEffect(() => {
    applyAudioEffects(prevState.current, state, audioControls);
    prevState.current = state;
  }, [state]);

  // Stop the scheduler if the component unmounts while running.
  useEffect(() => () => audioControls.stop(), []);

  const [activeBeat, setActiveBeat] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastBeat = useRef<number | null>(null);

  useEffect(() => {
    if (!state.isRunning) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastBeat.current = null;
      setActiveBeat(null);
      return;
    }

    function poll() {
      const beat = audioControls.getLastFiredBeat();
      if (beat !== lastBeat.current) {
        lastBeat.current = beat;
        setActiveBeat(beat);
      }
      rafRef.current = requestAnimationFrame(poll);
    }

    rafRef.current = requestAnimationFrame(poll);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [state.isRunning]);

  const setTempo = useCallback((val: number) => dispatch({ type: 'SET_TEMPO', val }), []);
  const start_ = useCallback(() => dispatch({ type: 'START' }), []);
  const stop_ = useCallback(() => dispatch({ type: 'STOP' }), []);
  const mute = useCallback(() => dispatch({ type: 'MUTE' }), []);
  const unmute = useCallback(() => dispatch({ type: 'UNMUTE' }), []);
  const setBeatsPerBar = useCallback((val: number) => dispatch({ type: 'SET_BEATS_PER_BAR', val }), []);
  const setBeatPattern = useCallback((val: BeatType[]) => dispatch({ type: 'SET_BEAT_PATTERN', val }), []);

  return {
    tempo: state.tempo,
    isRunning: state.isRunning,
    isMuted: state.isMuted,
    beatsPerBar: state.beatsPerBar,
    beatPattern: state.beatPattern,
    activeBeat,
    setTempo,
    start: start_,
    stop: stop_,
    mute,
    unmute,
    setBeatsPerBar,
    setBeatPattern,
  };
}
