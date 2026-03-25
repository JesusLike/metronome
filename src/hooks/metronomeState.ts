import { clamp } from '../utils';
import { MIN_BPM, MAX_BPM, AudioControls } from '../audio';

export type MetronomeState = { tempo: number; isRunning: boolean; isMuted: boolean };

export type MetronomeAction =
  | { type: 'SET_TEMPO'; val: number }
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'MUTE' }
  | { type: 'UNMUTE' };

export const INITIAL_STATE: MetronomeState = { tempo: 120, isRunning: false, isMuted: false };

export function applyAudioEffects(prev: MetronomeState, next: MetronomeState, audio: AudioControls): void {
  if (next.tempo !== prev.tempo) {
    audio.updateTempo(next.tempo);
  }
  if (next.isRunning !== prev.isRunning) {
    if (next.isRunning) {
      audio.start();
    } else {
      audio.stop();
    }
  }
  if (next.isMuted !== prev.isMuted) {
    audio.setMuted(next.isMuted);
  }
}

export function metronomeReducer(state: MetronomeState, action: MetronomeAction): MetronomeState {
  switch (action.type) {
    case 'SET_TEMPO':
      return { ...state, tempo: clamp(Math.round(action.val), MIN_BPM, MAX_BPM) };
    case 'START':
      return state.isRunning ? state : { ...state, isRunning: true };
    case 'STOP':
      return state.isRunning ? { ...state, isRunning: false } : state;
    case 'MUTE':
      return state.isMuted ? state : { ...state, isMuted: true };
    case 'UNMUTE':
      return state.isMuted ? { ...state, isMuted: false } : state;
  }
}
