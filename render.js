// GLIMMER: rendering. Procedural art: a lit forest floor under a darkness map, plus emissive eyes, motes and embers.
(() => {
'use strict';
const G = window.GLIMMER, CFG = G.CFG, TAU = Math.PI * 2, clamp = G.clamp;
const lerp = (a, b, t) => a + (b - a) * t;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const dark = document.createElement('canvas'), dctx = dark.getContext('2d');
const view = G.view = { w: 800, h: 600, dpr: 1, zoom: 1, cx: 0, cy: 0 };
const RD = G.RD = { buttons: [], mouse: { x: 0, y: 0, down: false }, touch: { used: false, stick: null, ox: 0, oy: 0 } };

function resize() {
  view.dpr = Math.min(2, window.devicePixelRatio || 1);
  view.w = window.innerWidth; view.h = window.innerHeight;
  cv.width = Math.round(view.w * view.dpr); cv.height = Math.round(view.h * view.dpr);
  dark.width = Math.max(1, Math.round(view.w / 2)); dark.height = Math.max(1, Math.round(view.h / 2)); // half-res darkness map: soft and cheap
  const m = Math.min(view.w, view.h); view.zoom = clamp(m / (m < 600 ? 460 : 640), 0.6, 1.6); // phones get a closer camera
  G.viewRadius = Math.max(640, Math.hypot(view.w, view.h) / 2 / view.zoom); // spawn just off-screen (640 = sim default)
}
RD.resize = resize;

// ---- sprites
function glowSprite(rgb, size, core = 0.0) {
  const c = document.createElement('canvas'); c.width = c.height = size * 2; const x = c.getContext('2d');
  const g = x.createRadialGradient(size, size, 0, size, size, size);
  g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(Math.max(0.01, core), `rgba(${rgb},0.6)`); g.addColorStop(0.4, `rgba(${rgb},0.18)`); g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g; x.fillRect(0, 0, size * 2, size * 2); return c;
}
const SPR = {
  warm: glowSprite('255,190,110', 128, 0.05), gold: glowSprite('255,225,140', 32, 0.1), white: glowSprite('255,250,235', 32, 0.15),
  ember: glowSprite('255,150,60', 16, 0.2), cyan: glowSprite('120,230,255', 32, 0.1), violet: glowSprite('200,170,255', 16, 0.2),
  red: glowSprite('255,70,60', 32, 0.1), mint: glowSprite('150,255,200', 16, 0.2), pink: glowSprite('255,190,240', 16, 0.2), coral: glowSprite('255,140,110', 48, 0.1),
};
const EYE_SPR = { moth: SPR.pink, shade: SPR.violet, lurker: SPR.cyan, wraith: SPR.mint, gloom: SPR.coral };

let groundPat = null;
function makeGround() {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  const rnd = G.mulberry32(7);
  x.fillStyle = '#26302a'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 160; i++) { // moss blotches (drawn wrapped so the tile is seamless)
    const px = rnd() * S, py = rnd() * S, r = 20 + rnd() * 70;
    const col = rnd() < 0.5 ? '58,74,52' : rnd() < 0.5 ? '44,52,46' : '70,62,48';
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, r); g.addColorStop(0, `rgba(${col},0.55)`); g.addColorStop(1, `rgba(${col},0)`);
      x.fillStyle = g; x.fillRect(px + ox - r, py + oy - r, r * 2, r * 2);
    }
  }
  for (let i = 0; i < 900; i++) { // grass blades
    const px = rnd() * S, py = rnd() * S, l = 3 + rnd() * 6, a = -Math.PI / 2 + (rnd() - 0.5) * 0.9;
    x.strokeStyle = `rgba(${90 + rnd() * 40 | 0},${120 + rnd() * 50 | 0},${70 + rnd() * 30 | 0},${0.25 + rnd() * 0.35})`; x.lineWidth = 1;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  for (let i = 0; i < 70; i++) { const px = rnd() * S, py = rnd() * S, r = 1 + rnd() * 3; x.fillStyle = `rgba(150,140,120,${0.2 + rnd() * 0.3})`; x.beginPath(); x.ellipse(px, py, r * 1.4, r, rnd() * 3, 0, TAU); x.fill(); }
  groundPat = ctx.createPattern(c, 'repeat');
}
function makeDecor() {
  const rnd = G.mulberry32(1234), out = [], W = CFG.worldR;
  for (let i = 0; i < 900; i++) {
    const a = rnd() * TAU, r = Math.sqrt(rnd()) * (W + 500), x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (Math.hypot(x, y) < 140) continue;
    const roll = rnd();
    const kind = r > W + 40 ? 'tree' : roll < 0.1 ? 'tree' : roll < 0.28 ? 'mush' : roll < 0.52 ? 'flower' : roll < 0.72 ? 'stone' : 'fern';
    out.push({ kind, x, y, s: 0.7 + rnd() * 0.8, rot: rnd() * TAU, hue: rnd(), seed: rnd() * 100 });
  }
  for (let i = 0; i < 110; i++) { const a = (i / 110) * TAU + rnd() * 0.05, r = W + 30 + rnd() * 90; out.push({ kind: 'tree', x: Math.cos(a) * r, y: Math.sin(a) * r, s: 1.2 + rnd() * 0.8, rot: rnd() * TAU, hue: rnd(), seed: rnd() * 100 }); }
  out.sort((a, b) => (a.kind === 'tree') - (b.kind === 'tree'));
  return out;
}
function drawDecor(d, x) {
  const s = d.s;
  if (d.kind === 'stone') { x.fillStyle = '#4a4d52'; x.beginPath(); x.ellipse(d.x, d.y, 9 * s, 6 * s, d.rot, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,0.08)'; x.beginPath(); x.ellipse(d.x - 2 * s, d.y - 2 * s, 5 * s, 3 * s, d.rot, 0, TAU); x.fill(); }
  else if (d.kind === 'flower') { const col = d.hue < 0.5 ? '#c98bd8' : d.hue < 0.8 ? '#e8d27a' : '#8fc3e8'; x.fillStyle = col; for (let k = 0; k < 5; k++) { const a = d.rot + k * TAU / 5; x.beginPath(); x.arc(d.x + Math.cos(a) * 3 * s, d.y + Math.sin(a) * 3 * s, 2.2 * s, 0, TAU); x.fill(); } x.fillStyle = '#f7e9b0'; x.beginPath(); x.arc(d.x, d.y, 1.6 * s, 0, TAU); x.fill(); }
  else if (d.kind === 'fern') { x.strokeStyle = '#4f7a46'; x.lineWidth = 2; for (let k = 0; k < 5; k++) { const a = d.rot + k * TAU / 5; x.beginPath(); x.moveTo(d.x, d.y); x.quadraticCurveTo(d.x + Math.cos(a + 0.4) * 9 * s, d.y + Math.sin(a + 0.4) * 9 * s, d.x + Math.cos(a) * 16 * s, d.y + Math.sin(a) * 16 * s); x.stroke(); } }
  else if (d.kind === 'mush') { x.fillStyle = '#d9d2c0'; x.fillRect(d.x - 1.5 * s, d.y, 3 * s, 6 * s); x.fillStyle = '#5fd6e6'; x.beginPath(); x.ellipse(d.x, d.y, 6 * s, 4 * s, 0, Math.PI, 0); x.fill(); }
  else if (d.kind === 'tree') {
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.beginPath(); x.ellipse(d.x + 10 * s, d.y + 14 * s, 46 * s, 30 * s, 0, 0, TAU); x.fill();
    x.fillStyle = '#1f2b22'; x.beginPath(); for (let k = 0; k < 9; k++) { const a = k * TAU / 9 + d.rot, r2 = (38 + Math.sin(d.seed + k * 2.1) * 8) * s; x.lineTo(d.x + Math.cos(a) * r2, d.y + Math.sin(a) * r2); } x.closePath(); x.fill();
    x.fillStyle = '#2c3d2e'; x.beginPath(); x.arc(d.x - 8 * s, d.y - 8 * s, 22 * s, 0, TAU); x.fill();
    x.fillStyle = 'rgba(160,200,140,0.08)'; x.beginPath(); x.arc(d.x - 12 * s, d.y - 12 * s, 12 * s, 0, TAU); x.fill();
  }
}
function worldToScreen(x, y) { return [(x - view.cx) * view.zoom + view.w / 2, (y - view.cy) * view.zoom + view.h / 2]; }
RD.worldToScreen = worldToScreen;

function drawEnemyBody(e, x, t) {
  const s = e.size, n = e.type === 'moth' ? 5 : 9, p = G.p;
  const lean = e.type === 'lurker' && e.state === 'tell' ? 0.75 : 1;
  x.save(); x.translate(e.x, e.y);
  if (e.type !== 'moth') { // tendrils trail away from the wisp
    x.strokeStyle = 'rgba(10,5,20,0.85)'; x.lineWidth = Math.max(2, s * 0.22); x.lineCap = 'round';
    const back = Math.atan2(p.y - e.y, p.x - e.x) + Math.PI, nt = e.type === 'gloom' ? 10 : 4;
    for (let k = 0; k < nt; k++) {
      const a = back + (k - (nt - 1) / 2) * (e.type === 'gloom' ? 0.35 : 0.45) + Math.sin(t * 3 + e.seed + k) * 0.2, L = s * (1.6 + 0.3 * Math.sin(t * 4 + k));
      x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(Math.cos(a + 0.4) * L * 0.6, Math.sin(a + 0.4) * L * 0.6, Math.cos(a) * L, Math.sin(a) * L); x.stroke();
    }
  } else { // moth wings flutter
    const f = Math.sin(t * 30 + e.seed) * 0.5 + 0.5; x.fillStyle = 'rgba(20,10,30,0.9)';
    x.beginPath(); x.ellipse(-s * 0.9, 0, s * (0.6 + f * 0.5), s * 0.9, 0.4, 0, TAU); x.fill(); x.beginPath(); x.ellipse(s * 0.9, 0, s * (0.6 + f * 0.5), s * 0.9, -0.4, 0, TAU); x.fill();
  }
  x.beginPath();
  for (let k = 0; k <= n; k++) { const a = k / n * TAU, r = s * lean * (1 + 0.14 * Math.sin(t * 5 + e.seed + k * 1.9)); x.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  x.closePath();
  x.fillStyle = e.flash > 0 ? '#fff4dc' : e.type === 'gloom' ? '#0a0508' : '#0a0612'; x.fill();
  if (e.burning) { x.strokeStyle = `rgba(255,${120 + Math.random() * 60 | 0},50,${0.7 + Math.random() * 0.3})`; x.lineWidth = 2; x.stroke(); }
  else { x.strokeStyle = 'rgba(150,120,220,0.35)'; x.lineWidth = 1.5; x.stroke(); }
  x.restore();
}
function drawEyes(e, x, t) {
  const s = e.size, a = Math.atan2(G.p.y - e.y, G.p.x - e.x);
  let spr = EYE_SPR[e.type];
  if ((e.type === 'lurker' || e.type === 'gloom') && (e.state === 'tell' || e.state === 'dash' || e.state === 'inhale')) spr = SPR.red;
  const closed = e.blink < 0;
  const n = e.type === 'wraith' ? 3 : 2, gap = s * (e.type === 'gloom' ? 0.42 : 0.38), es = e.type === 'gloom' ? 26 : e.type === 'wraith' ? 14 : e.type === 'moth' ? 7 : 10;
  const fx = Math.cos(a) * s * 0.35, fy = Math.sin(a) * s * 0.35;
  const tellPulse = e.state === 'tell' ? 1.6 + Math.sin(t * 30) * 0.4 : 1;
  for (let k = 0; k < n; k++) {
    const o = (k - (n - 1) / 2) * gap, ex = e.x + fx - Math.sin(a) * o, ey = e.y + fy + Math.cos(a) * o;
    const sz = es * tellPulse * (closed ? 0.3 : 1);
    x.drawImage(spr, ex - sz, ey - sz, sz * 2, sz * 2);
    if (!closed) { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(ex, ey, es * 0.16, es * 0.24, a, 0, TAU); x.fill(); }
  }
  if (e.type === 'gloom') { // health ring: visible progress against the big one (Cuphead fun-type short @00:49)
    x.strokeStyle = 'rgba(255,150,120,0.55)'; x.lineWidth = 4; x.beginPath(); x.arc(e.x, e.y, s + 14, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0, e.hp / e.maxhp)); x.stroke();
    if (e.stagger > 0) { x.fillStyle = '#fff1c1'; x.font = 'bold 15px Georgia, serif'; x.textAlign = 'center'; x.fillText('x3 DAMAGE', e.x, e.y - s - 24); }
    if (e.state === 'tell' || e.state === 'inhale') { x.strokeStyle = `rgba(255,90,70,${0.25 + 0.2 * Math.sin(t * 12)})`; x.lineWidth = 2; x.setLineDash([10, 10]); x.beginPath(); x.arc(e.x, e.y, 560, 0, TAU); x.stroke(); x.setLineDash([]); }
  }
  if (e.type === 'lurker' && e.state === 'tell') { // dash telegraph
    x.strokeStyle = 'rgba(255,80,70,0.5)'; x.lineWidth = 3; x.setLineDash([8, 8]); x.beginPath(); x.moveTo(e.x, e.y); x.lineTo(e.x + e.dx * 235, e.y + e.dy * 235); x.stroke(); x.setLineDash([]);
  }
}
function drawWisp(x, t, alpha = 1) {
  const p = G.p, fl = 1 + Math.sin(t * 13) * 0.04 + Math.sin(t * 7.3) * 0.03, sq = 1 + p.squash * 0.5, hurt = p.hurt > 0;
  x.globalCompositeOperation = 'lighter'; x.globalAlpha = alpha;
  const gs = 46 * fl * sq; x.drawImage(SPR.warm, p.x - gs, p.y - gs, gs * 2, gs * 2);
  x.drawImage(SPR.white, p.x - 18 * sq, p.y - 18 * sq, 36 * sq, 36 * sq);
  x.globalCompositeOperation = 'source-over';
  x.fillStyle = hurt ? '#ffb0a0' : '#fff8e6'; x.beginPath(); x.arc(p.x, p.y, CFG.size * fl * sq, 0, TAU); x.fill();
  const lx = Math.cos(p.dir) * 3, ly = Math.sin(p.dir) * 2.5, blink = (t % 4) < 0.12; // a little face that looks where you go
  x.fillStyle = '#5b3a1e';
  if (blink || hurt) { x.fillRect(p.x - 5 + lx, p.y - 1 + ly, 4, 1.5); x.fillRect(p.x + 1 + lx, p.y - 1 + ly, 4, 1.5); }
  else { x.beginPath(); x.arc(p.x - 3.2 + lx, p.y - 1 + ly, 1.7, 0, TAU); x.arc(p.x + 3.2 + lx, p.y - 1 + ly, 1.7, 0, TAU); x.fill(); }
  x.globalAlpha = 1;
}

RD.render = function (t) {
  const W = view.w, H = view.h, z = view.zoom, p = G.p;
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, W, H);
  if (!p) return;
  if (G.snapCam) { view.cx = p.x; view.cy = p.y; }
  const lx = p.x + p.vx * 0.18, ly = p.y + p.vy * 0.18; view.cx = lerp(view.cx, lx, 0.12); view.cy = lerp(view.cy, ly, 0.12); // camera leads movement a little
  // camera shake: vertical only, 0.12 s max, "like salt" (Camera shake @01:07)
  const shakeY = G.shakeT > 0 && G.settings.shake ? (Math.random() * 2 - 1) * G.shakeMag : 0;
  const vx0 = view.cx - W / 2 / z - 80, vx1 = view.cx + W / 2 / z + 80, vy0 = view.cy - H / 2 / z - 80, vy1 = view.cy + H / 2 / z + 80;
  const inView = d => d.x > vx0 && d.x < vx1 && d.y > vy0 && d.y < vy1;
  ctx.save(); ctx.translate(W / 2, H / 2 + shakeY); ctx.scale(z, z); ctx.translate(-view.cx, -view.cy);
  ctx.fillStyle = groundPat; ctx.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
  for (const d of G.decor) if (inView(d)) drawDecor(d, ctx);
  for (const e of G.enemies) drawEnemyBody(e, ctx, t);
  ctx.restore();

  // ---- darkness map: the world is only visible where there is light
  const dawnK = G.state === 'dawn' ? clamp(G.endTimer / 2.5, 0, 1) : (G.state === 'over' && G.won) ? 1 : 0, hs = dark.width / W;
  dctx.setTransform(1, 0, 0, 1, 0, 0); dctx.globalCompositeOperation = 'source-over';
  dctx.clearRect(0, 0, dark.width, dark.height); dctx.fillStyle = `rgba(4,7,22,${0.9 * (1 - dawnK * 0.85)})`; dctx.fillRect(0, 0, dark.width, dark.height);
  dctx.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, inner = 0.55, a = 1) => {
    const [sx, sy] = worldToScreen(x, y); const X = sx * hs, Y = (sy + shakeY) * hs, Rr = r * z * hs;
    if (Rr <= 0 || X + Rr < 0 || Y + Rr < 0 || X - Rr > dark.width || Y - Rr > dark.height) return;
    const g = dctx.createRadialGradient(X, Y, 0, X, Y, Rr); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(inner, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = g; dctx.fillRect(X - Rr, Y - Rr, Rr * 2, Rr * 2);
  };
  const flick = 1 + Math.sin(t * 9) * 0.012 + Math.sin(t * 23) * 0.008;
  if (G.state === 'dying') hole(p.x, p.y, p.R * Math.max(0.2, 1.2 - G.endTimer * 0.7), 0.4, Math.max(0, 1 - G.endTimer));
  else if (G.state !== 'over' || G.won) hole(p.x, p.y, p.R * 1.18 * flick, 0.62);
  for (const m of G.motes) hole(m.x, m.y, 34, 0.1, 0.55);
  for (const L of G.lights) hole(L.x, L.y, L.r * (0.6 + 0.4 * L.t / L.life), 0.5, 1 - L.t / L.life);
  for (const d of G.decor) if (d.kind === 'mush' && inView(d)) hole(d.x, d.y, 26 * d.s, 0.05, 0.35);
  for (const e of G.enemies) if (e.burning) hole(e.x, e.y, e.size * 2.2, 0.2, 0.5);
  for (const s of G.sparks) hole(s.x, s.y, 40, 0.1, 0.7);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
  ctx.drawImage(dark, 0, 0, cv.width, cv.height);
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);

  // ---- emissive layer: visible in the dark
  ctx.save(); ctx.translate(W / 2, H / 2 + shakeY); ctx.scale(z, z); ctx.translate(-view.cx, -view.cy);
  ctx.globalCompositeOperation = 'lighter';
  const alive = G.state === 'play' || G.state === 'kindle' || G.state === 'paused' || G.state === 'title';
  if (alive || G.state === 'dawn') { const r = p.R * 1.25; ctx.globalAlpha = 0.22; ctx.drawImage(SPR.warm, p.x - r, p.y - r, r * 2, r * 2); }
  for (const d of G.decor) if (d.kind === 'mush' && inView(d)) { const r = 10 * d.s * (1 + 0.15 * Math.sin(t * 2 + d.seed)); ctx.globalAlpha = 0.5; ctx.drawImage(SPR.cyan, d.x - r, d.y - r, r * 2, r * 2); }
  for (let i = 0; i < 26; i++) { // ambient fireflies
    const fx = view.cx + Math.sin(i * 12.9 + t * 0.2 * (1 + i % 3)) * W * 0.6 / z, fy = view.cy + Math.cos(i * 7.7 + t * 0.17 * (1 + i % 4)) * H * 0.6 / z;
    ctx.globalAlpha = Math.max(0, 0.3 + 0.3 * Math.sin(t * 2 + i)); ctx.drawImage(SPR.gold, fx - 5, fy - 5, 10, 10);
  }
  for (const m of G.motes) {
    const bob = Math.sin(t * 3 + m.seed) * 3, s = 14 + Math.sin(t * 6 + m.seed) * 2;
    ctx.globalAlpha = m.life - m.t < 2 ? (Math.sin(t * 20) > 0 ? 0.4 : 1) : 1;
    ctx.drawImage(SPR.gold, m.x - s, m.y + bob - s, s * 2, s * 2); ctx.drawImage(SPR.white, m.x - 4, m.y + bob - 4, 8, 8);
  }
  for (const q of G.parts) {
    const k = 1 - q.t / q.life;
    if (q.add) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k; const s = q.size * 3; ctx.drawImage(SPR.ember, q.x - s, q.y - s, s * 2, s * 2); }
    else { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = k * 0.8; ctx.fillStyle = `rgb(${q.col})`; ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size); }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter';
  for (const r of G.rings) { const k = r.t / r.life, e = 1 - Math.pow(1 - k, 3); ctx.strokeStyle = `rgba(${r.col},${1 - k})`; ctx.lineWidth = r.w * (1 - k) + 1; ctx.beginPath(); ctx.arc(r.x, r.y, lerp(r.r, r.R, e), 0, TAU); ctx.stroke(); }
  if (alive) for (const s of G.sparks) { ctx.drawImage(SPR.gold, s.x - 16, s.y - 16, 32, 32); ctx.drawImage(SPR.white, s.x - 6, s.y - 6, 12, 12); }
  ctx.globalCompositeOperation = 'source-over';
  for (const e of G.enemies) drawEyes(e, ctx, t); // eyes in the dark: you always see what is coming
  if (alive) {
    // the light's edge IS the health bar, right where the eyes already are (Sci-Fi Vampire Survivors lessons @12:51)
    const low = p.R < CFG.lowLight, pulse = low ? 0.5 + 0.5 * Math.sin(t * 10) : 0;
    ctx.strokeStyle = low ? `rgba(255,${110 - pulse * 60 | 0},90,${0.45 + pulse * 0.4})` : 'rgba(255,214,150,0.25)';
    ctx.lineWidth = low ? 2.5 : 1.5; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 20;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,214,150,0.08)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.Rmax, 0, TAU); ctx.stroke();
    if (G.state !== 'title') { // flare readiness arc around the wisp
      ctx.strokeStyle = G.canFlare() ? 'rgba(255,240,200,0.9)' : 'rgba(255,240,200,0.25)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, CFG.size + 6, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(1 - p.flareCd / CFG.flareCd, 0, 1)); ctx.stroke();
    }
  }
  if (G.state !== 'over' && !(G.state === 'dying' && G.endTimer > 0.6)) drawWisp(ctx, t, G.state === 'dying' ? 1 - G.endTimer / 0.6 : 1);
  ctx.textAlign = 'center';
  for (const q of G.texts) {
    const k = q.t / q.life, sc = k < 0.12 ? 0.6 + k / 0.12 * 0.6 : 1.2 - Math.min(0.2, k - 0.12);
    ctx.globalAlpha = k < 0.8 ? 1 : (1 - k) / 0.2; ctx.font = `bold ${q.size * sc | 0}px Georgia, serif`;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(q.s, q.x + 1.5, q.y + 1.5); ctx.fillStyle = q.col; ctx.fillText(q.s, q.x, q.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // ---- screen-space effects
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  const edge = (rgb, a) => { const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.7); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(1, `rgba(${rgb},${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
  if (G.hurtFlash > 0) edge('255,40,30', G.hurtFlash * 0.7);
  if (p.R < CFG.lowLight && G.state === 'play') edge('120,0,0', 0.25 + 0.15 * Math.sin(t * 10));
  if (G.flash > 0) { ctx.fillStyle = `rgba(${G.flashCol},${G.flash * 0.6})`; ctx.fillRect(0, 0, W, H); }
  if (dawnK > 0) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(255,200,140,${0.35 * dawnK})`); g.addColorStop(1, `rgba(255,140,120,${0.15 * dawnK})`); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
};
RD.ctx = ctx; RD.cv = cv; RD.SPR = SPR; RD.makeGround = makeGround; RD.makeDecor = makeDecor;
})();
