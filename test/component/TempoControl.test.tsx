// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TempoControl, WHEEL_DEBOUNCE_MS } from '../../src/components/TempoControl/TempoControl';

const onChange = vi.fn();
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  user = userEvent.setup();
  onChange.mockClear();
});
afterEach(cleanup);

const defaultProps = { tempo: 120, min: 1, max: 999, onChange };

// Simulate a paste by setting the input's value directly on the instance
// (bypassing jsdom's number input normalization) and firing the input event.
function simulatePaste(input: HTMLInputElement, value: string): void {
  Object.defineProperty(input, 'value', { configurable: true, writable: true, value });
  fireEvent.input(input);
  delete (input as any).value;
}

describe('TempoControl', () => {
  describe('basic user interaction', () => {
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

    it('commits tempo on Enter', async () => {
      render(<TempoControl {...defaultProps} />);
      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '180');
      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith(180);
    });

    it('reverts to current tempo when cleared', async () => {
      render(<TempoControl {...defaultProps} tempo={120} />);
      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith(120);
    });

    it('clamps tempo to max on commit', async () => {
      render(<TempoControl {...defaultProps} />);
      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '9999');
      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith(999);
    });

    it('clamps tempo to min on commit', async () => {
      render(<TempoControl {...defaultProps} />);
      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '0');
      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('commits tempo on blur', async () => {
      render(<TempoControl {...defaultProps} />);
      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '90');
      await user.tab();
      expect(onChange).toHaveBeenCalledWith(90);
    });

    it('commits slider value on mouse up', () => {
      render(<TempoControl {...defaultProps} />);
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '100' } });
      fireEvent.mouseUp(slider);
      expect(onChange).toHaveBeenCalledWith(100);
    });

    it('slider updates after number input commit', async () => {
      function Wrapper() {
        const [tempo, setTempo] = useState(120);
        return <TempoControl tempo={tempo} min={1} max={999} onChange={setTempo} />;
      }
      render(<Wrapper />);
      await user.clear(screen.getByRole('spinbutton'));
      await user.type(screen.getByRole('spinbutton'), '160');
      await user.keyboard('{Enter}');
      expect((screen.getByRole('slider') as HTMLInputElement).value).toBe('160');
    });

    it('does not call onChange while typing in number input', async () => {
      render(<TempoControl {...defaultProps} />);
      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '150');
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('typing invalid characters into number input', () => {
    // Verifies that onKeyDown blocks the character before it reaches the input event,
    // not merely that onChange filters the resulting value.
    for (const key of ['.', '-', 'e', 'E', '+']) {
      it(`blocks '${key}' before it reaches the input event`, async () => {
        render(<TempoControl {...defaultProps} />);
        const input = screen.getByRole('spinbutton') as HTMLInputElement;
        const inputEvents: Event[] = [];
        input.addEventListener('input', e => inputEvents.push(e));
        await user.click(input);
        await user.keyboard(key);
        expect(inputEvents).toHaveLength(0);
        expect(input.value).toBe(String(defaultProps.tempo));
      });
    }
  });

  describe('pasting invalid characters into number input', () => {
    it('rejects decimal point', () => {
      render(<TempoControl {...defaultProps} />);
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      simulatePaste(input, '1.5');
      expect(input.value).toBe(String(defaultProps.tempo));
    });

    it('rejects minus sign', () => {
      render(<TempoControl {...defaultProps} />);
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      simulatePaste(input, '-60');
      expect(input.value).toBe(String(defaultProps.tempo));
    });

    it('rejects e notation (lowercase)', () => {
      render(<TempoControl {...defaultProps} />);
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      simulatePaste(input, '6e2');
      expect(input.value).toBe(String(defaultProps.tempo));
    });

    it('rejects e notation (uppercase)', () => {
      render(<TempoControl {...defaultProps} />);
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      simulatePaste(input, '6E2');
      expect(input.value).toBe(String(defaultProps.tempo));
    });

    it('rejects plus sign', () => {
      render(<TempoControl {...defaultProps} />);
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      simulatePaste(input, '1e+2');
      expect(input.value).toBe(String(defaultProps.tempo));
    });
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
