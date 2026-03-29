// ═══════════════════════════════════════════════════
// VIP CONTROLS
// ═══════════════════════════════════════════════════
async function vipStartGame() {
  if (!isVip || !currentRoom) return;
  const initOrbs = []; let oid = 0;
  for (let i = 0; i < 3; i++) {
    const t = GRASS[Math.floor(Math.random() * GRASS.length)];
    const els = ['fire', 'earth', 'water', 'air'];
    initOrbs.push({ id: oid++, element: els[Math.floor(Math.random() * 4)], x: t.tx * T + 16, y: t.ty * T + 16 });
  }
  const slots = roomMeta.slots || {};
  const gd = { playerStates: {}, orbs: JSON.stringify(initOrbs), orbCounter: oid, winner: null };
  let si = 0;
  for (let i = 0; i < 4; i++) {
    const sl = slots[i];
    if (!sl || !sl.pcid || !sl.warrior || sl.warrior === 'spectator') continue;
    const sp = SPAWNS[si % 4];
    gd.playerStates[sl.pcid] = {
      x: sp.x, y: sp.y, dir: sp.x < CW / 2 ? 'right' : 'left',
      state: 'idle', hp: MHP, ammo: 0, wf: 0, at: 0, ft: 0,
      alive: true, type: sl.warrior, slot: i, pcid: sl.pcid
    };
    si++;
  }
  await currentRoom.ref.child('gameData').set(gd);
  await currentRoom.ref.child('hits').remove();
  await currentRoom.ref.child('status').set('countdown');
  await currentRoom.ref.child('votes').remove();
}

async function vipDeleteRoom() {
  if (!isVip || !currentRoom) return;
  if (!confirm('Delete this room?')) return;
  await currentRoom.ref.remove();
  cleanupListeners(); currentRoom = null; roomMeta = null; showMenu();
}

async function vipResetFromGame() {
  if (!isVip || !currentRoom) return;
  gameRunning = false; gameOver = false; countdownActive = false;
  await currentRoom.ref.child('gameData').remove();
  await currentRoom.ref.child('hits').remove();
  await currentRoom.ref.child('votes').remove();
  const slots = roomMeta.slots || {};
  const updates = {};
  for (const i of Object.keys(slots)) updates['slots/' + i + '/warrior'] = null;
  updates['status'] = 'lobby';
  await currentRoom.ref.update(updates);
}

async function voteReset(type) {
  if (!currentRoom) return;
  await currentRoom.ref.child('votes/' + myPCID).set(type);
  if (isVip) {
    const vSnap = await currentRoom.ref.child('votes').once('value');
    const votes = vSnap.val() || {};
    const slots = roomMeta.slots || {};
    const activePcids = Object.values(slots).filter(s => s && s.pcid && s.connected).map(s => s.pcid);
    const voteCount = activePcids.filter(p => votes[p]).length;
    if (voteCount < activePcids.length) return;
    const sameVotes = activePcids.filter(p => votes[p] === 'same').length;
    if (sameVotes > activePcids.length / 2) {
      await currentRoom.ref.child('votes').remove();
      vipStartGame();
    } else {
      vipResetFromGame();
    }
  }
}

// ═══════════════════════════════════════════════════
// LEAVE / EXIT
// ═══════════════════════════════════════════════════
async function leaveRoom() {
  if (!currentRoom) return;
  const slots = roomMeta?.slots || {};
  let mySlot = null;
  for (const [si, sl] of Object.entries(slots)) if (sl && sl.pcid === myPCID) mySlot = parseInt(si);
  if (mySlot === null) { cleanupListeners(); currentRoom = null; showMenu(); return; }
  await currentRoom.ref.child('slots/' + mySlot).set(null);
  if (roomMeta.status === 'playing') await currentRoom.ref.child('status').set('paused');
  if (isVip) {
    const remaining = Object.entries(slots).filter(([i, s]) => s && s.pcid && s.pcid !== myPCID && s.connected);
    if (remaining.length > 0) await currentRoom.ref.child('vip').set(remaining[0][1].pcid);
    else await currentRoom.ref.remove();
  } else {
    const remaining = Object.values(slots).filter(s => s && s.pcid && s.pcid !== myPCID);
    if (remaining.length === 0) await currentRoom.ref.remove();
  }
  cleanupListeners(); currentRoom = null; roomMeta = null;
  gameRunning = false; gameOver = false; countdownActive = false; allPlayers = []; myPlayer = null;
  showMenu();
}
