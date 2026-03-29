// ═══════════════════════════════════════════════════
// FIREBASE + PCID
// ═══════════════════════════════════════════════════
firebase.initializeApp({
  apiKey:"AIzaSyDVbt_8GuRuHJRPAN7jFXbs_lJUfUHNxHE",
  authDomain:"chummy-games.firebaseapp.com",
  databaseURL:"https://chummy-games-default-rtdb.firebaseio.com",
  projectId:"chummy-games",
  storageBucket:"chummy-games.firebasestorage.app",
  messagingSenderId:"869241598273",
  appId:"1:869241598273:web:d97492b7308f785c37f1c0"
});
const db = firebase.database();
const R = p => db.ref('showdown/' + p);

function getOrCreatePCID() {
  const k = 'ChummyGames-PC-ID';
  let id = localStorage.getItem(k);
  if (!id || id.length !== 12) {
    id = Array.from({ length: 12 }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
    ).join('');
    localStorage.setItem(k, id);
  }
  return id;
}
const myPCID = getOrCreatePCID();
let myName = '';

// ═══════════════════════════════════════════════════
// NAME CACHE
// ═══════════════════════════════════════════════════
const nameCache = {};
async function getName(pcid) {
  if (nameCache[pcid]) return nameCache[pcid];
  const s = await R('players/' + pcid + '/name').once('value');
  const n = s.val() || '???';
  nameCache[pcid] = n;
  return n;
}

// ═══════════════════════════════════════════════════
// WARRIOR + GAME CONFIG
// ═══════════════════════════════════════════════════
const W = {
  fire_none:  { label: 'FIRE',  emoji: '🔥', color: '#ff4400', grad: 'linear-gradient(90deg,#cc2200,#ff6600)' },
  earth_none: { label: 'EARTH', emoji: '🪨', color: '#8B7355', grad: 'linear-gradient(90deg,#5a4a2a,#8B7355)' },
  water_none: { label: 'WATER', emoji: '💧', color: '#2288dd', grad: 'linear-gradient(90deg,#1155aa,#2288dd)' },
  air_none:   { label: 'AIR',   emoji: '🌪️', color: '#88bb88', grad: 'linear-gradient(90deg,#557755,#88bb88)' },
};
const WK = Object.keys(W);

const FX = {
  fire_none:  { spr: i => `firepunch_${i + 1}`, fr: 5, base: 'right', ft: 80 },
  earth_none: { spr: () => 'rock_sprite',        fr: 1, base: null,    ft: 400 },
  water_none: { spr: i => `waterslice_${i + 1}`, fr: 2, base: 'right', ft: 100 },
  air_none:   { spr: i => `tornado_${i + 1}`,    fr: 3, base: 'right', ft: 100 },
};

const T = 32, MW = 10, MH = 8, CW = MW * T, CH = MH * T;
const SPD = 1.8, GSPD = 0.8, MHP = 100;
const DMG = 20, GDMG = 7, ATKR = 44, ATKW = 250, ATKD = 500, ATKCD = 800;
const SYNC = 66, MAMMO = 5, ORBMS = 1200, MORBS = 12, ODIST = 18;
const CORRECTION = 0.15;
const SPAWNS = [{ x: 64, y: 90 }, { x: 256, y: 90 }, { x: 64, y: 175 }, { x: 256, y: 175 }];

const MAP = [
  [1,1,1,1,1,1,1,1,1,1], [1,0,0,0,0,0,0,0,0,1], [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,2,0,0,0,0,1], [1,0,0,0,0,0,0,0,0,1], [1,0,0,0,0,2,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1], [1,1,1,1,1,1,1,1,1,1]
];

const GRASS = [];
for (let r = 0; r < MH; r++)
  for (let c = 0; c < MW; c++)
    if (MAP[r][c] === 0) GRASS.push({ tx: c, ty: r });
