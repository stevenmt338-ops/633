import Phaser from 'phaser';

/**
 * Procedurally generates all game textures and sprites using HTML5 Canvas.
 * This guarantees 100% reliable, instant loading with dark Victorian horror aesthetics.
 */
export function generateProceduralTextures(scene: Phaser.Scene) {
  const textures = scene.textures;

  // 1. Wood Floor (Victorian Mansion Ground Floor)
  if (!textures.exists('floor_wood')) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#221914';
    ctx.fillRect(0, 0, 128, 128);

    // Planks
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = 3;
    for (let y = 0; y < 128; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(128, y);
      ctx.stroke();

      // Wood grain lines
      ctx.strokeStyle = '#2b2019';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, y + 6 + i * 6);
        ctx.bezierCurveTo(40, y + 4 + i * 6, 80, y + 8 + i * 6, 128, y + 5 + i * 6);
        ctx.stroke();
      }
      ctx.strokeStyle = '#120d0a';
      ctx.lineWidth = 3;

      // Vertical plank seams
      const offset = (y / 32) % 2 === 0 ? 64 : 32;
      ctx.beginPath();
      ctx.moveTo(offset, y);
      ctx.lineTo(offset, y + 32);
      ctx.stroke();
    }
    textures.addCanvas('floor_wood', canvas);
  }

  // 2. Stone Floor (Dungeon Basement & Sewer)
  if (!textures.exists('floor_stone')) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#16191a';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = '#0a0d0e';
    ctx.lineWidth = 2;
    for (let x = 0; x < 128; x += 32) {
      for (let y = 0; y < 128; y += 32) {
        ctx.strokeRect(x + 1, y + 1, 30, 30);
        // Stone texture noise
        ctx.fillStyle = (x + y) % 64 === 0 ? '#1f2426' : '#141718';
        ctx.fillRect(x + 3, y + 3, 26, 26);
      }
    }
    textures.addCanvas('floor_stone', canvas);
  }

  // 3. Carpet Floor (Master Bedroom & Hallways)
  if (!textures.exists('floor_carpet')) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#261214'; // Dark crimson
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = '#38161a';
    ctx.lineWidth = 1.5;
    for (let d = -128; d < 256; d += 24) {
      ctx.beginPath();
      ctx.moveTo(d, 0);
      ctx.lineTo(d + 128, 128);
      ctx.stroke();
    }
    // Blood stain speckles
    ctx.fillStyle = 'rgba(74, 10, 14, 0.7)';
    ctx.beginPath();
    ctx.arc(48, 64, 18, 0, Math.PI * 2);
    ctx.fill();
    textures.addCanvas('floor_carpet', canvas);
  }

  // 4. Wall Texture
  if (!textures.exists('wall_tex')) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#131416';
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = '#282b30';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 64, 64);

    // Peeling wallpaper strips
    ctx.fillStyle = '#202226';
    ctx.fillRect(4, 4, 56, 56);
    textures.addCanvas('wall_tex', canvas);
  }

  // 5. Granny Sprite
  if (!textures.exists('granny_char')) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.ellipse(32, 34, 24, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nightgown (Dirty, blood-stained off-white)
    ctx.fillStyle = '#d5cebe';
    ctx.beginPath();
    ctx.arc(32, 32, 19, 0, Math.PI * 2);
    ctx.fill();

    // Blood splatters on gown
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.arc(36, 36, 7, 0, Math.PI * 2);
    ctx.arc(28, 42, 4, 0, Math.PI * 2);
    ctx.arc(39, 25, 3, 0, Math.PI * 2);
    ctx.fill();

    // Granny Head (Pale greenish decayed flesh)
    ctx.fillStyle = '#c7beaa';
    ctx.beginPath();
    ctx.arc(32, 28, 12, 0, Math.PI * 2);
    ctx.fill();

    // Messy grey hair bun
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.arc(32, 18, 9, 0, Math.PI * 2);
    ctx.fill();

    // Demonic Glowing Red Eyes
    ctx.fillStyle = '#ff1100';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(28, 30, 2.8, 0, Math.PI * 2);
    ctx.arc(36, 30, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Menacing Baseball Bat (Bloody wood)
    ctx.save();
    ctx.translate(46, 26);
    ctx.rotate(0.4);
    ctx.fillStyle = '#6b3a16';
    ctx.fillRect(-3, -20, 7, 28);
    // Blood on bat tip
    ctx.fillStyle = '#a10808';
    ctx.fillRect(-3, -20, 7, 12);
    ctx.restore();

    textures.addCanvas('granny_char', canvas);
  }

  // 6. Survivor Sprites (6 colors)
  const survivorColors: Record<string, string> = {
    ethan: '#3b82f6', // Blue jacket
    marcus: '#eab308', // Detective yellow coat
    sarah: '#ec4899', // Pink hoodie
    tyler: '#10b981', // Green jacket
    chloe: '#a855f7', // Purple jacket
    alex: '#f97316', // Orange vest
  };

  Object.entries(survivorColors).forEach(([id, color]) => {
    const key = `survivor_${id}`;
    if (!textures.exists(key)) {
      const canvas = document.createElement('canvas');
      canvas.width = 54;
      canvas.height = 54;
      const ctx = canvas.getContext('2d')!;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(27, 29, 18, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (Jacket)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(27, 27, 16, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = '#f3c7a2';
      ctx.beginPath();
      ctx.arc(27, 23, 9, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = '#2d1c15';
      ctx.beginPath();
      ctx.arc(27, 18, 7, Math.PI, Math.PI * 2);
      ctx.fill();

      // Flashlight held in hand
      ctx.fillStyle = '#444';
      ctx.fillRect(38, 20, 10, 5);
      ctx.fillStyle = '#ffeeaa';
      ctx.fillRect(47, 19, 3, 7);

      textures.addCanvas(key, canvas);
    }
  });

  // 7. Flashlight Light Beam Texture
  if (!textures.exists('flashlight_cone')) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;

    // Center is at 50, 200, shooting forward to 400
    const grad = ctx.createRadialGradient(60, 200, 10, 220, 200, 280);
    grad.addColorStop(0, 'rgba(255, 255, 225, 0.95)');
    grad.addColorStop(0.3, 'rgba(255, 245, 180, 0.6)');
    grad.addColorStop(0.7, 'rgba(255, 230, 150, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(60, 200);
    ctx.arc(60, 200, 320, -0.45, 0.45);
    ctx.closePath();
    ctx.fill();

    // Ambient circle around player body
    const bodyGrad = ctx.createRadialGradient(60, 200, 0, 60, 200, 65);
    bodyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    bodyGrad.addColorStop(0.7, 'rgba(255, 255, 240, 0.2)');
    bodyGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(60, 200, 65, 0, Math.PI * 2);
    ctx.fill();

    textures.addCanvas('flashlight_cone', canvas);
  }

  // 8. Bear Trap Texture
  if (!textures.exists('bear_trap')) {
    const canvas = document.createElement('canvas');
    canvas.width = 36;
    canvas.height = 36;
    const ctx = canvas.getContext('2d')!;

    ctx.strokeStyle = '#771111';
    ctx.fillStyle = '#222';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(18, 18, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Spikes
    ctx.fillStyle = '#b0b0b0';
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = 18 + Math.cos(angle) * 12;
      const y = 18 + Math.sin(angle) * 12;
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
    // Pressure plate
    ctx.fillStyle = '#991111';
    ctx.beginPath();
    ctx.arc(18, 18, 5, 0, Math.PI * 2);
    ctx.fill();

    textures.addCanvas('bear_trap', canvas);
  }

  // 9. Wardrobe Furniture
  if (!textures.exists('furniture_wardrobe')) {
    const canvas = document.createElement('canvas');
    canvas.width = 70;
    canvas.height = 45;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#3a2012';
    ctx.fillRect(0, 0, 70, 45);
    ctx.strokeStyle = '#1b0e07';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 70, 45);

    // Doors divider
    ctx.beginPath();
    ctx.moveTo(35, 0);
    ctx.lineTo(35, 45);
    ctx.stroke();

    // Handles
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(31, 22, 2.5, 0, Math.PI * 2);
    ctx.arc(39, 22, 2.5, 0, Math.PI * 2);
    ctx.fill();

    textures.addCanvas('furniture_wardrobe', canvas);
  }

  // 10. Bed Furniture
  if (!textures.exists('furniture_bed')) {
    const canvas = document.createElement('canvas');
    canvas.width = 90;
    canvas.height = 120;
    const ctx = canvas.getContext('2d')!;

    // Headboard
    ctx.fillStyle = '#241208';
    ctx.fillRect(0, 0, 90, 16);

    // Mattress & blood stained sheet
    ctx.fillStyle = '#4a2529';
    ctx.fillRect(4, 16, 82, 100);

    // Pillows
    ctx.fillStyle = '#baa397';
    ctx.fillRect(10, 20, 32, 20);
    ctx.fillRect(48, 20, 32, 20);

    // Red bloody blanket
    ctx.fillStyle = '#300f13';
    ctx.fillRect(4, 48, 82, 68);

    textures.addCanvas('furniture_bed', canvas);
  }

  // 11. Escape Car (Basement)
  if (!textures.exists('escape_car')) {
    const canvas = document.createElement('canvas');
    canvas.width = 110;
    canvas.height = 70;
    const ctx = canvas.getContext('2d')!;

    // Car Body (Old rusty blue sedan)
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(10, 10, 90, 50);

    // Roof
    ctx.fillStyle = '#142740';
    ctx.fillRect(28, 16, 52, 38);

    // Windshield
    ctx.fillStyle = '#88aacc';
    ctx.fillRect(72, 19, 7, 32);
    ctx.fillRect(29, 19, 6, 32);

    // Wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(16, 4, 18, 8);
    ctx.fillRect(74, 4, 18, 8);
    ctx.fillRect(16, 58, 18, 8);
    ctx.fillRect(74, 58, 18, 8);

    // Rust stains
    ctx.fillStyle = 'rgba(160, 82, 45, 0.8)';
    ctx.fillRect(40, 12, 24, 6);
    ctx.fillRect(15, 34, 16, 12);

    textures.addCanvas('escape_car', canvas);
  }
}
