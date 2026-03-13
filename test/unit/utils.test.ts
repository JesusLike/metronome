import { describe, it, expect } from 'vitest';
import { clamp } from '../../src/utils';

describe('clamp', () => {
  it('clamps value below min to min', () => {
    expect(clamp(0, 40, 200)).toBe(40);
  });

  it('clamps value above max to max', () => {
    expect(clamp(999, 40, 200)).toBe(200);
  });

  it('returns value unchanged when within range', () => {
    expect(clamp(120, 40, 200)).toBe(120);
  });

  it('returns value unchanged when at the range min', () => {
    expect(clamp(120, 120, 200)).toBe(120);
  });

  it('returns value unchanged when at the range max', () => {
    expect(clamp(120, 40, 120)).toBe(120);
  });

  it('returns exact value if min equals max', () => {
    expect(clamp(100, 100, 100)).toBe(100);
    expect(clamp(90, 100, 100)).toBe(100);
    expect(clamp(110, 100, 100)).toBe(100); 
  })

  it('clamps value to min with inverted range', () => {
    expect(clamp(60, 120, 80)).toBe(80);
  })

  it('clamps value to max with inverted range', () => {
    expect(clamp(180, 120, 80)).toBe(120);
  })

  it('returns value unchanged within inverted range', () => {
    expect(clamp(100, 120, 80)).toBe(100);
  })
});
