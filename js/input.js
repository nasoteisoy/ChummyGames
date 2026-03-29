// ═══════════════════════════════════════════════════
// INPUT — KEYBOARD
// ═══════════════════════════════════════════════════
const keys = {};
document.addEventListener('keydown', e => {
  iA(); keys[e.key] = true; uK();
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); doAtk(); }
  if (e.key === 'Shift') doGrd();
});
document.addEventListener('keyup', e => {
  keys[e.key] = false; uK();
  if (e.key === 'Shift') stopGrd();
});
function uK() {
  if (!myPlayer) return;
  myPlayer.mv.up    = keys['ArrowUp']   || keys['w'] || keys['W'];
  myPlayer.mv.down  = keys['ArrowDown'] || keys['s'] || keys['S'];
  myPlayer.mv.left  = keys['ArrowLeft'] || keys['a'] || keys['A'];
  myPlayer.mv.right = keys['ArrowRight']|| keys['d'] || keys['D'];
}

// ═══════════════════════════════════════════════════
// INPUT — VIRTUAL JOYSTICK
// ═══════════════════════════════════════════════════
const joyArea = document.getElementById('joystickArea');
const joyKnob = document.getElementById('joystickKnob');
let joyActive = false, joyTouchId = null;
const DEAD_ZONE = 0.15;

function joyUpdate(cx, cy) {
  const rect = joyArea.getBoundingClientRect();
  const ox = cx - rect.left - rect.width / 2;
  const oy = cy - rect.top - rect.height / 2;
  const maxR = rect.width / 2 - 4;
  let dist = Math.sqrt(ox * ox + oy * oy);
  let nx = ox, ny = oy;
  if (dist > maxR) { nx = ox / dist * maxR; ny = oy / dist * maxR; dist = maxR; }
  joyKnob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;

  if (!myPlayer) return;
  const frac = dist / maxR;
  if (frac < DEAD_ZONE) {
    myPlayer.mv.up = false; myPlayer.mv.down = false;
    myPlayer.mv.left = false; myPlayer.mv.right = false;
    return;
  }
  const angle = Math.atan2(oy, ox);
  myPlayer.mv.right = angle > -Math.PI / 3 && angle < Math.PI / 3;
  myPlayer.mv.left  = angle > Math.PI * 2 / 3 || angle < -Math.PI * 2 / 3;
  myPlayer.mv.down  = angle > Math.PI / 6 && angle < Math.PI * 5 / 6;
  myPlayer.mv.up    = angle < -Math.PI / 6 && angle > -Math.PI * 5 / 6;
}

function joyReset() {
  joyActive = false; joyTouchId = null;
  joyKnob.style.transform = 'translate(-50%,-50%)';
  if (myPlayer) { myPlayer.mv.up = false; myPlayer.mv.down = false; myPlayer.mv.left = false; myPlayer.mv.right = false; }
}

joyArea.addEventListener('touchstart', e => {
  e.preventDefault(); iA();
  if (joyTouchId !== null) return;
  const t = e.changedTouches[0];
  joyTouchId = t.identifier; joyActive = true;
  joyUpdate(t.clientX, t.clientY);
});
joyArea.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches)
    if (t.identifier === joyTouchId) { joyUpdate(t.clientX, t.clientY); break; }
});
joyArea.addEventListener('touchend', e => {
  for (const t of e.changedTouches)
    if (t.identifier === joyTouchId) { joyReset(); break; }
});
joyArea.addEventListener('touchcancel', () => joyReset());

// Mouse fallback for joystick
let joyMouse = false;
joyArea.addEventListener('mousedown', e => { e.preventDefault(); iA(); joyMouse = true; joyUpdate(e.clientX, e.clientY); });
document.addEventListener('mousemove', e => { if (joyMouse) joyUpdate(e.clientX, e.clientY); });
document.addEventListener('mouseup', () => { if (joyMouse) { joyMouse = false; joyReset(); } });

// ═══════════════════════════════════════════════════
// INPUT — ACTION BUTTONS
// ═══════════════════════════════════════════════════
const atkEl = document.getElementById('atkBtn');
atkEl.addEventListener('touchstart', e => { e.preventDefault(); iA(); doAtk(); atkEl.classList.add('pressed'); });
atkEl.addEventListener('touchend', e => { e.preventDefault(); atkEl.classList.remove('pressed'); });
atkEl.addEventListener('mousedown', e => { e.preventDefault(); iA(); doAtk(); });

const grdEl = document.getElementById('grdBtn');
grdEl.addEventListener('touchstart', e => { e.preventDefault(); iA(); doGrd(); grdEl.classList.add('pressed'); });
grdEl.addEventListener('touchend', e => { e.preventDefault(); stopGrd(); grdEl.classList.remove('pressed'); });
grdEl.addEventListener('touchcancel', () => { stopGrd(); grdEl.classList.remove('pressed'); });
grdEl.addEventListener('mousedown', e => { e.preventDefault(); iA(); doGrd(); });
grdEl.addEventListener('mouseup', () => stopGrd());
grdEl.addEventListener('mouseleave', () => stopGrd());

function doAtk() {
  if (!myPlayer || !gameRunning || gameOver || !myPlayer.alive) return;
  if (myPlayer.startAtk()) {
    const o = atkOff(myPlayer.dir);
    spawnFx(myPlayer.type, myPlayer.x + o[0], myPlayer.y + o[1], myPlayer.dir);
  }
}
function doGrd() { if (!myPlayer || !gameRunning || gameOver || !myPlayer.alive) return; myPlayer.startGrd(); }
function stopGrd() { if (myPlayer) myPlayer.stopGrd(); }
