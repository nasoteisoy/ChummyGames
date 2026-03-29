// ═══════════════════════════════════════════════════
// ENTER GAME
// ═══════════════════════════════════════════════════
async function enterGame(spectatorMode) {
  const gdSnap = await currentRoom.ref.child('gameData').once('value');
  const gd = gdSnap.val();
  if (!gd) { showLobby(); return; }

  allPlayers = []; myPlayer = null; effects.length = 0; gameOver = false;

  const ps = gd.playerStates || {};
  for (const [pcid, s] of Object.entries(ps)) {
    const p = new Player(s.type, s.x, s.y, s.slot, pcid);
    p.applyFull(s);
    allPlayers.push(p);
    if (pcid === myPCID && !spectatorMode) myPlayer = p;
  }

  try { orbs = JSON.parse(gd.orbs || '[]'); } catch (e) { orbs = []; }
  orbId = gd.orbCounter || 0;

  setupPlayerListeners();
  buildHUD();
  document.getElementById('controlsArea').style.display = myPlayer ? 'flex' : 'none';
  document.getElementById('resetGameBtn').style.display = isVip ? '' : 'none';
  show('gameScreen');
  document.getElementById('gameOverOverlay').classList.remove('active');
  document.getElementById('pauseOverlay').classList.remove('active');

  const status = roomMeta.status;
  if (status === 'countdown' && !countdownActive) {
    countdownActive = true;
    countdown(3, () => {
      countdownActive = false;
      if (isVip) currentRoom.ref.child('status').set('playing');
      gameRunning = true; lastTime = performance.now(); orbSpT = 0;
      requestAnimationFrame(gameLoop);
    });
  } else if (status === 'playing') {
    gameRunning = true; lastTime = performance.now(); orbSpT = 0;
    requestAnimationFrame(gameLoop);
  } else if (status === 'paused') {
    document.getElementById('pauseOverlay').classList.add('active');
    render();
  } else if (status === 'gameover') {
    gameOver = true; showGameOverUI(); render();
  }
}

function backToLobby() {
  gameRunning = false; gameOver = false; countdownActive = false;
  showLobby();
}

// ═══════════════════════════════════════════════════
// HUD
// ═══════════════════════════════════════════════════
function buildHUD() {
  const hud = document.getElementById('hud');
  let h = '';
  for (const p of allPlayers) {
    const w = W[p.type] || { emoji: '?', grad: '#555' };
    h += `<div class="hud-p" id="hud-${p.slot}"><div class="hud-icon">${w.emoji}</div>
      <div class="hud-bars"><div class="hud-nm" id="nm-${p.slot}">P${p.slot + 1}</div>
      <div class="hp-bg"><div class="hp-fill" id="hp-${p.slot}" style="width:100%;background:${w.grad}"></div></div></div>
      <div class="hud-ammo" id="am-${p.slot}">×0</div></div>`;
  }
  hud.innerHTML = h;
  for (const p of allPlayers) {
    getName(p.pcid).then(n => {
      const el = document.getElementById('nm-' + p.slot);
      if (el) el.textContent = (p === myPlayer ? 'YOU' : n);
    });
  }
}

function updateHUD() {
  for (const p of allPlayers) {
    const hpEl = document.getElementById('hp-' + p.slot);
    const amEl = document.getElementById('am-' + p.slot);
    if (hpEl) hpEl.style.width = (p.hp / MHP * 100) + '%';
    if (amEl) amEl.textContent = '×' + p.ammo;
    const hudEl = document.getElementById('hud-' + p.slot);
    if (hudEl) hudEl.style.opacity = p.alive ? '1' : '.3';
  }
  if (myPlayer) {
    const ab = document.getElementById('atkBtn');
    ab.classList.toggle('cooldown', myPlayer.state === 'attacking' || myPlayer.acd > 0);
    ab.classList.toggle('no-ammo', myPlayer.ammo <= 0 && myPlayer.state !== 'attacking');
  }
}

