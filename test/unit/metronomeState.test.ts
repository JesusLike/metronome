import { describe, it, expect, vi, beforeEach } from 'vitest';
import { metronomeReducer, applyAudioEffects, MetronomeState } from '../../src/hooks/metronomeState';
import { AudioControls, BeatType, DEFAULT_BEATS_PER_BAR, DEFAULT_BEAT_PATTERN, MIN_BEATS_PER_BAR, MAX_BEATS_PER_BAR } from '../../src/audio';

const B = DEFAULT_BEATS_PER_BAR;
const P = DEFAULT_BEAT_PATTERN;

const TEST_INITIAL_IDLE_STATE: MetronomeState    = { tempo: 120, isRunning: false, isMuted: false, beatsPerBar: B, beatPattern: P };
const TEST_INITIAL_RUNNING_STATE: MetronomeState = { tempo: 120, isRunning: true,  isMuted: false, beatsPerBar: B, beatPattern: P };
const TEST_MUTED_IDLE_STATE: MetronomeState      = { tempo: 120, isRunning: false, isMuted: true,  beatsPerBar: B, beatPattern: P };
const TEST_MUTED_RUNNING_STATE: MetronomeState   = { tempo: 120, isRunning: true,  isMuted: true,  beatsPerBar: B, beatPattern: P };

