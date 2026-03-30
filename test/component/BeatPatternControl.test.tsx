// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { BeatPatternControl } from '../../src/components/BeatPatternControl/BeatPatternControl';
import { BeatType, DEFAULT_BEAT_PATTERN } from '../../src/audio';

afterEach(cleanup);

const onChange = vi.fn();
afterEach(() => onChange.mockClear());

// Helper: get the beat button for beat at index (1-based label)
const beatBtn = (n: number) => screen.getByRole('button', { name: new RegExp(`^Beat ${n}:`) });

describe('BeatPatternControl', () => {
  describe('rendering', () => {
    it('renders a button for each beat in the pattern', () => {
      render(<BeatPatternControl pattern={DEFAULT_BEAT_PATTERN} activeBeat={null} onChange={onChange} />);
      for (let i = 1; i <= DEFAULT_BEAT_PATTERN.length; i++) {
        expect(beatBtn(i)).toBeTruthy();
      }
    });

    it('aria-label reflects beat type', () => {
      const pattern: BeatType[] = [BeatType.Strong, BeatType.Medium, BeatType.Weak, BeatType.Muted];
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      expect(beatBtn(1).getAttribute('aria-label')).toBe('Beat 1: strong');
      expect(beatBtn(2).getAttribute('aria-label')).toBe('Beat 2: medium');
      expect(beatBtn(3).getAttribute('aria-label')).toBe('Beat 3: weak');
      expect(beatBtn(4).getAttribute('aria-label')).toBe('Beat 4: muted');
    });

    it('renders a single row for 8 beats', () => {
      const pattern = Array<BeatType>(8).fill(BeatType.Weak);
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      // All 8 beats present, single row means rowIdx=0 for all → beatIdx = colIdx
      expect(beatBtn(8)).toBeTruthy();
    });

    it('renders two rows for 9 beats', () => {
      const pattern = Array<BeatType>(9).fill(BeatType.Weak);
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      // With 9 beats splitAt = ceil(9/2) = 5: row1 = 1-5, row2 = 6-9
      for (let i = 1; i <= 9; i++) expect(beatBtn(i)).toBeTruthy();
    });

    it('renders two rows for 16 beats', () => {
      const pattern = Array<BeatType>(16).fill(BeatType.Weak);
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      for (let i = 1; i <= 16; i++) expect(beatBtn(i)).toBeTruthy();
    });
  });

  describe('left click cycles forward', () => {
    it('strong → medium on click', () => {
      const pattern: BeatType[] = [BeatType.Strong, BeatType.Weak, BeatType.Weak, BeatType.Weak];
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      fireEvent.click(beatBtn(1));
      expect(onChange).toHaveBeenCalledWith([BeatType.Medium, BeatType.Weak, BeatType.Weak, BeatType.Weak]);
    });

    it('medium → weak on click', () => {
      const pattern: BeatType[] = [BeatType.Medium, BeatType.Weak, BeatType.Weak, BeatType.Weak];
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      fireEvent.click(beatBtn(1));
      expect(onChange).toHaveBeenCalledWith([BeatType.Weak, BeatType.Weak, BeatType.Weak, BeatType.Weak]);
    });

    it('weak → muted on click', () => {
      const pattern: BeatType[] = [BeatType.Weak, BeatType.Weak, BeatType.Weak, BeatType.Weak];
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      fireEvent.click(beatBtn(1));
      expect(onChange).toHaveBeenCalledWith([BeatType.Muted, BeatType.Weak, BeatType.Weak, BeatType.Weak]);
    });

    it('muted → strong on click (wraps around)', () => {
      const pattern: BeatType[] = [BeatType.Muted, BeatType.Weak, BeatType.Weak, BeatType.Weak];
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      fireEvent.click(beatBtn(1));
      expect(onChange).toHaveBeenCalledWith([BeatType.Strong, BeatType.Weak, BeatType.Weak, BeatType.Weak]);
    });

    it('only changes the clicked beat index', () => {
      render(<BeatPatternControl pattern={DEFAULT_BEAT_PATTERN} activeBeat={null} onChange={onChange} />);
      fireEvent.click(beatBtn(3));
      const newPattern = onChange.mock.calls[0][0] as BeatType[];
      expect(newPattern[0]).toBe(DEFAULT_BEAT_PATTERN[0]);
      expect(newPattern[1]).toBe(DEFAULT_BEAT_PATTERN[1]);
      expect(newPattern[3]).toBe(DEFAULT_BEAT_PATTERN[3]);
    });
  });

  describe('right click cycles backward', () => {
    it('medium → strong on right click', () => {
      const pattern: BeatType[] = [BeatType.Medium, BeatType.Weak, BeatType.Weak, BeatType.Weak];
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      fireEvent.contextMenu(beatBtn(1));
      expect(onChange).toHaveBeenCalledWith([BeatType.Strong, BeatType.Weak, BeatType.Weak, BeatType.Weak]);
    });

    it('strong → muted on right click (wraps backward)', () => {
      const pattern: BeatType[] = [BeatType.Strong, BeatType.Weak, BeatType.Weak, BeatType.Weak];
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      fireEvent.contextMenu(beatBtn(1));
      expect(onChange).toHaveBeenCalledWith([BeatType.Muted, BeatType.Weak, BeatType.Weak, BeatType.Weak]);
    });

    it('weak → medium on right click', () => {
      const pattern: BeatType[] = [BeatType.Weak, BeatType.Weak, BeatType.Weak, BeatType.Weak];
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      fireEvent.contextMenu(beatBtn(1));
      expect(onChange).toHaveBeenCalledWith([BeatType.Medium, BeatType.Weak, BeatType.Weak, BeatType.Weak]);
    });

    it('muted → weak on right click', () => {
      const pattern: BeatType[] = [BeatType.Muted, BeatType.Weak, BeatType.Weak, BeatType.Weak];
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      fireEvent.contextMenu(beatBtn(1));
      expect(onChange).toHaveBeenCalledWith([BeatType.Weak, BeatType.Weak, BeatType.Weak, BeatType.Weak]);
    });
  });

  describe('long press cycles backward', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('cycles backward after 500ms touch', () => {
      const pattern: BeatType[] = [BeatType.Medium, BeatType.Weak, BeatType.Weak, BeatType.Weak];
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      fireEvent.touchStart(beatBtn(1));
      act(() => vi.advanceTimersByTime(500));
      expect(onChange).toHaveBeenCalledWith([BeatType.Strong, BeatType.Weak, BeatType.Weak, BeatType.Weak]);
    });

    it('does not cycle backward before 500ms', () => {
      const pattern: BeatType[] = [BeatType.Medium, BeatType.Weak, BeatType.Weak, BeatType.Weak];
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      fireEvent.touchStart(beatBtn(1));
      act(() => vi.advanceTimersByTime(499));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('cancels long press on touchEnd before threshold', () => {
      const pattern: BeatType[] = [BeatType.Medium, BeatType.Weak, BeatType.Weak, BeatType.Weak];
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      fireEvent.touchStart(beatBtn(1));
      fireEvent.touchEnd(beatBtn(1));
      act(() => vi.advanceTimersByTime(500));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('cancels long press on touchMove', () => {
      const pattern: BeatType[] = [BeatType.Medium, BeatType.Weak, BeatType.Weak, BeatType.Weak];
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      fireEvent.touchStart(beatBtn(1));
      fireEvent.touchMove(beatBtn(1));
      act(() => vi.advanceTimersByTime(500));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('cancelLongPress is a no-op when called without a preceding touchStart', () => {
      const pattern: BeatType[] = [BeatType.Medium, BeatType.Weak, BeatType.Weak, BeatType.Weak];
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      // touchEnd without touchStart — timer is null, should not throw
      expect(() => fireEvent.touchEnd(beatBtn(1))).not.toThrow();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('long press does not also trigger click forward-cycle', () => {
      const pattern: BeatType[] = [BeatType.Medium, BeatType.Weak, BeatType.Weak, BeatType.Weak];
      render(<BeatPatternControl pattern={pattern} activeBeat={null} onChange={onChange} />);
      fireEvent.touchStart(beatBtn(1));
      act(() => vi.advanceTimersByTime(500));
      fireEvent.click(beatBtn(1)); // browser fires click after touch
      // only the backward cycle call, not a second forward-cycle
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith([BeatType.Strong, BeatType.Weak, BeatType.Weak, BeatType.Weak]);
    });
  });

  describe('active beat highlight', () => {
    it('applies active class to the active beat button', () => {
      render(<BeatPatternControl pattern={DEFAULT_BEAT_PATTERN} activeBeat={0} onChange={onChange} />);
      const btn = beatBtn(1);
      expect(btn.className).toContain('active');
    });

    it('does not apply active class to non-active beat buttons', () => {
      render(<BeatPatternControl pattern={DEFAULT_BEAT_PATTERN} activeBeat={0} onChange={onChange} />);
      expect(beatBtn(2).className).not.toContain('active');
      expect(beatBtn(3).className).not.toContain('active');
    });

    it('no button is active when activeBeat is null', () => {
      render(<BeatPatternControl pattern={DEFAULT_BEAT_PATTERN} activeBeat={null} onChange={onChange} />);
      for (let i = 1; i <= DEFAULT_BEAT_PATTERN.length; i++) {
        expect(beatBtn(i).className).not.toContain('active');
      }
    });

    it('moves active class when activeBeat prop changes', () => {
      const { rerender } = render(
        <BeatPatternControl pattern={DEFAULT_BEAT_PATTERN} activeBeat={0} onChange={onChange} />
      );
      expect(beatBtn(1).className).toContain('active');
      rerender(<BeatPatternControl pattern={DEFAULT_BEAT_PATTERN} activeBeat={2} onChange={onChange} />);
      expect(beatBtn(1).className).not.toContain('active');
      expect(beatBtn(3).className).toContain('active');
    });
  });
});
