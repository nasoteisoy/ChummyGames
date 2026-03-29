// ═══════════════════════════════════════════════════
// EFFECTS
// ═══════════════════════════════════════════════════
const effects = [];

function getRot(b, t) {
  if (!b) return 0;
  const a = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
  return (a[t] || 0) - (a[b] || 0);
}

function atkOff(d) {
  return { right: [28, -20], left: [-28, -20], down: [0, 0], up: [0, -40] }[d] || [0, -20];
}

function spawnFx(wt, x, y, dir) {
  const c = FX[wt]; if (!c) return;
  effects.push({ wt, x, y, dir: dir || 'right', f: 0, t: 0, mf: c.fr, ft: c.ft });
}

function updateFx(dt) {
  for (let i = effects.length - 1; i >= 0; i--) {
    effects[i].t += dt;
    if (effects[i].t >= effects[i].ft) {
      effects[i].f++; effects[i].t = 0;
      if (effects[i].f >= effects[i].mf) effects.splice(i, 1);
    }
  }
}
