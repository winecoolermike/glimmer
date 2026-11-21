// GLIMMER: game logic (no DOM). Your light is your life.
// Design doc: ../GDD.md. Bracketed citations refer to ../../knowledge_base.md.
(() => {
'use strict';
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- tuning
const CFG = {
  night: 180,                 // seconds from midnight to dawn (6 "hours" x 30 s)
  worldR: 1500,
  speed: 230, R0: 125, Rmax0: 160, Rmin: 22, drain: 1.0, drainFloor: 40, invuln: 0.65, size: 11,
  burnDps: 20, burnNear: 0.5,  burnSlow: 0.85,      // dps x (0.5 + 0.5 x closeness)
  hotLight: 110, hotMax: 0.6,       // a small flame burns hotter: up to +60% burn below R=110
  lowLight: 52, lowDmgMul: 0.7,     // near-loss rig: hits soften (-30%) when you are almost out
  mote: 3.5, magnet: 70, moteMax: 22, moteEvery: 0.45,
  flareFrac: 0.26, flareMin: 15, flareR0: 150, flareRk: 1.55, flareDmg: 75, flareDmgK: 0.45, flareCd: 1.0, flareKnock: 430,
  kindle: [6, 15, 27, 42, 60, 82, 108, 138, 172, 210, 252, 300],
  comboWindow: 2.5, flareMote: 0, drainK: 0.006, spawnMul: 3.4, randomSpawn: 0.5,
};
const ETYPE = {
  moth:   { hp: 9,    speed: 132, dmg: 8,  size: 7,  score: 5,    mote: 0.08, cost: 0.55 },
  shade:  { hp: 14,   speed: 78,  dmg: 20, size: 13, score: 10,   mote: 0.15, cost: 1 },
  lurker: { hp: 44,   speed: 56,  dmg: 28, size: 15, score: 25,   mote: 0.4,  cost: 2.6 },
  wraith: { hp: 175,  speed: 46,  dmg: 34, size: 27, score: 60,   mote: 1.5,  cost: 6 },
  gloom:  { hp: 1100, speed: 36,  dmg: 30, size: 64, score: 1000, mote: 16,   cost: 0 },
};
// What spawns each hour: [type, weight, pack min, pack max]
const HOURS = [
  { label: '12 AM', note: 'The night begins',         rate: 0.35, mix: [['shade', 1, 2, 3]] },
  { label: '1 AM',  note: 'Moths gather in the dark', rate: 1.2,  mix: [['shade', 3, 2, 4], ['moth', 2, 4, 6]] },
  { label: '2 AM',  note: 'Lurkers coil and strike',    rate: 1.9,  mix: [['shade', 3, 2, 4], ['moth', 2, 5, 7], ['lurker', 2, 1, 2]] },
  { label: '3 AM',  note: 'Wraiths drink the light',    rate: 2.6,  mix: [['shade', 3, 3, 5], ['moth', 2, 5, 8], ['lurker', 2, 1, 2], ['wraith', 1, 1, 1]] },
  { label: '4 AM',  note: 'THE GLOOM STIRS',            rate: 2.0,  mix: [['shade', 3, 2, 4], ['moth', 2, 4, 6], ['lurker', 1, 1, 2]] },
  { label: '5 AM',  note: 'The darkest hour',           rate: 3.6,  mix: [['shade', 3, 3, 6], ['moth', 2, 6, 9], ['lurker', 2, 1, 3], ['wraith', 1, 1, 2]] },
];
const UPGRADES = [
  { id: 'halo',    name: 'Wider Halo',     max: 3, desc: '+30 max light,\nand refill to full now.' },
  { id: 'sear',    name: 'Searing Glow',   max: 3, desc: 'Shadows burn 40% faster;\neach one burned feeds you light.' },
  { id: 'spark',   name: 'Orbiting Spark', max: 3, desc: 'A spark circles you\nand scorches what it touches.' },
  { id: 'after',   name: 'Afterglow',      max: 2, desc: 'Flare costs less\nand recharges faster.' },
  { id: 'wild',    name: 'Wildfire',       max: 2, desc: 'Shadows you burn away\nburst into flame.' },
  { id: 'lode',    name: 'Lodestar',       max: 2, desc: 'Motes fly to you from\nfarther, and give more light.' },
  { id: 'fleet',   name: 'Fleetwing',      max: 2, desc: '+20% move speed;\nmotes give +1 light.' },
  { id: 'steady',  name: 'Steady Flame',   max: 2, desc: 'Light fades 50% slower,\nhits dim you less.' },
  { id: 'phoenix', name: 'Phoenix Ember',  max: 1, desc: 'Once per night: when snuffed,\nreignite and flare.' },
];
const RANKS = [[0, 'Flicker'], [8000, 'Candle'], [20000, 'Lantern'], [40000, 'Bonfire'], [65000, 'Beacon'], [85000, 'Sunrise'], [100000, 'Dawnbringer']];

const G = window.GLIMMER = {
  CFG, ETYPE, HOURS, UPGRADES, RANKS, TAU, clamp, mulberry32,
  state: 'title', settings: { shake: true, muted: false }, best: 0,
  input: { mx: 0, my: 0, flare: false }, bot: null, headless: true, viewRadius: 640,
};
const SFX = new Proxy({}, { get: (_, k) => (...a) => { if (!G.headless && window.SFX && window.SFX[k]) window.SFX[k](...a); } });
try { const s = JSON.parse(localStorage.getItem('glimmer') || '{}'); G.best = s.best || 0; Object.assign(G.settings, s.settings || {}); } catch (e) {}
G.save = function () { try { localStorage.setItem('glimmer', JSON.stringify({ best: G.best, settings: G.settings })); } catch (e) {} };

G.newGame = function (seed) {
  G.seed = seed == null ? (Math.random() * 1e9) | 0 : seed;
  G.rnd = mulberry32(G.seed);
  G.t = 0; G.hour = -1; G.state = 'play'; G.hitstop = 0; G.endTimer = 0; G.won = false; G.deathT = null;
  G.p = { x: 0, y: 0, vx: 0, vy: 0, R: CFG.R0, Rmax: CFG.Rmax0, inv: 0, flareCd: 0, hurt: 0, dir: 0, moving: false, squash: 0 };
  G.up = {}; UPGRADES.forEach(u => G.up[u.id] = 0);
  G.enemies = []; G.motes = []; G.parts = []; G.texts = []; G.rings = []; G.lights = []; G.sparks = [];
  G.embers = 0; G.kindleIdx = 0; G.offer = null; G.upBag = []; G.picks = [];
  G.score = 0; G.combo = 0; G.comboT = 0; G.bestCombo = 0; G.kills = 0; G.motesGot = 0; G.flares = 0; G.hits = 0;
  G.budget = -1.5; G.nextPack = null; G.coneT = 0; G.lastSpawnA = G.rnd() * TAU;
  G.moteT = 0; G.moteDebt = 0; G.moteStreak = 0; G.moteStreakT = 0; G.pityT = 0;
  G.gloomSpawned = false; G.gloomKilled = false; G.gloomStaggers = 0;
  G.shakeT = 0; G.shakeMag = 0; G.flash = 0; G.flashCol = '255,255,255'; G.hurtFlash = 0; G.banner = null;
  G.hints = { move: 0, burn: 0, hit: 0, flare: 0 };
  G.minR = CFG.R0; G.sumR = 0; G.lowTime = 0; G.phoenixUsed = false; G.sparkA = 0; G.dawnBonus = 0;
  G.dmgTaken = { moth: 0, shade: 0, lurker: 0, wraith: 0, gloom: 0 };
  // Opening beat: shades already lurking at the edge and motes close by, so the first
  // sizzle-and-pop lands within ~3 s of pressing start (fun in the first 10 seconds).
  for (let i = 0; i < 5; i++) { const a = G.rnd() * TAU, d = 230 + G.rnd() * 140; spawnEnemy('shade', Math.cos(a) * d, Math.sin(a) * d); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + G.rnd(), d = 150 + G.rnd() * 120; spawnMote(Math.cos(a) * d, Math.sin(a) * d); }
};

// ---------------------------------------------------------------- helpers
const R = () => G.rnd();
const rr = (a, b) => a + (b - a) * R();
function burnMul() { return 1 + clamp((CFG.hotLight - G.p.R) / (CFG.hotLight - CFG.Rmin) * CFG.hotMax, 0, CFG.hotMax); }
function flareCost() { return Math.max(CFG.flareMin, G.p.R * CFG.flareFrac) * [1, 0.65, 0.5][G.up.after]; }
function canFlare() { return G.p.flareCd <= 0 && G.p.R - flareCost() >= CFG.Rmin + 6; }
G.flareCost = flareCost; G.canFlare = canFlare; G.burnMul = burnMul;
function addText(x, y, s, col, size = 14, life = 0.9) { if (!G.headless) G.texts.push({ x, y, s, col, size, life, t: 0 }); }
function shake(mag, dur = 0.1) { if (G.headless) return; G.shakeMag = Math.max(G.shakeMag, mag); G.shakeT = Math.max(G.shakeT, Math.min(dur, 0.12)); }
function burst(x, y, n, o) {
  if (G.headless) return;
  for (let i = 0; i < n && G.parts.length < 1600; i++) {
    const a = (o.a != null ? o.a + (Math.random() - 0.5) * (o.spread || TAU) : Math.random() * TAU), s = (o.s || 120) * (0.3 + Math.random() * 0.9);
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up || 0), life: (o.life || 0.6) * (0.5 + Math.random() * 0.7), t: 0, size: (o.size || 2.5) * (0.5 + Math.random()), col: o.col || '255,180,90', drag: o.drag || 2.5, add: o.add !== false, grav: o.grav || 0 });
  }
}
G.burst = burst; G.addText = addText;

