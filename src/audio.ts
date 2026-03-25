import { clamp } from './utils';

export const MIN_BPM = 1;
export const MAX_BPM = 999;

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;
const FREQ_ACCENTED = 1320;
const FREQ_NORMAL = 880;
const BEATS_PER_BAR = 4;

let audioCtx: AudioContext | null = null;
let nextNoteTime = 0;
let timerId: ReturnType<typeof setTimeout> | null = null;
let currentTempo = 120;
let currentBeat = 0;
let currentMuted = false;

function scheduleClick(time: number, isAccented: boolean): void {
  if (!audioCtx || currentMuted) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.frequency.value = isAccented ? FREQ_ACCENTED : FREQ_NORMAL;
  osc.type = 'sine';

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.8, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

  osc.start(time);
  osc.stop(time + 0.06);
}

function scheduler(): void {
  if (!audioCtx) return;
  while (nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD_S) {
    scheduleClick(nextNoteTime, currentBeat === 0);
    nextNoteTime += 60.0 / currentTempo;
    currentBeat = (currentBeat + 1) % BEATS_PER_BAR;
  }
  timerId = setTimeout(scheduler, LOOKAHEAD_MS);
}

function start(): void {
  stop(); // clear any existing scheduler before starting a new one
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  nextNoteTime = audioCtx.currentTime + 0.05;
  currentBeat = 0;
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

function updateTempo(tempo: number): void {
  currentTempo = clamp(Math.round(tempo), MIN_BPM, MAX_BPM);
  if (timerId !== null && audioCtx) {
    nextNoteTime = audioCtx.currentTime + 0.05;
    currentBeat = 0;
  }
}

export interface AudioControls {
  start: () => void;
  stop: () => void;
  updateTempo: (tempo: number) => void;
  setMuted: (muted: boolean) => void;
}

export const audioControls: AudioControls = { start, stop, updateTempo, setMuted };
