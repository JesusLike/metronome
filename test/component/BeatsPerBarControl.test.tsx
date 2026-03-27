// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BeatsPerBarControl } from '../../src/components/BeatsPerBarControl/BeatsPerBarControl';
import { MIN_BEATS_PER_BAR, MAX_BEATS_PER_BAR, DEFAULT_BEATS_PER_BAR } from '../../src/audio';

afterEach(cleanup);

const onChange = vi.fn();

afterEach(() => onChange.mockClear());

describe('BeatsPerBarControl', () => {
  it('shows current value in trigger', () => {
    render(<BeatsPerBarControl value={DEFAULT_BEATS_PER_BAR} onChange={onChange} />);
    expect(screen.getByRole('button', { name: String(DEFAULT_BEATS_PER_BAR) })).toBeTruthy();
  });

  it('shows Beats/bar label', () => {
    render(<BeatsPerBarControl value={DEFAULT_BEATS_PER_BAR} onChange={onChange} />);
    expect(screen.getByText('Beats/bar')).toBeTruthy();
  });

  it('dropdown is hidden initially', () => {
    render(<BeatsPerBarControl value={DEFAULT_BEATS_PER_BAR} onChange={onChange} />);
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('opens dropdown on trigger click', () => {
    render(<BeatsPerBarControl value={DEFAULT_BEATS_PER_BAR} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('list')).toBeTruthy();
  });

  it('shows all options from MIN to MAX when open', () => {
    render(<BeatsPerBarControl value={DEFAULT_BEATS_PER_BAR} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    for (let n = MIN_BEATS_PER_BAR; n <= MAX_BEATS_PER_BAR; n++) {
      expect(screen.getAllByRole('button', { name: String(n) }).length).toBeGreaterThan(0);
    }
  });

  it('calls onChange with selected value', () => {
    render(<BeatsPerBarControl value={DEFAULT_BEATS_PER_BAR} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getAllByRole('button', { name: '6' })[0]);
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('closes dropdown after selecting an option', () => {
    render(<BeatsPerBarControl value={DEFAULT_BEATS_PER_BAR} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getAllByRole('button', { name: '6' })[0]);
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('closes dropdown on outside mousedown', () => {
    render(<BeatsPerBarControl value={DEFAULT_BEATS_PER_BAR} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('list')).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('does not call onChange on outside click', () => {
    render(<BeatsPerBarControl value={DEFAULT_BEATS_PER_BAR} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.mouseDown(document.body);
    expect(onChange).not.toHaveBeenCalled();
  });
});
