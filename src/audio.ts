import { clamp } from './utils';

export const MIN_BPM = 1;
export const MAX_BPM = 999;
export const MIN_BEATS_PER_BAR = 2;
export const MAX_BEATS_PER_BAR = 16;
export const DEFAULT_BEATS_PER_BAR = 4;

export const enum BeatType {
  Strong = 'strong',
  Medium = 'medium',
  Weak = 'weak',
  Muted = 'muted',
}

export const DEFAULT_BEAT_PATTERN: BeatType[] = [BeatType.Strong, BeatType.Medium, BeatType.Medium, BeatType.Medium];

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;
export const FREQ_STRONG = 1320;
export const FREQ_MEDIUM = 880;
export const FREQ_WEAK = 660;
export const GAIN_STRONG = 1.0;
export const GAIN_MEDIUM = 0.8;
export const GAIN_WEAK = 0.2;

export function getBeatFrequency(beat: BeatType): number {
  switch (beat) {
    case BeatType.Strong: return FREQ_STRONG;
    case BeatType.Medium: return FREQ_MEDIUM;
    default: return FREQ_WEAK;
  }
}

export function getBeatGain(beat: BeatType): number {
  switch (beat) {
    case BeatType.Strong: return GAIN_STRONG;
    case BeatType.Medium: return GAIN_MEDIUM;
    default: return GAIN_WEAK;
  }
}

let audioCtx: AudioContext | null = null;
let nextNoteTime = 0;
let timerId: ReturnType<typeof setTimeout> | null = null;
let currentTempo = 120;
let nextBeatToFire = 0;
let currentMuted = false;
let currentBeatsPerBar = DEFAULT_BEATS_PER_BAR;
let currentBeatPattern: BeatType[] = [...DEFAULT_BEAT_PATTERN];

// Queue of upcoming/recent beat events used for UI sync.
const beatQueue: { time: number; index: number }[] = [];
const BEAT_QUEUE_MAX = 32;

function scheduleClick(time: number, beat: BeatType): void {
  if (!audioCtx || currentMuted || beat === BeatType.Muted) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.frequency.value = getBeatFrequency(beat);
  osc.type = 'sine';

  const peakGain = getBeatGain(beat);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(peakGain, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

  osc.start(time);
  osc.stop(time + 0.06);
}

function scheduler(): void {
  if (!audioCtx) return;
  while (nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD_S) {
    beatQueue.push({ time: nextNoteTime, index: nextBeatToFire });
    if (beatQueue.length > BEAT_QUEUE_MAX) beatQueue.shift();
    scheduleClick(nextNoteTime, currentBeatPattern[nextBeatToFire] ?? BeatType.Weak);
    nextNoteTime += 60.0 / currentTempo;
    nextBeatToFire = (nextBeatToFire + 1) % currentBeatsPerBar;
  }
  timerId = setTimeout(scheduler, LOOKAHEAD_MS);
}

function getLastFiredBeat(): number | null {
  if (!audioCtx || beatQueue.length === 0) return null;
  const now = audioCtx.currentTime;
  let result: number | null = null;
  for (const entry of beatQueue) {
    if (entry.time <= now) result = entry.index;
  }
  return result;
}

function start(): void {
  beatQueue.length = 0;
  stop(); // clear any existing scheduler before starting a new one
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  nextNoteTime = audioCtx.currentTime + 0.05;
  nextBeatToFire = 0;
  scheduler();
}

function stop(): void {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function setMuted(muted: boolean): void {
  currentMuted = muted;
}

function setBeatsPerBar(beats: number): void {
  currentBeatsPerBar = clamp(beats, MIN_BEATS_PER_BAR, MAX_BEATS_PER_BAR);
  nextBeatToFire = 0;
}

function setBeatPattern(pattern: BeatType[]): void {
  currentBeatPattern = pattern;
}

function updateTempo(tempo: number): void {
  currentTempo = clamp(Math.round(tempo), MIN_BPM, MAX_BPM);
  if (timerId !== null && audioCtx) {
    nextNoteTime = audioCtx.currentTime + 0.05;
    nextBeatToFire = 0;
  }
}

export interface AudioControls {
  start: () => void;
  stop: () => void;
  updateTempo: (tempo: number) => void;
  setMuted: (muted: boolean) => void;
  setBeatsPerBar: (beats: number) => void;
  setBeatPattern: (pattern: BeatType[]) => void;
  getLastFiredBeat: () => number | null;
}

export const audioControls: AudioControls = { start, stop, updateTempo, setMuted, setBeatsPerBar, setBeatPattern, getLastFiredBeat: getLastFiredBeat };
