// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MuteButton } from '../../src/components/MuteButton/MuteButton';

afterEach(cleanup);

describe('MuteButton', () => {
  it('has Mute aria-label when unmuted', () => {
    render(<MuteButton isMuted={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Mute' })).toBeTruthy();
  });

  it('has Unmute aria-label when muted', () => {
    render(<MuteButton isMuted={true} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Unmute' })).toBeTruthy();
  });

  it('calls onToggle when clicked while unmuted', () => {
    const onToggle = vi.fn();
    render(<MuteButton isMuted={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('calls onToggle when clicked while muted', () => {
    const onToggle = vi.fn();
    render(<MuteButton isMuted={true} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
