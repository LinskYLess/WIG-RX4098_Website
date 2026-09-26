/** relight.mjs — 终局：灯语敲击器（G5）→ keeper；守灯人页（导出/呼叫按钮）。 */

import { get, setGate, setKeeper, exportRescue } from './state.mjs';
import { playSign, playMorse, drawWave } from './audio.mjs';
import { toast, attemptGate } from './ui.mjs';
import { textToMorse } from '../../arg/cipher.mjs';

export function initRelight() {
  const tapper = document.getElementById('tapper');
  if (!tapper) return;
  const s = get();
  if (!(s.gates.r1 && s.gates.r2 && s.gates.r3) && !s.keeper) {
    tapper.innerHTML = '<p>（信读完了？读完再说。）</p>';
    return;
  }
  tapper.innerHTML = `
    <h3>回应灯塔</h3>
    <p>2019-06-21 23:44，她说这个信号的意思是「在」。现在轮到你了。</p>
    <div class="morse-tapper">
      <button class="btn" id="tap-s">● 短</button>
      <button class="btn" id="tap-L">— 长</button>
      <button class="btn" id="tap-reset">清空</button>
      <button class="btn primary" id="tap-play">试听</button>
      <div class="morse-display" id="tap-display">…</div>
    </div>
    <canvas id="tap-wave" width="480" height="72"></canvas>
    <p class="tap-note">敲错可以清空。敲对的话……你自然知道。（卡住了也可以直接输入它的意思）</p>
    <form id="tap-fallback"><input type="text" placeholder="……"><button class="btn" type="submit">说</button></form>
  `;

  const seq = [];
  const display = /** @type {HTMLElement} */ (tapper.querySelector('#tap-display'));
  const render = () => {
    display.textContent = seq.length ? seq.map((c) => (c === 'L' ? '—' : '●')).join('') : '…';
  };
  // 目标由页面内的 g5 金丝雀载荷承载（明文不落任何 JS）
  const targetLen = 5;
  const expect = 'ssLss';
  const check = () => {
    if (seq.length !== targetLen) return;
    if (seq.join('') === expect) {
      tapper.innerHTML = '<h3>●●—●●</h3><p>收到。</p>';
      // 先把玩家敲出的信号存为 g5 答案（终局页重放注入需要），再接灯
      setGate('g5', seq.join('').toLowerCase());
      setKeeper();
      toast('★ 灯常亮了', '从现在起，由你守灯。');
      setTimeout(() => { location.href = '/relight/end/'; }, 1600);
    } else {
      seq.length = 0;
      render();
      fails++;
      if (fails >= 3) { const fb = /** @type {HTMLElement} */ (tapper.querySelector('#tap-fallback')); if (fb) fb.style.display = 'block'; }
    }
  };
  let fails = 0;
  /** @type {HTMLElement} */ (tapper.querySelector('#tap-s')).addEventListener('click', () => { playSign('s'); seq.push('s'); render(); check(); });
  /** @type {HTMLElement} */ (tapper.querySelector('#tap-L')).addEventListener('click', () => { playSign('L'); seq.push('L'); render(); check(); });
  /** @type {HTMLElement} */ (tapper.querySelector('#tap-reset')).addEventListener('click', () => { seq.length = 0; render(); });
  /** @type {HTMLElement} */ (tapper.querySelector('#tap-play')).addEventListener('click', () => {
    playSign(seq.join('') || expect);
    drawWave(/** @type {HTMLCanvasElement} */ (tapper.querySelector('#tap-wave')), 'ss ss / s s / / ss ss'.replace(/ss ss/g, '.'), {});
  });
  tapper.querySelector('#tap-fallback')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = /** @type {HTMLInputElement} */ (/** @type {HTMLFormElement} */ (e.target).querySelector('input')).value.trim();
    if (!v) return;
    // 走统一门判定（页面 g5 双金丝雀：敲击串与文本义都能解出 MARKER）
    if (attemptGate('g5', 'raw', v)) {
      tapper.innerHTML = '<h3>●●—●●</h3><p>收到。</p>';
      setKeeper();
      setTimeout(() => { location.href = '/relight/end/'; }, 1600);
    }
  });
  render();
}

/** /relight/end/ 守灯人页的按钮。 */
export function initEnd() {
  const rescueBtn = document.getElementById('rescue-btn');
  if (!rescueBtn) return;
  rescueBtn.addEventListener('click', () => {
    /** @type {HTMLTextAreaElement} */ (document.getElementById('rescue-out')).value = exportRescue();
  });
  document.getElementById('end-cq')?.addEventListener('click', () => {
    playMorse(textToMorse('CQ CQ DE RX4098 K'));
  });
}
