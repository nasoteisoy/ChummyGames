// ═══════════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════════
let aC;
function iA() { if (!aC) aC = new (window.AudioContext || window.webkitAudioContext)(); }
function sn(f, d, t = 'square', v = .12) {
  if (!aC) return;
  const o = aC.createOscillator(), g = aC.createGain();
  o.type = t; o.frequency.value = f;
  g.gain.setValueAtTime(v, aC.currentTime);
  g.gain.exponentialRampToValueAtTime(.001, aC.currentTime + d);
  o.connect(g); g.connect(aC.destination); o.start(); o.stop(aC.currentTime + d);
}
const sfx = {
  atk() { sn(220, .15, 'sawtooth'); setTimeout(() => sn(330, .1), 80); },
  hit() { sn(100, .2, 'sawtooth', .18); sn(80, .3, 'square', .08); },
  grd() { sn(800, .08, 'triangle', .08); },
  ko()  { sn(400, .15); setTimeout(() => sn(300, .15), 150); setTimeout(() => sn(200, .3), 300); },
  cnt() { sn(600, .1, 'triangle', .08); },
  go()  { sn(800, .15, 'triangle', .12); setTimeout(() => sn(1000, .2, 'triangle', .12), 100); },
  orb() { sn(900, .08, 'sine', .1); setTimeout(() => sn(1200, .08, 'sine', .08), 60); },
  brk() { sn(200, .12, 'sawtooth', .06); }
};
