// ═══════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════
function render() {
  ctx.clearRect(0, 0, CW, CH);

  // Map
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = MAP[y][x];
    const gi = sprites['grass'];
    if (gi && gi.complete) ctx.drawImage(gi, x * T, y * T, T, T);
    else { ctx.fillStyle = '#2a4a1a'; ctx.fillRect(x * T, y * T, T, T); }
    if (t === 1) {
      const wi = sprites['wall'];
      if (wi && wi.complete) ctx.drawImage(wi, x * T, y * T, T, T);
      else { ctx.fillStyle = '#555'; ctx.fillRect(x * T, y * T, T, T); }
    } else if (t === 2) {
      const wi = sprites[waterF ? 'water2' : 'water1'];
      if (wi && wi.complete) ctx.drawImage(wi, x * T, y * T, T, T);
      else { ctx.fillStyle = '#2244aa'; ctx.fillRect(x * T, y * T, T, T); }
    }
  }

  // Orbs
  for (const orb of orbs) {
    const k = orb.element + 'orb' + (orbF + 1);
    const img = sprites[k];
    if (img && img.complete) ctx.drawImage(img, orb.x - 16, orb.y - 16, T, T);
    else { ctx.fillStyle = '#ff0'; ctx.fillRect(orb.x - 4, orb.y - 4, 8, 8); }
  }

  // Players sorted by Y
  const sorted = [...allPlayers].sort((a, b) => a.y - b.y);
  for (const p of sorted) drawP(p);

  // Effects
  for (const e of effects) {
    const cfg = FX[e.wt]; if (!cfg) continue;
    const k = cfg.spr(e.f); const img = sprites[k];
    if (img && img.complete) {
      ctx.save(); ctx.translate(e.x, e.y);
      const r = getRot(cfg.base, e.dir); if (r) ctx.rotate(r);
      ctx.drawImage(img, -16, -16, T, T); ctx.restore();
    }
  }
}

function drawP(p) {
  if (!p.alive) {
    ctx.globalAlpha = .3; ctx.fillStyle = W[p.type]?.color || '#888';
    ctx.font = '16px monospace'; ctx.textAlign = 'center';
    ctx.fillText('✕', p.x, p.y - 24); ctx.globalAlpha = 1; return;
  }
  const k = p.sprKey(); const img = sprites[k];
  const flash = p.ft > 0 && Math.floor(p.ft / 50) % 2 === 0;
  if (flash) ctx.globalAlpha = .4;
  if (img && img.complete) ctx.drawImage(img, p.x - 16, p.y - 56, T, 64);
  else { ctx.fillStyle = W[p.type]?.color || '#888'; ctx.fillRect(p.x - 10, p.y - 40, 20, 40); }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff'; ctx.font = '6px monospace'; ctx.textAlign = 'center';
  ctx.fillText(p === myPlayer ? 'YOU' : 'P' + (p.slot + 1), p.x, p.y - 58);
  if (p.ammo > 0) {
    ctx.fillStyle = W[p.type]?.color || '#ff0';
    for (let i = 0; i < p.ammo; i++) ctx.fillRect(p.x - p.ammo * 3 + i * 6, p.y + 4, 4, 4);
  }
}
