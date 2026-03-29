// ═══════════════════════════════════════════════════
// TV LINK
// ═══════════════════════════════════════════════════
function copyTvLink() {
  if (!currentRoom) return;
  const url = location.origin + location.pathname + '?tv=' + currentRoom.id;
  navigator.clipboard.writeText(url).then(() => alert('TV link copied!')).catch(() => {
    prompt('Copy this link:', url);
  });
}

// ═══════════════════════════════════════════════════
// SCROLL PREVENTION
// ═══════════════════════════════════════════════════
document.addEventListener('touchmove', e => {
  if (document.querySelector('#gameScreen.active')) e.preventDefault();
}, { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());

// ═══════════════════════════════════════════════════
// KEEPALIVE
// ═══════════════════════════════════════════════════
setInterval(() => {
  if (!currentRoom || !roomMeta) return;
  const slots = roomMeta.slots || {};
  for (const [i, sl] of Object.entries(slots)) {
    if (sl && sl.pcid === myPCID) {
      currentRoom.ref.child('slots/' + i + '/lastSeen').set(Date.now());
      currentRoom.ref.child('slots/' + i + '/connected').set(true);
      break;
    }
  }
}, 10000);

// ═══════════════════════════════════════════════════
// INIT / BOOT
// ═══════════════════════════════════════════════════
async function init() {
  const params = new URLSearchParams(location.search);
  if (params.has('admin')) { isAdmin = true; show('adminScreen'); loadAdmin(); return; }
  if (params.has('tv')) {
    isTv = true; document.body.classList.add('tv-mode');
    const rid = params.get('tv');
    if (rid) { joinRoomById(rid, true); return; }
  }
  const snap = await R('players/' + myPCID).once('value');
  if (snap.exists()) { myName = snap.val().name; nameCache[myPCID] = myName; showMenu(); }
  else { show('loginScreen'); setTimeout(() => document.getElementById('nameInput').focus(), 300); }
}

init();
