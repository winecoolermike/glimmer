// GLIMMER: HUD, screens, input and the main loop.
(() => {
'use strict';
const G = window.GLIMMER, RD = G.RD, CFG = G.CFG, TAU = Math.PI * 2, clamp = G.clamp, view = G.view, ctx = RD.ctx, cv = RD.cv, SPR = RD.SPR;
const mouse = RD.mouse, touch = RD.touch, buttons = RD.buttons, keys = {};
G.headless = false;
const SERIF = 'Georgia, "Palatino Linotype", serif';
function txt(s, x, y, size, col, align = 'center', weight = '') { ctx.font = `${weight} ${size}px ${SERIF}`; ctx.textAlign = align; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillText(s, x + 1.5, y + 2); ctx.fillStyle = col; ctx.fillText(s, x, y); }
function roundRect(x, y, w, h, r) { ctx.beginPath(); if (w <= 0) return; r = Math.min(r, w / 2, h / 2); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function iconButton(id, x, y, label, on) {
  buttons.push({ id, x: x - 18, y: y - 18, w: 36, h: 36 });
  ctx.fillStyle = 'rgba(20,18,30,0.55)'; ctx.beginPath(); ctx.arc(x, y, 17, 0, TAU); ctx.fill();
  ctx.strokeStyle = on ? 'rgba(255,220,160,0.6)' : 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.font = `12px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillStyle = on ? '#ffe2b0' : '#888'; ctx.fillText(label, x, y + 4);
}
function settingsButtons(withPause) {
  const W = view.w; let x = W - 24;
  if (withPause) { iconButton('pause', x, 30, G.state === 'paused' ? '▶' : '❚❚', true); x -= 40; }
  iconButton('mute', x, 30, G.settings.muted ? 'mute' : 'snd', !G.settings.muted); x -= 40;
  iconButton('shake', x, 30, 'shake', G.settings.shake);
}
let hintT = 0, hintCur = null;
function drawHUD(t) {
  const W = view.w, H = view.h, p = G.p;
  buttons.length = 0;
  // night progress: moon to sun
  const k = clamp(G.t / CFG.night, 0, 1), narrow = W < 600, bw = narrow ? W - 64 : Math.min(360, W * 0.46), bx = W / 2 - bw / 2, by = narrow ? 64 : 22;
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; roundRect(bx, by, bw, 6, 3); ctx.fill();
  const gr = ctx.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#6c6cc9'); gr.addColorStop(0.7, '#c98a8a'); gr.addColorStop(1, '#ffd38a');
  ctx.fillStyle = gr; roundRect(bx, by, bw * k, 6, 3); ctx.fill();
  for (let i = 1; i < 6; i++) { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(bx + bw * i / 6 - 0.5, by - 2, 1, 10); }
  ctx.fillStyle = '#c8cff5'; ctx.beginPath(); ctx.arc(bx - 14, by + 3, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#05070d'; ctx.beginPath(); ctx.arc(bx - 11, by + 1, 5, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(SPR.gold, bx + bw + 3, by - 8, 22, 22); ctx.globalCompositeOperation = 'source-over';
  txt(G.clock(G.t), W / 2, by + 30, 18, '#f3e7cf');
  txt(G.score.toLocaleString(), 22, 38, narrow ? 22 : 26, '#fff1d6', 'left', 'bold');
  const mult = Math.min(8, 1 + Math.floor(G.combo / 5));
  const hy = narrow ? 112 : 0;
  if (G.combo >= 5) txt('combo ' + G.combo + '  ×' + mult, 22, 62 + hy, 15, '#ffb347', 'left');
  const need = CFG.kindle[G.kindleIdx], prev = G.kindleIdx ? CFG.kindle[G.kindleIdx - 1] : 0;
  if (need) { const kk = clamp((G.embers - prev) / (need - prev), 0, 1), kx = 22, ky = (G.combo >= 5 ? 74 : 54) + hy; ctx.fillStyle = 'rgba(255,255,255,0.08)'; roundRect(kx, ky, 120, 5, 2.5); ctx.fill(); ctx.fillStyle = '#ffd77a'; roundRect(kx, ky, 120 * kk, 5, 2.5); ctx.fill(); txt('✦ kindle', kx + 128, ky + 6, 11, 'rgba(255,230,170,0.65)', 'left'); }
  settingsButtons(true);
  if (touch.used) { // touch flare button + virtual stick
    const fx = W - 74, fy = H - 84; buttons.push({ id: 'flare', x: fx - 46, y: fy - 46, w: 92, h: 92 });
    ctx.globalAlpha = G.canFlare() ? 0.9 : 0.35; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(SPR.gold, fx - 52, fy - 52, 104, 104); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(30,20,10,0.5)'; ctx.beginPath(); ctx.arc(fx, fy, 32, 0, TAU); ctx.fill(); txt('FLARE', fx, fy + 5, 13, '#fff1d6', 'center', 'bold'); ctx.globalAlpha = 1;
    if (touch.stick != null) { ctx.strokeStyle = 'rgba(255,230,180,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(touch.ox, touch.oy, 50, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,230,180,0.3)'; ctx.beginPath(); ctx.arc(touch.ox + G.input.mx * 50, touch.oy + G.input.my * 50, 18, 0, TAU); ctx.fill(); }
  }
  if (G.banner) { const b = G.banner, a = b.t < 0.4 ? b.t / 0.4 : b.t > 2.6 ? Math.max(0, (3.2 - b.t) / 0.6) : 1; ctx.globalAlpha = a; txt(b.title, W / 2, H * 0.24, 40, '#f6e3c0', 'center', 'bold'); txt(b.sub, W / 2, H * 0.24 + 30, 17, b.sub === b.sub.toUpperCase() ? '#ff9a7a' : '#cdbfe6'); ctx.globalAlpha = 1; }
  // one contextual hint at a time, shown when relevant then retired (teach by doing, not reading)
  let hint = null, key = null;
  if (G.hints.move === 0) { hint = touch.used ? 'Drag anywhere to move' : 'Move: WASD / arrows, or hold the mouse button'; key = 'move'; }
  else if (G.hints.burn === 1) { hint = 'Shadows burn inside your light'; key = 'burn'; }
  else if (G.hints.hit === 1) { hint = 'Their touch dims you. Gather motes ✦ to grow your light'; key = 'hit'; }
  else if (G.hints.flare === 1) { hint = touch.used ? 'Tap FLARE: spend some light to blast everything near you' : 'SPACE or right-click: FLARE, spending some light to blast everything near you'; key = 'flare'; }
  if (hint) {
    if (hintCur !== hint) { hintCur = hint; hintT = 0; } hintT += 1 / 60;
    ctx.globalAlpha = Math.min(1, hintT * 3); txt(hint, W / 2, H - 46, 18, '#f7e9c8'); ctx.globalAlpha = 1;
    if (key !== 'move' && hintT > (key === 'flare' ? 8 : 4.5)) G.hints[key] = 2;
  }
}
function drawUpgradeIcon(id, x, y, t) {
  ctx.save(); ctx.translate(x, y); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(SPR.warm, -40, -40, 80, 80); ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = '#ffe2b0'; ctx.fillStyle = '#ffe2b0'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  const s = Math.sin(t * 3);
  switch (id) {
    case 'halo': ctx.beginPath(); ctx.arc(0, 0, 16 + s * 2, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill(); break;
    case 'sear': for (let i = 0; i < 3; i++) { const ox = (i - 1) * 10; ctx.beginPath(); ctx.moveTo(ox, 14); ctx.quadraticCurveTo(ox - 8, 2, ox + s * 2, -16 + (i === 1 ? -4 : 2)); ctx.quadraticCurveTo(ox + 8, 2, ox, 14); ctx.fill(); } break;
    case 'spark': ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(Math.cos(t * 3) * 15, Math.sin(t * 3) * 15, 5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill(); break;
    case 'after': for (let i = 0; i < 3; i++) { ctx.globalAlpha = 1 - i * 0.3; ctx.beginPath(); ctx.arc(0, 0, 5 + i * 6 + ((t * 8) % 6), 0, TAU); ctx.stroke(); } ctx.globalAlpha = 1; break;
    case 'wild': for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); ctx.lineTo(Math.cos(a) * (16 + s * 2), Math.sin(a) * (16 + s * 2)); ctx.stroke(); } break;
    case 'lode': ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(5, -5); ctx.lineTo(16, 0); ctx.lineTo(5, 5); ctx.lineTo(0, 16); ctx.lineTo(-5, 5); ctx.lineTo(-16, 0); ctx.lineTo(-5, -5); ctx.closePath(); ctx.fill(); break;
    case 'fleet': for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-14 + i * 8, -12); ctx.lineTo(-4 + i * 8, 0); ctx.lineTo(-14 + i * 8, 12); ctx.stroke(); } break;
    case 'steady': ctx.beginPath(); ctx.moveTo(0, -16); ctx.quadraticCurveTo(12, 0, 0, 14); ctx.quadraticCurveTo(-12, 0, 0, -16); ctx.fill(); break;
    case 'phoenix': ctx.beginPath(); ctx.moveTo(0, 10); ctx.quadraticCurveTo(-18, -2, -16, -14); ctx.quadraticCurveTo(-6, -4, 0, -14); ctx.quadraticCurveTo(6, -4, 16, -14); ctx.quadraticCurveTo(18, -2, 0, 10); ctx.fill(); break;
  }
  ctx.restore();
}
function drawKindle(t) {
  const W = view.w, H = view.h;
  G.offerT = (G.offerT || 0) + 1 / 60;
  ctx.fillStyle = `rgba(4,4,10,${Math.min(0.6, G.offerT * 3)})`; ctx.fillRect(0, 0, W, H);
  txt('KINDLE', W / 2, H * 0.2, 36, '#ffe2b0', 'center', 'bold');
  txt('Your flame grows. Choose one.', W / 2, H * 0.2 + 28, 16, '#cdbfe6');
  const n = G.offer.length, gap = 14, cw = Math.min(210, (W - 40 - (n - 1) * gap) / n), ch = 236, tot = n * cw + (n - 1) * gap;
  for (let i = 0; i < n; i++) {
    const u = G.offer[i], x = W / 2 - tot / 2 + i * (cw + gap), y = H * 0.3 + Math.max(0, 40 - G.offerT * 240) * (i + 1) / 2;
    const hover = mouse.x > x && mouse.x < x + cw && mouse.y > y && mouse.y < y + ch;
    buttons.push({ id: 'pick' + i, x, y, w: cw, h: ch });
    ctx.fillStyle = hover ? 'rgba(60,44,30,0.94)' : 'rgba(26,20,30,0.92)'; roundRect(x, y, cw, ch, 14); ctx.fill();
    ctx.strokeStyle = hover ? '#ffd38a' : 'rgba(255,214,150,0.35)'; ctx.lineWidth = hover ? 2.5 : 1.5; ctx.stroke();
    drawUpgradeIcon(u.id, x + cw / 2, y + 58, t);
    const lvl = G.up[u.id];
    txt(u.name, x + cw / 2, y + 118, cw < 160 ? 15 : 18, '#fff1d6', 'center', 'bold');
    txt(u.max > 1 ? (lvl ? 'level ' + (lvl + 1) + ' of ' + u.max : 'new · up to ' + u.max) : 'unique', x + cw / 2, y + 138, 12, lvl ? '#ffb347' : '#9fe0b0');
    u.desc.split('\n').forEach((l, j) => txt(l, x + cw / 2, y + 166 + j * 19, cw < 160 ? 12 : 14, '#d8cfe8'));
    if (!touch.used) txt('[' + (i + 1) + ']', x + cw / 2, y + ch - 12, 12, 'rgba(255,255,255,0.35)');
  }
}
function drawTitle(t) {
  const W = view.w, H = view.h;
  ctx.fillStyle = 'rgba(3,4,10,0.25)'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18 + 0.06 * Math.sin(t * 1.5); ctx.drawImage(SPR.warm, W / 2 - 320, H * 0.2 - 170, 640, 300); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  txt('GLIMMER', W / 2, H * 0.2, Math.min(96, W * 0.16), '#fff1d6', 'center', 'bold');
  txt('Your light is your life. Survive until dawn.', W / 2, H * 0.2 + 40, Math.min(20, W * 0.045), '#e7d6b8');
  const lines = touch.used ? ['Drag anywhere to move', 'Tap FLARE to spend light in a blast'] : ['Move  ·  WASD / arrows, or hold the mouse button', 'Flare  ·  SPACE or right-click: spend light in a blast'];
  lines.forEach((l, i) => txt(l, W / 2, H * 0.74 + i * 26, Math.min(16, W * 0.038), '#c9bedf'));
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4); txt(touch.used ? 'Tap to begin' : 'Click or press SPACE to begin', W / 2, H * 0.74 + 72, 22, '#ffd38a', 'center', 'bold'); ctx.globalAlpha = 1;
  if (G.best) txt('Best: ' + G.best.toLocaleString() + '  ·  ' + G.rankFor(G.best)[1], W / 2, H - 22, 15, 'rgba(255,230,180,0.7)');
  buttons.length = 0; settingsButtons(false);
}
function drawOver(t) {
  const W = view.w, H = view.h; G.overT += 1 / 60;
  ctx.fillStyle = `rgba(3,3,8,${Math.min(0.74, G.overT * 2)})`; ctx.fillRect(0, 0, W, H);
  const won = G.won, cy = H * 0.14;
  txt(won ? 'DAWN BREAKS' : 'SNUFFED OUT', W / 2, cy, Math.min(56, W * 0.1), won ? '#ffe2a0' : '#d9c7ff', 'center', 'bold');
  txt(won ? 'You kept your light all night long.' : 'Your light went out at ' + G.clock(G.reachedT) + '.', W / 2, cy + 32, 17, '#e3d6c0');
  // how far you got: a progress bar turns every death into a micro-victory (Cuphead fun-type short @00:49)
  const bw = Math.min(420, W * 0.7), bx = W / 2 - bw / 2, by = cy + 56, k = clamp(G.reachedT / CFG.night, 0, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(bx, by, bw, 10, 5); ctx.fill();
  const gr = ctx.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#6c6cc9'); gr.addColorStop(0.7, '#c98a8a'); gr.addColorStop(1, '#ffd38a');
  ctx.fillStyle = gr; roundRect(bx, by, bw * k * clamp(G.overT / 0.8, 0, 1), 10, 5); ctx.fill();
  if (G.prevReach > 0 && G.prevReach < 1) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(bx + bw * G.prevReach - 1, by - 4, 2, 18); txt('last', bx + bw * G.prevReach, by - 7, 10, 'rgba(255,255,255,0.5)'); }
  ['12', '1', '2', '3', '4', '5', 'dawn'].forEach((l, i) => txt(l, bx + bw * i / 6, by + 28, 11, 'rgba(255,255,255,0.45)'));
  if (!won) txt(Math.round(k * 100) + '% of the night', W / 2, by + 48, 14, '#ffb347');
  const shown = Math.round(G.score * clamp(G.overT / 1.2, 0, 1)), sy0 = H * 0.46;
  txt(shown.toLocaleString(), W / 2, sy0, Math.min(64, W * 0.12), '#fff1d6', 'center', 'bold');
  const rk = G.rankFor(G.score), nx = G.nextRank(G.score);
  txt('Rank: ' + rk[1], W / 2, sy0 + 30, 20, '#ffd38a');
  if (G.newBest && G.overT > 1.2) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6); txt('NEW BEST!', W / 2, sy0 - 58, 20, '#9fe0b0', 'center', 'bold'); ctx.globalAlpha = 1; }
  const stats = [['Shadows burned', G.kills], ['Best combo', G.bestCombo], ['Motes gathered', G.motesGot], ['Flares', G.flares]];
  if (G.gloomSpawned) stats.push(['The Gloom', G.gloomKilled ? 'banished!' : 'still lurking']);
  if (G.won) stats.push(['Dawn bonus', '+' + G.dawnBonus.toLocaleString()]);
  const sy = sy0 + 60;
  stats.forEach((s, i) => { txt(s[0], W / 2 - 10, sy + i * 22, 15, '#bfb3d6', 'right'); txt(String(s[1]), W / 2 + 10, sy + i * 22, 15, '#fff1d6', 'left', 'bold'); });
  const ty = sy + stats.length * 22 + 16;
  if (nx) txt((nx[0] - G.score).toLocaleString() + ' more points to reach ' + nx[1], W / 2, ty, 15, '#e7b98a');
  txt('Best: ' + G.best.toLocaleString(), W / 2, ty + 22, 14, 'rgba(255,230,180,0.6)');
  if (G.overT > 0.9) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4); txt(touch.used ? 'Tap to try again' : 'SPACE / R / click to try again', W / 2, Math.min(H - 22, ty + 58), 20, '#ffd38a', 'center', 'bold'); ctx.globalAlpha = 1; }
  buttons.length = 0;
}
function drawPause() {
  const W = view.w, H = view.h; ctx.fillStyle = 'rgba(3,3,8,0.6)'; ctx.fillRect(0, 0, W, H);
  txt('PAUSED', W / 2, H * 0.42, 44, '#fff1d6', 'center', 'bold');
  txt('Esc / P resume  ·  M sound  ·  K screen shake (' + (G.settings.shake ? 'on' : 'off') + ')', W / 2, H * 0.42 + 34, 15, '#cdbfe6');
  txt('Click anywhere to resume', W / 2, H * 0.42 + 60, 14, 'rgba(255,230,180,0.6)');
  buttons.length = 0; settingsButtons(true);
}

// ---- input
function start() { window.SFX.init(); G.prevReach = G.reachedT ? G.reachedT / CFG.night : 0; G.newGame(); view.cx = 0; view.cy = 0; window.SFX.startMusic(); hintCur = null; }
G.start = start;
function toggle(id) {
  if (id === 'shake') G.settings.shake = !G.settings.shake;
  if (id === 'mute') { G.settings.muted = !G.settings.muted; window.SFX.setMuted(G.settings.muted); }
  if (id === 'pause') { if (G.state === 'play') G.state = 'paused'; else if (G.state === 'paused') G.state = 'play'; }
  window.SFX.click(); G.save();
}
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); keys[k] = true;
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  if (e.repeat) return;
  if (G.state === 'title' && (k === ' ' || k === 'enter')) return start();
  if (G.state === 'over' && G.overT > 0.6 && (k === ' ' || k === 'r' || k === 'enter')) return start();
  if (G.state === 'kindle' && ['1', '2', '3'].includes(k)) return G.choose(+k - 1);
  if (k === 'escape' || k === 'p') toggle('pause');
  if (k === 'm') toggle('mute');
  if (k === 'k') toggle('shake');
  if ((k === ' ' || k === 'shift' || k === 'j') && G.state === 'play') G.input.flare = true;
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
function hitButton(x, y) { for (const b of buttons) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b.id; return null; }
function pointerAction(x, y) {
  const b = hitButton(x, y);
  if (b && b.startsWith('pick')) { G.choose(+b.slice(4)); return true; }
  if (b === 'flare') { if (G.state === 'play') G.input.flare = true; return true; }
  if (b) { toggle(b); return true; }
  if (G.state === 'title') { start(); return true; }
  if (G.state === 'over') { if (G.overT > 0.6) start(); return true; }
  if (G.state === 'paused') { G.state = 'play'; return true; }
  return G.state === 'kindle';
}
cv.addEventListener('mousedown', e => {
  mouse.x = e.clientX; mouse.y = e.clientY; window.SFX.init();
  if (e.button === 2) { if (G.state === 'play') G.input.flare = true; return; }
  if (pointerAction(e.clientX, e.clientY)) return;
  mouse.down = true;
});
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('mouseup', () => { mouse.down = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('touchstart', e => {
  e.preventDefault(); touch.used = true; window.SFX.init();
  for (const tc of e.changedTouches) {
    if (pointerAction(tc.clientX, tc.clientY)) continue;
    if (G.state === 'play' && touch.stick == null) { touch.stick = tc.identifier; touch.ox = touch.x = tc.clientX; touch.oy = touch.y = tc.clientY; }
    else if (G.state === 'play') G.input.flare = true; // a second finger flares too
  }
}, { passive: false });
cv.addEventListener('touchmove', e => { e.preventDefault(); for (const tc of e.changedTouches) if (tc.identifier === touch.stick) { touch.x = tc.clientX; touch.y = tc.clientY; } }, { passive: false });
const endTouch = e => { for (const tc of e.changedTouches) if (tc.identifier === touch.stick) touch.stick = null; };
cv.addEventListener('touchend', endTouch); cv.addEventListener('touchcancel', endTouch);
function readInput() {
  if (G.bot) return;
  let mx = 0, my = 0;
  if (keys.a || keys.arrowleft) mx -= 1; if (keys.d || keys.arrowright) mx += 1; if (keys.w || keys.arrowup) my -= 1; if (keys.s || keys.arrowdown) my += 1;
  if (!mx && !my && mouse.down && G.p) { const [sx, sy] = RD.worldToScreen(G.p.x, G.p.y), dx = mouse.x - sx, dy = mouse.y - sy, d = Math.hypot(dx, dy); if (d > 10) { const f = Math.min(1, d / 60); mx = dx / d * f; my = dy / d * f; } }
  if (!mx && !my && touch.stick != null) { const dx = touch.x - touch.ox, dy = touch.y - touch.oy, d = Math.hypot(dx, dy); if (d > 6) { const f = Math.min(1, d / 50); mx = dx / d * f; my = dy / d * f; } }
  G.input.mx = mx; G.input.my = my;
}
window.addEventListener('blur', () => { if (G.state === 'play') G.state = 'paused'; });

// ---- title backdrop: a living scene behind the logo
function titleScene() {
  G.headless = true; G.newGame(42); G.headless = false;
  G.state = 'title'; G.p.R = 150;
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, d = 240 + (i % 3) * 80; G.spawnEnemy(i % 4 === 0 ? 'lurker' : i % 5 === 0 ? 'wraith' : 'shade', Math.cos(a) * d, Math.sin(a) * d); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.3, d = 110 + (i % 2) * 70; G.spawnMote(Math.cos(a) * d, Math.sin(a) * d, { life: 1e9 }); }
}
function animateTitle(dt, t) {
  for (const e of G.enemies) { const a = Math.atan2(e.y, e.x) + dt * 0.12, d = Math.hypot(e.x, e.y); e.x = Math.cos(a) * d; e.y = Math.sin(a) * d; e.born += dt; e.blink -= dt; if (e.blink < -0.12) e.blink = 2 + Math.random() * 4; }
  G.p.dir = t * 0.7; for (const m of G.motes) m.t = 0;
}

// ---- main loop: fixed 120 Hz simulation, render on rAF
let last = performance.now(), acc = 0; const STEP = 1 / 120;
function drawAll(t) {
  RD.render(t);
  if (G.state === 'play' || G.state === 'dying' || G.state === 'dawn') drawHUD(t);
  else if (G.state === 'kindle') { drawHUD(t); drawKindle(t); }
  else if (G.state === 'paused') { drawHUD(t); drawPause(); }
  else if (G.state === 'title') drawTitle(t);
  else if (G.state === 'over') drawOver(t);
}
G.drawAll = drawAll;
function frame(now) {
  const dtReal = Math.min(0.1, (now - last) / 1000); last = now; const t = now / 1000;
  readInput();
  if (G.state === 'title') animateTitle(dtReal, t);
  else if (G.state !== 'paused' && G.state !== 'kindle' && !G.externalStep) {
    acc += dtReal * (G.state === 'dying' ? 0.35 : 1); // slow-motion as the light goes out
    while (acc >= STEP) { G.update(STEP); acc -= STEP; }
  } else acc = 0;
  G.shakeT -= dtReal; if (G.shakeT <= 0) G.shakeMag = 0;
  G.flash = Math.max(0, G.flash - dtReal * 2.2); G.hurtFlash = Math.max(0, G.hurtFlash - dtReal * 1.6);
  drawAll(t);
  if (window.SFX.ctx) window.SFX.tickMusic(G.state === 'play' ? clamp(G.t / CFG.night, 0, 1) : 0.1);
  requestAnimationFrame(frame);
}
RD.resize(); RD.makeGround(); G.decor = RD.makeDecor(); window.addEventListener('resize', () => { RD.resize(); RD.makeGround(); });
titleScene(); window.SFX.setMuted(G.settings.muted);
requestAnimationFrame(frame);
})();
