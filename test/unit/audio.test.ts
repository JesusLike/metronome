import { describe, it, expect } from 'vitest';
import { BeatType, getBeatFrequency, getBeatGain, FREQ_STRONG, FREQ_MEDIUM, FREQ_WEAK, GAIN_STRONG, GAIN_MEDIUM, GAIN_WEAK } from '../../src/audio';

describe('getBeatFrequency', () => {
  it('returns FREQ_STRONG for strong', () => {
    expect(getBeatFrequency(BeatType.Strong)).toBe(FREQ_STRONG);
  });

  it('returns FREQ_MEDIUM for medium', () => {
    expect(getBeatFrequency(BeatType.Medium)).toBe(FREQ_MEDIUM);
  });

  it('returns FREQ_WEAK for weak', () => {
    expect(getBeatFrequency(BeatType.Weak)).toBe(FREQ_WEAK);
  });

  it('strong > medium > weak', () => {
    expect(getBeatFrequency(BeatType.Strong)).toBeGreaterThan(getBeatFrequency(BeatType.Medium));
    expect(getBeatFrequency(BeatType.Medium)).toBeGreaterThan(getBeatFrequency(BeatType.Weak));
  });
});

describe('getBeatGain', () => {
  it('returns GAIN_STRONG for strong', () => {
    expect(getBeatGain(BeatType.Strong)).toBe(GAIN_STRONG);
  });

  it('returns GAIN_MEDIUM for medium', () => {
    expect(getBeatGain(BeatType.Medium)).toBe(GAIN_MEDIUM);
  });

  it('returns GAIN_WEAK for weak', () => {
    expect(getBeatGain(BeatType.Weak)).toBe(GAIN_WEAK);
  });

  it('strong > medium > weak', () => {
    expect(getBeatGain(BeatType.Strong)).toBeGreaterThan(getBeatGain(BeatType.Medium));
    expect(getBeatGain(BeatType.Medium)).toBeGreaterThan(getBeatGain(BeatType.Weak));
  });
});
