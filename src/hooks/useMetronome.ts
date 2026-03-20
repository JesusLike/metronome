import { useReducer, useEffect, useRef, useCallback } from 'react';
import { audioControls } from '../audio';
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

  const setTempo = useCallback((val: number) => dispatch({ type: 'SET_TEMPO', val }), []);
  const start_ = useCallback(() => dispatch({ type: 'START' }), []);
  const stop_ = useCallback(() => dispatch({ type: 'STOP' }), []);

  return { tempo: state.tempo, isRunning: state.isRunning, setTempo, start: start_, stop: stop_ };
}
