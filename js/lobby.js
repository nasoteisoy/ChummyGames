// ═══════════════════════════════════════════════════
// LOGIN / NAME
// ═══════════════════════════════════════════════════
async function saveName() {
  const n = document.getElementById('nameInput').value.trim();
  if (!n || n.length < 1) { document.getElementById('nameError').textContent = 'Enter a name'; return; }
  myName = n; nameCache[myPCID] = n;
  await R('players/' + myPCID).set({ name: n, createdAt: Date.now() });
  showMenu();
}

function changeName() {
  document.getElementById('nameInput').value = myName;
  show('loginScreen');
  setTimeout(() => document.getElementById('nameInput').focus(), 300);
}

// ═══════════════════════════════════════════════════
// ROOM BROWSER
// ═══════════════════════════════════════════════════
let roomListRef = null;
function showMenu() {
  document.getElementById('welcomeName').textContent = myName;
  show('menuScreen');
  if (roomListRef) roomListRef.off();
  roomListRef = R('rooms');
  roomListRef.on('value', snap => {
    const list = document.getElementById('roomList');
    const rooms = snap.val() || {};
    const keys = Object.keys(rooms);
    if (!keys.length) { list.innerHTML = '<div class="status-text">No rooms yet</div>'; return; }
    let html = '';
    for (const id of keys) {
      const rm = rooms[id];
      if (rm.status === 'deleted') continue;
      const slots = rm.slots || {};
      const pCount = Object.values(slots).filter(s => s && s.pcid).length;
      const isMine = Object.values(slots).some(s => s && s.pcid === myPCID);
      const st = rm.status || 'lobby';
      html += `<div class="room-card ${isMine ? 'my-room' : ''}" onclick="joinRoomById('${id}')">
        <div class="rc-name">${rm.name || id}</div>
        <div class="rc-info">${pCount}/4</div>
        <div class="rc-status ${st}">${st.toUpperCase()}</div>
        ${isMine ? '<div class="rc-info" style="color:#ff8800">★</div>' : ''}
      </div>`;
    }
    list.innerHTML = html || '<div class="status-text">No rooms</div>';
  });
}

async function createRoom() {
  iA();
  const id = Array.from({ length: 8 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
  ).join('');
  await R('rooms/' + id).set({
    name: 'Room ' + id.substring(0, 4), status: 'lobby', vip: myPCID, createdAt: Date.now(),
    slots: { 0: { pcid: myPCID, warrior: null, connected: true, lastSeen: Date.now() } }
  });
  joinRoomById(id);
}

// ═══════════════════════════════════════════════════
// JOIN ROOM
// ═══════════════════════════════════════════════════
async function joinRoomById(id, tvMode) {
  iA();
  if (roomListRef) { roomListRef.off(); roomListRef = null; }
  cleanupListeners();
  currentRoom = { id, ref: R('rooms/' + id) };

  const snap = await currentRoom.ref.once('value');
  if (!snap.exists()) { alert('Room not found'); showMenu(); return; }
  roomMeta = snap.val();

  if (tvMode || isTv) {
    setupListeners();
    const st = roomMeta.status;
    if (st === 'playing' || st === 'paused' || st === 'countdown') enterGame(true);
    else { show('lobbyScreen'); document.getElementById('lobbyRoomName').textContent = roomMeta.name || id; }
    return;
  }

  const slots = roomMeta.slots || {};
  let mySlot = null;
  for (const [si, sl] of Object.entries(slots)) if (sl && sl.pcid === myPCID) { mySlot = parseInt(si); break; }
  if (mySlot === null) {
    for (let i = 0; i < 4; i++) { if (!slots[i] || !slots[i].pcid) { mySlot = i; break; } }
    if (mySlot === null) { alert('Room is full'); showMenu(); return; }
    await currentRoom.ref.child('slots/' + mySlot).set({
      pcid: myPCID, warrior: null, connected: true, lastSeen: Date.now() });
  } else {
    await currentRoom.ref.child('slots/' + mySlot + '/connected').set(true);
    await currentRoom.ref.child('slots/' + mySlot + '/lastSeen').set(Date.now());
  }
  currentRoom.ref.child('slots/' + mySlot + '/connected').onDisconnect().set(false);

  setupListeners();

  const status = roomMeta.status;
  if (status === 'playing' || status === 'countdown' || status === 'paused') enterGame(false);
  else showLobby();
}

// ═══════════════════════════════════════════════════
// LOBBY
// ═══════════════════════════════════════════════════
function showLobby() {
  show('lobbyScreen');
  document.getElementById('lobbyRoomName').textContent = roomMeta?.name || currentRoom?.id || '?';
  renderLobby();
}

async function renderLobby() {
  if (!roomMeta) return;
  const slots = roomMeta.slots || {};
  const taken = Object.values(slots).filter(s => s && s.warrior && s.warrior !== 'spectator').map(s => s.warrior);

  const pcids = Object.values(slots).filter(s => s && s.pcid).map(s => s.pcid);
  const names = {};
  await Promise.all(pcids.map(async p => { names[p] = await getName(p); }));

  let html = '';
  for (let i = 0; i < 4; i++) {
    const sl = slots[i];
    const hasPcid = sl && sl.pcid;
    const isMe = hasPcid && sl.pcid === myPCID;
    const isSlotVip = hasPcid && sl.pcid === roomMeta.vip;
    const connected = sl && sl.connected;

    html += `<div class="lobby-slot ${isMe ? 'me' : ''}">`;
    html += `<div class="slot-label ${isSlotVip ? 'vip' : ''}">${isSlotVip ? '★VIP' : 'P' + (i + 1)}</div>`;
    if (hasPcid) {
      html += `<div class="lobby-picks">`;
      for (const wk of WK) {
        const w = W[wk];
        const sel = sl.warrior === wk;
        const tak = !sel && taken.includes(wk);
        const canClick = isMe && !tak;
        let cls = 'pick-btn';
        if (sel) cls += ' selected'; if (tak) cls += ' taken'; if (!canClick && !sel) cls += ' disabled';
        const oc = canClick || (sel && isMe) ? ` onclick="pickW('${sel ? '' : wk}',${i})"` : '';
        html += `<button class="${cls}"${oc} title="${w.label}">${w.emoji}</button>`;
      }
      const specSel = sl.warrior === 'spectator';
      let specCls = 'pick-btn' + (specSel ? ' selected' : '');
      if (!isMe && !specSel) specCls += ' disabled';
      const specOc = isMe ? ` onclick="pickW('${specSel ? '' : 'spectator'}',${i})"` : '';
      html += `<button class="${specCls}"${specOc} title="WATCH">👁️</button>`;
      html += `</div>`;
      html += `<div class="slot-name ${connected ? 'connected' : ''}">${names[sl.pcid] || '???'}${connected ? '' : ' (away)'}</div>`;
    } else {
      html += `<div class="slot-empty">Empty</div>`;
    }
    html += `</div>`;
  }
  document.getElementById('slotList').innerHTML = html;
  document.getElementById('vipControls').style.display = isVip && !isTv ? 'flex' : 'none';
}

async function pickW(warrior, slot) {
  if (!currentRoom) return;
  await currentRoom.ref.child('slots/' + slot + '/warrior').set(warrior || null);
}
