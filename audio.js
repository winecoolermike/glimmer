// Glimmer: procedural WebAudio sound. No assets. All sounds are synthesized.
(() => {
'use strict';
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31];
const A = { ctx: null, master: null, muted: false, music: null, last: {} };
const now = () => A.ctx ? A.ctx.currentTime : 0;
const hz = (semi, base = 440) => base * Math.pow(2, semi / 12);

A.init = function () {
  if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return;
  A.ctx = new C();
  A.master = A.ctx.createGain(); A.master.gain.value = A.muted ? 0 : 0.55;
  const comp = A.ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6;
  A.master.connect(comp); comp.connect(A.ctx.destination);
  // shared noise buffer
  const len = A.ctx.sampleRate * 1.5, buf = A.ctx.createBuffer(1, len, A.ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  A.noise = buf;
  // reverb-ish delay bus for sparkle
  A.wet = A.ctx.createGain(); A.wet.gain.value = 0.28;
  const dl = A.ctx.createDelay(1); dl.delayTime.value = 0.23; const fb = A.ctx.createGain(); fb.gain.value = 0.38;
  const lp = A.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
  A.wet.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(A.master);
};
A.setMuted = function (m) { A.muted = m; if (A.master) A.master.gain.setTargetAtTime(m ? 0 : 0.55, now(), 0.05); };
function throttle(key, sec) { const t = performance.now() / 1000; if (A.last[key] && t - A.last[key] < sec) return false; A.last[key] = t; return true; }

function tone(freq, dur, { type = 'sine', vol = 0.2, attack = 0.005, wet = 0, slide = 0, delay = 0 } = {}) {
  if (!A.ctx) return;
  const t = now() + delay, o = A.ctx.createOscillator(), g = A.ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(A.master); if (wet) { const w = A.ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(A.wet); }
  o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, { vol = 0.2, type = 'bandpass', f0 = 1000, f1 = 0, q = 1, delay = 0, attack = 0.005 } = {}) {
  if (!A.ctx) return;
  const t = now() + delay, s = A.ctx.createBufferSource(), f = A.ctx.createBiquadFilter(), g = A.ctx.createGain();
  s.buffer = A.noise; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t);
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(A.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
}

A.sizzle = () => { if (throttle('sz', 0.09)) noise(0.12, { vol: 0.05, type: 'highpass', f0: 3500, q: 0.7 }); };
A.kill = (combo) => { if (!throttle('k', 0.03)) return; const s = PENTA[Math.min(PENTA.length - 1, combo % 14)]; tone(hz(s, 523), 0.18, { type: 'triangle', vol: 0.13, wet: 0.6 }); noise(0.08, { vol: 0.06, f0: 1800, q: 2 }); };
A.mote = (streak) => { if (!throttle('m', 0.025)) return; const s = PENTA[Math.min(PENTA.length - 1, streak)]; tone(hz(s, 880), 0.25, { type: 'sine', vol: 0.1, wet: 0.8 }); };
A.hit = () => { // deliberately harsh: damage must be impossible to miss (Sci-Fi Vampire Survivors lessons @12:51)
  tone(140, 0.22, { type: 'sawtooth', vol: 0.22, slide: 0.4 }); tone(97, 0.25, { type: 'square', vol: 0.12, slide: 0.5 });
  noise(0.28, { vol: 0.25, type: 'bandpass', f0: 600, f1: 200, q: 0.8 });
};
A.flare = () => { noise(0.6, { vol: 0.35, type: 'bandpass', f0: 300, f1: 5000, q: 0.6, attack: 0.02 }); tone(70, 0.6, { vol: 0.4, slide: 0.35 }); tone(hz(7, 440), 0.5, { type: 'triangle', vol: 0.08, wet: 1, delay: 0.03 }); };
A.flareFail = () => { tone(180, 0.12, { type: 'square', vol: 0.06, slide: 0.7 }); };
A.kindle = () => { [0, 4, 7, 12, 16].forEach((s, i) => tone(hz(s, 440), 0.6, { type: 'triangle', vol: 0.09, wet: 1, delay: i * 0.06 })); };
A.pick = () => { tone(hz(12, 440), 0.3, { type: 'sine', vol: 0.15, wet: 1 }); tone(hz(19, 440), 0.4, { type: 'sine', vol: 0.1, wet: 1, delay: 0.05 }); };
A.dash = () => { noise(0.35, { vol: 0.12, type: 'bandpass', f0: 900, f1: 2600, q: 3 }); };
A.windup = () => { tone(220, 0.5, { type: 'sawtooth', vol: 0.05, slide: 1.8, attack: 0.1 }); };
A.inhale = () => { noise(1.5, { vol: 0.22, type: 'lowpass', f0: 200, f1: 1600, q: 4, attack: 1.2 }); tone(55, 1.5, { type: 'sawtooth', vol: 0.08, slide: 1.5, attack: 0.8 }); };
A.stagger = () => { tone(hz(-5, 440), 0.5, { type: 'square', vol: 0.12, slide: 0.5 }); noise(0.4, { vol: 0.3, f0: 2000, f1: 400 }); };
A.boom = () => { tone(55, 1.2, { vol: 0.5, slide: 0.4 }); noise(1.2, { vol: 0.4, type: 'lowpass', f0: 3000, f1: 100 }); [0, 7, 12, 19].forEach((s, i) => tone(hz(s, 330), 1.2, { type: 'triangle', vol: 0.07, wet: 1, delay: 0.1 + i * 0.08 })); };
A.heart = () => { if (!throttle('h', 0.7)) return; tone(60, 0.12, { vol: 0.25, slide: 0.6 }); tone(55, 0.12, { vol: 0.2, slide: 0.6, delay: 0.16 }); };
A.hour = () => { tone(hz(-12, 440), 1.6, { type: 'sine', vol: 0.18, wet: 1 }); tone(hz(-5, 440), 1.6, { type: 'sine', vol: 0.1, wet: 1, delay: 0.02 }); };
A.dawn = () => { [0, 4, 7, 11, 14, 19, 24].forEach((s, i) => tone(hz(s, 262), 3.2, { type: 'triangle', vol: 0.08, wet: 1, delay: i * 0.12, attack: 0.3 })); };
A.death = () => { tone(440, 1.4, { type: 'sine', vol: 0.18, slide: 0.25, wet: 1 }); noise(1, { vol: 0.15, type: 'lowpass', f0: 1500, f1: 80 }); };
A.click = () => tone(1200, 0.05, { type: 'square', vol: 0.04 });

// Ambient music: a slow pentatonic music-box over a drone, with a pulse that intensifies with the hour.
A.startMusic = function () {
  if (!A.ctx || A.music) return;
  const m = { beat: 0, next: now() + 0.1, intensity: 0, nodes: [] };
  const drone = A.ctx.createGain(); drone.gain.value = 0.0001; drone.connect(A.master);
  drone.gain.exponentialRampToValueAtTime(0.06, now() + 3);
  const lp = A.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; lp.connect(drone);
  [110, 110.6, 164.8].forEach(f => { const o = A.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(); m.nodes.push(o); });
  const lfo = A.ctx.createOscillator(), lg = A.ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 250; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(); m.nodes.push(lfo);
  m.drone = drone; A.music = m;
};
A.stopMusic = function () { if (!A.music) return; const m = A.music; m.drone.gain.setTargetAtTime(0.0001, now(), 0.5); setTimeout(() => m.nodes.forEach(n => { try { n.stop(); } catch (e) {} }), 1500); A.music = null; };
A.tickMusic = function (intensity) { // called every frame; schedules ahead
  const m = A.music; if (!m || !A.ctx) return;
  const spb = 60 / 96 / 2; // eighth notes at 96 BPM
  while (m.next < now() + 0.15) {
    const b = m.beat++, t = m.next - now();
    if (b % 2 === 0 || Math.random() < 0.25 + intensity * 0.3) {
      const s = PENTA[(Math.floor(Math.random() * 6) + (b % 16 < 8 ? 0 : 2))];
      tone(hz(s, 440), 0.9, { type: 'sine', vol: 0.035 + intensity * 0.02, wet: 1, delay: Math.max(0, t) });
    }
    if (intensity > 0.25 && b % 4 === 0) tone(55, 0.25, { vol: 0.08 + intensity * 0.12, slide: 0.5, delay: Math.max(0, t) });
    if (intensity > 0.6 && b % 4 === 2) noise(0.05, { vol: 0.03 * intensity, type: 'highpass', f0: 6000, delay: Math.max(0, t) });
    m.next += spb;
  }
};
window.SFX = A;
})();
