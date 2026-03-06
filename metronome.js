const MIN_BPM = 1;
const MAX_BPM = 999;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;

let audioCtx = null;
let running = false;
let nextNoteTime = 0;
let timerId = null;
let tempo = 120;
let currentBeat = 0;

const tempoInput = document.getElementById('tempo-input');
const tempoSlider = document.getElementById('tempo-slider');
const toggleBtn = document.getElementById('toggle-btn');

tempoInput.min = MIN_BPM;
tempoInput.max = MAX_BPM;
tempoInput.value = tempo;
tempoSlider.min = MIN_BPM;
tempoSlider.max = MAX_BPM;
tempoSlider.value = tempo;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function setTempo(val, { updateSlider = true } = {}) {
  tempo = clamp(Math.round(val), MIN_BPM, MAX_BPM);
  tempoInput.value = tempo;
  if (updateSlider) tempoSlider.value = tempo;
  if (running) {
    nextNoteTime = audioCtx.currentTime + 0.05;
    currentBeat = 0;
  }
}

tempoInput.addEventListener('change', () => {
  const val = parseInt(tempoInput.value, 10);
  setTempo(isNaN(val) ? tempo : val);
});

tempoSlider.addEventListener('input', () => {
  tempoInput.value = tempoSlider.value;
});

tempoSlider.addEventListener('change', () => {
  setTempo(parseInt(tempoSlider.value, 10), { updateSlider: false });
});

function scheduleClick(time, isAccented) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.frequency.value = isAccented ? 1200 : 800;
  osc.type = 'sine';

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.8, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

  osc.start(time);
  osc.stop(time + 0.06);
}

function scheduler() {
  while (nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD_S) {
    scheduleClick(nextNoteTime, currentBeat === 0);
    nextNoteTime += 60.0 / tempo;
    currentBeat = (currentBeat + 1) % 4;
  }
  timerId = setTimeout(scheduler, LOOKAHEAD_MS);
}

function start() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  nextNoteTime = audioCtx.currentTime + 0.05;
  currentBeat = 0;
  running = true;
  scheduler();
  toggleBtn.textContent = 'Stop';
  toggleBtn.classList.add('running');
}

function stop() {
  clearTimeout(timerId);
  running = false;
  toggleBtn.textContent = 'Start';
  toggleBtn.classList.remove('running');
}

toggleBtn.addEventListener('click', () => {
  running ? stop() : start();
});
