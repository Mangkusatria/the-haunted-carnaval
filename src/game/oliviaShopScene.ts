import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { ShopItemId } from '../components/ShopModal';

const BG_COLOR = 0x1a0b2c;

const ITEM_POSITIONS: Record<ShopItemId, number> = {
  monster_radar: -1.58,
  circus_pistol: 0,
  circus_gloves: 1.58
};

const ITEM_ACCENTS: Record<ShopItemId, number> = {
  monster_radar: 0xfb7185,
  circus_pistol: 0x22d3ee,
  circus_gloves: 0x34d399
};

export interface OliviaShopSceneCallbacks {
  onSelectItem?: (itemId: ShopItemId) => void;
  onHoverItem?: (itemId: ShopItemId | null) => void;
}

export interface OliviaShopSceneController {
  selectItem: (itemId: ShopItemId) => void;
  triggerPurchaseFx: (itemId: ShopItemId) => void;
  resetCamera: () => void;
  dispose: () => void;
}

function detectSoftwareGl(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = ext
      ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '')
      : String(gl.getParameter(gl.RENDERER) || '');
    return /(SwiftShader|llvmpipe|Software Rasterizer)/i.test(rendererStr);
  } catch {
    return false;
  }
}

function createCheckeredFloorTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const tiles = 8;
  const step = canvas.width / tiles;
  for (let y = 0; y < tiles; y++) {
    for (let x = 0; x < tiles; x++) {
      const dark = (x + y) % 2 === 0;
      ctx.fillStyle = dark ? '#321438' : '#582047';
      ctx.fillRect(x * step, y * step, step, step);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.16)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x * step + 1, y * step + 1, step - 2, step - 2);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = anisotropy;
  return tex;
}

function createCarnivalPlazaTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#231336';
  ctx.fillRect(0, 0, 512, 512);
  const block = 64;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const offset = y % 2 === 0 ? 0 : block * 0.5;
      ctx.fillStyle = (x + y) % 2 === 0 ? '#2b1842' : '#25143a';
      ctx.fillRect((x * block + offset) % 512, y * block, block - 4, block - 4);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.anisotropy = anisotropy;
  return tex;
}