describe('metronomeReducer', () => {
  describe('SET_TEMPO', () => {
    it('updates tempo', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'SET_TEMPO', val: 140 });
      expect(state.tempo).toBe(140);
    });

    it('rounds fractional values', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'SET_TEMPO', val: 120.7 });
      expect(state.tempo).toBe(121);
    });

    it('clamps below MIN_BPM', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'SET_TEMPO', val: 0 });
      expect(state.tempo).toBe(1);
    });

    it('clamps above MAX_BPM', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'SET_TEMPO', val: 1000 });
      expect(state.tempo).toBe(999);
    });

    it('does not change running', () => {
      const state = metronomeReducer(TEST_INITIAL_RUNNING_STATE, { type: 'SET_TEMPO', val: 140 });
      expect(state.isRunning).toBe(true);
    });
  });

  describe('START', () => {
    it('sets running to true when stopped', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'START' });
      expect(state.isRunning).toBe(true);
    });

    it('is idempotent when already running', () => {
      const state = metronomeReducer(TEST_INITIAL_RUNNING_STATE, { type: 'START' });
      expect(state).toBe(TEST_INITIAL_RUNNING_STATE);
    });

    it('does not change tempo', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'START' });
      expect(state.tempo).toBe(TEST_INITIAL_IDLE_STATE.tempo);
    });

    it('does not change isMuted', () => {
      const state = metronomeReducer(TEST_MUTED_IDLE_STATE, { type: 'START' });
      expect(state.isMuted).toBe(true);
    });

    it('does not change beatPattern', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'START' });
      expect(state.beatPattern).toBe(TEST_INITIAL_IDLE_STATE.beatPattern);
    });
  });

  describe('STOP', () => {
    it('sets running to false when running', () => {
      const state = metronomeReducer(TEST_INITIAL_RUNNING_STATE, { type: 'STOP' });
      expect(state.isRunning).toBe(false);
    });

    it('is idempotent when already stopped', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'STOP' });
      expect(state).toBe(TEST_INITIAL_IDLE_STATE);
    });

    it('does not change tempo', () => {
      const state = metronomeReducer(TEST_INITIAL_RUNNING_STATE, { type: 'STOP' });
      expect(state.tempo).toBe(TEST_INITIAL_RUNNING_STATE.tempo);
    });

    it('does not change isMuted', () => {
      const state = metronomeReducer(TEST_MUTED_RUNNING_STATE, { type: 'STOP' });
      expect(state.isMuted).toBe(true);
    });

    it('does not change beatPattern', () => {
      const state = metronomeReducer(TEST_INITIAL_RUNNING_STATE, { type: 'STOP' });
      expect(state.beatPattern).toBe(TEST_INITIAL_RUNNING_STATE.beatPattern);
    });
  });

  describe('MUTE', () => {
    it('sets isMuted to true when unmuted', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'MUTE' });
      expect(state.isMuted).toBe(true);
    });

    it('is idempotent when already muted', () => {
      const state = metronomeReducer(TEST_MUTED_IDLE_STATE, { type: 'MUTE' });
      expect(state).toBe(TEST_MUTED_IDLE_STATE);
    });

    it('does not change isRunning', () => {
      const state = metronomeReducer(TEST_INITIAL_RUNNING_STATE, { type: 'MUTE' });
      expect(state.isRunning).toBe(true);
    });
  });

  describe('UNMUTE', () => {
    it('sets isMuted to false when muted', () => {
      const state = metronomeReducer(TEST_MUTED_IDLE_STATE, { type: 'UNMUTE' });
      expect(state.isMuted).toBe(false);
    });

    it('is idempotent when already unmuted', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'UNMUTE' });
      expect(state).toBe(TEST_INITIAL_IDLE_STATE);
    });

    it('does not change isRunning', () => {
      const state = metronomeReducer(TEST_MUTED_RUNNING_STATE, { type: 'UNMUTE' });
      expect(state.isRunning).toBe(true);
    });
  });

  describe('SET_BEATS_PER_BAR', () => {
    it('updates beatsPerBar', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'SET_BEATS_PER_BAR', val: 6 });
      expect(state.beatsPerBar).toBe(6);
    });

    it('clamps below MIN_BEATS_PER_BAR', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'SET_BEATS_PER_BAR', val: 0 });
      expect(state.beatsPerBar).toBe(MIN_BEATS_PER_BAR);
    });

    it('clamps above MAX_BEATS_PER_BAR', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'SET_BEATS_PER_BAR', val: 100 });
      expect(state.beatsPerBar).toBe(MAX_BEATS_PER_BAR);
    });

    it('does not change isRunning', () => {
      const state = metronomeReducer(TEST_INITIAL_RUNNING_STATE, { type: 'SET_BEATS_PER_BAR', val: 6 });
      expect(state.isRunning).toBe(true);
    });

    it('does not change tempo', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'SET_BEATS_PER_BAR', val: 6 });
      expect(state.tempo).toBe(TEST_INITIAL_IDLE_STATE.tempo);
    });

    it('is idempotent when value is unchanged', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'SET_BEATS_PER_BAR', val: B });
      expect(state).toBe(TEST_INITIAL_IDLE_STATE);
    });

    it('truncates beatPattern when shrinking bar', () => {
      // start with 6 beats
      const s6 = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'SET_BEATS_PER_BAR', val: 6 });
      // shrink to 3
      const s3 = metronomeReducer(s6, { type: 'SET_BEATS_PER_BAR', val: 3 });
      expect(s3.beatPattern).toHaveLength(3);
      expect(s3.beatPattern).toEqual(s6.beatPattern.slice(0, 3));
    });

    it('pads beatPattern with Medium when growing bar', () => {
      // start with 4 beats (default)
      const s6 = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'SET_BEATS_PER_BAR', val: 6 });
      expect(s6.beatPattern).toHaveLength(6);
      expect(s6.beatPattern.slice(0, B)).toEqual(TEST_INITIAL_IDLE_STATE.beatPattern);
      expect(s6.beatPattern[4]).toBe(BeatType.Medium);
      expect(s6.beatPattern[5]).toBe(BeatType.Medium);
    });

    it('preserves existing beats when growing bar', () => {
      const custom: BeatType[] = [BeatType.Strong, BeatType.Weak, BeatType.Muted, BeatType.Weak];
      const base: MetronomeState = { ...TEST_INITIAL_IDLE_STATE, beatPattern: custom };
      const s6 = metronomeReducer(base, { type: 'SET_BEATS_PER_BAR', val: 6 });
      expect(s6.beatPattern.slice(0, 4)).toEqual(custom);
    });
  });

  describe('SET_BEAT_PATTERN', () => {
    const newPattern: BeatType[] = [BeatType.Strong, BeatType.Weak, BeatType.Muted, BeatType.Weak];

    it('updates beatPattern', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'SET_BEAT_PATTERN', val: newPattern });
      expect(state.beatPattern).toEqual(newPattern);
    });

    it('does not change tempo', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'SET_BEAT_PATTERN', val: newPattern });
      expect(state.tempo).toBe(TEST_INITIAL_IDLE_STATE.tempo);
    });

    it('does not change isRunning', () => {
      const state = metronomeReducer(TEST_INITIAL_RUNNING_STATE, { type: 'SET_BEAT_PATTERN', val: newPattern });
      expect(state.isRunning).toBe(true);
    });

    it('does not change beatsPerBar', () => {
      const state = metronomeReducer(TEST_INITIAL_IDLE_STATE, { type: 'SET_BEAT_PATTERN', val: newPattern });
      expect(state.beatsPerBar).toBe(B);
    });
  });
});

