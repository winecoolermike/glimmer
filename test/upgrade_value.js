// Which upgrades actually help? Average bot always prefers upgrade X when offered.
global.window = global; global.localStorage = { getItem: () => null, setItem: () => {} };
require('../logic.js'); const bots = require('./bots.js'); const G = window.GLIMMER;
const N = +process.argv[2] || 30;
if (process.argv[3]) Object.assign(G.CFG, JSON.parse(process.argv[3]));
if (process.argv[4]) { const o = JSON.parse(process.argv[4]); for (const k in o) Object.assign(G.ETYPE[k], o[k]); }
const skill = +(process.argv[5] || 0.5);
const rows = [];
for (const fav of ['(first card)', ...G.UPGRADES.map(u => u.id)]) {
  const pick = g => { const i = g.offer.findIndex(u => u.id === fav); return i < 0 ? 0 : i; };
  let wins = 0, t = 0, sc = 0;
  for (let s = 1; s <= N; s++) { const r = G.simulate(5000 + s, bots.heuristic(skill), pick); wins += r.won; t += r.t; sc += r.score; }
  rows.push([fav, Math.round(wins / N * 100), Math.round(t / N), Math.round(sc / N)]);
  console.log(fav.padEnd(14), 'win%', rows.at(-1)[1], 'avgT', rows.at(-1)[2], 'avgScore', rows.at(-1)[3]);
}
require('fs').writeFileSync(__dirname + '/upgrade_value.json', JSON.stringify(rows));