// ═══════════════════════════════════════════════════
// COUNTDOWN
// ═══════════════════════════════════════════════════
function countdown(n, cb) {
  const el = document.getElementById('countdown'), txt = document.getElementById('countdownText');
  el.classList.add('active');
  let c = n;
  (function tick() {
    if (c > 0) {
      txt.textContent = c; txt.style.animation = 'none'; void txt.offsetHeight;
      txt.style.animation = 'cp .5s ease-out'; sfx.cnt(); c--; setTimeout(tick, 800);
    } else {
      txt.textContent = 'FIGHT!'; txt.style.animation = 'none'; void txt.offsetHeight;
      txt.style.animation = 'cp .5s ease-out'; sfx.go();
      setTimeout(() => { el.classList.remove('active'); cb(); }, 600);
    }
  })();
}

// ═══════════════════════════════════════════════════
// GAME LOOP
// ═══════════════════════════════════════════════════
function gameLoop(ts) {
  if (!gameRunning) return;
  const dt = Math.min(ts - lastTime, 50);
  lastTime = ts;

  // Update local player
  if (myPlayer && myPlayer.alive) {
    const hits = myPlayer.update(dt, allPlayers);
    for (const h of hits) {
      currentRoom.ref.child('hits/' + h.tgt).push({
        dmg: h.dmg, aType: myPlayer.type, dir: myPlayer.dir, ts: Date.now()
      });
      const o = atkOff(myPlayer.dir);
      spawnFx(myPlayer.type, myPlayer.x + o[0], myPlayer.y + o[1], myPlayer.dir);
    }
  }

  // Dead reckon remote players
  for (const p of allPlayers) {
    if (p !== myPlayer) p.predict(dt);
  }

  updateFx(dt);

  // Tile animation
  waterT += dt; if (waterT > 500) { waterF = 1 - waterF; waterT = 0; }
  orbT += dt; if (orbT > 400) { orbF = 1 - orbF; orbT = 0; }

  // VIP spawns orbs
  if (isVip) {
    orbSpT += dt;
    if (orbSpT >= ORBMS) {
      orbSpT = 0;
      if (orbs.length < MORBS) {
        const t = GRASS[Math.floor(Math.random() * GRASS.length)];
        const els = ['fire', 'earth', 'water', 'air'];
        orbs.push({ id: orbId++, element: els[Math.floor(Math.random() * 4)], x: t.tx * T + 16, y: t.ty * T + 16 });
        writeOrbs();
      }
    }
  }

  // Orb collection
  if (myPlayer && myPlayer.alive) {
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      const dx = myPlayer.x - orb.x, dy = myPlayer.y - orb.y;
      if (Math.sqrt(dx * dx + dy * dy) < ODIST) {
        const match = (orb.element + '_none') === myPlayer.type;
        if (match) { myPlayer.ammo = Math.min(MAMMO, myPlayer.ammo + 1); sfx.orb(); } else sfx.brk();
        orbs.splice(i, 1);
        writeOrbs();
        break;
      }
    }
  }

  // Sync to Firebase
  syncT += dt;
  if (syncT >= SYNC) { syncT = 0; if (myPlayer) writeMyState(); }

  updateHUD();

  // Check game over
  const alive = allPlayers.filter(p => p.alive);
  if (!gameOver && allPlayers.length >= 2 && alive.length <= 1) {
    gameOver = true; gameRunning = false; sfx.ko();
    const winner = alive[0] || null;
    if (isVip) {
      currentRoom.ref.child('gameData/winner').set(winner ? winner.pcid : null);
      currentRoom.ref.child('status').set('gameover');
    }
    setTimeout(() => showGameOverUI(winner), 600);
  }

  render();
  if (gameRunning) requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════════════════
// GAME OVER
// ═══════════════════════════════════════════════════
async function showGameOverUI(winner) {
  if (!winner) {
    const ws = await currentRoom.ref.child('gameData/winner').once('value');
    const wpcid = ws.val();
    if (wpcid) winner = allPlayers.find(p => p.pcid === wpcid);
  }
  const wt = document.getElementById('winnerText');
  if (winner) {
    const w = W[winner.type];
    wt.innerHTML = `${w.emoji} ${w.label} WINS! ${w.emoji}`;
    wt.style.color = w.color;
  } else { wt.innerHTML = 'DRAW!'; wt.style.color = '#888'; }
  document.getElementById('goVipBtns').style.display = isVip ? '' : 'none';
  document.getElementById('goVoteBtns').style.display = isVip ? 'none' : '';
  document.getElementById('gameOverOverlay').classList.add('active');
  render();
}
