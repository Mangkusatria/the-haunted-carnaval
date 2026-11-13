/**
 * Procedural Canvas Textures for Jacky's Carnival: Circus Horror
 * Zero external image dependencies!
 */

import * as THREE from 'three';

export class ProceduralTextures {
  private static tentTexture: THREE.CanvasTexture | null = null;
  private static harlequinTexture: THREE.CanvasTexture | null = null;
  private static groundTexture: THREE.CanvasTexture | null = null;
  private static woodTexture: THREE.CanvasTexture | null = null;
  private static jackyFaceTexture: THREE.CanvasTexture | null = null;
  private static circusSignTexture: THREE.CanvasTexture | null = null;
  private static boxItemTexture: THREE.CanvasTexture | null = null;

  public static getTentStripes(): THREE.CanvasTexture {
    if (this.tentTexture) return this.tentTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Weathered off-white background
    ctx.fillStyle = '#c8bc9f';
    ctx.fillRect(0, 0, 512, 512);

    // Weathered deep crimson stripes
    ctx.fillStyle = '#6e0f17';
    const stripeWidth = 64;
    for (let x = 0; x < 512; x += stripeWidth * 2) {
      ctx.fillRect(x, 0, stripeWidth, 512);
    }

    // Dirt & grime overlay
    for (let i = 0; i < 3000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const alpha = Math.random() * 0.15;
      ctx.fillStyle = `rgba(30, 20, 10, ${alpha})`;
      ctx.fillRect(rx, ry, 2, 2);
    }

    // Creepy tears / seams
    ctx.strokeStyle = 'rgba(20, 10, 5, 0.4)';
    ctx.lineWidth = 1.5;
    for (let y = 128; y < 512; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.tentTexture = tex;
    return tex;
  }

  public static getHarlequin(): THREE.CanvasTexture {
    if (this.harlequinTexture) return this.harlequinTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#111116';
    ctx.fillRect(0, 0, 512, 512);

    const diamondW = 64;
    const diamondH = 96;

    for (let y = -diamondH; y < 512 + diamondH; y += diamondH / 2) {
      for (let x = -diamondW; x < 512 + diamondW; x += diamondW) {
        const offset = ((y / (diamondH / 2)) % 2 === 0) ? 0 : diamondW / 2;
        const cx = x + offset;
        const cy = y;

        ctx.beginPath();
        ctx.moveTo(cx, cy - diamondH / 2);
        ctx.lineTo(cx + diamondW / 2, cy);
        ctx.lineTo(cx, cy + diamondH / 2);
        ctx.lineTo(cx - diamondW / 2, cy);
        ctx.closePath();

        const isAlt = (Math.floor(x / diamondW) + Math.floor(y / (diamondH / 2))) % 2 === 0;
        ctx.fillStyle = isAlt ? '#7d121c' : '#c49a45';
        ctx.fill();

        ctx.strokeStyle = '#18120b';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.harlequinTexture = tex;
    return tex;
  }

  public static getGround(): THREE.CanvasTexture {
    if (this.groundTexture) return this.groundTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Muddy dark carnival earth
    ctx.fillStyle = '#1c1815';
    ctx.fillRect(0, 0, 512, 512);

    // Patches of dead brown grass & dried mud
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 15 + Math.random() * 35;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(45, 38, 28, 0.45)');
      grad.addColorStop(1, 'rgba(28, 24, 21, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sawdust specks
    ctx.fillStyle = 'rgba(180, 160, 110, 0.25)';
    for (let i = 0; i < 2000; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(24, 24);
    this.groundTexture = tex;
    return tex;
  }

  public static getWood(): THREE.CanvasTexture {
    if (this.woodTexture) return this.woodTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Weathered barn timber
    ctx.fillStyle = '#2f2319';
    ctx.fillRect(0, 0, 512, 512);

    // Planks
    const plankH = 64;
    for (let y = 0; y < 512; y += plankH) {
      ctx.strokeStyle = '#120c07';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      // Wood grain lines
      ctx.strokeStyle = 'rgba(65, 48, 33, 0.6)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 6; g++) {
        const gy = y + 8 + Math.random() * 48;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(170, gy + Math.random() * 8 - 4, 340, gy + Math.random() * 8 - 4, 512, gy);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.woodTexture = tex;
    return tex;
  }

  public static getJackyFace(smirkAmount: number = 0.5): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Pale cracked porcelain skin
    ctx.fillStyle = '#ece8dc';
    ctx.fillRect(0, 0, 512, 512);

    // Porcelain cracks
    ctx.strokeStyle = 'rgba(60, 50, 45, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(120, 80);
    ctx.lineTo(160, 140);
    ctx.lineTo(145, 200);
    ctx.moveTo(380, 90);
    ctx.lineTo(340, 150);
    ctx.lineTo(365, 220);
    ctx.stroke();

    // Dark sunken eye sockets
    ctx.fillStyle = '#120a0a';
    ctx.beginPath();
    ctx.arc(170, 200, 45, 0, Math.PI * 2);
    ctx.arc(342, 200, 45, 0, Math.PI * 2);
    ctx.fill();

    // Glowing crimson irises
    ctx.fillStyle = '#ff1122';
    ctx.beginPath();
    ctx.arc(170, 200, 18, 0, Math.PI * 2);
    ctx.arc(342, 200, 18, 0, Math.PI * 2);
    ctx.fill();

    // Red clown diamonds around eyes
    ctx.fillStyle = '#8f0a15';
    // Left eye diamond
    ctx.beginPath();
    ctx.moveTo(170, 120);
    ctx.lineTo(195, 200);
    ctx.lineTo(170, 280);
    ctx.lineTo(145, 200);
    ctx.fill();

    // Right eye diamond
    ctx.beginPath();
    ctx.moveTo(342, 120);
    ctx.lineTo(367, 200);
    ctx.lineTo(342, 280);
    ctx.lineTo(317, 200);
    ctx.fill();

    // Red bulbous nose
    const noseGrad = ctx.createRadialGradient(256, 260, 4, 256, 260, 24);
    noseGrad.addColorStop(0, '#ff2233');
    noseGrad.addColorStop(1, '#66050e');
    ctx.fillStyle = noseGrad;
    ctx.beginPath();
    ctx.arc(256, 260, 24, 0, Math.PI * 2);
    ctx.fill();

    // Grotesque Nyengar-Nyengir Wide Grin / Smirk
    const smirkLift = smirkAmount * 40; // Corner lifts up into unsettling smirk
    ctx.fillStyle = '#100508';
    ctx.beginPath();
    ctx.moveTo(100, 350 - smirkLift * 0.3);
    ctx.quadraticCurveTo(256, 470, 412, 350 - smirkLift);
    ctx.quadraticCurveTo(256, 380, 100, 350 - smirkLift * 0.3);
    ctx.fill();

    // Jagged needle-sharp teeth
    ctx.fillStyle = '#fff9d6';
    const toothCount = 12;
    for (let i = 0; i < toothCount; i++) {
      const tx = 130 + i * 22;
      const ty = 370 + Math.sin((i / toothCount) * Math.PI) * 20;
      // Top tooth
      ctx.beginPath();
      ctx.moveTo(tx - 8, ty - 5);
      ctx.lineTo(tx + 8, ty - 5);
      ctx.lineTo(tx, ty + 18);
      ctx.fill();

      // Bottom tooth
      ctx.beginPath();
      ctx.moveTo(tx - 6, ty + 35);
      ctx.lineTo(tx + 6, ty + 35);
      ctx.lineTo(tx, ty + 12);
      ctx.fill();
    }

    // Blood drips on mouth corners
    ctx.fillStyle = '#800000';
    ctx.beginPath();
    ctx.arc(105, 360, 8, 0, Math.PI * 2);
    ctx.arc(410, 355 - smirkLift, 9, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  public static getCircusArchBanner(): THREE.CanvasTexture {
    if (this.circusSignTexture) return this.circusSignTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Distressed black/crimson board
    ctx.fillStyle = '#130e12';
    ctx.fillRect(0, 0, 1024, 256);

    ctx.strokeStyle = '#cda250';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, 1000, 232);

    // Archaic horror carnival text
    ctx.fillStyle = '#d42230';
    ctx.font = 'bold 74px "Cinzel Decorative", "Nosifer", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎪 KARNAVAL TERKUTUK 🎪', 512, 95);

    ctx.fillStyle = '#c7b38c';
    ctx.font = 'bold 36px "Inter", sans-serif';
    ctx.fillText('JACKY\'S CIRCUS OF SHADOWS • KUMPULKAN 20 KOTAK', 512, 180);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.circusSignTexture = tex;
    return tex;
  }

  public static getBoxItemTexture(): THREE.CanvasTexture {
    if (this.boxItemTexture) return this.boxItemTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#4a080f';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#e6b840';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 240, 240);

    // Gold diamond in center
    ctx.fillStyle = '#d99a26';
    ctx.beginPath();
    ctx.moveTo(128, 30);
    ctx.lineTo(220, 128);
    ctx.lineTo(128, 226);
    ctx.lineTo(36, 128);
    ctx.fill();

    // Clown face silhouette on box
    ctx.fillStyle = '#140c0e';
    ctx.beginPath();
    ctx.arc(128, 128, 35, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.boxItemTexture = tex;
    return tex;
  }

  private static paintingTextures: THREE.CanvasTexture[] = [];
  private static graffitiTextures: THREE.CanvasTexture[] = [];
  private static ceilingTexture: THREE.CanvasTexture | null = null;

  /**
   * Vintage Haunted Circus Paintings & Posters for Maze Walls
   */
  public static getCircusPaintingTexture(variant: number = 0): THREE.CanvasTexture {
    const idx = Math.abs(variant) % 3;
    if (this.paintingTextures[idx]) return this.paintingTextures[idx];

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d')!;

    // Aged parchment / faded canvas
    ctx.fillStyle = idx === 0 ? '#1e1614' : idx === 1 ? '#121822' : '#211418';
    ctx.fillRect(0, 0, 256, 320);

    // Inner aged vignette
    const grad = ctx.createRadialGradient(128, 150, 20, 128, 150, 140);
    grad.addColorStop(0, idx === 1 ? '#293548' : '#3a2b22');
    grad.addColorStop(1, '#090708');
    ctx.fillStyle = grad;
    ctx.fillRect(14, 14, 228, 292);

    // Ornate weathered border
    ctx.strokeStyle = '#927038';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, 232, 296);

    if (idx === 0) {
      // Portrait 0: "THE WEEPING JESTER"
      ctx.fillStyle = '#d6cfc0';
      ctx.beginPath();
      ctx.arc(128, 130, 52, 0, Math.PI * 2);
      ctx.fill();

      // Jester hat silhouette
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.moveTo(80, 95);
      ctx.lineTo(50, 42);
      ctx.lineTo(110, 78);
      ctx.moveTo(176, 95);
      ctx.lineTo(206, 42);
      ctx.lineTo(146, 78);
      ctx.fill();

      // Gouged eye sockets & glowing pinpoint pupils
      ctx.fillStyle = '#0c0a09';
      ctx.beginPath();
      ctx.arc(108, 122, 12, 0, Math.PI * 2);
      ctx.arc(148, 122, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(108, 122, 3, 0, Math.PI * 2);
      ctx.arc(148, 122, 3, 0, Math.PI * 2);
      ctx.fill();

      // Split Tragedy/Comedy grin
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(128, 148, 28, 0.2, Math.PI - 0.2);
      ctx.stroke();

      ctx.fillStyle = '#e7dec8';
      ctx.font = 'bold 20px serif';
      ctx.textAlign = 'center';
      ctx.fillText('JESTY 1984', 128, 245);
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('TERTAWA ATAU MATI', 128, 272);
    } else if (idx === 1) {
      // Portrait 1: "THE BIG TOP MAZE" vintage circus tent poster
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(128, 52);
      ctx.lineTo(40, 175);
      ctx.lineTo(216, 175);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#d6c7a9';
      ctx.beginPath();
      ctx.moveTo(128, 52);
      ctx.lineTo(90, 175);
      ctx.lineTo(166, 175);
      ctx.closePath();
      ctx.fill();

      // Crescent moon & dark bars
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(185, 70, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f5f5f4';
      ctx.font = 'bold 18px serif';
      ctx.textAlign = 'center';
      ctx.fillText('LABIRIN SIRKUS', 128, 222);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('10 KUNCI HARAPAN', 128, 250);
    } else {
      // Portrait 2: Clawed Clown Portrait with red "X" vandalism
      ctx.fillStyle = '#e5dcc8';
      ctx.beginPath();
      ctx.ellipse(128, 128, 46, 58, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(128, 134, 14, 0, Math.PI * 2);
      ctx.fill();

      // Diagonal crimson X slash across painting
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(45, 50);
      ctx.lineTo(210, 220);
      ctx.moveTo(210, 50);
      ctx.lineTo(45, 220);
      ctx.stroke();

      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 19px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO ESCAPE', 128, 262);
    }

    // Grime & blood splatters
    ctx.fillStyle = 'rgba(130, 10, 10, 0.45)';
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.arc(30 + Math.random() * 196, 30 + Math.random() * 260, 2 + Math.random() * 6, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.paintingTextures[idx] = tex;
    return tex;
  }

  /**
   * Creepy Wall Graffiti / Coretan Dinding & Claw Scratches (transparent PNG-style canvas)
   */
  public static getGraffitiDecalTexture(variant: number = 0): THREE.CanvasTexture {
    const idx = Math.abs(variant) % 3;
    if (this.graffitiTextures[idx]) return this.graffitiTextures[idx];

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 256);

    if (idx === 0) {
      // Coretan: "TOLONG!! JESTY DI BELAKANGMU" + tally marks
      ctx.fillStyle = 'rgba(155, 16, 16, 0.88)';
      ctx.font = 'bold 46px monospace';
      ctx.save();
      ctx.rotate(-0.06);
      ctx.fillText('JANGAN BERSUARA...', 24, 92);
      ctx.font = 'bold 34px monospace';
      ctx.fillStyle = 'rgba(210, 200, 180, 0.82)';
      ctx.fillText('TOPENG KETAWA = BAHAYA!', 34, 154);
      ctx.restore();

      // Blood drips
      ctx.fillStyle = 'rgba(120, 8, 8, 0.85)';
      for (let x = 40; x < 460; x += 48) {
        ctx.fillRect(x, 95, 4, 24 + (x % 30));
      }
    } else if (idx === 1) {
      // Coretan: Arrow + "PINTU EXIT -> UTARA" + tally scratches
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.88)';
      ctx.lineWidth = 7;
      for (let t = 0; t < 5; t++) {
        ctx.beginPath();
        ctx.moveTo(45 + t * 22, 50);
        ctx.lineTo(38 + t * 22, 140);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(25, 115);
      ctx.lineTo(150, 70);
      ctx.stroke();

      ctx.fillStyle = 'rgba(245, 158, 11, 0.88)';
      ctx.font = 'bold 38px monospace';
      ctx.fillText('10 KUNCI = BEBAS', 175, 108);
      ctx.fillStyle = 'rgba(180, 20, 20, 0.85)';
      ctx.font = 'bold 28px monospace';
      ctx.fillText('LARI DARI PENJARA!!', 180, 162);
    } else {
      // Giant bloody claw marks & creepy smiley
      ctx.strokeStyle = 'rgba(140, 10, 10, 0.9)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      for (let c = 0; c < 4; c++) {
        ctx.beginPath();
        ctx.moveTo(70 + c * 32, 30);
        ctx.quadraticCurveTo(100 + c * 30, 130, 145 + c * 28, 225);
        ctx.stroke();
      }

      // Chilling drawn clown smile on right
      ctx.strokeStyle = 'rgba(230, 225, 210, 0.78)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(360, 128, 60, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = 'rgba(220, 38, 38, 0.85)';
      ctx.beginPath();
      ctx.arc(335, 95, 10, 0, Math.PI * 2);
      ctx.arc(385, 95, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.graffitiTextures[idx] = tex;
    return tex;
  }

  /**
   * Dark Weathered Tent Roof Canvas for Maze Ceiling
   */
  public static getTentCeilingTexture(): THREE.CanvasTexture {
    if (this.ceilingTexture) return this.ceilingTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1b1416';
    ctx.fillRect(0, 0, 512, 512);

    // Muted dark crimson & faded charcoal stripes
    const w = 64;
    for (let x = 0; x < 512; x += w * 2) {
      ctx.fillStyle = '#3b0c12';
      ctx.fillRect(x, 0, w, 512);
    }

    // Stained seams
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 3;
    for (let y = 0; y < 512; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 10);
    this.ceilingTexture = tex;
    return tex;
  }
}
