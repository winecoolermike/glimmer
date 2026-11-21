// Node difficulty sim: node test/sim.js [N]
global.window = global; global.localStorage = { getItem: () => null, setItem: () => {} };
require('../logic.js'); const bots = require('./bots.js'); const G = window.GLIMMER;
const N = +process.argv[2] || 60;
if (process.argv[3]) Object.assign(G.CFG, JSON.parse(process.argv[3]));
if (process.argv[4]) { const o = JSON.parse(process.argv[4]); for (const k in o) Object.assign(G.ETYPE[k], o[k]); }
const cfgs = [
  ['idle', () => bots.idle(), bots.pickFirst],
  ['random', () => bots.random(), bots.pickFirst],
  ['novice (skill .2, first pick)', () => bots.heuristic(0.2), bots.pickFirst],
  ['average (skill .5, first pick)', () => bots.heuristic(0.5), bots.pickFirst],
  ['sharp (skill .8, first pick)', () => bots.heuristic(0.8), bots.pickFirst],
  ['expert (skill 1, smart pick)', () => bots.heuristic(1), bots.pickSmart],
];
const out = {};
for (const [name, mk, pick] of cfgs) {
  const rs = []; for (let s = 1; s <= N; s++) rs.push(G.simulate(1000 + s, mk(), pick));
  const med = a => { const b = [...a].sort((x, y) => x - y); return b[b.length >> 1]; };
  const sum = { runs: N, winRate: +(rs.filter(r => r.won).length / N * 100).toFixed(0), medianTime: med(rs.map(r => r.t)), medianScore: med(rs.map(r => r.score)), gloomKill: +(rs.filter(r => r.gloomKilled).length / N * 100).toFixed(0), nearLossPct: +(rs.filter(r => r.minR < 40).length / N * 100).toFixed(0), medKindles: med(rs.map(r => r.kindles)), medFlares: med(rs.map(r => r.flares)), avgR: med(rs.map(r => r.avgR)), lowPct: med(rs.map(r => Math.round(r.lowTime / r.t * 100))), deathHour: [0,0,0,0,0,0,0] };
  rs.forEach(r => { if (!r.won) sum.deathHour[Math.min(6, Math.floor(r.t / 30))]++; else sum.deathHour[6]++; });
  const dmg = {}; rs.forEach(r => { for (const k in r.dmgTaken) dmg[k] = (dmg[k] || 0) + r.dmgTaken[k]; }); sum.dmgShare = dmg;
  out[name] = sum; console.log(name.padEnd(36), JSON.stringify(sum));
}
require('fs').writeFileSync(__dirname + '/sim_results.json', JSON.stringify(out, null, 1));
