// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// vi.mock is hoisted to the top of the file, so mockAudio must be defined
// with vi.hoisted to be accessible inside the factory.
const mockAudio = vi.hoisted(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  updateTempo: vi.fn(),
  setMuted: vi.fn(),
  setBeatsPerBar: vi.fn(),
  setBeatPattern: vi.fn(),
  getLastFiredBeat: vi.fn<() => number | null>(() => null),
}));
vi.mock('../../src/audio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/audio')>();
  return { ...actual, audioControls: mockAudio };
});

import { useMetronome } from '../../src/hooks/useMetronome';
import { INITIAL_STATE } from '../../src/hooks/metronomeState';

beforeEach(() => {
  vi.clearAllMocks();
  mockAudio.getLastFiredBeat.mockReturnValue(null);
});

describe('useMetronome', () => {
  describe('initial state', () => {
    it('returns initial tempo', () => {
      const { result } = renderHook(() => useMetronome());
      expect(result.current.tempo).toBe(INITIAL_STATE.tempo);
    });

    it('returns initial isRunning as false', () => {
      const { result } = renderHook(() => useMetronome());
      expect(result.current.isRunning).toBe(false);
    });

    it('does not call start or stop on mount', () => {
      renderHook(() => useMetronome());
      expect(mockAudio.start).not.toHaveBeenCalled();
      expect(mockAudio.stop).not.toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('sets isRunning to true', () => {
      const { result } = renderHook(() => useMetronome());
      act(() => result.current.start());
      expect(result.current.isRunning).toBe(true);
    });

    it('calls audio.start', () => {
      const { result } = renderHook(() => useMetronome());
      act(() => result.current.start());
      expect(mockAudio.start).toHaveBeenCalledTimes(1);
    });

    it('is idempotent — does not call audio.start again if already running', () => {
      const { result } = renderHook(() => useMetronome());
      act(() => result.current.start());
      act(() => result.current.start());
      expect(mockAudio.start).toHaveBeenCalledTimes(1);
    });
  });

  describe('stop', () => {
    it('sets isRunning to false', () => {
      const { result } = renderHook(() => useMetronome());
      act(() => result.current.start());
      act(() => result.current.stop());
      expect(result.current.isRunning).toBe(false);
    });

    it('calls audio.stop', () => {
      const { result } = renderHook(() => useMetronome());
      act(() => result.current.start());
      act(() => result.current.stop());
      expect(mockAudio.stop).toHaveBeenCalledTimes(1);
    });

    it('is idempotent — does not call audio.stop again if already stopped', () => {
      const { result } = renderHook(() => useMetronome());
      act(() => result.current.stop());
      expect(mockAudio.stop).not.toHaveBeenCalled();
    });
  });

  describe('setTempo', () => {
    it('updates tempo', () => {
      const { result } = renderHook(() => useMetronome());
      act(() => result.current.setTempo(140));
      expect(result.current.tempo).toBe(140);
    });

    it('calls audio.updateTempo', () => {
      const { result } = renderHook(() => useMetronome());
      act(() => result.current.setTempo(140));
      expect(mockAudio.updateTempo).toHaveBeenCalledWith(140);
    });

    it('does not call audio.start or audio.stop when only tempo changes', () => {
      const { result } = renderHook(() => useMetronome());
      act(() => result.current.setTempo(140));
      expect(mockAudio.start).not.toHaveBeenCalled();
      expect(mockAudio.stop).not.toHaveBeenCalled();
    });
  });

  describe('unmount', () => {
    // stop() is always called on unmount as an unconditional safety cleanup.
    // This is correct because stop() is idempotent.
    it('calls audio.stop when unmounted while running', () => {
      const { result, unmount } = renderHook(() => useMetronome());
      act(() => result.current.start());
      unmount();
      expect(mockAudio.stop).toHaveBeenCalled();
    });

    it('calls audio.stop when unmounted while stopped', () => {
      const { unmount } = renderHook(() => useMetronome());
      unmount();
      expect(mockAudio.stop).toHaveBeenCalled();
    });
  });

  describe('activeBeat polling', () => {
    let rafQueue: FrameRequestCallback[];
    let rafHandle: number;

    beforeEach(() => {
      rafQueue = [];
      rafHandle = 0;
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        rafQueue.push(cb);
        return ++rafHandle;
      });
      vi.stubGlobal('cancelAnimationFrame', () => {
        rafQueue = [];
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    const tick = () => {
      const callbacks = [...rafQueue];
      rafQueue = [];
      act(() => callbacks.forEach(cb => cb(0)));
    };

    it('activeBeat is null initially', () => {
      const { result } = renderHook(() => useMetronome());
      expect(result.current.activeBeat).toBeNull();
    });

    it('starts polling RAF when start() is called', () => {
      const { result } = renderHook(() => useMetronome());
      act(() => result.current.start());
      expect(rafQueue.length).toBeGreaterThan(0);
    });

    it('does not poll RAF when stopped', () => {
      renderHook(() => useMetronome());
      expect(rafQueue).toHaveLength(0);
    });

    it('updates activeBeat when getLastFiredBeat returns a new value', () => {
      mockAudio.getLastFiredBeat.mockReturnValue(2);
      const { result } = renderHook(() => useMetronome());
      act(() => result.current.start());
      tick();
      expect(result.current.activeBeat).toBe(2);
    });

    it('does not re-render when getLastFiredBeat returns the same value twice', () => {
      mockAudio.getLastFiredBeat.mockReturnValue(1);
      const { result } = renderHook(() => useMetronome());
      act(() => result.current.start());
      tick();
      const renderCount1 = result.current.activeBeat;
      tick();
      // activeBeat unchanged — same reference, no extra state update
      expect(result.current.activeBeat).toBe(renderCount1);
    });

    it('updates activeBeat as beat index advances', () => {
      const { result } = renderHook(() => useMetronome());
      act(() => result.current.start());

      mockAudio.getLastFiredBeat.mockReturnValue(0);
      tick();
      expect(result.current.activeBeat).toBe(0);

      mockAudio.getLastFiredBeat.mockReturnValue(1);
      tick();
      expect(result.current.activeBeat).toBe(1);

      mockAudio.getLastFiredBeat.mockReturnValue(2);
      tick();
      expect(result.current.activeBeat).toBe(2);
    });

    it('resets activeBeat to null when stop() is called', () => {
      mockAudio.getLastFiredBeat.mockReturnValue(1);
      const { result } = renderHook(() => useMetronome());
      act(() => result.current.start());
      tick();
      expect(result.current.activeBeat).toBe(1);
      act(() => result.current.stop());
      expect(result.current.activeBeat).toBeNull();
    });

    it('stops polling RAF when stop() is called', () => {
      const { result } = renderHook(() => useMetronome());
      act(() => result.current.start());
      act(() => result.current.stop());
      expect(rafQueue).toHaveLength(0);
    });

    it('cancels RAF on unmount while running', () => {
      const cancelSpy = vi.fn();
      vi.stubGlobal('cancelAnimationFrame', cancelSpy);
      const { result, unmount } = renderHook(() => useMetronome());
      act(() => result.current.start());
      unmount();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });
});
