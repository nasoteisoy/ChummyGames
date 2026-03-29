// ═══════════════════════════════════════════════════
// PLAYER CLASS (with dead reckoning for remote)
// ═══════════════════════════════════════════════════
class Player {
  constructor(type, sx, sy, slot, pcid) {
    this.type = type; this.x = sx; this.y = sy; this.slot = slot; this.pcid = pcid;
    this.tx = sx; this.ty = sy;
    this.rdir = 'right'; this.rstate = 'idle';
    this.dir = sx < CW / 2 ? 'right' : 'left';
    this.hp = MHP; this.ammo = 0; this.state = 'idle';
    this.wf = 0; this.wt = 0; this.at = 0; this.acd = 0;
    this.hd = false; this.ft = 0; this.alive = true;
    this.mv = { up: false, down: false, left: false, right: false };
  }

  sprKey() {
    let a = 'idle';
    if (this.state === 'attacking') a = 'attackstand';
    else if (this.state === 'guarding') a = 'guardpose';
    else if (this.state === 'walking') a = this.wf === 0 ? 'walk1' : 'walk2';
    return `${this.type}_${this.dir}_${a}`;
  }

  update(dt, all) {
    if (!this.alive) return [];
    if (this.ft > 0) this.ft -= dt;
    if (this.acd > 0) this.acd -= dt;
    const hits = [];
    if (this.state === 'attacking') {
      this.at += dt;
      if (!this.hd && this.at >= ATKW) {
        this.hd = true;
        for (const o of all) {
          if (o === this || !o.alive) continue;
          const dx = o.x - this.x, dy = o.y - this.y;
          if (Math.sqrt(dx * dx + dy * dy) < ATKR && this.fac(dx, dy))
            hits.push({ tgt: o.pcid, dmg: o.state === 'guarding' ? GDMG : DMG, slot: o.slot });
        }
      }
      if (this.at >= ATKD) { this.state = 'idle'; this.at = 0; this.acd = ATKCD - ATKD; }
      return hits;
    }
    const m = this.mv.up || this.mv.down || this.mv.left || this.mv.right;
    const s = this.state === 'guarding' ? GSPD : SPD;
    if (m) {
      this.state = this.state === 'guarding' ? 'guarding' : 'walking';
      let dx = 0, dy = 0;
      if (this.mv.left) { dx -= 1; this.dir = 'left'; }
      if (this.mv.right) { dx += 1; this.dir = 'right'; }
      if (this.mv.up) { dy -= 1; this.dir = 'up'; }
      if (this.mv.down) { dy += 1; this.dir = 'down'; }
      if (dx && dy) { dx *= .707; dy *= .707; }
      if (!this.col(this.x + dx * s, this.y)) this.x += dx * s;
      if (!this.col(this.x, this.y + dy * s)) this.y += dy * s;
      this.wt += dt;
      if (this.wt > 180) { this.wf = 1 - this.wf; this.wt = 0; }
    } else if (this.state !== 'guarding') { this.state = 'idle'; this.wt = 0; }
    return hits;
  }

  predict(dt) {
    if (!this.alive) return;
    if (this.state === 'walking') {
      this.wt += dt; if (this.wt > 180) { this.wf = 1 - this.wf; this.wt = 0; }
    }
    if (this.rstate === 'walking' || this.rstate === 'guarding') {
      const s = this.rstate === 'guarding' ? GSPD : SPD;
      let dx = 0, dy = 0;
      switch (this.rdir) {
        case 'left': dx = -1; break; case 'right': dx = 1; break;
        case 'up': dy = -1; break; case 'down': dy = 1; break;
      }
      if (!this.col(this.x + dx * s, this.y)) this.x += dx * s;
      if (!this.col(this.x, this.y + dy * s)) this.y += dy * s;
    }
    const ex = this.tx - this.x, ey = this.ty - this.y;
    const dist = Math.sqrt(ex * ex + ey * ey);
    if (dist > 80) { this.x = this.tx; this.y = this.ty; }
    else if (dist > 0.5) { this.x += ex * CORRECTION; this.y += ey * CORRECTION; }
  }

  fac(dx, dy) {
    switch (this.dir) {
      case 'right': return dx > -10; case 'left': return dx < 10;
      case 'down': return dy > -10; case 'up': return dy < 10;
    } return true;
  }

  col(x, y) {
    for (const [px, py] of [[x-10,y-6],[x+10,y-6],[x-10,y+6],[x+10,y+6]]) {
      const tx = Math.floor(px / T), ty = Math.floor(py / T);
      if (tx < 0 || tx >= MW || ty < 0 || ty >= MH || MAP[ty][tx] !== 0) return true;
    } return false;
  }

  takeDmg(d) {
    this.hp = Math.max(0, this.hp - d); this.ft = 200;
    if (this.hp <= 0) this.alive = false;
    this.state === 'guarding' ? sfx.grd() : sfx.hit();
  }

  startAtk() {
    if (this.state === 'attacking' || this.acd > 0 || this.ammo <= 0) return false;
    this.state = 'attacking'; this.at = 0; this.hd = false; this.ammo--; sfx.atk(); return true;
  }

  startGrd() { if (this.state !== 'attacking') this.state = 'guarding'; }
  stopGrd() { if (this.state === 'guarding') this.state = 'idle'; }

  ser() {
    return { x: Math.round(this.x*10)/10, y: Math.round(this.y*10)/10, dir: this.dir,
      state: this.state, hp: this.hp, ammo: this.ammo, wf: this.wf, at: Math.round(this.at),
      ft: Math.round(this.ft), alive: this.alive, type: this.type, slot: this.slot, pcid: this.pcid };
  }

  applyRemote(s) {
    this.tx = s.x; this.ty = s.y;
    this.rdir = s.dir; this.rstate = s.state;
    this.dir = s.dir; this.state = s.state; this.hp = s.hp;
    this.ammo = s.ammo; this.at = s.at; this.ft = s.ft; this.alive = s.alive;
  }

  applyFull(s) {
    this.x = s.x; this.y = s.y; this.tx = s.x; this.ty = s.y;
    this.rdir = s.dir; this.rstate = s.state;
    this.dir = s.dir; this.state = s.state; this.hp = s.hp; this.ammo = s.ammo;
    this.wf = s.wf; this.at = s.at; this.ft = s.ft; this.alive = s.alive;
  }
}
