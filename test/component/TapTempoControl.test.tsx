// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { TapTempoControl } from '../../src/components/TapTempoControl/TapTempoControl';
import { MAX_BPM } from '../../src/audio';

afterEach(cleanup);

const onTempoChange = vi.fn();
afterEach(() => onTempoChange.mockClear());

const tapBtn = () => screen.getByRole('button', { name: 'Tap Tempo' }) as HTMLButtonElement;

describe('TapTempoControl', () => {
  describe('rendering', () => {
    it('renders button with TAP text and aria-label', () => {
      render(<TapTempoControl isRunning={false} onTempoChange={onTempoChange} />);
      const btn = tapBtn();
      expect(btn.textContent).toBe('TAP');
    });

    it('button is enabled when not running', () => {
      render(<TapTempoControl isRunning={false} onTempoChange={onTempoChange} />);
      expect(tapBtn().disabled).toBe(false);
    });

    it('button is disabled when running', () => {
      render(<TapTempoControl isRunning={true} onTempoChange={onTempoChange} />);
      expect(tapBtn().disabled).toBe(true);
    });
  });

  describe('isRunning prop changes', () => {
    it('button becomes disabled when isRunning changes to true', () => {
      const { rerender } = render(<TapTempoControl isRunning={false} onTempoChange={onTempoChange} />);
      rerender(<TapTempoControl isRunning={true} onTempoChange={onTempoChange} />);
      expect(tapBtn().disabled).toBe(true);
    });

    it('button becomes enabled when isRunning changes to false', () => {
      const { rerender } = render(<TapTempoControl isRunning={true} onTempoChange={onTempoChange} />);
      rerender(<TapTempoControl isRunning={false} onTempoChange={onTempoChange} />);
      expect(tapBtn().disabled).toBe(false);
    });
  });

  describe('tempo calculation', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('first tap does not call onTempoChange', () => {
      vi.setSystemTime(0);
      render(<TapTempoControl isRunning={false} onTempoChange={onTempoChange} />);
      fireEvent.click(tapBtn());
      expect(onTempoChange).not.toHaveBeenCalled();
    });

    it('two taps 500ms apart sets tempo to 120 BPM', () => {
      vi.setSystemTime(0);
      render(<TapTempoControl isRunning={false} onTempoChange={onTempoChange} />);
      fireEvent.click(tapBtn());
      vi.setSystemTime(500);
      fireEvent.click(tapBtn());
      expect(onTempoChange).toHaveBeenCalledWith(120);
    });

    it('two taps 600ms apart sets tempo to 100 BPM', () => {
      vi.setSystemTime(0);
      render(<TapTempoControl isRunning={false} onTempoChange={onTempoChange} />);
      fireEvent.click(tapBtn());
      vi.setSystemTime(600);
      fireEvent.click(tapBtn());
      expect(onTempoChange).toHaveBeenCalledWith(100);
    });

    it('uses average of multiple intervals', () => {
      // intervals: 500ms, 600ms → avg 550ms → BPM = round(60000/550) = 109
      vi.setSystemTime(0);
      render(<TapTempoControl isRunning={false} onTempoChange={onTempoChange} />);
      fireEvent.click(tapBtn());
      vi.setSystemTime(500);
      fireEvent.click(tapBtn());
      vi.setSystemTime(1100);
      fireEvent.click(tapBtn());
      const lastCall = onTempoChange.mock.calls[onTempoChange.mock.calls.length - 1][0];
      expect(lastCall).toBe(Math.round(60000 / 550));
    });

    it('clamps BPM to MAX_BPM for very fast taps', () => {
      vi.setSystemTime(0);
      render(<TapTempoControl isRunning={false} onTempoChange={onTempoChange} />);
      fireEvent.click(tapBtn());
      vi.setSystemTime(1); // 1ms interval → well above MAX_BPM
      fireEvent.click(tapBtn());
      expect(onTempoChange).toHaveBeenCalledWith(MAX_BPM);
    });

  });

  describe('tapped animation', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('applies tapped class immediately after click', () => {
      vi.setSystemTime(0);
      render(<TapTempoControl isRunning={false} onTempoChange={onTempoChange} />);
      fireEvent.click(tapBtn());
      expect(tapBtn().className).toContain('tapped');
    });

    it('removes tapped class after 150ms', () => {
      vi.setSystemTime(0);
      render(<TapTempoControl isRunning={false} onTempoChange={onTempoChange} />);
      fireEvent.click(tapBtn());
      act(() => vi.advanceTimersByTime(150));
      expect(tapBtn().className).not.toContain('tapped');
    });
  });

  describe('inactivity reset', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('button remains enabled after 3s of inactivity', () => {
      vi.setSystemTime(0);
      render(<TapTempoControl isRunning={false} onTempoChange={onTempoChange} />);
      fireEvent.click(tapBtn());
      act(() => vi.advanceTimersByTime(3000));
      expect(tapBtn().disabled).toBe(false);
    });

    it('first tap after timer-based reset does not call onTempoChange', () => {
      vi.setSystemTime(0);
      render(<TapTempoControl isRunning={false} onTempoChange={onTempoChange} />);
      fireEvent.click(tapBtn());
      vi.setSystemTime(500);
      fireEvent.click(tapBtn()); // BPM = 120
      expect(onTempoChange).toHaveBeenCalledWith(120);
      onTempoChange.mockClear();

      act(() => vi.advanceTimersByTime(3000)); // reset timer fires, clears tap history

      vi.setSystemTime(4000);
      fireEvent.click(tapBtn()); // first tap in new session
      expect(onTempoChange).not.toHaveBeenCalled();
    });

    it('tap more than 3s after previous resets measurement inline', () => {
      // The inline stale check in handleTap (no timer advancement needed)
      vi.setSystemTime(0);
      render(<TapTempoControl isRunning={false} onTempoChange={onTempoChange} />);
      fireEvent.click(tapBtn());
      vi.setSystemTime(500);
      fireEvent.click(tapBtn()); // BPM = 120
      onTempoChange.mockClear();

      // Move clock > 3s past last tap without advancing fake timers
      vi.setSystemTime(4000); // 3.5s gap — stale check triggers in handleTap
      fireEvent.click(tapBtn()); // treated as first tap of new session
      expect(onTempoChange).not.toHaveBeenCalled();
    });
  });

  describe('isRunning change resets tap history', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('tap after isRunning reset does not combine with prior taps', () => {
      vi.setSystemTime(0);
      const { rerender } = render(<TapTempoControl isRunning={false} onTempoChange={onTempoChange} />);
      fireEvent.click(tapBtn()); // first tap at t=0

      rerender(<TapTempoControl isRunning={true} onTempoChange={onTempoChange} />);
      rerender(<TapTempoControl isRunning={false} onTempoChange={onTempoChange} />); // clears tap history

      vi.setSystemTime(500);
      fireEvent.click(tapBtn()); // fresh first tap — no BPM call
      expect(onTempoChange).not.toHaveBeenCalled();
    });
  });
});
