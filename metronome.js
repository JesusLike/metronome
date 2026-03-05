const MIN_BPM = 20;
const MAX_BPM = 300;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;

let audioCtx = null;
let running = false;
let nextNoteTime = 0;
let timerId = null;
let tempo = 120;

const tempoInput = document.getElementById('tempo-input');
const tempoSlider = document.getElementById('tempo-slider');
const toggleBtn = document.getElementById('toggle-btn');

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function setTempo(val, { updateSlider = true } = {}) {
  tempo = clamp(Math.round(val), MIN_BPM, MAX_BPM);
  tempoInput.value = tempo;
  if (updateSlider) tempoSlider.value = tempo;
}

tempoInput.addEventListener('input', () => {
  const val = parseInt(tempoInput.value, 10);
  if (!isNaN(val)) setTempo(val);
});

tempoInput.addEventListener('blur', () => {
  setTempo(parseInt(tempoInput.value, 10) || tempo);
});

tempoSlider.addEventListener('input', () => {
  setTempo(parseInt(tempoSlider.value, 10), { updateSlider: false });
});

function scheduleClick(time) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.frequency.value = 1000;
  osc.type = 'sine';

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.8, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

  osc.start(time);
  osc.stop(time + 0.06);
}

function scheduler() {
  while (nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD_S) {
    scheduleClick(nextNoteTime);
    nextNoteTime += 60.0 / tempo;
  }
  timerId = setTimeout(scheduler, LOOKAHEAD_MS);
}

function start() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  nextNoteTime = audioCtx.currentTime + 0.05;
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
