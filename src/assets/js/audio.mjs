/**
 * audio.mjs — WebAudio 摩斯/灯语播放（时序与构建期 WAV 生成同源）。
 */

const UNIT = 0.14;   // 摩斯基本单位（秒）
const FREQ = 620;    // 摩斯音高

/** 摩斯串 → 时序事件。 */
export function timeline(morse, unit = UNIT) {
  const events = [];
  let t = 0;
  for (const ch of morse) {
    if (ch === '.') { events.push({ t, d: unit }); t += unit * 2; }
    else if (ch === '-') { events.push({ t, d: unit * 3 }); t += unit * 4; }
    else if (ch === ' ') t += unit * 2;
    else if (ch === '/') t += unit * 6;
  }
  return { events, duration: t };
}

let ctx = null;
function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext ?? /** @type {any} */ (window).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** 播放摩斯串，返回总时长（秒）。 */
export function playMorse(morse, { freq = FREQ } = {}) {
  const ac = audioCtx();
  const { events, duration } = timeline(morse);
  for (const ev of events) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t0 = ac.currentTime + ev.t + 0.05;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.4, t0 + 0.008);
    gain.gain.setValueAtTime(0.4, t0 + ev.d - 0.02);
    gain.gain.linearRampToValueAtTime(0, t0 + ev.d);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + ev.d + 0.02);
  }
  return duration;
}

/** 萤火灯语（ssLss：短短长短短）→ 可播放的摩斯等价（短=点 长=划，间隔加宽）。 */
export function playSign(sign = 'ssLss', { unit = 0.32, freq = 520 } = {}) {
  const ac = audioCtx();
  let t = 0;
  for (const ch of sign) {
    const d = ch === 'L' ? unit * 2.4 : unit;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t0 = ac.currentTime + t + 0.05;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.42, t0 + 0.01);
    gain.gain.setValueAtTime(0.42, t0 + d - 0.03);
    gain.gain.linearRampToValueAtTime(0, t0 + d);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + d + 0.02);
    t += d + unit * 1.6;
  }
  return t;
}

/** 简易波形可视化（Canvas 2D）。 */
export function drawWave(canvas, morse, { unit = UNIT } = {}) {
  const g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const { events, duration } = timeline(morse, unit);
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#04070a';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#f2a33c';
  g.lineWidth = 1.5;
  g.beginPath();
  for (const ev of events) {
    const x0 = (ev.t / duration) * W;
    const x1 = ((ev.t + ev.d) / duration) * W;
    const y = H / 2;
    g.moveTo(x0, y);
    for (let x = x0; x < x1; x += 2) {
      g.lineTo(x, y - Math.sin((x - x0) * 0.55) * H * 0.32);
    }
    g.lineTo(x1, y);
  }
  g.stroke();
}