// ---------------------------------------------------------------- spawning
// Pack spawns sit in a cone ahead of the player's movement, so you head into
// danger instead of being surrounded at random (Sci-Fi Vampire Survivors lessons @05:36).
function pickPack() {
  const h = HOURS[Math.max(0, G.hour)], tot = h.mix.reduce((s, m) => s + m[1], 0);
  let r = R() * tot;
  for (const m of h.mix) { if ((r -= m[1]) <= 0) return { type: m[0], n: Math.round(rr(m[2], m[3])) }; }
  return { type: 'shade', n: 2 };
}
function spawnPack(pk) {
  const p = G.p;
  let a;
  if (R() < CFG.randomSpawn) a = R() * TAU; else { a = G.lastSpawnA + rr(-1, 1) * (12 * Math.PI / 180); G.lastSpawnA = a; }
  const d = G.viewRadius + 60 + R() * 60, spread = 40 * Math.sqrt(pk.n);
  const cx = p.x + Math.cos(a) * d, cy = p.y + Math.sin(a) * d;
  for (let i = 0; i < pk.n; i++) spawnEnemy(pk.type, cx + rr(-1, 1) * spread, cy + rr(-1, 1) * spread);
}
function spawnEnemy(type, x, y) {
  const T = ETYPE[type];
  const e = { type, T, x, y, kx: 0, ky: 0, hp: T.hp, maxhp: T.hp, size: T.size, seed: R() * 100, burning: 0, flash: 0, state: 'move', st: 0, cd: rr(1, 2.5), dx: 0, dy: 0, sparkCd: 0, blink: rr(2, 6), dead: false, born: 0, stagger: 0 };
  if (type === 'gloom') e.cd = 5;
  G.enemies.push(e); return e;
}
G.spawnEnemy = spawnEnemy;
function updateSpawning(dt) {
  const p = G.p;
  G.coneT -= dt;
  if (G.coneT <= 0) { // re-aim the cone toward where the player is heading
    G.coneT = rr(5, 9);
    const base = p.moving ? p.dir : G.lastSpawnA + rr(-1.2, 1.2);
    G.lastSpawnA = base + rr(-0.6, 0.6);
  }
  const h = HOURS[G.hour];
  const ramp = 1 + (G.t - G.hour * CFG.night / 6) / (CFG.night / 6) * 0.25;
  G.budget += h.rate * ramp * CFG.spawnMul * dt;
  if (!G.nextPack) G.nextPack = pickPack();
  const cost = ETYPE[G.nextPack.type].cost * G.nextPack.n;
  if (G.budget >= cost && G.enemies.length < 170) { G.budget -= cost; spawnPack(G.nextPack); G.nextPack = null; }
  if (G.hour >= 4 && !G.gloomSpawned) { // 4 AM: the boss-like event
    G.gloomSpawned = true; const a = p.moving ? p.dir : R() * TAU, d = G.viewRadius + 120;
    spawnEnemy('gloom', p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
  }
}

// ---------------------------------------------------------------- motes
function spawnMote(x, y, opts = {}) { G.motes.push({ x, y, vx: opts.vx || 0, vy: opts.vy || 0, t: 0, seed: Math.random() * 10, life: opts.life || 24, drop: !!opts.drop }); }
G.spawnMote = spawnMote;
function updateMotes(dt) {
  const p = G.p;
  G.moteT -= dt;
  let ambient = 0; for (const m of G.motes) if (!m.drop) ambient++;
  if (G.moteT <= 0 && ambient < CFG.moteMax) {
    G.moteT = CFG.moteEvery;
    // greed: motes appear out in the dark, beyond your light (Dave the Diver spotlight @06:49)
    const a = R() * TAU, d = rr(Math.max(150, p.R + 30), 640);
    let x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
    const dw = Math.hypot(x, y); if (dw > CFG.worldR - 40) { x *= (CFG.worldR - 40) / dw; y *= (CFG.worldR - 40) / dw; }
    spawnMote(x, y);
  }
  // pity motes: when almost snuffed, a lifeline appears nearby (How hard should your game be short @00:33)
  if (p.R < CFG.lowLight) { G.pityT -= dt; if (G.pityT <= 0) { G.pityT = 1.6; const a = R() * TAU, d = rr(90, 170); spawnMote(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, { life: 8 }); } } else G.pityT = 0.6;
  const mag = CFG.magnet * (1 + 0.5 * G.up.lode);
  G.moteStreakT -= dt; if (G.moteStreakT <= 0) G.moteStreak = 0;
  for (let i = G.motes.length - 1; i >= 0; i--) {
    const m = G.motes[i]; m.t += dt;
    const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 0.01;
    if (d < mag) { const pull = 900 * (1 - d / mag) + 200; m.vx += dx / d * pull * dt; m.vy += dy / d * pull * dt; }
    m.vx *= Math.exp(-3 * dt); m.vy *= Math.exp(-3 * dt); m.x += m.vx * dt; m.y += m.vy * dt;
    if (d < CFG.size + 9) {
      G.motes.splice(i, 1);
      p.R = Math.min(p.Rmax, p.R + CFG.mote + 0.5 * G.up.lode + (G.up.fleet ? 1 : 0)); G.embers++; G.motesGot++; G.score += 2;
      G.moteStreak++; G.moteStreakT = 1.6;
      SFX.mote(G.moteStreak); burst(m.x, m.y, 8, { s: 90, col: '255,230,140', life: 0.4, size: 2 });
      checkKindle();
      continue;
    }
    if (m.t > m.life) G.motes.splice(i, 1);
  }
}

// ---------------------------------------------------------------- upgrades
// A marble bag: every upgrade is offered once before any repeats (Marble bag deep dive @00:00).
function availableUps() { return UPGRADES.filter(u => G.up[u.id] < u.max); }
function drawOffer() {
  const avail = availableUps(); if (!avail.length) return null;
  const out = []; let guard = 0;
  while (out.length < Math.min(3, avail.length) && guard++ < 60) {
    if (!G.upBag.length) { G.upBag = availableUps().map(u => u.id); for (let i = G.upBag.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [G.upBag[i], G.upBag[j]] = [G.upBag[j], G.upBag[i]]; } }
    const id = G.upBag.pop(); const u = UPGRADES.find(u => u.id === id);
    if (u && G.up[id] < u.max && !out.includes(u)) out.push(u);
  }
  return out;
}
function checkKindle() {
  if (G.state === 'play' && G.kindleIdx < CFG.kindle.length && G.embers >= CFG.kindle[G.kindleIdx]) {
    G.kindleIdx++;
    const offer = drawOffer();
    if (offer && offer.length) { G.offer = offer; G.state = 'kindle'; G.offerT = 0; SFX.kindle(); }
  }
}
G.choose = function (i) {
  if (G.state !== 'kindle' || !G.offer || !G.offer[i]) return;
  const u = G.offer[i]; G.up[u.id]++; G.picks.push(u.id);
  const p = G.p;
  if (u.id === 'halo') { p.Rmax += 30; p.R = p.Rmax; }
  G.offer = null; G.state = 'play';
  SFX.pick(); burst(p.x, p.y, 40, { s: 260, col: '255,220,150', life: 0.7 });
  addText(p.x, p.y - 40, u.name + (u.max > 1 ? ' ' + 'I'.repeat(G.up[u.id]) : ''), '#ffe7b0', 18, 1.6);
  checkKindle();
};

// ---------------------------------------------------------------- combat
function kill(e, how) {
  if (e.dead) return; e.dead = true;
  const T = e.T, p = G.p;
  G.kills++; G.combo++; G.comboT = CFG.comboWindow; G.bestCombo = Math.max(G.bestCombo, G.combo);
  const mult = Math.min(8, 1 + Math.floor(G.combo / 5));
  const pts = T.score * mult; G.score += pts;
  // drops use an accumulator, so motes arrive at a steady rate (randomness with memory)
  G.moteDebt += T.mote + (how === 'flare' ? CFG.flareMote : 0);
  while (G.moteDebt >= 1) { G.moteDebt -= 1; const a = R() * TAU; spawnMote(e.x, e.y, { vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, drop: true, life: 12 }); }
  if (G.up.wild && how !== 'wild') {
    const rad = 60 + 20 * G.up.wild, dmg = 14 * G.up.wild;
    for (const o of G.enemies) if (!o.dead && o !== e && Math.hypot(o.x - e.x, o.y - e.y) < rad + o.size) damage(o, dmg, 'wild', e.x, e.y, 120);
    if (!G.headless) G.rings.push({ x: e.x, y: e.y, r: 8, R: rad, t: 0, life: 0.3, col: '255,140,60', w: 3 });
  }
  if (e.type === 'gloom') {
    G.gloomKilled = true; p.R = Math.min(p.Rmax, p.R + 30); G.hitstop = 0.18; shake(9, 0.12);
    SFX.boom();
    if (!G.headless) { G.flash = 0.6; G.flashCol = '255,200,140'; burst(e.x, e.y, 220, { s: 520, col: '255,170,90', life: 1.4, size: 4 }); addText(e.x, e.y - 60, 'THE GLOOM IS BANISHED', '#ffd38a', 26, 2.5); G.rings.push({ x: e.x, y: e.y, r: 20, R: 600, t: 0, life: 0.8, col: '255,220,160', w: 8 }); }
  }
  SFX.kill(G.combo);
  if (!G.headless) {
    burst(e.x, e.y, 10 + e.size, { s: 60 + e.size * 6, col: '40,30,60', life: 0.9, add: false, size: 3, up: 30 });
    burst(e.x, e.y, 6 + e.size / 2, { s: 140, col: '255,170,80', life: 0.5, size: 2.2 });
    addText(e.x, e.y - e.size, '+' + pts, mult > 1 ? '#ffcf6b' : '#f4e6c8', 12 + Math.min(10, mult * 1.5), 0.8);
    if (mult > 1 && G.combo % 5 === 0) addText(p.x, p.y - 34, 'x' + mult, '#ffb347', 22, 0.9);
  }
  if (!G.hints.burn) G.hints.burn = 1;
}
function damage(e, amt, how, fx, fy, knock) {
  if (e.dead) return;
  if (e.type === 'gloom' && e.stagger > 0) amt *= 3;
  e.hp -= amt; e.flash = 0.12;
  if (knock) { const a = Math.atan2(e.y - fy, e.x - fx), k = knock * (e.type === 'gloom' ? 0.08 : e.type === 'wraith' ? 0.35 : 1); e.kx += Math.cos(a) * k; e.ky += Math.sin(a) * k; }
  if (e.hp <= 0) kill(e, how);
}
function doFlare() {
  const p = G.p;
  if (!canFlare()) { if (p.flareCd <= 0) { SFX.flareFail(); addText(p.x, p.y - 30, 'too dim to flare', '#ff9a8a', 13, 0.8); } return false; }
  const rad = CFG.flareR0 + CFG.flareRk * p.R, dmg = CFG.flareDmg + CFG.flareDmgK * p.R;
  p.R -= flareCost(); p.flareCd = CFG.flareCd * (G.up.after ? 0.7 : 1); G.flares++;
  for (const e of G.enemies) {
    if (e.dead) continue;
    const d = dist(e, p); if (d > rad + e.size) continue;
    if (e.type === 'gloom' && (e.state === 'tell' || e.state === 'inhale')) { // the counter to the boss's big move
      e.stagger = 2.6; e.state = 'move'; e.cd = 6.5; G.gloomStaggers++;
      SFX.stagger(); addText(e.x, e.y - 80, 'STAGGERED!', '#fff1c1', 24, 1.4);
    }
    damage(e, dmg * (1 - 0.4 * d / rad), 'flare', p.x, p.y, CFG.flareKnock * (1 - 0.5 * d / rad));
  }
  G.hitstop = 0.06; shake(6, 0.1);
  SFX.flare();
  if (!G.headless) {
    G.flash = 0.35; G.flashCol = '255,236,190';
    G.rings.push({ x: p.x, y: p.y, r: p.R * 0.5, R: rad, t: 0, life: 0.38, col: '255,235,180', w: 10 });
    G.rings.push({ x: p.x, y: p.y, r: 10, R: rad * 0.7, t: 0, life: 0.5, col: '255,160,80', w: 4 });
    G.lights.push({ x: p.x, y: p.y, r: rad * 1.1, t: 0, life: 0.55 });
    burst(p.x, p.y, 70, { s: rad * 2.2, col: '255,210,140', life: 0.5, size: 2.5, drag: 4 });
    p.squash = 1;
  }
  G.hints.flare = 2;
  return true;
}
G.doFlare = doFlare;
function hurtPlayer(e) {
  const p = G.p;
  let dmg = e.T.dmg * [1, 0.8, 0.7][G.up.steady];
  if (p.R < CFG.lowLight) dmg *= CFG.lowDmgMul; // rigged near-loss: secretly easier than it feels
  p.R -= dmg; p.inv = CFG.invuln; p.hurt = 0.35; G.hits++; G.dmgTaken[e.type] += dmg;
  G.combo = 0;
  const a = Math.atan2(e.y - p.y, e.x - p.x);
  e.kx += Math.cos(a) * 320; e.ky += Math.sin(a) * 320;
  p.vx -= Math.cos(a) * 160; p.vy -= Math.sin(a) * 160;
  if (e.type === 'moth') kill(e, 'touch');
  if (e.type === 'lurker' && e.state === 'dash') { e.state = 'recover'; e.st = 1; }
  shake(7, 0.12);
  SFX.hit();
  if (!G.headless) { G.hurtFlash = 0.45; burst(p.x, p.y, 26, { s: 220, col: '255,90,70', life: 0.45 }); addText(p.x, p.y - 26, '-' + Math.round(dmg), '#ff7a6a', 16, 0.8); }
  if (!G.hints.hit) G.hints.hit = 1;
  if (p.R <= CFG.Rmin) {
    if (G.up.phoenix && !G.phoenixUsed) {
      G.phoenixUsed = true; p.flareCd = 0; p.inv = 1.5;
      addText(p.x, p.y - 50, 'PHOENIX!', '#ffcf6b', 26, 1.6);
      p.R = 200; doFlare(); p.R = Math.min(p.Rmax, 120);
    } else die();
  }
}
function die() {
  G.p.R = CFG.Rmin; G.state = 'dying'; G.deathT = G.t; G.endTimer = 0;
  SFX.death(); burst(G.p.x, G.p.y, 80, { s: 200, col: '255,200,120', life: 1.4, size: 3, drag: 1.5 });
}

// ---------------------------------------------------------------- update
G.update = function (dt) {
  if (G.state === 'dying') { G.endTimer += dt; updateParticles(dt); if (G.endTimer > 1.4) finish(false); return; }
  if (G.state === 'dawn') {
    G.endTimer += dt; updateParticles(dt);
    for (const e of G.enemies) if (!e.dead && R() < dt * 2.5) { e.dead = true; burst(e.x, e.y, 14, { s: 120, col: '255,190,110', life: 0.8, up: 60 }); }
    G.enemies = G.enemies.filter(e => !e.dead);
    if (G.endTimer > 3.2) finish(true);
    return;
  }
  if (G.state !== 'play') return;
  G.dt = dt;
  if (G.hitstop > 0) { G.hitstop -= dt; return; }
  if (G.bot) G.bot(G);
  const p = G.p, inp = G.input;
  G.t += dt;
  const h = Math.min(5, Math.floor(G.t / (CFG.night / 6)));
  if (h !== G.hour) { G.hour = h; G.banner = { title: HOURS[h].label, sub: HOURS[h].note, t: 0 }; SFX.hour(); }
  if (G.t >= CFG.night) { startDawn(); return; }
  // movement: velocity snaps to input in ~50 ms with no wind-up (Responsive game feel short @01:30)
  let mx = inp.mx, my = inp.my; const ml = Math.hypot(mx, my);
  if (ml > 1) { mx /= ml; my /= ml; }
  const sp = CFG.speed * (1 + 0.2 * G.up.fleet), k = 1 - Math.exp(-18 * dt);
  p.vx += (mx * sp - p.vx) * k; p.vy += (my * sp - p.vy) * k;
  p.x += p.vx * dt; p.y += p.vy * dt;
  p.moving = ml > 0.15; if (p.moving) { p.dir = Math.atan2(my, mx); G.hints.move = 2; }
  const dw = Math.hypot(p.x, p.y); if (dw > CFG.worldR) { p.x *= CFG.worldR / dw; p.y *= CFG.worldR / dw; }
  p.inv -= dt; p.flareCd -= dt; p.hurt -= dt; p.squash *= Math.exp(-8 * dt);
  // light slowly fades, but fading alone never kills you; only shadows do (fair deaths)
  if (p.R > CFG.drainFloor) p.R = Math.max(CFG.drainFloor, p.R - (CFG.drain + CFG.drainK * p.R) * (1 + G.t / CFG.night * 0.6) * (G.up.steady ? 0.5 : 1) * dt);
  G.minR = Math.min(G.minR, p.R); G.sumR += p.R * dt; if (p.R < CFG.lowLight) { G.lowTime += dt; SFX.heart(); }
  if (inp.flare) { inp.flare = false; doFlare(); }
  if (G.t > 14 && !G.hints.flare) G.hints.flare = 1;
  G.comboT -= dt; if (G.comboT <= 0) G.combo = 0;
  updateSpawning(dt);
  updateEnemies(dt);
  if (G.state !== 'play') return;
  updateMotes(dt);
  updateParticles(dt);
};
function startDawn() {
  G.state = 'dawn'; G.endTimer = 0; G.won = true;
  G.dawnBonus = 2000 + Math.round(G.p.R * 10); G.score += G.dawnBonus;
  SFX.dawn(); SFX.stopMusic(); addText(G.p.x, G.p.y - 50, 'DAWN! +' + G.dawnBonus, '#ffe9a8', 28, 3);
}
function finish(won) {
  G.state = 'over'; G.won = won; G.overT = 0;
  G.newBest = G.score > G.best; if (G.newBest) G.best = G.score;
  G.reachedT = won ? CFG.night : (G.deathT != null ? G.deathT : G.t);
  G.save();
  if (!won) SFX.stopMusic();
}
function updateEnemies(dt) {
  const p = G.p, bm = burnMul() * (1 + 0.4 * G.up.sear);
  let sizzled = false;
  G.sparkA += dt * 3.2;
  const nSpark = G.up.spark, sparkR = Math.max(62, p.R * 0.55);
  G.sparks = []; for (let i = 0; i < nSpark; i++) { const a = G.sparkA + i * TAU / nSpark; G.sparks.push({ x: p.x + Math.cos(a) * sparkR, y: p.y + Math.sin(a) * sparkR }); }
  const E = G.enemies;
  for (let i = 0; i < E.length; i++) {
    const e = E[i]; if (e.dead) continue;
    const T = e.T; e.born += dt; e.flash -= dt; e.blink -= dt; if (e.blink < -0.12) e.blink = rr(2, 6);
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    let sp = T.speed, vx = ux, vy = uy;
    // light burns: the closer, the hotter
    e.burning = 0;
    if (d < p.R + e.size * 0.5) {
      const close = clamp(1 - d / p.R, 0, 1);
      let dps = CFG.burnDps * (CFG.burnNear + (1 - CFG.burnNear) * close) * bm;
      if (e.type === 'wraith') dps *= 0.6; if (e.type === 'gloom') dps *= 0.5;
      e.burning = 1; sp *= e.type === 'gloom' ? 0.85 : CFG.burnSlow; sizzled = true;
      e.hp -= dps * dt;
      if (!G.headless && Math.random() < dt * (10 + e.size)) burst(e.x + (Math.random() * 2 - 1) * e.size, e.y + (Math.random() * 2 - 1) * e.size, 1, { s: 30, col: '255,150,60', life: 0.6, up: 50, size: 2 });
      if (e.hp <= 0) { if (G.up.sear) p.R = Math.min(p.Rmax, p.R + 0.6 * G.up.sear); kill(e, 'burn'); continue; }
    }
    for (const s of G.sparks) if (e.sparkCd <= 0 && Math.hypot(s.x - e.x, s.y - e.y) < e.size + 9) { e.sparkCd = 0.35; damage(e, 48, 'spark', s.x, s.y, 160); burst(s.x, s.y, 6, { s: 120, col: '255,240,170', life: 0.3 }); }
    if (e.dead) continue; e.sparkCd -= dt;
    // behaviours
    if (e.type === 'moth') { const w = Math.sin(e.born * 6 + e.seed) * 0.9; vx = ux * Math.cos(w) - uy * Math.sin(w); vy = uy * Math.cos(w) + ux * Math.sin(w); }
    else if (e.type === 'shade') { const w = Math.sin(e.born * 1.7 + e.seed) * 0.35; vx = ux * Math.cos(w) - uy * Math.sin(w); vy = uy * Math.cos(w) + ux * Math.sin(w); }
    else if (e.type === 'lurker') { // readable tell: stop, eyes go red, dashed line, then lunge
      e.cd -= dt;
      if (e.state === 'move' && d < 300 && e.cd <= 0) { e.state = 'tell'; e.st = 0.6; e.dx = ux; e.dy = uy; SFX.windup(); }
      if (e.state === 'tell') { sp = -25; e.st -= dt; vx = e.dx; vy = e.dy; if (e.st <= 0) { e.state = 'dash'; e.st = 0.42; SFX.dash(); } }
      else if (e.state === 'dash') { sp = 560; vx = e.dx; vy = e.dy; e.st -= dt; if (!G.headless && Math.random() < 0.6) burst(e.x, e.y, 1, { s: 20, col: '120,240,255', life: 0.35, size: 2.5 }); if (e.st <= 0) { e.state = 'recover'; e.st = 1.0; } }
      else if (e.state === 'recover') { sp *= 0.3; e.st -= dt; if (e.st <= 0) { e.state = 'move'; e.cd = rr(1.2, 2.2); } }
    } else if (e.type === 'gloom') { // big threat with a big tell; the Flare is the answer (Prophet Skeram short @00:00)
      e.stagger = Math.max(0, e.stagger - dt); e.cd -= dt;
      if (e.stagger > 0) sp = 0;
      if (e.state === 'move' && e.cd <= 0 && d < 700) { e.state = 'tell'; e.st = 1.5; SFX.inhale(); addText(e.x, e.y - 90, 'it inhales...', '#ffb0a0', 16, 1.4); }
      else if (e.state === 'tell') { sp = 0; e.st -= dt; if (e.st <= 0) { e.state = 'inhale'; e.st = 1.7; } }
      else if (e.state === 'inhale') {
        sp = 0; e.st -= dt;
        if (d < 560) { p.x -= ux * 105 * dt; p.y -= uy * 105 * dt; if (p.R > CFG.Rmin + 8) p.R -= 9 * dt; }
        if (!G.headless && Math.random() < 0.8) { const a = Math.random() * TAU, r = 260 + Math.random() * 200; G.parts.push({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 1.6, vy: -Math.sin(a) * r * 1.6, life: 0.6, t: 0, size: 2.5, col: '255,180,160', drag: 0, add: true, grav: 0 }); }
        if (e.st <= 0) { e.state = 'move'; e.cd = 6.5; }
      }
    }
    // separation
    for (let j = i + 1; j < E.length; j++) {
      const o = E[j]; if (o.dead) continue;
      const sx = o.x - e.x, sy = o.y - e.y, md = e.size + o.size; if (Math.abs(sx) > md || Math.abs(sy) > md) continue;
      const sd = Math.hypot(sx, sy) || 0.01;
      if (sd < md) { const push = (md - sd) * 0.5, nx = sx / sd, ny = sy / sd, we = e.type === 'gloom' ? 0.1 : 1, wo = o.type === 'gloom' ? 0.1 : 1; e.x -= nx * push * we; e.y -= ny * push * we; o.x += nx * push * wo; o.y += ny * push * wo; }
    }
    e.kx *= Math.exp(-5 * dt); e.ky *= Math.exp(-5 * dt);
    e.x += (vx * sp + e.kx) * dt; e.y += (vy * sp + e.ky) * dt;
    if (d < e.size + CFG.size && p.inv <= 0) { hurtPlayer(e); if (G.state !== 'play') break; }
    if (d > 2600) e.dead = true;
  }
  if (sizzled) SFX.sizzle();
  G.enemies = E.filter(e => !e.dead);
}
function updateParticles(dt) {
  if (G.headless) return;
  for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.t += dt; if (q.t >= q.life) { G.parts.splice(i, 1); continue; } const dr = Math.exp(-q.drag * dt); q.vx *= dr; q.vy *= dr; q.vy += q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
  for (let i = G.texts.length - 1; i >= 0; i--) { const q = G.texts[i]; q.t += dt; q.y -= 28 * dt; if (q.t >= q.life) G.texts.splice(i, 1); }
  for (let i = G.rings.length - 1; i >= 0; i--) { const q = G.rings[i]; q.t += dt; if (q.t >= q.life) G.rings.splice(i, 1); }
  for (let i = G.lights.length - 1; i >= 0; i--) { const q = G.lights[i]; q.t += dt; if (q.t >= q.life) G.lights.splice(i, 1); }
  if (G.banner) { G.banner.t += dt; if (G.banner.t > 3.2) G.banner = null; }
}
G.rankFor = function (s) { let r = RANKS[0]; for (const x of RANKS) if (s >= x[0]) r = x; return r; };
G.nextRank = function (s) { return RANKS.find(x => x[0] > s); };
G.clock = function (t) { const hh = Math.floor(t / 30), mm = Math.floor((t % 30) / 30 * 60); return (hh === 0 ? 12 : hh) + ':' + String(mm).padStart(2, '0') + ' AM'; };

// Run one full game with no rendering (used by tests and difficulty sims).
G.simulate = function (seed, bot, pick, maxT = 400) {
  const prevHeadless = G.headless; G.headless = true;
  G.newGame(seed); G.bot = bot;
  let steps = 0; const dt = 1 / 120;
  while (G.state !== 'over' && steps < maxT * 120) {
    if (G.state === 'kindle') G.choose(pick ? pick(G) : 0);
    G.update(dt); steps++;
  }
  const res = { seed, won: G.won, t: +(G.reachedT ?? G.t).toFixed(1), score: G.score, kills: G.kills, flares: G.flares, hits: G.hits, minR: +G.minR.toFixed(1), avgR: Math.round(G.sumR / Math.max(1, G.t)), lowTime: +G.lowTime.toFixed(1), kindles: G.picks.length, gloomKilled: G.gloomKilled, staggers: G.gloomStaggers, bestCombo: G.bestCombo, dmgTaken: Object.fromEntries(Object.entries(G.dmgTaken).map(([k, v]) => [k, Math.round(v)])), rank: G.rankFor(G.score)[1] };
  G.bot = null; G.headless = prevHeadless;
  return res;
};
})();
