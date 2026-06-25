const DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const LABELS = { focus: 'Hora de focar', short: 'Pausa rápida', long: 'Relaxe um pouco' };
const CIRC = 691; // 2 * π * 110

const $ = (id) => document.getElementById(id);
const timeEl = $('time'), labelEl = $('label'), ring = $('ring');
const startBtn = $('startBtn'), resetBtn = $('resetBtn');

let mode = 'focus';
let remaining = DURATIONS[mode];
let total = DURATIONS[mode];
let timer = null;
let running = false;

// Estatísticas persistentes
let stats = JSON.parse(localStorage.getItem('pomo-stats') || '{"done":0,"min":0}');
function renderStats() {
  $('doneCount').textContent = stats.done;
  $('focusMin').textContent = stats.min;
  localStorage.setItem('pomo-stats', JSON.stringify(stats));
}

function fmt(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function draw() {
  timeEl.textContent = fmt(remaining);
  labelEl.textContent = LABELS[mode];
  const progress = remaining / total;
  ring.style.strokeDashoffset = CIRC * (1 - progress);
  document.title = running ? `${fmt(remaining)} · Pomodoro` : 'Pomodoro Focus ⏱️';
}

function setMode(m) {
  mode = m;
  document.body.dataset.mode = m;
  document.querySelectorAll('.mode').forEach(b => b.classList.toggle('active', b.dataset.m === m));
  stop();
  remaining = total = DURATIONS[m];
  draw();
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; o.type = 'sine';
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    o.start(); o.stop(ctx.currentTime + 0.6);
  } catch (e) { /* sem áudio disponível */ }
}

function complete() {
  stop();
  beep();
  if (mode === 'focus') {
    stats.done += 1;
    stats.min += Math.round(DURATIONS.focus / 60);
    renderStats();
    $('hint').textContent = '✅ Pomodoro concluído! Que tal uma pausa?';
  } else {
    $('hint').textContent = '🚀 Pausa encerrada. Bora focar de novo!';
  }
  remaining = total;
  draw();
}

function tick() {
  remaining--;
  draw();
  if (remaining <= 0) complete();
}

function start() {
  if (running) return;
  running = true;
  startBtn.textContent = 'Pausar';
  timer = setInterval(tick, 1000);
}

function stop() {
  running = false;
  startBtn.textContent = 'Iniciar';
  clearInterval(timer);
  draw();
}

startBtn.addEventListener('click', () => (running ? stop() : start()));
resetBtn.addEventListener('click', () => { stop(); remaining = total; draw(); });
document.querySelectorAll('.mode').forEach(b => b.addEventListener('click', () => setMode(b.dataset.m)));

// Atalho: barra de espaço inicia/pausa
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); running ? stop() : start(); }
});

ring.style.strokeDasharray = CIRC;
renderStats();
draw();