function createStripedCanopyTexture(anisotropy: number, palette = ['#6b1457', '#d97706', '#3b0c46', '#be185d']): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const stripes = 12;
  const sw = canvas.width / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = palette[i % palette.length];
    ctx.fillRect(i * sw, 0, sw + 1, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(i * sw, 0, 4, canvas.height);
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  for (let y = 0; y < canvas.height; y += 8) {
    ctx.fillRect(0, y, canvas.width, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(2, 1);
  tex.anisotropy = anisotropy;
  return tex;
}

function createWoodCounterTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#47251a';
  ctx.fillRect(0, 0, 512, 256);

  for (let i = 0; i < 6; i++) {
    const y = i * (256 / 6);
    ctx.fillStyle = i % 2 === 0 ? '#522b1e' : '#3e1e15';
    ctx.fillRect(0, y, 512, 256 / 6 - 3);
    ctx.fillStyle = '#240f0a';
    ctx.fillRect(0, y + 256 / 6 - 3, 512, 3);
  }
  ctx.strokeStyle = 'rgba(255, 200, 140, 0.07)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 45; i++) {
    const gy = (i * 19) % 256;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.bezierCurveTo(170, gy + 5, 340, gy - 5, 512, gy + 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = anisotropy;
  return tex;
}

function createMarqueeSignTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#2a0836');
  grad.addColorStop(0.5, '#190421');
  grad.addColorStop(1, '#2d0938');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 14;
  ctx.strokeRect(14, 14, 996, 228);
  ctx.strokeStyle = '#fde68a';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 964, 196);

  const drawDiamond = (cx: number, cy: number, r: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.75, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r * 0.75, cy);
    ctx.closePath();
    ctx.fill();
  };
  drawDiamond(78, 128, 22, '#e879f9');
  drawDiamond(946, 128, 22, '#e879f9');
  drawDiamond(122, 128, 13, '#fde047');
  drawDiamond(902, 128, 13, '#fde047');

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(245, 158, 11, 0.75)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#fde68a';
  ctx.font = '900 78px Georgia, serif';
  ctx.fillText('TOKO OLIVIA', 512, 104);

  ctx.shadowColor = 'rgba(232, 121, 249, 0.8)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#f0abfc';
  ctx.font = '700 32px monospace';
  ctx.fillText('THE JESTER WOMAN • CIRCUS EMPORIUM', 512, 178);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function createPriceTagTexture(label: string, accentHex: string, anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1b0b24';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 240, 112);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fde68a';
  ctx.font = '900 50px monospace';
  ctx.fillText(label, 128, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function createHarlequinBoxTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(0, 0, 256, 256);

  const cols = 4;
  const rows = 4;
  const w = 256 / cols;
  const h = 256 / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#991b1b' : '#f5d0a9';
      ctx.beginPath();
      ctx.moveTo(x * w + w * 0.5, y * h + 4);
      ctx.lineTo(x * w + w - 4, y * h + h * 0.5);
      ctx.lineTo(x * w + w * 0.5, y * h + h - 4);
      ctx.lineTo(x * w + 4, y * h + h * 0.5);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 248);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function createSleepingJackyFaceTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Pale porcelain clown skin
  ctx.fillStyle = '#efe5dc';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle clown diamond makeup around closed eyes
  const drawDiamond = (cx: number, cy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 26);
    ctx.lineTo(cx + 18, cy);
    ctx.lineTo(cx, cy + 26);
    ctx.lineTo(cx - 18, cy);
    ctx.closePath();
    ctx.fill();
  };
  drawDiamond(92, 112, '#7f1d1d');
  drawDiamond(164, 112, '#7f1d1d');

  // Peaceful closed sleeping eyelids
  ctx.strokeStyle = '#1f1016';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(92, 108, 14, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(164, 108, 14, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // Rosy clown nose
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(128, 134, 12, 0, Math.PI * 2);
  ctx.fill();

  // Gentle sleeping smile
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(128, 148, 22, 0.18 * Math.PI, 0.82 * Math.PI);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function createTipJarLabelTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 240, 112);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#78350f';
  ctx.font = '900 54px Georgia, serif';
  ctx.fillText('TIPS', 128, 56);
  ctx.fillStyle = '#be185d';
  ctx.font = '700 22px monospace';
  ctx.fillText('★ OLIVIA ★', 128, 98);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function createZzzSpriteTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 128, 128);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(165, 243, 252, 0.85)';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#e0f2fe';
  ctx.font = '900 76px Georgia, serif';
  ctx.fillText('Z', 64, 68);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createOliviaShopScene(
  container: HTMLElement,
  initialSelected: ShopItemId,
  callbacks: OliviaShopSceneCallbacks
): OliviaShopSceneController {
  const cbRef = { current: callbacks };

  // Pre-allocated scratch helpers (zero per-frame GC)
  const pointerNdc = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  raycaster.layers.set(1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG_COLOR);
  scene.fog = new THREE.FogExp2(BG_COLOR, 0.022);

  const width = Math.max(container.clientWidth, 320);
  const height = Math.max(container.clientHeight, 240);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 90);
  camera.position.set(0, 2.38, 4.78);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
  });
  const gl = renderer.getContext();
  const isSoftwareGl = detectSoftwareGl(gl);

  if (isSoftwareGl) {
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = false;
  } else {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.touchAction = 'none';
  container.appendChild(renderer.domElement);

  const maxAniso = Math.min(8, Math.max(1, renderer.capabilities.getMaxAnisotropy()));

  // Environment IBL via RoomEnvironment
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envTarget = pmrem.fromScene(roomEnv, 0.04);
  scene.environment = envTarget.texture;
  roomEnv.dispose();
  pmrem.dispose();

  const texturesToDispose: THREE.Texture[] = [envTarget.texture];

  // OrbitControls bounded cleanly in front of the booth
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.5, -0.2);
  controls.enablePan = false;
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2.65;
  controls.maxDistance = 6.2;
  controls.minPolarAngle = Math.PI * 0.23;
  controls.maxPolarAngle = Math.PI * 0.50;
  controls.minAzimuthAngle = -Math.PI * 0.34;
  controls.maxAzimuthAngle = Math.PI * 0.34;
  controls.update();

  // Warm / Cool Carnival Lighting Rig
  const hemiLight = new THREE.HemisphereLight(0xc4b5fd, 0x3b0764, 0.78);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffe7bd, 2.25);
  keyLight.position.set(4.5, 6.8, 5.4);
  if (!isSoftwareGl) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -4.6;
    keyLight.shadow.camera.right = 4.6;
    keyLight.shadow.camera.top = 4.0;
    keyLight.shadow.camera.bottom = -3.4;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 19;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
  }
  scene.add(keyLight);

  const boothLampLight = new THREE.PointLight(0xffcf77, 5.0, 9.0, 2);
  boothLampLight.position.set(0, 2.85, 0.35);
  scene.add(boothLampLight);

  const shelfWarmLight = new THREE.PointLight(0xffd6a5, 3.8, 6.0, 2);
  shelfWarmLight.position.set(0, 2.2, -1.25);
  scene.add(shelfWarmLight);

  const rimMagentaLight = new THREE.PointLight(0xe879f9, 3.4, 8.5, 2);
  rimMagentaLight.position.set(-2.2, 2.6, -2.5);
  scene.add(rimMagentaLight);

  // Textures & Shared Materials
  const floorTex = createCheckeredFloorTexture(maxAniso);
  const plazaTex = createCarnivalPlazaTexture(maxAniso);
  const canopyTex = createStripedCanopyTexture(maxAniso);
  const altTentTex = createStripedCanopyTexture(maxAniso, ['#0f766e', '#f59e0b', '#0e7490', '#fef3c7']);
  const crimsonTentTex = createStripedCanopyTexture(maxAniso, ['#b91c1c', '#fef3c7', '#991b1b', '#f59e0b']);
  const woodTex = createWoodCounterTexture(maxAniso);
  const signTex = createMarqueeSignTexture(maxAniso);
  const harlequinTex = createHarlequinBoxTexture(maxAniso);
  const sleepingJackyTex = createSleepingJackyFaceTexture(maxAniso);
  const tipLabelTex = createTipJarLabelTexture(maxAniso);
  const zzzTex = createZzzSpriteTexture(maxAniso);
  texturesToDispose.push(
    floorTex,
    plazaTex,
    canopyTex,
    altTentTex,
    crimsonTentTex,
    woodTex,
    signTex,
    harlequinTex,
    sleepingJackyTex,
    tipLabelTex,
    zzzTex
  );

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.85,
    roughness: 0.24
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.68,
    metalness: 0.08
  });
  const velvetCrimsonMat = new THREE.MeshStandardMaterial({
    color: 0x701a4b,
    roughness: 0.92,
    metalness: 0.04
  });
  const velvetPurpleMat = new THREE.MeshStandardMaterial({
    color: 0x4c1d95,
    roughness: 0.9,
    metalness: 0.05
  });
  const canopyMat = new THREE.MeshStandardMaterial({
    map: canopyTex,
    roughness: 0.78,
    metalness: 0.06,
    side: THREE.DoubleSide
  });

  // ---------------------------------------------------------------------------
  // 1. CHEERFUL CIRCUS CARNIVAL FAIRGROUND BACKGROUND (NOT Jacky's Horror Carnival)
  // ---------------------------------------------------------------------------
  const plazaGround = new THREE.Mesh(
    new THREE.CircleGeometry(46, 48),
    new THREE.MeshStandardMaterial({ map: plazaTex, roughness: 0.9, metalness: 0.05 })
  );
  plazaGround.rotation.x = -Math.PI / 2;
  plazaGround.position.y = -0.02;
  plazaGround.receiveShadow = true;
  scene.add(plazaGround);

  // Olivia's Raised Fairground Stage Deck
  const stageDeck = new THREE.Mesh(
    new THREE.CylinderGeometry(4.35, 4.5, 0.12, 16),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.62, metalness: 0.12 })
  );
  stageDeck.position.y = -0.06;
  stageDeck.receiveShadow = true;
  scene.add(stageDeck);

  const stageBrassRim = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.045, 10, 48), brassMat);
  stageBrassRim.rotation.x = Math.PI / 2;
  stageBrassRim.position.y = 0;
  scene.add(stageBrassRim);

  // Background Ferris Wheel (Bianglala) with glowing pastel gondolas
  const ferrisGroup = new THREE.Group();
  ferrisGroup.position.set(-7.5, 0, -14.5);
  ferrisGroup.rotation.y = 0.28;
  scene.add(ferrisGroup);

  const ferrisFrameMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, metalness: 0.6, roughness: 0.35 });
  for (const side of [-0.6, 0.6]) {
    const legA = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 7.6, 8), ferrisFrameMat);
    legA.position.set(-1.7, 3.6, side);
    legA.rotation.z = -0.26;
    ferrisGroup.add(legA);

    const legB = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 7.6, 8), ferrisFrameMat);
    legB.position.set(1.7, 3.6, side);
    legB.rotation.z = 0.26;
    ferrisGroup.add(legB);
  }

  const ferrisWheelPivot = new THREE.Group();
  ferrisWheelPivot.position.set(0, 7.0, 0);
  ferrisGroup.add(ferrisWheelPivot);

  const wheelRimMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    emissive: 0xdb2777,
    emissiveIntensity: 0.75,
    roughness: 0.3
  });
  for (const wz of [-0.35, 0.35]) {
    const outerRim = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.08, 8, 36), wheelRimMat);
    outerRim.position.z = wz;
    ferrisWheelPivot.add(outerRim);
  }

  const gondolaPivots: THREE.Group[] = [];
  const gondolaColors = [0xfde047, 0x38bdf8, 0xf472b6, 0x34d399];
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 8.8, 6), ferrisFrameMat);
    spoke.rotation.z = angle;
    ferrisWheelPivot.add(spoke);

    const gPivot = new THREE.Group();
    gPivot.position.set(Math.cos(angle) * 4.4, Math.sin(angle) * 4.4, 0);
    const col = gondolaColors[i % gondolaColors.length];
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.58, 0.62),
      new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.6, roughness: 0.35 })
    );
    cabin.position.y = -0.35;
    gPivot.add(cabin);
    ferrisWheelPivot.add(gPivot);
    gondolaPivots.push(gPivot);
  }

  // Background Festive Striped Carnival Tents (Big Top & Side Booths)
  const buildBgCircusTent = (x: number, z: number, radius: number, wallH: number, roofH: number, tex: THREE.Texture) => {
    const tGroup = new THREE.Group();
    tGroup.position.set(x, 0, z);
    const tMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72, metalness: 0.05 });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.05, wallH, 16), tMat);
    wall.position.y = wallH * 0.5;
    tGroup.add(wall);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(radius * 1.12, roofH, 16), tMat);
    roof.position.y = wallH + roofH * 0.5;
    tGroup.add(roof);
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.9, 6), brassMat);
    flagPole.position.y = wallH + roofH + 0.4;
    tGroup.add(flagPole);
    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.32, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xf59e0b, emissiveIntensity: 0.55 })
    );
    flag.position.set(0.32, wallH + roofH + 0.68, 0);
    tGroup.add(flag);
    scene.add(tGroup);
  };

  buildBgCircusTent(6.8, -11.5, 2.3, 2.5, 2.2, altTentTex);
  buildBgCircusTent(-0.8, -18.5, 3.6, 3.2, 3.1, crimsonTentTex);
  buildBgCircusTent(-9.5, -9.0, 1.8, 2.1, 1.8, crimsonTentTex);

  // Rotating Mini Merry-Go-Round Carousel (Right Background)
  const carouselGroup = new THREE.Group();
  carouselGroup.position.set(7.2, 0, -6.2);
  scene.add(carouselGroup);

  const carouselBase = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.0, 0.32, 16), brassMat);
  carouselBase.position.y = 0.16;
  carouselGroup.add(carouselBase);

  const carouselSpinPivot = new THREE.Group();
  carouselGroup.add(carouselSpinPivot);

  const carouselCenterPole = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 3.2, 12), brassMat);
  carouselCenterPole.position.y = 1.6;
  carouselSpinPivot.add(carouselCenterPole);

  const carouselRoof = new THREE.Mesh(
    new THREE.ConeGeometry(2.15, 1.15, 16),
    new THREE.MeshStandardMaterial({ map: altTentTex, roughness: 0.6 })
  );
  carouselRoof.position.y = 3.55;
  carouselSpinPivot.add(carouselRoof);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const px = Math.cos(a) * 1.4;
    const pz = Math.sin(a) * 1.4;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.8, 8), brassMat);
    pole.position.set(px, 1.65, pz);
    carouselSpinPivot.add(pole);

    const horse = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.36, 0.62),
      new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xfef3c7 : 0xf9a8d4,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.25,
        roughness: 0.4
      })
    );
    horse.position.set(px, 1.2 + (i % 2) * 0.2, pz);
    horse.rotation.y = -a;
    carouselSpinPivot.add(horse);
  }

  // Cheerful Carnival Balloon Clusters flanking the Stage
  const balloonColors = [0xf43f5e, 0x38bdf8, 0xfacc15, 0xc084fc, 0x34d399];
  const buildBalloonCluster = (x: number, z: number, seed: number) => {
    const cGroup = new THREE.Group();
    cGroup.position.set(x, 0, z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 8), darkWoodMat);
    post.position.y = 1.2;
    cGroup.add(post);

    for (let i = 0; i < 5; i++) {
      const col = balloonColors[(i + seed) % balloonColors.length];
      const bx = Math.cos(i * 1.25) * 0.26;
      const bz = Math.sin(i * 1.25) * 0.26;
      const by = 2.6 + (i % 3) * 0.22;
      const b = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 14, 12),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.28, metalness: 0.1 })
      );
      b.scale.set(1, 1.18, 1);
      b.position.set(bx, by, bz);
      cGroup.add(b);
    }
    scene.add(cGroup);
  };
  buildBalloonCluster(-3.95, -0.4, 0);
  buildBalloonCluster(3.95, -0.4, 2);

  // Carnival Festoon Light String Poles & Bulbs across the mid-ground
  const festoonBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfbbf24,
    emissiveIntensity: 1.5,
    roughness: 0.2
  });
  const festoonCoords: [number, number, number, number][] = [
    [-6.2, -5.2, -2.9, -2.1],
    [2.9, -2.1, 6.2, -5.2]
  ];
  for (const [x1, z1, x2, z2] of festoonCoords) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.6, 8), darkWoodMat);
    pole.position.set(x1 < -4 ? x1 : x2, 1.8, x1 < -4 ? z1 : z2);
    scene.add(pole);

    for (let s = 1; s <= 6; s++) {
      const t = s / 7;
      const bx = THREE.MathUtils.lerp(x1, x2, t);
      const bz = THREE.MathUtils.lerp(z1, z2, t);
      const by = 3.35 - Math.sin(t * Math.PI) * 0.45;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), festoonBulbMat);
      bulb.position.set(bx, by, bz);
      scene.add(bulb);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. OLIVIA'S CIRCUS STALL BOOTH (Open-Back Frame so Shelf & Fairground Shine)
  // ---------------------------------------------------------------------------
  const boothGroup = new THREE.Group();
  scene.add(boothGroup);

  const counterBase = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.96, 1.05), darkWoodMat);
  counterBase.position.set(0, 0.48, 0.18);
  counterBase.castShadow = true;
  counterBase.receiveShadow = true;
  boothGroup.add(counterBase);

  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(5.42, 0.07, 1.24),
    new THREE.MeshStandardMaterial({ color: 0x562b1e, roughness: 0.48, metalness: 0.1 })
  );
  counterTop.position.set(0, 0.995, 0.18);
  counterTop.castShadow = true;
  counterTop.receiveShadow = true;
  boothGroup.add(counterTop);

  const counterFrontTrim = new THREE.Mesh(new THREE.BoxGeometry(5.46, 0.04, 0.05), brassMat);
  counterFrontTrim.position.set(0, 1.01, 0.8);
  boothGroup.add(counterFrontTrim);

  const velvetRunner = new THREE.Mesh(new THREE.BoxGeometry(4.75, 0.014, 0.72), velvetCrimsonMat);
  velvetRunner.position.set(0, 1.035, 0.2);
  velvetRunner.receiveShadow = true;
  boothGroup.add(velvetRunner);

  for (let i = -2; i <= 2; i++) {
    const plaque = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), brassMat);
    plaque.scale.set(1, 1.35, 0.25);
    plaque.position.set(i * 1.02, 0.5, 0.72);
    boothGroup.add(plaque);
  }

  // Booth Pillars (2 front, 2 back)
  const pillarCoords: [number, number][] = [
    [-2.78, 0.58],
    [2.78, 0.58],
    [-2.78, -2.05],
    [2.78, -2.05]
  ];
  const pillarGeo = new THREE.CylinderGeometry(0.11, 0.13, 3.35, 16);
  const collarRingGeo = new THREE.TorusGeometry(0.14, 0.03, 8, 20);
  for (const [px, pz] of pillarCoords) {
    const pillar = new THREE.Mesh(pillarGeo, canopyMat);
    pillar.position.set(px, 1.675, pz);
    pillar.castShadow = true;
    boothGroup.add(pillar);

    for (const ry of [0.12, 1.04, 3.22]) {
      const ring = new THREE.Mesh(collarRingGeo, brassMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(px, ry, pz);
      boothGroup.add(ring);
    }
  }

  // Side Velvet Curtain Drapes framing the booth (leaving center open to show the shelf & carnival!)
  for (const side of [-1, 1]) {
    for (let f = 0; f < 3; f++) {
      const drape = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 3.25, 10),
        f % 2 === 0 ? velvetPurpleMat : velvetCrimsonMat
      );
      drape.scale.set(1, 1, 0.5);
      drape.position.set(side * (2.45 - f * 0.32), 1.62, -2.02);
      boothGroup.add(drape);
    }
  }

  // Striped Pitched Tent Canopy Roof
  const canopyRoof = new THREE.Mesh(new THREE.ConeGeometry(4.25, 1.25, 4), canopyMat);
  canopyRoof.rotation.y = Math.PI / 4;
  canopyRoof.scale.set(1.18, 1, 0.78);
  canopyRoof.position.set(0, 3.92, -0.72);
  canopyRoof.castShadow = true;
  boothGroup.add(canopyRoof);

  const spireStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.09, 0.42, 12), brassMat);
  spireStem.position.set(0, 4.65, -0.72);
  boothGroup.add(spireStem);
  const spireBall = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), brassMat);
  spireBall.position.set(0, 4.9, -0.72);
  boothGroup.add(spireBall);

  // Front Scalloped Awning Valance
  const valanceCount = 9;
  for (let i = 0; i < valanceCount; i++) {
    const vx = (i - (valanceCount - 1) / 2) * 0.62;
    const scallop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.31, 0.31, 0.08, 16, 1, false, 0, Math.PI),
      i % 2 === 0 ? velvetCrimsonMat : brassMat
    );
    scallop.rotation.z = Math.PI / 2;
    scallop.rotation.y = Math.PI / 2;
    scallop.position.set(vx, 3.24, 0.72);
    boothGroup.add(scallop);
  }

  // Hanging "TOKO OLIVIA" Marquee Sign
  const signGroup = new THREE.Group();
  signGroup.position.set(0, 2.86, 0.74);
  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(2.65, 0.66, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x22072b, roughness: 0.5, metalness: 0.3 })
  );
  signGroup.add(signBoard);
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(2.55, 0.58),
    new THREE.MeshStandardMaterial({
      map: signTex,
      emissive: 0xffffff,
      emissiveMap: signTex,
      emissiveIntensity: 0.38,
      roughness: 0.35
    })
  );
  signFace.position.z = 0.045;
  signGroup.add(signFace);

  for (const cx of [-1.05, 1.05]) {
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8), brassMat);
    chain.position.set(cx, 0.52, 0);
    signGroup.add(chain);
  }
  boothGroup.add(signGroup);

  // Warm String Fairy Bulbs along front beam
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3b0,
    emissive: 0xffb703,
    emissiveIntensity: 1.6,
    roughness: 0.25
  });
  for (let i = 0; i < 11; i++) {
    const bx = -2.5 + i * 0.5;
    const sag = Math.sin((i / 10) * Math.PI) * 0.1;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), bulbMat);
    bulb.position.set(bx, 3.16 - sag, 0.8);
    boothGroup.add(bulb);
  }

  // Counter Props: Stack of KS Gold Coins (right) & Brass Lantern (left)
  const coinStackGroup = new THREE.Group();
  coinStackGroup.position.set(2.38, 1.03, 0.32);
  const coinGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.024, 18);
  const stackOffsets: [number, number, number][] = [
    [0, 0.012, 0],
    [0.01, 0.036, -0.01],
    [-0.01, 0.06, 0.008],
    [0.005, 0.084, 0],
    [0.19, 0.012, 0.09],
    [0.18, 0.036, 0.095]
  ];
  for (const [cx, cy, cz] of stackOffsets) {
    const coin = new THREE.Mesh(coinGeo, brassMat);
    coin.position.set(cx, cy, cz);
    coin.castShadow = true;
    coinStackGroup.add(coin);
  }
  boothGroup.add(coinStackGroup);

  const lanternGroup = new THREE.Group();
  lanternGroup.position.set(-2.38, 1.03, 0.34);
  const lanternBase = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.05, 8), brassMat);
  lanternBase.position.y = 0.025;
  lanternGroup.add(lanternBase);
  const lanternCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.22, 8),
    new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xffa62b,
      emissiveIntensity: 1.5,
      roughness: 0.2
    })
  );
  lanternCore.position.y = 0.16;
  lanternGroup.add(lanternCore);
  const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.11, 8), brassMat);
  lanternCap.position.y = 0.31;
  lanternGroup.add(lanternCap);
  boothGroup.add(lanternGroup);

  // ---------------------------------------------------------------------------
  // 3. WOODEN DISPLAY SHELF BEHIND OLIVIA (Teddy Bear, Tip Jar, Flower Pot, Jester Hat)
  // ---------------------------------------------------------------------------
  const shelfGroup = new THREE.Group();
  shelfGroup.position.set(0, 0, -1.68);
  scene.add(shelfGroup);

  const shelfWoodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0xd6b49c,
    roughness: 0.65,
    metalness: 0.06
  });

  // Two vertical side uprights + back slim rail + 3 shelf boards
  for (const sx of [-1.42, 1.42]) {
    const upright = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.52, 0.42), shelfWoodMat);
    upright.position.set(sx, 1.26, 0);
    upright.castShadow = true;
    shelfGroup.add(upright);
  }
  const backLowerBoard = new THREE.Mesh(new THREE.BoxGeometry(2.84, 1.15, 0.06), shelfWoodMat);
  backLowerBoard.position.set(0, 0.58, -0.18);
  shelfGroup.add(backLowerBoard);

  // Shelf planks at y = 1.32 (lower visible), y = 1.92 (upper visible), y = 2.48 (top cornice)
  for (const sy of [1.32, 1.92, 2.48]) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(2.94, 0.065, 0.44), shelfWoodMat);
    plank.position.set(0, sy, 0);
    plank.castShadow = true;
    plank.receiveShadow = true;
    shelfGroup.add(plank);
  }
  // Ornate brass shelf edge trim
  for (const sy of [1.32, 1.92]) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(2.88, 0.022, 0.025), brassMat);
    trim.position.set(0, sy, 0.225);
    shelfGroup.add(trim);
  }

  // --- SHELF ITEM A (Upper Left x=-1.02, y=1.95): BONEKA TEDDY BEAR ---
  {
    const teddyGroup = new THREE.Group();
    teddyGroup.position.set(-1.02, 1.955, 0.03);
    teddyGroup.rotation.y = 0.22;
    const plushMat = new THREE.MeshStandardMaterial({ color: 0xb4693a, roughness: 0.88, metalness: 0.02 });
    const snoutMat = new THREE.MeshStandardMaterial({ color: 0xe6c39c, roughness: 0.85 });
    const btnMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 12), plushMat);
    belly.scale.set(0.95, 1.12, 0.85);
    belly.position.y = 0.15;
    teddyGroup.add(belly);

    const bellyPatch = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), snoutMat);
    bellyPatch.scale.set(0.9, 1.05, 0.4);
    bellyPatch.position.set(0, 0.14, 0.095);
    teddyGroup.add(bellyPatch);

    const tHead = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 14), plushMat);
    tHead.position.y = 0.36;
    teddyGroup.add(tHead);

    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), plushMat);
      ear.position.set(side * 0.095, 0.455, -0.01);
      teddyGroup.add(ear);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), btnMat);
      eye.position.set(side * 0.044, 0.385, 0.11);
      teddyGroup.add(eye);

      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.09, 4, 8), plushMat);
      arm.position.set(side * 0.145, 0.2, 0.03);
      arm.rotation.z = side * 0.55;
      teddyGroup.add(arm);

      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.09, 4, 8), plushMat);
      leg.position.set(side * 0.085, 0.045, 0.1);
      leg.rotation.x = Math.PI * 0.45;
      teddyGroup.add(leg);
    }

    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), snoutMat);
    snout.scale.set(1.1, 0.85, 0.9);
    snout.position.set(0, 0.34, 0.115);
    teddyGroup.add(snout);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), btnMat);
    nose.position.set(0, 0.355, 0.155);
    teddyGroup.add(nose);

    const bowtie = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.04, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.5 })
    );
    bowtie.position.set(0, 0.255, 0.11);
    teddyGroup.add(bowtie);

    shelfGroup.add(teddyGroup);
  }

  // --- SHELF ITEM B (Lower Left x=-0.96, y=1.355): POT BUNGA ---
  {
    const potGroup = new THREE.Group();
    potGroup.position.set(-0.96, 1.355, 0.04);

    const terracottaMat = new THREE.MeshStandardMaterial({ color: 0xc25934, roughness: 0.78 });
    const potBody = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.095, 0.19, 14), terracottaMat);
    potBody.position.y = 0.095;
    potGroup.add(potBody);

    const potRim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.145, 0.045, 14), terracottaMat);
    potRim.position.y = 0.19;
    potGroup.add(potRim);

    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.125, 0.125, 0.02, 12),
      new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.95 })
    );
    soil.position.y = 0.195;
    potGroup.add(soil);

    const stemMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.65 });
    const flowerSpecs: { dx: number; dz: number; h: number; tilt: number; color: number }[] = [
      { dx: 0, dz: 0, h: 0.26, tilt: 0.05, color: 0xf43f5e },
      { dx: -0.07, dz: 0.04, h: 0.2, tilt: 0.28, color: 0xfbbf24 },
      { dx: 0.07, dz: -0.02, h: 0.22, tilt: -0.25, color: 0xe879f9 }
    ];
    for (const fs of flowerSpecs) {
      const fPivot = new THREE.Group();
      fPivot.position.set(fs.dx, 0.2, fs.dz);
      fPivot.rotation.z = fs.tilt;

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, fs.h, 6), stemMat);
      stem.position.y = fs.h * 0.5;
      fPivot.add(stem);

      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 6), stemMat);
      leaf.scale.set(1.5, 0.25, 0.7);
      leaf.position.set(0.032, fs.h * 0.45, 0);
      leaf.rotation.z = 0.4;
      fPivot.add(leaf);

      const blossom = new THREE.Group();
      blossom.position.y = fs.h;
      const petalMat = new THREE.MeshStandardMaterial({
        color: fs.color,
        emissive: fs.color,
        emissiveIntensity: 0.22,
        roughness: 0.45
      });
      for (let p = 0; p < 6; p++) {
        const pa = (p / 6) * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), petalMat);
        petal.scale.set(1.2, 0.5, 0.8);
        petal.position.set(Math.cos(pa) * 0.038, 0, Math.sin(pa) * 0.038);
        blossom.add(petal);
      }
      const center = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.4 })
      );
      blossom.add(center);
      fPivot.add(blossom);

      potGroup.add(fPivot);
    }

    shelfGroup.add(potGroup);
  }

  // --- SHELF ITEM C (Lower Right x=+0.88, y=1.355): TOPLES TIP (Tip Jar) ---
  {
    const jarGroup = new THREE.Group();
    jarGroup.position.set(0.88, 1.355, 0.05);

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.36,
      roughness: 0.12,
      metalness: 0.15
    });
    const jarBody = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.28, 18), glassMat);
    jarBody.position.y = 0.14;
    jarGroup.add(jarBody);

    // Brass coin rim on top (open coin slot lid)
    const jarRim = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.018, 8, 20), brassMat);
    jarRim.rotation.x = Math.PI / 2;
    jarRim.position.y = 0.285;
    jarGroup.add(jarRim);

    // Coins inside the Tip Jar!
    const insideCoinGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.016, 12);
    for (let c = 0; c < 11; c++) {
      const coin = new THREE.Mesh(insideCoinGeo, brassMat);
      coin.position.set(
        Math.cos(c * 2.1) * 0.052,
        0.02 + Math.floor(c / 4) * 0.026,
        Math.sin(c * 2.1) * 0.052
      );
      coin.rotation.set((c % 3) * 0.18, c * 0.5, (c % 2) * 0.15);
      jarGroup.add(coin);
    }

    // Crisp "TIPS" Label wrapped on front of jar
    const labelMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.133, 0.133, 0.12, 18, 1, true, -Math.PI * 0.36, Math.PI * 0.72),
      new THREE.MeshStandardMaterial({ map: tipLabelTex, roughness: 0.55 })
    );
    labelMesh.position.y = 0.15;
    jarGroup.add(labelMesh);

    shelfGroup.add(jarGroup);
  }

  // --- SHELF ITEM D (Upper Right x=+0.98, y=1.955): TOPI JESTER ---
  {
    const hatStandGroup = new THREE.Group();
    hatStandGroup.position.set(0.98, 1.955, 0.04);
    hatStandGroup.rotation.y = -0.25;

    const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.035, 14), brassMat);
    standBase.position.y = 0.017;
    hatStandGroup.add(standBase);

    const standPost = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.22, 8), darkWoodMat);
    standPost.position.y = 0.12;
    hatStandGroup.add(standPost);

    const standKnob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), darkWoodMat);
    standKnob.position.y = 0.23;
    hatStandGroup.add(standKnob);

    const hatDisplay = new THREE.Group();
    hatDisplay.position.y = 0.25;
    const hatBandDisp = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.025, 8, 20), brassMat);
    hatBandDisp.rotation.x = Math.PI / 2;
    hatDisplay.add(hatBandDisp);

    const hornColors = [0xd946ef, 0x6d28d9, 0x06b6d4];
    const dispHorns: { rx: number; rz: number; h: number; c: number }[] = [
      { rx: 0.06, rz: 0.62, h: 0.26, c: hornColors[0] },
      { rx: 0.06, rz: -0.62, h: 0.26, c: hornColors[1] },
      { rx: -0.15, rz: 0, h: 0.28, c: hornColors[2] }
    ];
    for (const dh of dispHorns) {
      const hg = new THREE.Group();
      hg.rotation.set(dh.rx, 0, dh.rz);
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.062, dh.h, 10),
        new THREE.MeshStandardMaterial({ color: dh.c, roughness: 0.55 })
      );
      cone.position.y = dh.h * 0.5;
      hg.add(cone);
      const bell = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), brassMat);
      bell.position.y = dh.h + 0.015;
      hg.add(bell);
      hatDisplay.add(hg);
    }
    hatStandGroup.add(hatDisplay);
    shelfGroup.add(hatStandGroup);
  }

  // ---------------------------------------------------------------------------
  // 4. OLIVIA THE JESTER WOMAN (Standing Behind Counter)
  // ---------------------------------------------------------------------------
  const oliviaRoot = new THREE.Group();
  oliviaRoot.position.set(-0.18, 0, -0.84);
  scene.add(oliviaRoot);

  const oliviaBodyPivot = new THREE.Group();
  oliviaRoot.add(oliviaBodyPivot);

  const magentaSuitMat = new THREE.MeshStandardMaterial({ color: 0xc026d3, roughness: 0.56, metalness: 0.12 });
  const royalPlumMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.6, metalness: 0.1 });
  const porcelainMat = new THREE.MeshStandardMaterial({ color: 0xfdf2f8, roughness: 0.42, metalness: 0.02 });
  const goldEyeMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xfacc15,
    emissiveIntensity: 1.25,
    roughness: 0.2
  });
  const lipstickMat = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.32 });

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.46, 0.96, 16), royalPlumMat);
  skirt.position.y = 0.48;
  skirt.castShadow = true;
  oliviaBodyPivot.add(skirt);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.25, 0.58, 16), magentaSuitMat);
  torso.position.y = 1.24;
  torso.castShadow = true;
  oliviaBodyPivot.add(torso);

  const chestDiamond1 = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), brassMat);
  chestDiamond1.scale.set(0.85, 1.25, 0.35);
  chestDiamond1.position.set(0, 1.32, 0.22);
  oliviaBodyPivot.add(chestDiamond1);

  const chestDiamond2 = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), royalPlumMat);
  chestDiamond2.scale.set(0.85, 1.2, 0.35);
  chestDiamond2.position.set(0, 1.15, 0.23);
  oliviaBodyPivot.add(chestDiamond2);

  const ruffGroup = new THREE.Group();
  ruffGroup.position.y = 1.54;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const petal = new THREE.Mesh(
      new THREE.ConeGeometry(0.085, 0.2, 6),
      i % 2 === 0 ? royalPlumMat : brassMat
    );
    petal.position.set(Math.cos(angle) * 0.2, 0, Math.sin(angle) * 0.2);
    petal.rotation.z = -Math.cos(angle) * 1.15;
    petal.rotation.x = Math.sin(angle) * 1.15;
    ruffGroup.add(petal);
  }
  oliviaBodyPivot.add(ruffGroup);

  const oliviaHeadPivot = new THREE.Group();
  oliviaHeadPivot.position.set(0, 1.64, 0);
  oliviaBodyPivot.add(oliviaHeadPivot);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.12, 12), porcelainMat);
  neck.position.y = 0.04;
  oliviaHeadPivot.add(neck);

  const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 18), porcelainMat);
  headSphere.scale.set(0.95, 1.08, 0.96);
  headSphere.position.y = 0.23;
  headSphere.castShadow = true;
  oliviaHeadPivot.add(headSphere);

  for (const side of [-1, 1]) {
    const diamond = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.048, 0),
      side < 0 ? royalPlumMat : magentaSuitMat
    );
    diamond.scale.set(0.75, 1.35, 0.3);
    diamond.position.set(side * 0.078, 0.25, 0.195);
    diamond.rotation.y = side * 0.28;
    oliviaHeadPivot.add(diamond);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 10), goldEyeMat);
    eye.position.set(side * 0.078, 0.25, 0.212);
    oliviaHeadPivot.add(eye);

    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), lipstickMat);
    cheek.scale.set(1, 0.7, 0.35);
    cheek.position.set(side * 0.125, 0.18, 0.175);
    oliviaHeadPivot.add(cheek);
  }

  const smileArc = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.012, 8, 16, Math.PI * 0.85), lipstickMat);
  smileArc.position.set(0, 0.165, 0.2);
  smileArc.rotation.z = Math.PI + Math.PI * 0.075;
  oliviaHeadPivot.add(smileArc);

  const hatBand = new THREE.Mesh(new THREE.TorusGeometry(0.195, 0.036, 10, 24), brassMat);
  hatBand.rotation.x = Math.PI / 2 - 0.12;
  hatBand.position.set(0, 0.37, -0.01);
  oliviaHeadPivot.add(hatBand);

  const hornSpecs: { x: number; z: number; rz: number; rx: number; h: number; mat: THREE.Material }[] = [
    { x: -0.18, z: -0.02, rz: 0.68, rx: 0.1, h: 0.36, mat: magentaSuitMat },
    { x: 0.18, z: -0.02, rz: -0.68, rx: 0.1, h: 0.36, mat: royalPlumMat },
    { x: 0, z: -0.04, rz: 0, rx: -0.18, h: 0.38, mat: magentaSuitMat }
  ];
  for (const hs of hornSpecs) {
    const hornGroup = new THREE.Group();
    hornGroup.position.set(hs.x * 0.45, 0.39, hs.z);
    hornGroup.rotation.z = hs.rz;
    hornGroup.rotation.x = hs.rx;

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.088, hs.h, 12), hs.mat);
    cone.position.y = hs.h * 0.5;
    hornGroup.add(cone);

    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.044, 12, 10), brassMat);
    bell.position.y = hs.h + 0.02;
    hornGroup.add(bell);

    oliviaHeadPivot.add(hornGroup);
  }

  const buildOliviaArm = (side: -1 | 1): THREE.Group => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.25, 1.46, 0.02);

    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), brassMat);
    armPivot.add(puff);

    const upperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.046, 0.32, 10),
      side < 0 ? royalPlumMat : magentaSuitMat
    );
    upperArm.position.set(side * 0.04, -0.16, 0.08);
    upperArm.rotation.x = -0.55;
    upperArm.rotation.z = side * 0.18;
    armPivot.add(upperArm);

    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.04, 0.28, 10),
      porcelainMat
    );
    forearm.position.set(side * 0.07, -0.26, 0.28);
    forearm.rotation.x = -1.25;
    armPivot.add(forearm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), porcelainMat);
    hand.position.set(side * 0.08, -0.22, 0.42);
    armPivot.add(hand);

    return armPivot;
  };
  const oliviaLeftArm = buildOliviaArm(-1);
  const oliviaRightArm = buildOliviaArm(1);
  oliviaBodyPivot.add(oliviaLeftArm, oliviaRightArm);

  // ---------------------------------------------------------------------------
  // 5. SLEEPING JACKY IN HIS BOX BESIDE OLIVIA (Jack-in-the-Box Nap!)
  // ---------------------------------------------------------------------------
  const jackyNapGroup = new THREE.Group();
  jackyNapGroup.position.set(1.48, 0, -0.82);
  jackyNapGroup.rotation.y = -0.35;
  scene.add(jackyNapGroup);

  // Low wooden crate riser so Jacky's box peeks visibly right beside Olivia above the counter
  const jackyRiser = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.38, 1.06), darkWoodMat);
  jackyRiser.position.y = 0.19;
  jackyRiser.castShadow = true;
  jackyRiser.receiveShadow = true;
  jackyNapGroup.add(jackyRiser);

  const jackyBoxMat = new THREE.MeshStandardMaterial({
    map: harlequinTex,
    roughness: 0.45,
    metalness: 0.32
  });
  const jackyCrate = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.88, 0.92), jackyBoxMat);
  jackyCrate.position.y = 0.82;
  jackyCrate.castShadow = true;
  jackyNapGroup.add(jackyCrate);

  // Brass corner brackets on Jacky's box
  const jackyBracketGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  for (const bx of [-0.45, 0.45]) {
    for (const bz of [-0.45, 0.45]) {
      for (const by of [0.42, 1.24]) {
        const br = new THREE.Mesh(jackyBracketGeo, brassMat);
        br.position.set(bx, by, bz);
        jackyNapGroup.add(br);
      }
    }
  }

  // Side mechanical hand-crank on Jacky's box
  const jackyCrank = new THREE.Group();
  jackyCrank.position.set(0.5, 0.84, 0);
  const crankAxle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.14, 8), brassMat);
  crankAxle.rotation.z = Math.PI / 2;
  jackyCrank.add(crankAxle);
  const crankArm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.04), brassMat);
  crankArm.position.set(0.07, 0.1, 0);
  jackyCrank.add(crankArm);
  const crankKnob = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), brassMat);
  crankKnob.position.set(0.11, 0.21, 0);
  jackyCrank.add(crankKnob);
  jackyNapGroup.add(jackyCrank);

  // Hinged box lid propped slightly open
  const jackyLidPivot = new THREE.Group();
  jackyLidPivot.position.set(0, 1.27, -0.45);
  jackyLidPivot.rotation.x = -0.82;
  const jackyLid = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.95), jackyBoxMat);
  jackyLid.position.set(0, 0.04, 0.45);
  jackyLidPivot.add(jackyLid);
  jackyNapGroup.add(jackyLidPivot);

  // Jacky himself curled comfortably sleeping inside the open box!
  const jackySleepPivot = new THREE.Group();
  jackySleepPivot.position.set(0, 1.28, 0.08);
  jackyNapGroup.add(jackySleepPivot);

  const jackyBodyMat = new THREE.MeshStandardMaterial({ color: 0x82131b, roughness: 0.72 });
  const jackyRuff = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.085, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0xdecbb2, roughness: 0.65 })
  );
  jackyRuff.rotation.x = Math.PI / 2;
  jackyRuff.position.y = 0.05;
  jackySleepPivot.add(jackyRuff);

  const jackyHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 18, 16),
    new THREE.MeshStandardMaterial({ map: sleepingJackyTex, roughness: 0.38 })
  );
  jackyHead.position.set(0, 0.23, 0.06);
  jackyHead.rotation.x = 0.28;
  jackyHead.rotation.z = 0.18;
  jackyHead.rotation.y = -Math.PI / 2 + 0.15;
  jackySleepPivot.add(jackyHead);

  // Jacky's crimson jester cap with golden bell flopped to the side
  const jackyHat = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.36, 10),
    new THREE.MeshStandardMaterial({ color: 0x7a111a, roughness: 0.62 })
  );
  jackyHat.position.set(-0.08, 0.44, -0.02);
  jackyHat.rotation.z = 0.42;
  jackyHat.rotation.x = -0.22;
  jackySleepPivot.add(jackyHat);

  const jackyBell = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), brassMat);
  jackyBell.position.set(-0.18, 0.58, -0.08);
  jackySleepPivot.add(jackyBell);

  // Jacky's gloved/clawed hand resting lazily on the box rim
  const jackyRestArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.24, 8), jackyBodyMat);
  jackyRestArm.position.set(-0.22, 0.08, 0.26);
  jackyRestArm.rotation.x = 1.25;
  jackyRestArm.rotation.z = 0.35;
  jackySleepPivot.add(jackyRestArm);

  // Floating "Z z z" Sprites drifting gently above sleeping Jacky
  interface SleepZzz {
    sprite: THREE.Sprite;
    phase: number;
  }
  const sleepZzzPool: SleepZzz[] = [];
  for (let i = 0; i < 3; i++) {
    const spMat = new THREE.SpriteMaterial({
      map: zzzTex,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spMat);
    sprite.position.set(0.05 + i * 0.08, 1.85 + i * 0.22, 0.15);
    sprite.scale.setScalar(0.22);
    jackyNapGroup.add(sprite);
    sleepZzzPool.push({ sprite, phase: i / 3 });
  }

  // ---------------------------------------------------------------------------
  // 6. THREE INTERACTIVE 3D ITEM PEDESTALS & COLLECTIBLE PROPS
  // ---------------------------------------------------------------------------
  interface ItemDisplaySlot {
    id: ShopItemId;
    root: THREE.Group;
    floatGroup: THREE.Group;
    ringMat: THREE.MeshStandardMaterial;
    hitbox: THREE.Mesh;
    radarSweep?: THREE.Group;
    accentLight: THREE.PointLight;
  }

  const itemSlots: Record<ShopItemId, ItemDisplaySlot> = {} as Record<ShopItemId, ItemDisplaySlot>;
  const hitboxes: THREE.Mesh[] = [];

  const buildPedestalBase = (id: ShopItemId, x: number, accentHex: number, tagAccent: string) => {
    const root = new THREE.Group();
    root.position.set(x, 1.03, 0.24);
    scene.add(root);

    const pedBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.41, 0.07, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e0924, roughness: 0.4, metalness: 0.35 })
    );
    pedBase.position.y = 0.035;
    pedBase.castShadow = true;
    pedBase.receiveShadow = true;
    root.add(pedBase);

    const cushion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.31, 0.33, 0.045, 16),
      velvetCrimsonMat
    );
    cushion.position.y = 0.088;
    root.add(cushion);

    const ringMat = new THREE.MeshStandardMaterial({
      color: accentHex,
      emissive: accentHex,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.5
    });
    const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.018, 8, 32), ringMat);
    glowRing.rotation.x = Math.PI / 2;
    glowRing.position.y = 0.025;
    root.add(glowRing);

    const tagTex = createPriceTagTexture('100 KS', tagAccent, maxAniso);
    texturesToDispose.push(tagTex);
    const placard = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.16, 0.024),
      new THREE.MeshStandardMaterial({ map: tagTex, roughness: 0.45, metalness: 0.2 })
    );
    placard.position.set(0, 0.09, 0.44);
    placard.rotation.x = -0.45;
    root.add(placard);

    const floatGroup = new THREE.Group();
    floatGroup.position.set(0, 0.42, 0);
    root.add(floatGroup);

    const accentLight = new THREE.PointLight(accentHex, 0.6, 1.6, 2);
    accentLight.position.set(0, 0.52, 0.15);
    root.add(accentLight);

    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(0.98, 1.02, 0.92),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.set(0, 0.46, 0.06);
    hitbox.layers.set(1);
    hitbox.userData.itemId = id;
    root.add(hitbox);
    hitboxes.push(hitbox);

    return { root, floatGroup, ringMat, hitbox, accentLight };
  };

  // --- ITEM 1: MONSTER RADAR ---
  {
    const slot = buildPedestalBase('monster_radar', ITEM_POSITIONS.monster_radar, ITEM_ACCENTS.monster_radar, '#fb7185');
    const radarBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.42, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x3b0d22, roughness: 0.45, metalness: 0.4 })
    );
    radarBody.castShadow = true;
    slot.floatGroup.add(radarBody);

    const screenBezel = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.018, 8, 24), brassMat);
    screenBezel.position.set(0, 0.04, 0.075);
    slot.floatGroup.add(screenBezel);

    const screenDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.118, 0.118, 0.015, 24),
      new THREE.MeshStandardMaterial({
        color: 0x052e16,
        emissive: 0x10b981,
        emissiveIntensity: 0.45,
        roughness: 0.2
      })
    );
    screenDisc.rotation.x = Math.PI / 2;
    screenDisc.position.set(0, 0.04, 0.074);
    slot.floatGroup.add(screenDisc);

    const radarSweep = new THREE.Group();
    radarSweep.position.set(0, 0.04, 0.088);
    const needle = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.105, 0.01),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfb7185, emissiveIntensity: 1.6 })
    );
    needle.position.y = 0.045;
    radarSweep.add(needle);
    slot.floatGroup.add(radarSweep);

    const dishBowl = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.48),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8, roughness: 0.25, side: THREE.DoubleSide })
    );
    dishBowl.position.set(0, 0.29, -0.01);
    dishBowl.rotation.x = Math.PI * 0.72;
    slot.floatGroup.add(dishBowl);

    const antennaRod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.18, 8), brassMat);
    antennaRod.position.set(0.11, 0.28, 0);
    slot.floatGroup.add(antennaRod);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.036, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xfda4af, emissive: 0xf43f5e, emissiveIntensity: 1.8 })
    );
    beacon.position.set(0.11, 0.38, 0);
    slot.floatGroup.add(beacon);

    itemSlots.monster_radar = { id: 'monster_radar', ...slot, radarSweep };
  }

  // --- ITEM 2: PISTOL SIRKUS ---
  {
    const slot = buildPedestalBase('circus_pistol', ITEM_POSITIONS.circus_pistol, ITEM_ACCENTS.circus_pistol, '#22d3ee');
    const pistolGroup = new THREE.Group();
    pistolGroup.rotation.y = -0.35;
    slot.floatGroup.add(pistolGroup);

    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.24, 0.11),
      new THREE.MeshStandardMaterial({ color: 0x5c2b16, roughness: 0.65, metalness: 0.08 })
    );
    grip.position.set(-0.14, -0.1, 0);
    grip.rotation.z = -0.34;
    grip.castShadow = true;
    pistolGroup.add(grip);

    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.1), brassMat);
    receiver.position.set(-0.04, 0.03, 0);
    receiver.castShadow = true;
    pistolGroup.add(receiver);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.048, 0.34, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.22 })
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.22, 0.045, 0);
    barrel.castShadow = true;
    pistolGroup.add(barrel);

    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.045, 0.11, 16), brassMat);
    muzzle.rotation.z = Math.PI / 2;
    muzzle.position.set(0.41, 0.045, 0);
    pistolGroup.add(muzzle);

    const muzzleCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.048, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xa5f3fc, emissive: 0x06b6d4, emissiveIntensity: 1.9 })
    );
    muzzleCore.position.set(0.44, 0.045, 0);
    pistolGroup.add(muzzleCore);

    const coilMat = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      emissive: 0x22d3ee,
      emissiveIntensity: 1.4,
      roughness: 0.2
    });
    for (const cx of [0.16, 0.27]) {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.013, 8, 20), coilMat);
      coil.rotation.y = Math.PI / 2;
      coil.position.set(cx, 0.045, 0);
      pistolGroup.add(coil);
    }

    itemSlots.circus_pistol = { id: 'circus_pistol', ...slot };
  }

  // --- ITEM 3: SARUNG TANGAN SIRKUS ---
  {
    const slot = buildPedestalBase('circus_gloves', ITEM_POSITIONS.circus_gloves, ITEM_ACCENTS.circus_gloves, '#34d399');
    const emeraldGlowMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 1.25,
      roughness: 0.28
    });
    const gloveClothMat = new THREE.MeshStandardMaterial({
      color: 0x6d28d9,
      roughness: 0.72,
      metalness: 0.08
    });

    const buildGlove = (side: -1 | 1): THREE.Group => {
      const g = new THREE.Group();
      g.position.set(side * 0.16, -0.02, 0);
      g.rotation.z = side * -0.18;
      g.rotation.y = side * -0.22;

      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.072, 0.14, 14), brassMat);
      cuff.position.y = -0.12;
      g.add(cuff);

      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.1), gloveClothMat);
      palm.position.y = 0.03;
      palm.castShadow = true;
      g.add(palm);

      const knuckleStrip = new THREE.Mesh(new THREE.BoxGeometry(0.185, 0.032, 0.108), emeraldGlowMat);
      knuckleStrip.position.y = 0.11;
      g.add(knuckleStrip);

      for (let f = 0; f < 4; f++) {
        const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.075, 4, 8), gloveClothMat);
        finger.position.set(-0.065 + f * 0.043, 0.185, 0.01);
        finger.rotation.x = 0.18;
        g.add(finger);
      }
      const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.065, 4, 8), emeraldGlowMat);
      thumb.position.set(side * -0.11, 0.06, 0.03);
      thumb.rotation.z = side * 0.65;
      g.add(thumb);

      return g;
    };

    slot.floatGroup.add(buildGlove(-1));
    slot.floatGroup.add(buildGlove(1));
    itemSlots.circus_gloves = { id: 'circus_gloves', ...slot };
  }

  // ---------------------------------------------------------------------------
  // 7. CELEBRATION CONFETTI BURST POOL (Zero Runtime GC)
  // ---------------------------------------------------------------------------
  interface ConfettiParticle {
    mesh: THREE.Mesh;
    vel: THREE.Vector3;
    spin: THREE.Vector3;
    life: number;
  }
  const confettiPool: ConfettiParticle[] = [];
  const confettiGeo = new THREE.OctahedronGeometry(0.042, 0);
  const confettiColors = [0xfde047, 0xe879f9, 0x22d3ee, 0x34d399, 0xfb7185];
  for (let i = 0; i < 24; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: confettiColors[i % confettiColors.length],
      emissive: confettiColors[i % confettiColors.length],
      emissiveIntensity: 0.9,
      roughness: 0.3
    });
    const mesh = new THREE.Mesh(confettiGeo, mat);
    mesh.visible = false;
    scene.add(mesh);
    confettiPool.push({
      mesh,
      vel: new THREE.Vector3(),
      spin: new THREE.Vector3(),
      life: 0
    });
  }

  // ---------------------------------------------------------------------------
  // 8. INTERACTION & CAMERA STATE
  // ---------------------------------------------------------------------------
  let selectedItem: ShopItemId = initialSelected;
  let hoveredItem: ShopItemId | null = null;
  let oliviaWaveTimer = 0;
  let userDragging = false;
  let focusTargetX: number | null = ITEM_POSITIONS[initialSelected] * 0.35;
  let lastMoveRayTime = 0;
  let pointerDownPos = { x: 0, y: 0 };

  controls.addEventListener('start', () => {
    userDragging = true;
    focusTargetX = null;
  });
  controls.addEventListener('end', () => {
    userDragging = false;
  });

  const updatePointerNdc = (clientX: number, clientY: number) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  };

  const pickItemAt = (clientX: number, clientY: number): ShopItemId | null => {
    updatePointerNdc(clientX, clientY);
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(hitboxes, false);
    if (hits.length === 0) return null;
    const hitId = hits[0].object.userData.itemId as ShopItemId | undefined;
    return hitId ?? null;
  };

  const handlePointerMove = (e: PointerEvent) => {
    const now = performance.now();
    if (now - lastMoveRayTime < 55) return;
    lastMoveRayTime = now;

    const hit = pickItemAt(e.clientX, e.clientY);
    if (hit !== hoveredItem) {
      hoveredItem = hit;
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
      cbRef.current.onHoverItem?.(hit);
    }
  };

  const handlePointerDown = (e: PointerEvent) => {
    pointerDownPos = { x: e.clientX, y: e.clientY };
    if (!hoveredItem) {
      renderer.domElement.style.cursor = 'grabbing';
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    const dx = e.clientX - pointerDownPos.x;
    const dy = e.clientY - pointerDownPos.y;
    if (dx * dx + dy * dy <= 36) {
      const hit = pickItemAt(e.clientX, e.clientY);
      if (hit) {
        selectedItem = hit;
        focusTargetX = ITEM_POSITIONS[hit] * 0.35;
        oliviaWaveTimer = Math.max(oliviaWaveTimer, 0.75);
        cbRef.current.onSelectItem?.(hit);
      }
    }
    renderer.domElement.style.cursor = hoveredItem ? 'pointer' : 'grab';
  };

  renderer.domElement.addEventListener('pointermove', handlePointerMove);
  renderer.domElement.addEventListener('pointerdown', handlePointerDown);
  renderer.domElement.addEventListener('pointerup', handlePointerUp);

  const handleResize = () => {
    const w = Math.max(container.clientWidth, 320);
    const h = Math.max(container.clientHeight, 240);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', handleResize);

  // ---------------------------------------------------------------------------
  // 9. ANIMATION LOOP (with Software-WebGL GPU Fence Pacing)
  // ---------------------------------------------------------------------------
  let disposed = false;
  let rafId = 0;
  let timeoutId = 0;
  let lastTime = performance.now();
  let elapsed = 0;

  const afterDraw = (next: () => void) => {
    const fence = (gl as WebGL2RenderingContext).fenceSync?.((gl as WebGL2RenderingContext).SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (fence) {
      gl.flush();
      const poll = () => {
        if (disposed) {
          (gl as WebGL2RenderingContext).deleteSync(fence);
          return;
        }
        const status = (gl as WebGL2RenderingContext).clientWaitSync(fence, 0, 0);
        if (status === (gl as WebGL2RenderingContext).TIMEOUT_EXPIRED) {
          timeoutId = window.setTimeout(poll, 4);
        } else {
          (gl as WebGL2RenderingContext).deleteSync(fence);
          rafId = requestAnimationFrame(next);
        }
      };
      timeoutId = window.setTimeout(poll, 80);
    } else {
      timeoutId = window.setTimeout(() => {
        if (!disposed) rafId = requestAnimationFrame(next);
      }, 80);
    }
  };

  const tick = () => {
    if (disposed) return;

    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    elapsed += dt;

    if (focusTargetX !== null && !userDragging) {
      controls.target.x = THREE.MathUtils.damp(controls.target.x, focusTargetX, 5.5, dt);
      if (Math.abs(controls.target.x - focusTargetX) < 0.01) {
        focusTargetX = null;
      }
    }
    controls.update();

    bulbMat.emissiveIntensity = 1.4 + Math.sin(elapsed * 3.1) * 0.22;
    festoonBulbMat.emissiveIntensity = 1.35 + Math.cos(elapsed * 2.7) * 0.25;

    // Background Carnival Rides gentle animation
    ferrisWheelPivot.rotation.z += dt * 0.16;
    for (const gp of gondolaPivots) {
      gp.rotation.z = -ferrisWheelPivot.rotation.z;
    }
    carouselSpinPivot.rotation.y += dt * 0.55;

    // Sleeping Jacky peaceful breathing & floating "Zzz"
    jackySleepPivot.position.y = 1.28 + Math.sin(elapsed * 1.4) * 0.025;
    jackyCrank.rotation.x = Math.sin(elapsed * 0.8) * 0.08;
    for (const zItem of sleepZzzPool) {
      const progress = (elapsed * 0.35 + zItem.phase) % 1;
      zItem.sprite.position.y = 1.72 + progress * 0.65;
      zItem.sprite.position.x = 0.06 + Math.sin(progress * Math.PI * 2) * 0.08;
      zItem.sprite.scale.setScalar(0.14 + progress * 0.12);
      zItem.sprite.material.opacity = Math.sin(progress * Math.PI) * 0.88;
    }

    // Olivia idle breathing + gaze tracking + celebratory wave
    const gazeItem = hoveredItem ?? selectedItem;
    const targetLookYaw = Math.atan2(ITEM_POSITIONS[gazeItem] - oliviaRoot.position.x, 1.1) * 0.62;
    oliviaHeadPivot.rotation.y = THREE.MathUtils.damp(oliviaHeadPivot.rotation.y, targetLookYaw, 6, dt);
    oliviaHeadPivot.rotation.x = THREE.MathUtils.damp(oliviaHeadPivot.rotation.x, 0.08 + Math.sin(elapsed * 1.6) * 0.03, 5, dt);
    oliviaBodyPivot.position.y = Math.sin(elapsed * 2.2) * 0.018;
    oliviaBodyPivot.rotation.z = Math.sin(elapsed * 1.1) * 0.025;

    if (oliviaWaveTimer > 0) {
      oliviaWaveTimer = Math.max(0, oliviaWaveTimer - dt);
      oliviaRightArm.rotation.x = -0.95 + Math.sin(elapsed * 14) * 0.28;
      oliviaRightArm.rotation.z = 0.25 + Math.cos(elapsed * 14) * 0.16;
      oliviaLeftArm.rotation.x = -0.35 + Math.sin(elapsed * 6) * 0.1;
    } else {
      oliviaRightArm.rotation.x = THREE.MathUtils.damp(oliviaRightArm.rotation.x, Math.sin(elapsed * 1.8) * 0.08, 6, dt);
      oliviaRightArm.rotation.z = THREE.MathUtils.damp(oliviaRightArm.rotation.z, 0.04, 6, dt);
      oliviaLeftArm.rotation.x = THREE.MathUtils.damp(oliviaLeftArm.rotation.x, -Math.sin(elapsed * 1.8) * 0.06, 6, dt);
    }

    // Animate the 3 collectible items on their pedestals
    (['monster_radar', 'circus_pistol', 'circus_gloves'] as ShopItemId[]).forEach((id, idx) => {
      const slot = itemSlots[id];
      const isSelected = selectedItem === id;
      const isHovered = hoveredItem === id;
      const targetLift = isSelected ? 0.54 : isHovered ? 0.5 : 0.41;
      const bob = Math.sin(elapsed * 2.4 + idx * 1.9) * (isSelected ? 0.045 : 0.025);
      slot.floatGroup.position.y = THREE.MathUtils.damp(slot.floatGroup.position.y, targetLift + bob, 7, dt);
      slot.floatGroup.rotation.y += dt * (isSelected ? 0.95 : 0.35);

      const targetScale = isSelected ? 1.14 : isHovered ? 1.09 : 1.0;
      const nextScale = THREE.MathUtils.damp(slot.floatGroup.scale.x, targetScale, 8, dt);
      slot.floatGroup.scale.setScalar(nextScale);

      const targetEmissive = isSelected ? 1.85 : isHovered ? 1.3 : 0.35;
      slot.ringMat.emissiveIntensity = THREE.MathUtils.damp(slot.ringMat.emissiveIntensity, targetEmissive, 8, dt);
      slot.accentLight.intensity = THREE.MathUtils.damp(slot.accentLight.intensity, isSelected ? 1.95 : isHovered ? 1.25 : 0.4, 8, dt);

      if (slot.radarSweep) {
        slot.radarSweep.rotation.z -= dt * (isSelected ? 3.2 : 1.6);
      }
    });

    // Update Celebration Confetti Burst
    for (const p of confettiPool) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.mesh.visible = false;
        continue;
      }
      p.vel.y -= 5.4 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += p.spin.x * dt;
      p.mesh.rotation.y += p.spin.y * dt;
      p.mesh.scale.setScalar(Math.min(1, p.life * 2.2));
    }

    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      rafId = requestAnimationFrame(tick);
    }
  };

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }
  rafId = requestAnimationFrame(tick);

  return {
    selectItem: (itemId: ShopItemId) => {
      selectedItem = itemId;
      focusTargetX = ITEM_POSITIONS[itemId] * 0.35;
      oliviaWaveTimer = Math.max(oliviaWaveTimer, 0.55);
    },
    triggerPurchaseFx: (itemId: ShopItemId) => {
      selectedItem = itemId;
      focusTargetX = ITEM_POSITIONS[itemId] * 0.35;
      oliviaWaveTimer = 1.6;
      const originX = ITEM_POSITIONS[itemId];
      for (let i = 0; i < confettiPool.length; i++) {
        const p = confettiPool[i];
        p.mesh.position.set(originX, 1.55, 0.24);
        const angle = (i / confettiPool.length) * Math.PI * 2 + Math.random() * 0.3;
        const speed = 1.1 + Math.random() * 1.4;
        p.vel.set(Math.cos(angle) * speed, 1.8 + Math.random() * 1.8, Math.sin(angle) * speed);
        p.spin.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, 0);
        p.life = 1.05 + Math.random() * 0.35;
        p.mesh.visible = true;
      }
    },
    resetCamera: () => {
      userDragging = false;
      focusTargetX = 0;
      camera.position.set(0, 2.38, 4.78);
      controls.target.set(0, 1.5, -0.2);
      controls.update();
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      controls.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite) {
          if (obj instanceof THREE.Mesh) obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) {
            if (m && typeof m.dispose === 'function') m.dispose();
          }
        }
      });
      for (const tex of texturesToDispose) {
        tex.dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    }
  };
}
