// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted to the top of the file, so mockAudio must be defined
// with vi.hoisted to be accessible inside the factory.
const mockAudio = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(), updateTempo: vi.fn() }));
vi.mock('../../src/audio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/audio')>();
  return { ...actual, audioControls: mockAudio };
});

import { useMetronome } from '../../src/hooks/useMetronome';
import { INITIAL_STATE } from '../../src/hooks/metronomeState';

beforeEach(() => {
  vi.clearAllMocks();
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
});
