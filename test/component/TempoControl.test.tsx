// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TempoControl, WHEEL_DEBOUNCE_MS } from '../../src/components/TempoControl/TempoControl';

const onChange = vi.fn();

beforeEach(() => onChange.mockClear());
afterEach(cleanup);

const defaultProps = { tempo: 120, min: 1, max: 999, onChange };

describe('TempoControl', () => {
  it('displays the current tempo', () => {
    render(<TempoControl {...defaultProps} tempo={140} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('140');
  });

  it('updates the number input when slider moves', () => {
    render(<TempoControl {...defaultProps} />);
    const slider = screen.getByRole('slider') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '160' } });
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('160');
  });

  it('commits tempo on Enter', () => {
    render(<TempoControl {...defaultProps} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '180' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(180);
  });

  it('reverts to current tempo on invalid input', () => {
    render(<TempoControl {...defaultProps} tempo={120} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(120);
  });

  it('clamps tempo to max on commit', () => {
    render(<TempoControl {...defaultProps} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '9999' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(999);
  });

  it('clamps tempo to min on commit', () => {
    render(<TempoControl {...defaultProps} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('commits tempo on blur', () => {
    render(<TempoControl {...defaultProps} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '90' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(90);
  });

  it('commits slider value on mouse up', () => {
    render(<TempoControl {...defaultProps} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '100' } });
    fireEvent.mouseUp(slider);
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it('updates slider when tempo prop changes after number input commit', () => {
    const { rerender } = render(<TempoControl {...defaultProps} tempo={120} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '160' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    rerender(<TempoControl {...defaultProps} tempo={160} />);
    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.value).toBe('160');
  });

  it('ignores decimal point while typing', () => {
    render(<TempoControl {...defaultProps} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.input(input, { target: { value: '60' } });
    fireEvent.keyDown(input, { key: '.',  code: 190 }); // rejected — '6.0' is a valid float so jsdom won't sanitize it
    expect(input.value).toBe('60');
  });

  it('ignores minus sign while typing', () => {
    render(<TempoControl {...defaultProps} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.input(input, { target: { value: '60' } });
    fireEvent.keyDown(input, { key: '-' });
    expect(input.value).toBe('60');
  });

  it('ignores e notation while typing', () => {
    render(<TempoControl {...defaultProps} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.input(input, { target: { value: '60' } });
    fireEvent.keyDown(input, { key: 'e' });
    expect(input.value).toBe('60');
  });

  it('ignores E notation while typing', () => {
    render(<TempoControl {...defaultProps} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.input(input, { target: { value: '60' } });
    fireEvent.keyDown(input, { key: 'E' });
    expect(input.value).toBe('60');
  });

  it('ignores plus sign while typing', () => {
    render(<TempoControl {...defaultProps} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.input(input, { target: { value: '60' } });
    fireEvent.keyDown(input, { key: '+' });
    expect(input.value).toBe('60');
  });

  it('does not call onChange while typing in number input', () => {
    render(<TempoControl {...defaultProps} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.change(input, { target: { value: '15' } });
    fireEvent.change(input, { target: { value: '150' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  describe('mouse wheel', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('increments tempo on scroll up on slider', () => {
      render(<TempoControl {...defaultProps} tempo={120} />);
      fireEvent.wheel(screen.getByRole('slider'), { deltaY: -1 });
      vi.advanceTimersByTime(WHEEL_DEBOUNCE_MS);
      expect(onChange).toHaveBeenCalledWith(121);
    });

    it('decrements tempo on scroll down on slider', () => {
      render(<TempoControl {...defaultProps} tempo={120} />);
      fireEvent.wheel(screen.getByRole('slider'), { deltaY: 1 });
      vi.advanceTimersByTime(WHEEL_DEBOUNCE_MS);
      expect(onChange).toHaveBeenCalledWith(119);
    });

    it('increments tempo on scroll up on number input', () => {
      render(<TempoControl {...defaultProps} tempo={120} />);
      fireEvent.wheel(screen.getByRole('spinbutton'), { deltaY: -1 });
      vi.advanceTimersByTime(WHEEL_DEBOUNCE_MS);
      expect(onChange).toHaveBeenCalledWith(121);
    });

    it('decrements tempo on scroll down on number input', () => {
      render(<TempoControl {...defaultProps} tempo={120} />);
      fireEvent.wheel(screen.getByRole('spinbutton'), { deltaY: 1 });
      vi.advanceTimersByTime(WHEEL_DEBOUNCE_MS);
      expect(onChange).toHaveBeenCalledWith(119);
    });

    it('debounces rapid wheel scrolls into a single commit', () => {
      render(<TempoControl {...defaultProps} tempo={120} />);
      const slider = screen.getByRole('slider');
      fireEvent.wheel(slider, { deltaY: -1 });
      fireEvent.wheel(slider, { deltaY: -1 });
      fireEvent.wheel(slider, { deltaY: -1 });
      vi.advanceTimersByTime(WHEEL_DEBOUNCE_MS);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(123);
    });
  });
});
