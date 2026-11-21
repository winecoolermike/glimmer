// Bots shared by the Node sim and the Playwright test. Plain functions of the game object G.
(function (root) {
const bots = {};
bots.idle = () => G => { G.input.mx = 0; G.input.my = 0; };
bots.random = (rate = 0.5) => { let t = 0, a = 0; return G => { t -= G.dt || 1 / 120; if (t <= 0) { t = 0.3 + G.rnd() * 0.8; a = G.rnd() * Math.PI * 2; if (G.rnd() < rate * 0.4) G.input.flare = true; } G.input.mx = Math.cos(a); G.input.my = Math.sin(a); }; };
// "Decent player": dodge threats, chase motes, flare at crowds / tells / the Gloom's inhale.
bots.heuristic = (skill = 1) => {
  // skill 1 = sharp player (120 ms reactions); 0.5 = average; 0.2 = novice. Lower skill = slower, noisier, shorter sight.
  let think = 0, err = 0, distracted = 0;
  return G => {
  const dt = G.dt || 1 / 120; think -= dt; distracted -= dt;
  if (think > 0) return;
  think = 0.12 + (1 - skill) * 0.28;
  if (distracted > 0) return;
  if (G.rnd() < (1 - skill) * 0.04) { distracted = 0.4 + G.rnd() * 0.6; return; } // momentary lapse
  err = (G.rnd() - 0.5) * (1 - skill) * 1.6;
  const p = G.p; let fx = 0, fy = 0, crowd = 0, urgent = false, gloomTell = false;
  const frad = G.CFG.flareR0 + G.CFG.flareRk * p.R, sight = 140 + skill * 140;
  for (const e of G.enemies) {
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
    if (d < frad * 0.8) crowd += e.type === 'moth' ? 0.5 : e.type === 'wraith' ? 3 : 1;
    if (e.type === 'gloom' && (e.state === 'tell' || e.state === 'inhale') && d < frad && G.rnd() < skill) gloomTell = true;
    if (skill > 0.45 && e.type === 'lurker' && e.state === 'tell' && d < 260) { urgent = true; fx -= -dy / d * 3; fy -= dx / d * 3; }
    const reach = e.type === 'gloom' ? sight + 180 : sight;
    if (d < reach) { const w = (e.T.dmg / 14) * Math.pow((reach - d) / reach, 2); fx -= dx / d * w * 3; fy -= dy / d * w * 3; }
    if (d < e.size + 35 && e.type !== 'moth') urgent = true;
  }
  let best = null, bd = 1e9; for (const m of G.motes) { const d = Math.hypot(m.x - p.x, m.y - p.y); if (d < bd) { bd = d; best = m; } }
  if (best) { const need = 1 + (p.Rmax - p.R) / 40; fx += (best.x - p.x) / bd * need; fy += (best.y - p.y) / bd * need; }
  const dw = Math.hypot(p.x, p.y); if (dw > G.CFG.worldR - 250) { fx -= p.x / dw * 2; fy -= p.y / dw * 2; }
  const c = Math.cos(err), s2 = Math.sin(err);
  G.input.mx = fx * c - fy * s2; G.input.my = fx * s2 + fy * c;
  const crowdNeed = 5 + (1 - skill) * 5;
  if (G.canFlare() && (gloomTell || crowd >= crowdNeed || (urgent && p.R > 75 && G.rnd() < skill))) G.input.flare = true;
}; };
// Upgrade pickers
bots.pickFirst = () => 0;
bots.pickPref = G => { const pref = ['sear', 'halo', 'spark', 'wild', 'after', 'steady', 'phoenix', 'lode', 'fleet']; let bi = 0, bs = 99; G.offer.forEach((u, i) => { const s = pref.indexOf(u.id); if (s < bs) { bs = s; bi = i; } }); return bi; };
bots.pickSmart = G => { const pref = ['lode', 'wild', 'after', 'phoenix', 'steady', 'spark', 'halo', 'sear', 'fleet']; let bi = 0, bs = 99; G.offer.forEach((u, i) => { const s = pref.indexOf(u.id); if (s < bs) { bs = s; bi = i; } }); return bi; };
root.GLIMMER_BOTS = bots;
if (typeof module !== 'undefined') module.exports = bots;
})(typeof window !== 'undefined' ? window : globalThis);
