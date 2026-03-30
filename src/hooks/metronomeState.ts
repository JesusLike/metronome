import { clamp } from '../utils';
import {
  MIN_BPM, MAX_BPM,
  MIN_BEATS_PER_BAR, MAX_BEATS_PER_BAR, DEFAULT_BEATS_PER_BAR,
  DEFAULT_BEAT_PATTERN,
  BeatType,
  AudioControls,
} from '../audio';

export type MetronomeState = {
  tempo: number;
  isRunning: boolean;
  isMuted: boolean;
  beatsPerBar: number;
  beatPattern: BeatType[];
};

export type MetronomeAction =
  | { type: 'SET_TEMPO'; val: number }
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'MUTE' }
  | { type: 'UNMUTE' }
  | { type: 'SET_BEATS_PER_BAR'; val: number }
  | { type: 'SET_BEAT_PATTERN'; val: BeatType[] };

export const INITIAL_STATE: MetronomeState = {
  tempo: 120,
  isRunning: false,
  isMuted: false,
  beatsPerBar: DEFAULT_BEATS_PER_BAR,
  beatPattern: DEFAULT_BEAT_PATTERN,
};

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
  if (next.beatsPerBar !== prev.beatsPerBar) {
    audio.setBeatsPerBar(next.beatsPerBar);
  }
  if (next.beatPattern !== prev.beatPattern) {
    audio.setBeatPattern(next.beatPattern);
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
    case 'SET_BEATS_PER_BAR': {
      const newBeats = clamp(action.val, MIN_BEATS_PER_BAR, MAX_BEATS_PER_BAR);
      if (newBeats === state.beatsPerBar) return state;
      const old = state.beatPattern;
      const newPattern: BeatType[] = newBeats <= old.length
        ? old.slice(0, newBeats)
        : [...old, ...Array<BeatType>(newBeats - old.length).fill(BeatType.Medium)];
      return { ...state, beatsPerBar: newBeats, beatPattern: newPattern };
    }
    case 'SET_BEAT_PATTERN':
      return { ...state, beatPattern: action.val };
  }
}
