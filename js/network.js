// ═══════════════════════════════════════════════════
// FIREBASE LISTENERS (split for performance)
// ═══════════════════════════════════════════════════
function setupListeners() {
  // 1) Room meta: status, vip, slots, name, votes (NOT gameData)
  const metaRef = currentRoom.ref;
  const metaFn = metaRef.on('value', snap => {
    if (!snap.exists()) { cleanupListeners(); currentRoom = null; roomMeta = null; showMenu(); return; }
    const d = snap.val();
    const oldStatus = roomMeta?.status;
    roomMeta = { status: d.status, vip: d.vip, slots: d.slots, name: d.name,
      createdAt: d.createdAt, votes: d.votes };
    isVip = d.vip === myPCID;

    if (currentScreen === 'lobbyScreen') {
      renderLobby();
      if (d.status === 'countdown' && oldStatus !== 'countdown') enterGame(isTv);
    }
    if (currentScreen === 'gameScreen') {
      if (d.status === 'lobby') {
        gameRunning = false; gameOver = false; countdownActive = false;
        allPlayers = []; myPlayer = null; showLobby(); return;
      }
      if (d.status === 'paused' && gameRunning) {
        gameRunning = false;
        document.getElementById('pauseOverlay').classList.add('active');
      }
      if (d.status === 'playing' && !gameRunning && !gameOver && !countdownActive) {
        document.getElementById('pauseOverlay').classList.remove('active');
        gameRunning = true; lastTime = performance.now(); requestAnimationFrame(gameLoop);
      }
      if (d.status === 'gameover' && !gameOver) {
        gameOver = true; gameRunning = false; sfx.ko();
        setTimeout(() => showGameOverUI(), 600);
      }
      document.getElementById('resetGameBtn').style.display = isVip ? '' : 'none';
    }
  });
  activeListeners.push({ ref: metaRef, ev: 'value', fn: metaFn });

  // 2) Orbs
  const orbRef = currentRoom.ref.child('gameData/orbs');
  const orbFn = orbRef.on('value', snap => {
    if (!snap.exists()) { orbs = []; return; }
    try { orbs = JSON.parse(snap.val()); } catch (e) { orbs = []; }
  });
  activeListeners.push({ ref: orbRef, ev: 'value', fn: orbFn });

  const orbCRef = currentRoom.ref.child('gameData/orbCounter');
  const orbCFn = orbCRef.on('value', snap => { if (snap.exists()) orbId = snap.val(); });
  activeListeners.push({ ref: orbCRef, ev: 'value', fn: orbCFn });

  // 3) Hit listener (for my player)
  if (!isTv) {
    const hitRef = currentRoom.ref.child('hits/' + myPCID);
    const hitFn = hitRef.on('child_added', snap => {
      const h = snap.val(); if (!h) return;
      if (myPlayer && myPlayer.alive) {
        myPlayer.takeDmg(h.dmg);
        const fl = document.getElementById('damageFlash');
        fl.classList.add('hit'); setTimeout(() => fl.classList.remove('hit'), 150);
        spawnFx(h.aType || 'fire_none', myPlayer.x, myPlayer.y - 20, h.dir || 'right');
        writeMyState();
      }
      snap.ref.remove();
    });
    activeListeners.push({ ref: hitRef, ev: 'child_added', fn: hitFn });
  }
}

function setupPlayerListeners() {
  for (const p of allPlayers) {
    if (p === myPlayer) continue;
    const ref = currentRoom.ref.child('gameData/playerStates/' + p.pcid);
    const fn = ref.on('value', snap => {
      const s = snap.val(); if (s) p.applyRemote(s);
    });
    activeListeners.push({ ref, ev: 'value', fn });
  }
}

function cleanupListeners() {
  for (const l of activeListeners) l.ref.off(l.ev, l.fn);
  activeListeners = [];
}

// ═══════════════════════════════════════════════════
// FIREBASE WRITES (throttled / dirty-checked)
// ═══════════════════════════════════════════════════
let lastWrittenState = null;
function writeMyState() {
  if (!currentRoom || !myPlayer) return;
  const s = myPlayer.ser();
  const key = JSON.stringify(s);
  if (key === lastWrittenState) return;
  lastWrittenState = key;
  currentRoom.ref.child('gameData/playerStates/' + myPCID).set(s);
}

function writeOrbs() {
  if (!currentRoom) return;
  currentRoom.ref.child('gameData/orbs').set(JSON.stringify(orbs));
  currentRoom.ref.child('gameData/orbCounter').set(orbId);
}
