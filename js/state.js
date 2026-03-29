// ═══════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════
let currentRoom = null;
let roomMeta = null;
let allPlayers = [];
let myPlayer = null;
let orbs = [], orbId = 0, orbSpT = 0;
let gameRunning = false, gameOver = false;
let lastTime = 0, syncT = 0;
let waterT = 0, waterF = 0, orbT = 0, orbF = 0;
let isVip = false, isTv = false, isAdmin = false;
let activeListeners = [];
let countdownActive = false;
let currentScreen = '';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ═══════════════════════════════════════════════════
// SCREEN MANAGEMENT
// ═══════════════════════════════════════════════════
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  currentScreen = id;
}
