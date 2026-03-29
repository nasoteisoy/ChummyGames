// ═══════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════
function loadAdmin() {
  R('rooms').on('value', snap => {
    const rooms = snap.val() || {};
    let html = '<h3>ROOMS (' + Object.keys(rooms).length + ')</h3>';
    for (const [id, rm] of Object.entries(rooms)) {
      const slots = rm.slots || {};
      const pCount = Object.values(slots).filter(s => s && s.pcid).length;
      html += `<div class="admin-row">
        <input id="rn-${id}" value="${rm.name || id}">
        <span class="admin-id">${id}</span>
        <span>${rm.status || '?'} (${pCount}p)</span>
        <button class="btn btn-sm btn-go" onclick="adminRenameRoom('${id}')">Save</button>
        <button class="btn btn-sm btn-danger" onclick="adminDelRoom('${id}')">Del</button>
      </div>`;
    }
    document.getElementById('adminRooms').innerHTML = html;
  });
  R('players').on('value', snap => {
    const players = snap.val() || {};
    let html = '<h3>PLAYERS (' + Object.keys(players).length + ')</h3>';
    for (const [pcid, pl] of Object.entries(players)) {
      html += `<div class="admin-row">
        <input id="pn-${pcid}" value="${pl.name || '???'}">
        <span class="admin-id">${pcid}</span>
        <button class="btn btn-sm btn-go" onclick="adminRenamePl('${pcid}')">Save</button>
        <button class="btn btn-sm btn-danger" onclick="adminDelPl('${pcid}')">Del</button>
      </div>`;
    }
    document.getElementById('adminPlayers').innerHTML = html;
  });
}

async function adminRenameRoom(id) {
  const n = document.getElementById('rn-' + id).value.trim();
  if (n) await R('rooms/' + id + '/name').set(n);
}
async function adminDelRoom(id) {
  if (confirm('Delete room ' + id + '?')) await R('rooms/' + id).remove();
}
async function adminRenamePl(pcid) {
  const n = document.getElementById('pn-' + pcid).value.trim();
  if (n) { await R('players/' + pcid + '/name').set(n); nameCache[pcid] = n; }
}
async function adminDelPl(pcid) {
  if (confirm('Delete player ' + pcid + '?')) { await R('players/' + pcid).remove(); delete nameCache[pcid]; }
}
async function adminCreatePcid() {
  const name = prompt('Player name:'); if (!name) return;
  const pcid = Array.from({ length: 12 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  ).join('');
  await R('players/' + pcid).set({ name, createdAt: Date.now() });
  nameCache[pcid] = name;
  alert('Created PCID: ' + pcid);
}
