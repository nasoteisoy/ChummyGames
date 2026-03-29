// ═══════════════════════════════════════════════════
// SPRITES
// ═══════════════════════════════════════════════════
const sprites = {};
let sL = 0, sT = 0;

function ld(k, p) {
  sT++;
  const i = new Image();
  i.onload = () => sL++;
  i.onerror = () => { console.warn('Miss:', p); sL++; };
  i.src = p;
  sprites[k] = i;
}

function loadAllSprites() {
  for (const w of WK)
    for (const d of ['down', 'up', 'left', 'right'])
      for (const a of ['idle', 'walk1', 'walk2', 'attackstand', 'guardpose'])
        ld(`${w}_${d}_${a}`, `sprites/warrior/${w}/${d}_${a}.png`);

  for (let i = 1; i <= 5; i++) ld(`firepunch_${i}`, `sprites/attack/firepunch/frame${i}.png`);
  ld('rock_sprite', 'sprites/groundelements/rock/frame1.png');
  for (let i = 1; i <= 2; i++) ld(`waterslice_${i}`, `sprites/attack/waterslice/frame${i}.png`);
  for (let i = 1; i <= 3; i++) ld(`tornado_${i}`, `sprites/attack/tornado/frame${i}.png`);

  ld('grass', 'sprites/floortiles/grass/frame1.png');
  ld('wall', 'sprites/obstacle/graywall/frame1.png');
  ld('water1', 'sprites/floortiles/water/frame1.png');
  ld('water2', 'sprites/floortiles/water/frame2.png');

  for (const el of ['fire', 'earth', 'water', 'air']) {
    ld(`${el}orb1`, `sprites/item/${el}orb/frame1.png`);
    ld(`${el}orb2`, `sprites/item/${el}orb/frame2.png`);
  }
}

loadAllSprites();