describe('applyAudioEffects', () => {
  let audio: AudioControls;

  beforeEach(() => {
    audio = {
      start: vi.fn(),
      stop: vi.fn(),
      updateTempo: vi.fn(),
      setMuted: vi.fn(),
      setBeatsPerBar: vi.fn(),
      setBeatPattern: vi.fn(),
      getLastFiredBeat: vi.fn(),
    };
  });

  it('calls updateTempo when tempo changes', () => {
    applyAudioEffects(TEST_INITIAL_IDLE_STATE, { ...TEST_INITIAL_IDLE_STATE, tempo: 140 }, audio);
    expect(audio.updateTempo).toHaveBeenCalledWith(140);
  });

  it('does not call updateTempo when tempo is unchanged', () => {
    applyAudioEffects(TEST_INITIAL_IDLE_STATE, TEST_INITIAL_IDLE_STATE, audio);
    expect(audio.updateTempo).not.toHaveBeenCalled();
  });

  it('calls start when starting', () => {
    applyAudioEffects(TEST_INITIAL_IDLE_STATE, TEST_INITIAL_RUNNING_STATE, audio);
    expect(audio.start).toHaveBeenCalled();
  });

  it('calls stop when stopping', () => {
    applyAudioEffects(TEST_INITIAL_RUNNING_STATE, TEST_INITIAL_IDLE_STATE, audio);
    expect(audio.stop).toHaveBeenCalled();
  });

  it('does not call start or stop when running state is unchanged', () => {
    applyAudioEffects(TEST_INITIAL_IDLE_STATE, TEST_INITIAL_IDLE_STATE, audio);
    expect(audio.start).not.toHaveBeenCalled();
    expect(audio.stop).not.toHaveBeenCalled();
  });

  it('calls both updateTempo and start when starting with a new tempo', () => {
    const next: MetronomeState = { tempo: 140, isRunning: true, isMuted: false, beatsPerBar: B, beatPattern: P };
    applyAudioEffects(TEST_INITIAL_IDLE_STATE, next, audio);
    expect(audio.updateTempo).toHaveBeenCalledWith(140);
    expect(audio.start).toHaveBeenCalled();
  });

  it('calls setMuted(true) when muting', () => {
    applyAudioEffects(TEST_INITIAL_IDLE_STATE, TEST_MUTED_IDLE_STATE, audio);
    expect(audio.setMuted).toHaveBeenCalledWith(true);
  });

  it('calls setMuted(false) when unmuting', () => {
    applyAudioEffects(TEST_MUTED_IDLE_STATE, TEST_INITIAL_IDLE_STATE, audio);
    expect(audio.setMuted).toHaveBeenCalledWith(false);
  });

  it('does not call setMuted when isMuted is unchanged', () => {
    applyAudioEffects(TEST_INITIAL_IDLE_STATE, TEST_INITIAL_IDLE_STATE, audio);
    expect(audio.setMuted).not.toHaveBeenCalled();
  });

  it('does not call start or stop when only mute changes', () => {
    applyAudioEffects(TEST_INITIAL_RUNNING_STATE, TEST_MUTED_RUNNING_STATE, audio);
    expect(audio.start).not.toHaveBeenCalled();
    expect(audio.stop).not.toHaveBeenCalled();
  });

  it('calls setBeatsPerBar when beatsPerBar changes', () => {
    applyAudioEffects(TEST_INITIAL_IDLE_STATE, { ...TEST_INITIAL_IDLE_STATE, beatsPerBar: 6 }, audio);
    expect(audio.setBeatsPerBar).toHaveBeenCalledWith(6);
  });

  it('does not call setBeatsPerBar when beatsPerBar is unchanged', () => {
    applyAudioEffects(TEST_INITIAL_IDLE_STATE, TEST_INITIAL_IDLE_STATE, audio);
    expect(audio.setBeatsPerBar).not.toHaveBeenCalled();
  });

  it('calls setBeatPattern when beatPattern changes', () => {
    const newPattern: BeatType[] = [BeatType.Strong, BeatType.Weak, BeatType.Weak, BeatType.Weak];
    applyAudioEffects(TEST_INITIAL_IDLE_STATE, { ...TEST_INITIAL_IDLE_STATE, beatPattern: newPattern }, audio);
    expect(audio.setBeatPattern).toHaveBeenCalledWith(newPattern);
  });

  it('does not call setBeatPattern when beatPattern is unchanged (same reference)', () => {
    applyAudioEffects(TEST_INITIAL_IDLE_STATE, TEST_INITIAL_IDLE_STATE, audio);
    expect(audio.setBeatPattern).not.toHaveBeenCalled();
  });

  it('does not call start or stop when only beatPattern changes', () => {
    const newPattern: BeatType[] = [BeatType.Weak, BeatType.Weak, BeatType.Weak, BeatType.Weak];
    applyAudioEffects(TEST_INITIAL_RUNNING_STATE, { ...TEST_INITIAL_RUNNING_STATE, beatPattern: newPattern }, audio);
    expect(audio.start).not.toHaveBeenCalled();
    expect(audio.stop).not.toHaveBeenCalled();
  });
});
