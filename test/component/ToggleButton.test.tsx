// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(cleanup);
import { ToggleButton } from '../../src/components/ToggleButton/ToggleButton';

describe('ToggleButton', () => {
  it('shows Start when not running', () => {
    render(<ToggleButton isRunning={false} onToggle={() => {}} />);
    expect(screen.getByRole('button').textContent).toBe('Start');
  });

  it('shows Stop when running', () => {
    render(<ToggleButton isRunning={true} onToggle={() => {}} />);
    expect(screen.getByRole('button').textContent).toBe('Stop');
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<ToggleButton isRunning={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
