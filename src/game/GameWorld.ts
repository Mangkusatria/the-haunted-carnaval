/**
 * Central Three.js Game World for Jacky's Carnival: Circus Horror
 * Coordinates scene, renderer, player physics, WASD+Shift+C+F+E controls,
 * 30s countdown, 3D lockers, 20 collectible boxes, Jacky AI, and Bot companions!
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CircusMap } from './circusMap';
import { CircusMaze } from './circusMaze';
import { JackyMonster } from './jackyMonster';
import { JestyMonster } from './jestyMonster';
import { BotManager } from './botCompanion';
import {
  GameStatus,
  ChapterMode,
  DeviceMode,
  ObjectiveState,
  PlayerStats,
  CollectibleBox,
  InterrogationPrompt,
  BotCompanionState,
  MazeMachine,
  MachineSkillCheckState,
  MazeObjectiveState,
  PrisonCageState,
  WhistleState,
  JestyTracker
} from '../types';
import { horrorAudio } from '../audio/HorrorAudio';
import { ProceduralTextures } from './proceduralTextures';

export interface LockerItem {
  id: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  isOccupied: boolean;
  mesh: THREE.Group;
}

export class GameWorld {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private isSoftwareGl: boolean = false;

  // Components
  public circusMap: CircusMap;
  public jacky: JackyMonster;
  public botManager: BotManager;

  // Player State
  public player: PlayerStats = {
    health: 100,
    stamina: 100,
    isSprinting: false,
    isCrouching: false,
    isHiding: false,
    flashlightOn: true,
    flashlightBattery: 100,
    x: 0,
    y: 1.7,
    z: -100,
    rotationY: 0,
    graceTimer: 0
  };

  // 30-second Countdown timer before Jacky starts hunting
  public startCountdown: number = 30.0;
  public isHuntingStarted: boolean = false;

  // Objectives
  public objectives: ObjectiveState = {
    boxesTotal: 20,
    boxesCollected: 0,
    gateUnlocked: false,
    escaped: false
  };

  // Lockers for hiding
  public lockers: LockerItem[] = [];
  public currentLocker: LockerItem | null = null;
  public nearbyLocker: LockerItem | null = null;
  public nearbyBox: CollectibleBox | null = null;

  // Lights, Flashlight & Blood Sky
  public playerFlashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;
  public isBloodSky: boolean = false;
  private moonKey: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private bloodMoonMesh: THREE.Mesh;

  // Controls & Movement: PC (WASD + Mouse) & Mobile Android (Analog Joystick + Touch Look)
  public deviceMode: DeviceMode = 'PC';
  public keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false
  };
  public joystickInput: { x: number; y: number } = { x: 0, y: 0 };
  public mobileSprintActive: boolean = false;
  private activeLookTouchId: number | null = null;
  private lastTouchLookX: number = 0;
  private lastTouchLookY: number = 0;
  private isMouseDown: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  public cameraPitch: number = 0;
  public cameraYaw: number = 0;
  public isThirdPerson: boolean = false;
  private lastInteractTime: number = 0;

  // Interrogation & Betrayal State
  public activeInterrogation: InterrogationPrompt | null = null;
  public betrayedBotId: string | null = null;
  public betrayalWarning: {
    botName: string;
    victimName: string;
    isPlayerTarget: boolean;
    timer: number;
  } | null = null;

  // Leap landing indicator & screen shake
  public landingIndicatorGroup: THREE.Group;
  private landingRingOuter: THREE.Mesh;
  private landingRingInner: THREE.Mesh;
  private landingBeacon: THREE.Mesh;
  public screenShakeIntensity: number = 0;

  // Dying Bot 5-second Jacky Location Tracker
  public jackyTracker: {
    active: boolean;
    timer: number;
    botName: string;
    zoneName: string;
    x: number;
    z: number;
  } | null = null;
  private jackyBeaconBeam: THREE.Mesh;

  // Game Loop
  private clock: THREE.Clock = new THREE.Clock();
  private frameId: number = 0;
  public gameStatus: GameStatus = 'PLAYING';
  public chapter: ChapterMode = 'FAIRGROUND';
  public circusMaze: CircusMaze | null = null;
  public nearbyMazeExit: boolean = false;
  private stateUpdateTimer: number = 0;
  private fairgroundLockers: LockerItem[] = [];
  private fairgroundLockerGroups: THREE.Group[] = [];

  // Chapter 2: The Circus Maze & Jesty the Clown (20 Machines + Calibration Puzzle)
  public jesty: JestyMonster | null = null;
  public mazeObjectives: MazeObjectiveState = {
    machinesTotal: 20,
    machinesFixed: 0,
    keysTotal: 20,
    keysCollected: 0,
    exitUnlocked: false,
    escaped: false
  };
  public prisonCage: PrisonCageState = {
    x: 0,
    z: -16,
    playerImprisoned: false,
    imprisonedBotIds: [],
    rescuingBotId: null,
    rescueProgress: 0
  };
  public whistle: WhistleState = {
    cooldownTimer: 0,
    activeRippleTime: 0,
    highlightedBotId: null,
    highlightedBotName: null,
    highlightedBotDistance: 0,
    highlightTimer: 0
  };
  public jestyTracker: JestyTracker | null = null;
  public nearbyMachine: MazeMachine | null = null;
  public repairingMachineId: number | null = null;
  public skillCheck: MachineSkillCheckState = {
    active: false,
    machineId: 0,
    needleAngle: 0,
    zoneStartAngle: 120,
    zoneSizeAngle: 60,
    speedDegPerSec: 245,
    feedbackText: null,
    feedbackType: null,
    feedbackTimer: 0
  };
  private nextSkillCheckTimer: number = 2.0;
  public somethingComingTimer: number = 0;
  private somethingComingCooldown: number = 0;
  public nearbyCageUnlock: boolean = false;
  public nearbyMazeMap: boolean = false;
  public nearbyCheatButton: boolean = false;
  public isCheatMenuOpen: boolean = false;
  public showMazeMapOverlay: boolean = false;
  private botWhistleTimer: number = 25.0;
  private rescueWatchdogTimer: number = 0;
  private playerStepTimer: number = 0;

  // Reward Item: Pistol Sirkus (Single-use per item, earned every victory)
  public circusPistolCount: number = 0;
  public pistolFeedback: { textId: string; textEn: string; type: 'HIT' | 'MISS'; timer: number } | null = null;
  private pistolTracerMesh: THREE.Mesh;
  private pistolTracerTimer: number = 0;

  // Callbacks to UI
  public onStateUpdate?: () => void;
  public onPistolCountChange?: (newCount: number) => void;
  public onCheatMenuOpened?: () => void;
  public onInterrogationTriggered?: (prompt: InterrogationPrompt) => void;
  public onGameOver?: (reason: string) => void;
  public onVictory?: () => void;
  public onCarCutsceneTriggered?: () => void;
  public onMazeEscapeCutsceneTriggered?: () => void;
  public onMazeVictory?: () => void;

  constructor(container: HTMLElement, botCount: number = 6) {
    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize Three.js Scene & Camera (750m far plane so Giant Labyrinth Tent is visible from Fairground!)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06080e);
    // Atmospheric nocturnal carnival fog tuned to show Giant Tent silhouette far North
    this.scene.fog = new THREE.FogExp2(0x080a14, 0.0085);

    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 750);
    this.camera.position.set(0, 1.7, -100);

    // 3. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !this.isSoftwareGl
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 4. RoomEnvironment for Metallic PBR Reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting: Moonlit Key Light + Cool Hemisphere Fill
    this.moonKey = new THREE.DirectionalLight(0x7088b0, 0.7);
    this.moonKey.position.set(40, 80, 50);
    this.moonKey.castShadow = !this.isSoftwareGl;
    this.moonKey.shadow.mapSize.width = 1024;
    this.moonKey.shadow.mapSize.height = 1024;
    this.moonKey.shadow.camera.near = 10;
    this.moonKey.shadow.camera.far = 250;
    const d = 100;
    this.moonKey.shadow.camera.left = -d;
    this.moonKey.shadow.camera.right = d;
    this.moonKey.shadow.camera.top = d;
    this.moonKey.shadow.camera.bottom = -d;
    this.scene.add(this.moonKey);

    this.hemiLight = new THREE.HemisphereLight(0x1a2638, 0x0d0d12, 0.45);
    this.scene.add(this.hemiLight);

    // 5.5 Giant Blood Moon (Visible when Blood Sky is triggered!)
    const bloodMoonGeo = new THREE.SphereGeometry(22, 24, 24);
    const bloodMoonMat = new THREE.MeshBasicMaterial({ color: 0xee1111 });
    this.bloodMoonMesh = new THREE.Mesh(bloodMoonGeo, bloodMoonMat);
    this.bloodMoonMesh.position.set(0, 115, -170);
    this.bloodMoonMesh.visible = false;
    this.scene.add(this.bloodMoonMesh);

    // 6. Player Flashlight
    this.playerFlashlight = new THREE.SpotLight(0xfff5e6, 3.8, 38, Math.PI / 4.5, 0.25, 1.2);
    this.playerFlashlight.position.set(0, 1.6, -100);
    this.playerFlashlight.castShadow = !this.isSoftwareGl;
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 1.6, -90);
    this.scene.add(this.flashlightTarget);
    this.playerFlashlight.target = this.flashlightTarget;
    this.scene.add(this.playerFlashlight);

    // 7. Circus Map + Distant Giant Labyrinth Tent (physically separate at z = -280)
    this.circusMap = new CircusMap();
    this.scene.add(this.circusMap.group);

    this.circusMaze = new CircusMaze();
    this.circusMaze.setChapterMode(false);
    this.scene.add(this.circusMaze.group);

    // 8. Jacky Monster (Starts in Big Top Center tent, winding up)
    this.jacky = new JackyMonster(0, 0);
    this.jacky.onScreenShake = (intensity: number) => {
      this.screenShakeIntensity = intensity;
    };
    this.scene.add(this.jacky.group);

    // 8.1 3D Leap Landing Indicator
    this.landingIndicatorGroup = new THREE.Group();
    this.landingIndicatorGroup.visible = false;

    // Red pulsating landing ring
    const ringGeo = new THREE.RingGeometry(3.0, 3.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    this.landingRingOuter = new THREE.Mesh(ringGeo, ringMat);
    this.landingRingOuter.rotation.x = -Math.PI / 2;
    this.landingIndicatorGroup.add(this.landingRingOuter);

    // Inner contracting ring
    const innerRingGeo = new THREE.RingGeometry(0.1, 2.9, 32);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    this.landingRingInner = new THREE.Mesh(innerRingGeo, innerRingMat);
    this.landingRingInner.rotation.x = -Math.PI / 2;
    this.landingIndicatorGroup.add(this.landingRingInner);

    // High vertical beacon cylinder pointing up to the sky
    const beamGeo = new THREE.CylinderGeometry(0.2, 0.4, 60, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xff2222,
      transparent: true,
      opacity: 0.4
    });
    this.landingBeacon = new THREE.Mesh(beamGeo, beamMat);
    this.landingBeacon.position.y = 30;
    this.landingIndicatorGroup.add(this.landingBeacon);

    this.scene.add(this.landingIndicatorGroup);

    // 8.2 Dying Bot Tracker Beacon Beam above Jacky
    const trackerBeamGeo = new THREE.CylinderGeometry(0.3, 0.6, 75, 16);
    const trackerBeamMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.7
    });
    this.jackyBeaconBeam = new THREE.Mesh(trackerBeamGeo, trackerBeamMat);
    this.jackyBeaconBeam.position.y = 37.5;
    this.jackyBeaconBeam.visible = false;
    this.jacky.group.add(this.jackyBeaconBeam);

    // 8.3 Pre-allocated Pistol Sirkus 3D Neon Stun Tracer Beam
    const tracerGeo = new THREE.CylinderGeometry(0.06, 0.14, 1, 8);
    tracerGeo.translate(0, 0.5, 0);
    tracerGeo.rotateX(Math.PI / 2);
    const tracerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9
    });
    this.pistolTracerMesh = new THREE.Mesh(tracerGeo, tracerMat);
    this.pistolTracerMesh.visible = false;
    this.scene.add(this.pistolTracerMesh);

    // 9. Bot Companion Survivors
    this.botManager = new BotManager(botCount);
    this.scene.add(this.botManager.group);

    // 10. Build 3D Carnival Lockers
    this.buildLockers();

    // 11. Event Listeners
    this.setupControls();
    window.addEventListener('resize', this.onResize);

    // Start Audio
    horrorAudio.init();

    // Pre-compile all active scene shaders once before gameplay begins
    this.renderer.compile(this.scene, this.camera);

    // Start Loop
    this.startLoop();
  }

  /**
   * Build 8 interactive 3D Carnival Lockers around the map
   */
  private buildLockers(): void {
    const woodTex = ProceduralTextures.getWood();
    const lockerMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.7 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });

    const lockerLocations = [
      { id: 'l1', x: -12, z: -110, rot: 0 },
      { id: 'l2', x: 22, z: -18, rot: -Math.PI / 2 },
      { id: 'l3', x: -22, z: 18, rot: Math.PI / 2 },
      { id: 'l4', x: 72, z: -48, rot: 0 },
      { id: 'l5', x: 88, z: 90, rot: Math.PI },
      { id: 'l6', x: -84, z: -92, rot: 0 },
      { id: 'l7', x: -88, z: 42, rot: Math.PI / 2 },
      { id: 'l8', x: 110, z: -10, rot: -Math.PI / 2 }
    ];

    lockerLocations.forEach((loc) => {
      const g = new THREE.Group();
      g.position.set(loc.x, 0, loc.z);
      g.rotation.y = loc.rot;

      // Outer wardrobe frame
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, 1.2), lockerMat);
      box.position.y = 1.4;
      g.add(box);

      // Louvers / Slits on door
      const louverMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
      for (let s = 0; s < 5; s++) {
        const slit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.02), louverMat);
        slit.position.set(0, 1.6 + s * 0.18, 0.61);
        g.add(slit);
      }

      // Handle
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 6), metalMat);
      handle.position.set(0.5, 1.4, 0.65);
      g.add(handle);

      this.scene.add(g);
      this.fairgroundLockerGroups.push(g);
      this.circusMap.colliders.push({ x: loc.x, z: loc.z, radius: 1.2 });
      this.circusMap.hidingSpots.push({ x: loc.x, z: loc.z, name: 'Lemari Sirkus' });

      const lockerItem: LockerItem = {
        id: loc.id,
        x: loc.x,
        y: 0,
        z: loc.z,
        rotationY: loc.rot,
        isOccupied: false,
        mesh: g
      };
      this.lockers.push(lockerItem);
      this.fairgroundLockers.push(lockerItem);
    });
  }

  private setupControls(): void {
    window.addEventListener('keydown', (e) => {
      const targetTag = (e.target as HTMLElement | null)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || this.isCheatMenuOpen) {
        return;
      }

      horrorAudio.resume();

      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';

      // W: Maju (Forward)
      if (code === 'KeyW' || key === 'w' || code === 'ArrowUp') {
        this.keys.forward = true;
      }
      // S: Mundur (Backward)
      if (code === 'KeyS' || key === 's' || code === 'ArrowDown') {
        this.keys.backward = true;
      }
      // A: Ke Kiri (Left)
      if (code === 'KeyA' || key === 'a' || code === 'ArrowLeft') {
        this.keys.left = true;
      }
      // D: Ke Kanan (Right)
      if (code === 'KeyD' || key === 'd' || code === 'ArrowRight') {
        this.keys.right = true;
      }
      // Shift: Sprint / Lari
      if (e.shiftKey || code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') {
        this.keys.sprint = true;
      }

      // F: Senter
      if (code === 'KeyF' || key === 'f') {
        this.toggleFlashlight();
        return;
      }

      // E: Interaksi (Ambil kotak / ambil kunci / sembunyi di lemari / buka pintu)
      if (code === 'KeyE' || key === 'e') {
        this.handleInteract();
        return;
      }

      // G: Bersiul (Whistle) - Cooldown 20 detik
      if (code === 'KeyG' || key === 'g') {
        this.triggerWhistle();
        return;
      }

      // Q: Tembak Pistol Sirkus (Stun Monster sekali pakai)
      if (code === 'KeyQ' || key === 'q') {
        this.fireCircusPistol();
        return;
      }

      // Backspace: Kalibrasi Skill Check Mesin Labirin!
      if (code === 'Backspace') {
        if (this.gameStatus === 'PLAYING' || this.gameStatus === 'MAZE_PLAYING') {
          e.preventDefault();
        }
        if (this.chapter === 'MAZE' && this.skillCheck.active) {
          this.handleSkillCheckBackspace();
        }
        return;
      }

      // C: Jongkok (Crouch)
      if (code === 'KeyC' || key === 'c') {
        this.player.isCrouching = !this.player.isCrouching;
        return;
      }

      // V: Toggle sudut pandang kamera (1st Person / 3rd Person)
      if (code === 'KeyV' || key === 'v') {
        this.isThirdPerson = !this.isThirdPerson;
        return;
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';

      if (code === 'KeyW' || key === 'w' || code === 'ArrowUp') {
        this.keys.forward = false;
      }
      if (code === 'KeyS' || key === 's' || code === 'ArrowDown') {
        this.keys.backward = false;
      }
      if (code === 'KeyA' || key === 'a' || code === 'ArrowLeft') {
        this.keys.left = false;
      }
      if (code === 'KeyD' || key === 'd' || code === 'ArrowRight') {
        this.keys.right = false;
      }
      if (!e.shiftKey && (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift')) {
        this.keys.sprint = false;
      }
    });

    // Pointer Lock, Mouse Drag & Mobile Touch Drag Looking
    const canvas = this.renderer.domElement;
    canvas.addEventListener('click', () => {
      if (this.deviceMode === 'PC' && (this.gameStatus === 'PLAYING' || this.gameStatus === 'MAZE_PLAYING')) {
        try {
          canvas.requestPointerLock?.();
        } catch {}
      }
    });

    canvas.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.gameStatus !== 'PLAYING' && this.gameStatus !== 'MAZE_PLAYING') return;

      const sens = 0.0024;
      if (document.pointerLockElement === canvas) {
        this.cameraYaw -= e.movementX * sens;
        this.cameraPitch -= e.movementY * sens;
        this.cameraPitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.cameraPitch));
      } else if (this.isMouseDown) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.cameraYaw -= dx * sens;
        this.cameraPitch -= dy * sens;
        this.cameraPitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.cameraPitch));
      }
    });

    canvas.addEventListener('touchstart', (e) => {
      horrorAudio.resume();
      if (this.gameStatus !== 'PLAYING' && this.gameStatus !== 'MAZE_PLAYING') return;
      if (this.activeLookTouchId === null && e.changedTouches.length > 0) {
        const t = e.changedTouches[0];
        this.activeLookTouchId = t.identifier;
        this.lastTouchLookX = t.clientX;
        this.lastTouchLookY = t.clientY;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (this.gameStatus !== 'PLAYING' && this.gameStatus !== 'MAZE_PLAYING') return;
      if (this.activeLookTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === this.activeLookTouchId) {
          const dx = t.clientX - this.lastTouchLookX;
          const dy = t.clientY - this.lastTouchLookY;
          this.lastTouchLookX = t.clientX;
          this.lastTouchLookY = t.clientY;
          const touchSens = 0.0042;
          this.cameraYaw -= dx * touchSens;
          this.cameraPitch -= dy * touchSens;
          this.cameraPitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.cameraPitch));
          break;
        }
      }
    }, { passive: true });

    const endTouchLook = (e: TouchEvent) => {
      if (this.activeLookTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.activeLookTouchId) {
          this.activeLookTouchId = null;
          break;
        }
      }
    };
    canvas.addEventListener('touchend', endTouchLook, { passive: true });
    canvas.addEventListener('touchcancel', endTouchLook, { passive: true });
  }

  public toggleFlashlight(): void {
    if (this.player.flashlightBattery <= 0) return;
    this.player.flashlightOn = !this.player.flashlightOn;
    this.playerFlashlight.intensity = (this.player.flashlightOn && !this.player.isHiding) ? 3.8 : 0;
    horrorAudio.playFlashlightClick(this.player.flashlightOn);
  }

  /**
   * Interact (E key): Pick up box or enter/exit locker
   */
  public handleInteract(): void {
    const now = performance.now();
    if (now - this.lastInteractTime < 350) return;
    this.lastInteractTime = now;

    // 1. If currently inside a locker, EXIT locker!
    if (this.player.isHiding && this.currentLocker) {
      const locker = this.currentLocker;
      locker.isOccupied = false;
      this.player.isHiding = false;

      // Teleport safely to the FRONT of the locker (outside the 1.2m collider + 0.7m radius)
      // Front direction vector = (sin(rotationY), cos(rotationY))
      const exitDist = 2.5;
      const frontX = Math.sin(locker.rotationY);
      const frontZ = Math.cos(locker.rotationY);

      this.player.x = locker.x + frontX * exitDist;
      this.player.z = locker.z + frontZ * exitDist;
      this.cameraYaw = locker.rotationY; // Face outward from the locker

      // Immediately update camera position to avoid 1-frame position lag
      this.camera.position.set(this.player.x, this.player.y, this.player.z);

      this.currentLocker = null;
      this.nearbyLocker = null; // Clear so player does not immediately re-enter
      this.playerFlashlight.intensity = this.player.flashlightOn ? 3.8 : 0;

      horrorAudio.playFlashlightClick(false);
      return;
    }

    // 2. If near a locker, ENTER locker!
    if (this.nearbyLocker && !this.nearbyLocker.isOccupied) {
      this.stopRepairingMachine();
      this.currentLocker = this.nearbyLocker;
      this.currentLocker.isOccupied = true;
      this.player.isHiding = true;
      this.player.x = this.nearbyLocker.x;
      this.player.z = this.nearbyLocker.z;
      this.nearbyLocker = null;
      this.playerFlashlight.intensity = 0; // Hide flashlight beam inside locker
      // Jacky immediately turns around and targets another exposed bot (NEVER freezes or camps!)
      this.jacky.onPlayerHidInLocker(this.botManager.bots, this.player.x, this.player.z);
      horrorAudio.playFlashlightClick(true);
      return;
    }

    // 3. Chapter 2: Inspect Start Maze Map Board OR Start/Stop repairing a Circus Machine!
    if (this.chapter === 'MAZE' && this.circusMaze) {
      if (this.showMazeMapOverlay || this.nearbyMazeMap) {
        this.showMazeMapOverlay = !this.showMazeMapOverlay;
        if (this.onStateUpdate) this.onStateUpdate();
        return;
      }
      if (this.repairingMachineId !== null) {
        this.stopRepairingMachine();
        return;
      }
      if (this.nearbyMachine && !this.nearbyMachine.fixed) {
        this.startRepairingMachine(this.nearbyMachine.id);
        return;
      }
    }

    // 4. Chapter 2: If near Prison Cage padlock, RESCUE trapped companion bots!
    if (this.chapter === 'MAZE' && this.circusMaze && this.nearbyCageUnlock) {
      if (this.prisonCage.imprisonedBotIds.length > 0) {
        const freedIds = [...this.prisonCage.imprisonedBotIds];
        this.prisonCage.imprisonedBotIds = [];
        this.circusMaze.setPrisonGateOpen(true);
        const dropPos = this.circusMaze.prisonDropOffPosition;
        this.botManager.bots.forEach((b, bIdx) => {
          if (freedIds.includes(b.id)) {
            b.state = 'SEARCHING';
            b.x = dropPos.x + (bIdx % 2 === 0 ? -1 : 1);
            b.z = dropPos.z + 1.2;
            b.hideCooldown = 8.0;
          }
        });
        horrorAudio.playPrisonRescueUnlock();
        this.botManager.addChatMessage(
          'Player (Anda)',
          '#10b981',
          `Aku membuka gembok penjara sirkus! Kalian semua bebas!`,
          `I unlocked the circus prison! You're all free!`,
          'INFO'
        );
      }
      return;
    }

    // 5. Chapter 2: If near Grand Golden Exit Door and unlocked, ESCAPE via Getaway Car Cutscene!
    if (this.chapter === 'MAZE' && this.nearbyMazeExit) {
      if (this.mazeObjectives.exitUnlocked || this.mazeObjectives.machinesFixed >= 20) {
        this.triggerMazeEscapeCutscene();
        return;
      }
    }

    // 6. Chapter 1: If near a collectible Jack-in-the-box, COLLECT it!
    if (this.chapter === 'FAIRGROUND' && this.nearbyBox && !this.nearbyBox.collected) {
      this.collectBox(this.nearbyBox.id, 'PLAYER');
      return;
    }

    // 6.5. Chapter 1: Secret Cheat Console at the corner edge near Midway game booths
    if (this.chapter === 'FAIRGROUND' && this.nearbyCheatButton) {
      this.isCheatMenuOpen = true;
      this.keys = { forward: false, backward: false, left: false, right: false, sprint: false };
      this.joystickInput = { x: 0, y: 0 };
      try {
        document.exitPointerLock?.();
      } catch {}
      horrorAudio.playBoxCollectChime();
      this.onCheatMenuOpened?.();
      return;
    }

    // 7. Chapter 1: If at North Exit Gate and all 20 boxes collected, ESCAPE via Getaway Car!
    if (this.chapter === 'FAIRGROUND' && this.objectives.gateUnlocked) {
      const distToGate = Math.hypot(this.player.x - 0, this.player.z - (-115));
      if (distToGate < 8) {
        this.triggerCarCutscene();
      }
    }
  }

  public collectBox(boxId: number, collector: 'PLAYER' | string): void {
    const box = this.circusMap.collectibleBoxes.find(b => b.id === boxId);
    if (!box || box.collected) return;

    box.collected = true;
    box.collectedBy = collector;
    this.objectives.boxesCollected++;

    // Hide mesh
    const mesh = this.circusMap.boxMeshes[boxId - 1];
    if (mesh) {
      mesh.visible = false;
    }

    horrorAudio.playBoxCollectChime();

    if (collector === 'PLAYER') {
      this.botManager.addChatMessage(
        'Player (Anda)',
        '#60a5fa',
        `Aku menemukan satu kotak Jack-in-the-Box di ${box.zone}! [${this.objectives.boxesCollected}/20]`,
        `I found a Jack-in-the-Box item at ${box.zone}! [${this.objectives.boxesCollected}/20]`,
        'INFO'
      );
    }

    // Check for Victory / Blood Sky condition (all 20 collected!)
    if (this.objectives.boxesCollected >= this.objectives.boxesTotal && !this.objectives.gateUnlocked) {
      this.triggerBloodSky();
    }
  }

  /**
   * Catastrophic Blood Sky & Omniscient Jacky Event:
   * When all 20 boxes are collected and the gate unlocks, the sky turns blood red,
   * thick crimson fog covers the fairground, a giant Blood Moon appears,
   * and Jacky enters Omniscient mode knowing the exact location of all survivors!
   */
  public triggerBloodSky(): void {
    if (this.isBloodSky) return;
    this.isBloodSky = true;
    this.objectives.gateUnlocked = true;
    this.objectives.bloodSkyActive = true;
    this.circusMap.unlockExitGates();
    this.bloodMoonMesh.visible = true;

    // Shift scene background and fog to eerie blood red (still shows Giant Tent silhouette)
    this.scene.background = new THREE.Color(0x350404);
    this.scene.fog = new THREE.FogExp2(0x2a0303, 0.012);

    // Shift moon key light and ambient hemisphere to deep red
    this.moonKey.color.setHex(0xff1818);
    this.moonKey.intensity = 1.35;
    this.hemiLight.color.setHex(0x990f0f);
    this.hemiLight.groundColor.setHex(0x330000);

    // Apocalyptic sirens, thunderous rumble & psychotic chuckle
    horrorAudio.playBloodSkyRoar();

    // Broadcast urgent alarms in chat
    this.botManager.addChatMessage(
      'Sistem Sirkus',
      '#ef4444',
      `⚠️ SEMUA 20 KOTAK TERKUMPUL! GERBANG UTARA TERBUKA!`,
      `⚠️ ALL 20 BOXES COLLECTED! NORTH GATE IS UNLOCKED!`,
      'ALERT'
    );

    this.botManager.addChatMessage(
      'Jacky (Monster)',
      '#dc2626',
      `HEHEHEHE... LANGIT MERAH TELAH TURUN!! TIDAK ADA LAGI TEMPAT BERSEMBUNYI!! AKU MELIHAT KALIAN SEMUA!!`,
      `HEHEHEHE... THE BLOOD SKY HAS FALLEN!! NOWHERE TO HIDE!! I SEE EVERY SINGLE ONE OF YOU!!`,
      'WARNING'
    );

    setTimeout(() => {
      this.botManager.addChatMessage(
        'Teman Bot',
        '#f59e0b',
        `LANGITNYA JADI MERAH DARAH!! JACKY TAHU KITA SEMUA ADA DI MANA! JANGAN SEMBUNYI, LARI KE GERBANG UTARA SEKARANG!!`,
        `THE SKY TURNED BLOOD RED!! JACKY KNOWS WHERE WE ALL ARE! DON'T HIDE, RUN TO THE NORTH GATE NOW!!`,
        'PANIC'
      );
    }, 1200);
  }

  private startLoop(): void {
    const tick = () => {
      const delta = Math.min(0.1, this.clock.getDelta());
      const elapsed = this.clock.getElapsedTime();

      if ((this.gameStatus === 'PLAYING' || this.gameStatus === 'MAZE_PLAYING') && !this.isCheatMenuOpen) {
        this.updateGame(delta, elapsed);
      }

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        // Safe frame pacing on software WebGL
        window.setTimeout(() => {
          this.frameId = requestAnimationFrame(tick);
        }, 60);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };
    this.frameId = requestAnimationFrame(tick);
  }

  private updateGame(delta: number, elapsed: number): void {
    // 1. Initial 30-Second Grace Countdown before Jacky Hunts (Chapter 1)
    if (this.chapter === 'FAIRGROUND' && this.startCountdown > 0) {
      this.startCountdown -= delta;
      if (this.startCountdown <= 0) {
        this.startCountdown = 0;
        this.isHuntingStarted = true;
        // Jumpscare stinger & Jacky unleash sound!
        horrorAudio.playJackyJumpscare();
        this.botManager.addChatMessage(
          'Jacky (Monster)',
          '#dc2626',
          `HEHEHEHE... WAKTU SEMBUNYI HABIS! SIAP ATAU TIDAK, AKU DATANG MENCARIMU!!`,
          `HEHEHEHE... HIDING TIME IS OVER! READY OR NOT, HERE I COME!!`,
          'WARNING'
        );
      }
    }

    // Grace timer (after interrogation or rescue)
    if (this.player.graceTimer > 0) {
      this.player.graceTimer -= delta;
    }

    // Betrayal Alert Banner timer countdown
    if (this.betrayalWarning) {
      this.betrayalWarning.timer -= delta;
      if (this.betrayalWarning.timer <= 0) {
        this.betrayalWarning = null;
      }
    }

    // Pistol Sirkus feedback & tracer beam decay
    if (this.pistolFeedback) {
      this.pistolFeedback.timer -= delta;
      if (this.pistolFeedback.timer <= 0) {
        this.pistolFeedback = null;
      }
    }
    if (this.pistolTracerTimer > 0) {
      this.pistolTracerTimer -= delta;
      (this.pistolTracerMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, this.pistolTracerTimer * 3.5);
      if (this.pistolTracerTimer <= 0) {
        this.pistolTracerMesh.visible = false;
      }
    }

    // Blood Sky dynamic crimson pulse & North Gate escape check (Chapter 1)
    if (this.chapter === 'FAIRGROUND' && this.isBloodSky) {
      const bloodPulse = Math.sin(elapsed * 2.8) * 0.05;
      (this.scene.background as THREE.Color).setRGB(0.20 + bloodPulse * 0.04, 0.02, 0.02);
      (this.scene.fog as THREE.FogExp2).color.setRGB(0.16 + bloodPulse * 0.03, 0.015, 0.015);

      // Auto check if player escapes through the open North Gate -> Getaway Car Cutscene!
      const distToGate = Math.hypot(this.player.x - 0, this.player.z - (-115));
      if (distToGate < 7.5 && this.objectives.gateUnlocked) {
        this.triggerCarCutscene();
        return;
      }
    }

    // Chapter 2 Red Inferno pulse when all 20 machines are fixed & exit is open
    if (this.chapter === 'MAZE' && this.mazeObjectives.exitUnlocked) {
      const firePulse = Math.sin(elapsed * 5.2) * 0.04;
      (this.scene.background as THREE.Color).setRGB(0.24 + firePulse, 0.025, 0.015);
      (this.scene.fog as THREE.FogExp2).color.setRGB(0.21 + firePulse, 0.02, 0.015);
    }

    // 2. Player Movement Physics (WASD, Shift, C) — disabled while hiding or clutched by Jesty
    if (!this.player.isHiding && !this.player.isCarriedByJesty) {
      this.updatePlayerMovement(delta);
    }

    // 3. Update Camera & Flashlight positions with screen shake support
    this.updateCamera(delta, elapsed);

    // ========================================================
    // CHAPTER 1: FAIRGROUND LOGIC
    // ========================================================
    if (this.chapter === 'FAIRGROUND') {
      // Update Circus Map Animations (Carousel, Ferris wheel, boxes)
      this.circusMap.update(delta, elapsed);

      // Update Jacky Monster AI
      if (this.isHuntingStarted) {
        this.jacky.update(
          delta,
          elapsed,
          this.player.x,
          this.player.z,
          this.player.isHiding,
          this.player.flashlightOn,
          this.botManager.bots,
          this.betrayedBotId,
          this.isBloodSky,
          this.player.graceTimer
        );

        // Update 3D Leap Landing Indicator
        if (this.jacky.info.isLeaping) {
          this.landingIndicatorGroup.visible = true;
          const targetX = this.jacky.info.leapTargetX ?? this.jacky.info.x;
          const targetZ = this.jacky.info.leapTargetZ ?? this.jacky.info.z;
          this.landingIndicatorGroup.position.set(targetX, 0.05, targetZ);
          this.landingRingOuter.rotation.z += delta * 3.0;
          const progress = Math.max(0, Math.min(1, this.jacky.info.leapProgress ?? 0));
          const scale = 1.0 - progress * 0.85;
          this.landingRingInner.scale.set(scale, scale, 1);
          this.landingBeacon.scale.y = 1.0 + Math.sin(elapsed * 12) * 0.25;
        } else {
          this.landingIndicatorGroup.visible = false;
        }

        // Update Dying Bot Jacky Location Tracker (5-second beacon)
        if (this.jackyTracker && this.jackyTracker.active) {
          this.jackyTracker.timer -= delta;
          this.jackyTracker.x = this.jacky.info.x;
          this.jackyTracker.z = this.jacky.info.z;
          const currentZone = this.circusMap.getZoneAt(this.jacky.info.x, this.jacky.info.z);
          this.jackyTracker.zoneName = currentZone.nameId;
          this.jackyBeaconBeam.visible = true;
          const pulse = 0.5 + Math.sin(elapsed * 14) * 0.4;
          (this.jackyBeaconBeam.material as THREE.MeshBasicMaterial).opacity = Math.max(0.2, pulse);

          if (this.jackyTracker.timer <= 0) {
            this.jackyTracker = null;
            this.jackyBeaconBeam.visible = false;
          }
        } else {
          this.jackyBeaconBeam.visible = false;
        }

        // Check if Jacky catches player! (NEVER catches while hiding, stunned, or airborne leaping)
        const distToJacky = Math.hypot(this.jacky.info.x - this.player.x, this.jacky.info.z - this.player.z);
        if (
          !this.player.isHiding &&
          this.jacky.stunTimer <= 0 &&
          distToJacky < 2.5 &&
          this.player.graceTimer <= 0 &&
          !this.jacky.info.isLeaping &&
          (this.jacky.info.state === 'ATTACKING' || (this.isBloodSky && this.jacky.info.targetType === 'PLAYER'))
        ) {
          this.handlePlayerCaptured();
        }

        // Check if Jacky catches ANY companion bot! (Ignore while airborne leaping or stunned)
        if (!this.jacky.info.isLeaping && this.jacky.stunTimer <= 0) {
          for (const bot of this.botManager.bots) {
            if (!bot.isAlive || bot.state === 'ESCAPED') continue;
            const bDist = Math.hypot(this.jacky.info.x - bot.x, this.jacky.info.z - bot.z);
            if (
              bDist < 2.4 &&
              (this.jacky.info.state === 'ATTACKING' ||
                (this.jacky.info.state === 'CHASING' && this.jacky.info.targetBotId === bot.id) ||
                (this.isBloodSky && this.jacky.info.targetBotId === bot.id))
            ) {
              this.handleBotCaptured(bot);
              break;
            }
          }
        }
      }

      // Update Bot Companions
      this.botManager.update(
        delta,
        elapsed,
        this.player.x,
        this.player.z,
        this.jacky.info.x,
        this.jacky.info.z,
        this.jacky.info.state,
        this.circusMap.collectibleBoxes,
        this.circusMap.hidingSpots,
        (boxId, botName) => this.collectBox(boxId, botName),
        this.isBloodSky
      );
    }

    // ========================================================
    // CHAPTER 2: CIRCUS LABYRINTH LOGIC (JESTY & 10 KEYS)
    // ========================================================
    if (this.chapter === 'MAZE') {
      // 1. Whistle cooldown, ripple, & 10-second nearest bot highlight timer
      if (this.whistle.cooldownTimer > 0) {
        this.whistle.cooldownTimer = Math.max(0, this.whistle.cooldownTimer - delta);
      }
      if (this.whistle.activeRippleTime > 0) {
        this.whistle.activeRippleTime = Math.max(0, this.whistle.activeRippleTime - delta);
      }
      if (this.whistle.highlightTimer > 0) {
        this.whistle.highlightTimer = Math.max(0, this.whistle.highlightTimer - delta);
        const hBot = this.botManager.bots.find(
          b => b.id === this.whistle.highlightedBotId && b.isAlive && b.state !== 'ESCAPED' && b.state !== 'IMPRISONED'
        );
        if (hBot && this.whistle.highlightTimer > 0) {
          this.whistle.highlightedBotDistance = Math.hypot(hBot.x - this.player.x, hBot.z - this.player.z);
        } else {
          this.whistle.highlightTimer = 0;
          this.whistle.highlightedBotId = null;
          this.whistle.highlightedBotName = null;
          this.whistle.highlightedBotDistance = 0;
        }
      }

      // 2. Surviving free bots occasionally whistle to locate each other (20-40s)
      this.botWhistleTimer -= delta;
      if (this.botWhistleTimer <= 0) {
        this.botWhistleTimer = 20.0 + Math.random() * 18.0;
        const freeBots = this.botManager.bots.filter(b => b.isAlive && b.state !== 'IMPRISONED' && b.state !== 'HIDING' && b.state !== 'ESCAPED');
        if (freeBots.length > 0) {
          const wb = freeBots[Math.floor(Math.random() * freeBots.length)];
          horrorAudio.playBotWhistleResponse();
          wb.currentDialog = `[Bersiul] *Fwhiiit!* Teman-teman, kalian di mana?`;
          wb.dialogTimer = 3.5;
        }
      }

      // 3. Update Circus Maze Machines animation & player repair puzzle
      if (this.circusMaze) {
        this.circusMaze.update(delta, elapsed);
      }

      if (this.somethingComingTimer > 0) {
        this.somethingComingTimer = Math.max(0, this.somethingComingTimer - delta);
      }
      if (this.somethingComingCooldown > 0) {
        this.somethingComingCooldown = Math.max(0, this.somethingComingCooldown - delta);
      }
      if ((this.skillCheck.feedbackTimer ?? 0) > 0) {
        this.skillCheck.feedbackTimer = Math.max(0, (this.skillCheck.feedbackTimer ?? 0) - delta);
        if (this.skillCheck.feedbackTimer <= 0) {
          this.skillCheck.feedbackText = null;
          this.skillCheck.feedbackType = null;
        }
      }

      // Active Machine Repair & Rotating White Bar Backspace Skill Check
      if (this.repairingMachineId !== null && this.circusMaze) {
        const machine = this.circusMaze.mazeMachines.find(m => m.id === this.repairingMachineId);
        const hasJoystickMove = Math.hypot(this.joystickInput.x, this.joystickInput.y) > 0.14;
        const isMoving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right || hasJoystickMove;
        if (!machine || machine.fixed || this.player.isImprisoned || this.player.isHiding || isMoving) {
          this.stopRepairingMachine();
        } else {
          // Steady base repair progress
          machine.progress = Math.min(100, machine.progress + delta * 10.5);

          // Trigger "ADA SESUATU YANG DATANG" if Jesty discovers/approaches player while repairing!
          if (this.jesty) {
            const distJestyPlayer = Math.hypot(this.jesty.info.x - this.player.x, this.jesty.info.z - this.player.z);
            const isTargetingUs = this.jesty.info.targetType === 'PLAYER' || distJestyPlayer < 22;
            if (this.jesty.info.activeMask === 'COMEDY' && isTargetingUs && distJestyPlayer < 25 && this.somethingComingCooldown <= 0) {
              this.somethingComingTimer = 4.0;
              this.somethingComingCooldown = 7.0;
              horrorAudio.playSomethingComingSting();
            }
          }

          if (machine.progress >= 100) {
            this.completeMazeMachine(machine.id, 'PLAYER');
          } else if (this.skillCheck.active) {
            // Rotate the white needle line continuously around the calibration bar
            this.skillCheck.needleAngle += this.skillCheck.speedDegPerSec * delta;
            if (this.skillCheck.needleAngle >= 410) {
              // Missed timing window completely -> failure!
              this.failPlayerMachineCheck(machine);
            }
          } else {
            this.nextSkillCheckTimer -= delta;
            if (this.nextSkillCheckTimer <= 0) {
              this.skillCheck.active = true;
              this.skillCheck.machineId = machine.id;
              this.skillCheck.needleAngle = 0;
              this.skillCheck.zoneStartAngle = 55 + Math.random() * 215;
              this.skillCheck.zoneSizeAngle = 56;
              this.skillCheck.speedDegPerSec = 235 + Math.random() * 55;
              horrorAudio.playSkillCheckTrigger();
            }
          }
        }
      }

      // 4. Update Jesty Monster AI & Surviving Bot Companions
      if (this.jesty && this.circusMaze) {
        const activeMaze = this.circusMaze;
        this.jesty.update(
          delta,
          elapsed,
          this.player.x,
          this.player.z,
          this.player.isHiding,
          Boolean(this.player.isImprisoned || this.player.isCarriedByJesty),
          this.player.graceTimer,
          this.botManager.bots,
          activeMaze,
          (deliveredType, deliveredId) => {
            const cagePos = activeMaze.prisonCagePosition;
            if (deliveredType === 'PLAYER') {
              this.player.isCarriedByJesty = false;
              this.player.isImprisoned = true;
              this.prisonCage.playerImprisoned = true;
              this.player.x = cagePos.x;
              this.player.z = cagePos.z;
              this.player.y = 1.7;
              this.cameraYaw = Math.PI;
              this.cameraPitch = 0;
              this.camera.position.set(cagePos.x, 1.7, cagePos.z);

              this.botManager.addChatMessage(
                'Jesty the Clown',
                '#ef4444',
                '🎭 HAHAHAHA! Masuk ke kurungan penjara sirkus, bocah nakal!',
                '🎭 HAHAHAHA! Into the circus prison cage you go!',
                'WARNING'
              );

              // Dispatch 1-4 surviving free companion bots to search for the prison cage & rescue player!
              this.dispatchMazeRescueTeam();
            } else if (deliveredType === 'BOT' && deliveredId) {
              const victim = this.botManager.bots.find(b => b.id === deliveredId);
              if (victim) {
                victim.state = 'IMPRISONED';
                victim.x = cagePos.x + (Math.random() - 0.5) * 1.8;
                victim.z = cagePos.z + (Math.random() - 0.5) * 1.8;
                if (!this.prisonCage.imprisonedBotIds.includes(victim.id)) {
                  this.prisonCage.imprisonedBotIds.push(victim.id);
                }
                this.jesty?.setRevealed(5.0);
                this.botManager.addChatMessage(
                  victim.name,
                  victim.color,
                  `TIDAK!! Jesty menjebloskanku ke dalam sangkar besi! Siapa saja tolong buka gemboknya!`,
                  `NO!! Jesty threw me into the iron cage! Someone unlock it!`,
                  'PANIC'
                );
                // Dispatch 1-4 free bots to search the prison and free the trapped teammate!
                this.dispatchMazeRescueTeam();
              }
            }
          },
          this.isPanicModeActive()
        );

        // Keep carried player tightly in Jesty's outstretched claws while walking to prison
        if (this.player.isCarriedByJesty) {
          if (this.jesty.info.state === 'CARRYING_VICTIM' && this.jesty.info.carryingVictimType === 'PLAYER') {
            const jx = this.jesty.info.x;
            const jz = this.jesty.info.z;
            const jRot = this.jesty.info.rotationY;
            this.player.x = jx + Math.sin(jRot) * 1.15;
            this.player.z = jz + Math.cos(jRot) * 1.15;
            this.player.y = 1.45 + Math.sin(elapsed * 14) * 0.08;
            this.cameraYaw = jRot;
            this.cameraPitch = -0.15;
          } else {
            this.player.isCarriedByJesty = false;
          }
        }

        // Jesty Capture Mechanics (Only when not stunned, wearing COMEDY mask & hands are empty!)
        if (this.jesty.stunTimer <= 0 && this.jesty.info.activeMask === 'COMEDY' && this.jesty.info.state !== 'CARRYING_VICTIM') {
          // A. Player capture check -> Grab into clutches, carry to prison!
          const distToPlayer = Math.hypot(this.jesty.info.x - this.player.x, this.jesty.info.z - this.player.z);
          if (
            distToPlayer < 2.2 &&
            !this.player.isHiding &&
            !this.player.isImprisoned &&
            !this.player.isCarriedByJesty &&
            this.player.graceTimer <= 0
          ) {
            this.stopRepairingMachine();
            this.player.isCarriedByJesty = true;
            this.jesty.captureVictim('PLAYER', null, 'Player (Anda)');
            this.botManager.addChatMessage(
              'Player (Anda)',
              '#ef4444',
              '✋ TOLONG!! Aku dicengkram Jesty dan sedang diseret menuju penjara sirkus!!',
              '✋ HELP!! Jesty grabbed me and is dragging me toward the circus prison!!',
              'PANIC'
            );
          } else {
            // B. Companion Bots capture check -> Grab into clutches, carry to prison!
            for (const bot of this.botManager.bots) {
              if (
                !bot.isAlive ||
                bot.state === 'HIDING' ||
                bot.state === 'IMPRISONED' ||
                bot.state === 'BEING_CARRIED' ||
                bot.state === 'ESCAPED'
              ) continue;
              const distToBot = Math.hypot(this.jesty.info.x - bot.x, this.jesty.info.z - bot.z);
              if (distToBot < 2.2) {
                bot.state = 'BEING_CARRIED';
                bot.targetMachineId = null;
                this.jesty.captureVictim('BOT', bot.id, bot.name);
                this.jesty.setRevealed(5.0);
                this.botManager.addChatMessage(
                  bot.name,
                  bot.color,
                  `✋ TIDAK!! Jesty mencengkramku dan menyeretku menuju kurungan penjara!!`,
                  `✋ NO!! Jesty grabbed me and is dragging me to the prison cage!!`,
                  'PANIC'
                );
                break;
              }
            }
          }
        }

        // Ensure 1-4 free bots keep searching for the prison whenever player or any bot is trapped
        if (this.player.isImprisoned || this.prisonCage.imprisonedBotIds.length > 0) {
          this.rescueWatchdogTimer -= delta;
          if (this.rescueWatchdogTimer <= 0) {
            this.rescueWatchdogTimer = 2.5;
            const activeRescuers = this.botManager.bots.filter(
              b => b.isAlive && b.state === 'RESCUING_PLAYER'
            );
            if (activeRescuers.length === 0) {
              this.dispatchMazeRescueTeam();
            }
          }
        }

        // 5. Update Surviving Bot Companions inside Maze (Visible meshes, BFS pathfinding, 20-machine repair, carry, flee & 1-4 bot rescue)
        this.botManager.updateMazeBots(
          delta,
          elapsed,
          this.circusMaze,
          this.jesty.info.x,
          this.jesty.info.z,
          this.jesty.info.rotationY,
          this.jesty.info.activeMask,
          Boolean(this.player.isImprisoned),
          this.prisonCage.imprisonedBotIds.length,
          this.mazeObjectives.exitUnlocked,
          this.whistle.highlightTimer > 0 ? this.whistle.highlightedBotId : null,
          (machineId, botName) => this.completeMazeMachine(machineId, botName),
          (failedMachine, botName) => {
            horrorAudio.playMachineFailExplosion();
            this.jesty?.investigateMachineFailure(failedMachine.x, failedMachine.z);
            const botObj = this.botManager.bots.find(b => b.name === botName);
            this.botManager.addChatMessage(
              botName,
              botObj?.color || '#f59e0b',
              `⚠️ KORSLETING!! Aku gagal kalibrasi ${failedMachine.name} — JESTY MENUJU KE SANA!!`,
              `⚠️ SHORT CIRCUIT!! I botched the calibration on ${failedMachine.name} — JESTY IS HEADING THERE!!`,
              'PANIC'
            );
          },
          (rescuer) => {
            if (!this.circusMaze) return;
            const drop = this.circusMaze.prisonDropOffPosition;
            this.circusMaze.setPrisonGateOpen(true);

            // Free imprisoned player if inside cage
            if (this.player.isImprisoned) {
              this.player.isImprisoned = false;
              this.player.isCarriedByJesty = false;
              this.prisonCage.playerImprisoned = false;
              this.player.x = drop.x;
              this.player.z = drop.z + 1.0;
              this.cameraYaw = Math.PI;
              this.camera.position.set(this.player.x, this.player.y, this.player.z);
              this.player.graceTimer = 6.0;
            }

            // Free any imprisoned companion bots inside cage too
            if (this.prisonCage.imprisonedBotIds.length > 0) {
              const freedIds = [...this.prisonCage.imprisonedBotIds];
              this.prisonCage.imprisonedBotIds = [];
              this.botManager.bots.forEach((b, bIdx) => {
                if (freedIds.includes(b.id)) {
                  b.state = 'SEARCHING';
                  b.x = drop.x + (bIdx % 2 === 0 ? -1.0 : 1.0);
                  b.z = drop.z + 1.0;
                  b.hideCooldown = 7.0;
                }
              });
            }

            // Release other rescuers back to machine hunting
            this.botManager.bots.forEach(b => {
              if (b.isAlive && b.state === 'RESCUING_PLAYER') {
                b.state = 'SEARCHING';
              }
            });
            this.prisonCage.rescuingBotId = null;

            horrorAudio.playPrisonRescueUnlock();
            this.botManager.addChatMessage(
              rescuer.name,
              rescuer.color,
              `🔓 Aku berhasil menemukan penjara dan membuka gemboknya! Semua tahanan bebas, cepat lari!`,
              `🔓 I found the prison cage and unlocked it! Everyone inside is free, run!`,
              'INFO'
            );
          },
          (escapedBot) => {
            horrorAudio.playMazeDoorUnlock();
            this.botManager.addChatMessage(
              escapedBot.name,
              escapedBot.color,
              `AKU BERHASIL KELUAR DARI LABIRIN SIRKUS!! CEPAT KE PINTU UTARA!!`,
              `I ESCAPED THE CIRCUS LABYRINTH!! HURRY TO THE NORTH EXIT!!`,
              'INFO'
            );
          }
        );

        // 6. Check Game Over: Player is imprisoned and ALL companion bots are dead, imprisoned, carried, or escaped!
        if (this.player.isImprisoned) {
          const aliveFreeBots = this.botManager.bots.filter(
            b => b.isAlive && b.state !== 'IMPRISONED' && b.state !== 'BEING_CARRIED' && b.state !== 'ESCAPED'
          );
          if (aliveFreeBots.length === 0) {
            horrorAudio.stopMazeEscapeSiren();
            this.gameStatus = 'GAMEOVER';
            horrorAudio.playJackyJumpscare();
            if (this.onGameOver) {
              this.onGameOver('Semua rekan bot telah kabur atau terkurung meninggalkanmu sendirian di dalam penjara labirin selamanya!');
            }
            return;
          }
        }

        // 7. Auto check if player walks through the open North Grand Exit Gate -> Escape Car Cutscene!
        if (
          (this.mazeObjectives.exitUnlocked || this.mazeObjectives.machinesFixed >= 20) &&
          !this.player.isImprisoned &&
          !this.player.isCarriedByJesty
        ) {
          const distToExit = Math.hypot(
            this.circusMaze.exitDoorPosition.x - this.player.x,
            this.circusMaze.exitDoorPosition.z - this.player.z
          );
          if (distToExit < 3.6) {
            this.triggerMazeEscapeCutscene();
            return;
          }
        }
      }
    }

    // Check Proximity to interactive items (Lockers, Boxes, Keys, Padlock, Exit Door)
    this.checkInteractiveProximity();

    // Throttle React state updates to 10Hz to eliminate DOM rendering freeze!
    this.stateUpdateTimer += delta;
    if (this.stateUpdateTimer >= 0.1) {
      this.stateUpdateTimer = 0;
      if (this.onStateUpdate) {
        this.onStateUpdate();
      }
    }
  }

  public isPanicModeActive(): boolean {
    if (this.chapter === 'FAIRGROUND') {
      return this.isBloodSky || this.objectives.gateUnlocked;
    }
    return this.mazeObjectives.exitUnlocked || this.mazeObjectives.machinesFixed >= 20;
  }

  private updatePlayerMovement(delta: number): void {
    const joyMag = Math.hypot(this.joystickInput.x, this.joystickInput.y);
    const hasJoystickMove = joyMag > 0.12;
    const isMoving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right || hasJoystickMove;
    const wantsSprint = (this.keys.sprint || this.mobileSprintActive) && isMoving && !this.player.isCrouching;
    const panicUnlimited = this.isPanicModeActive();

    // Stamina: Unlimited during Panic Mode (exit gates unlocked), drains normally otherwise
    if (panicUnlimited) {
      this.player.stamina = 100;
      this.player.isSprinting = wantsSprint;
    } else if (wantsSprint && this.player.stamina > 5) {
      this.player.isSprinting = true;
      this.player.stamina = Math.max(0, this.player.stamina - delta * 24);
    } else {
      this.player.isSprinting = false;
      this.player.stamina = Math.min(100, this.player.stamina + delta * 14);
    }

    // Speed calculation
    let speed = 4.4; // base walk
    if (this.player.isSprinting) speed = 7.8;
    if (this.player.isCrouching) speed = 2.4;

    // Camera forward and right vectors projected onto the horizontal ground plane (X-Z)
    // Three.js camera faces along negative Z when yaw = 0.
    // Therefore:
    // Forward Vector = (-sin(yaw), -cos(yaw))
    // Right Vector   = ( cos(yaw), -sin(yaw))
    const fwdX = -Math.sin(this.cameraYaw);
    const fwdZ = -Math.cos(this.cameraYaw);
    const rightX = Math.cos(this.cameraYaw);
    const rightZ = -Math.sin(this.cameraYaw);

    let inputFwd = 0;
    let inputRight = 0;

    // W: Maju (Forward)
    if (this.keys.forward) inputFwd += 1;
    // S: Mundur (Backward)
    if (this.keys.backward) inputFwd -= 1;
    // D: Ke Kanan (Right)
    if (this.keys.right) inputRight += 1;
    // A: Ke Kiri (Left)
    if (this.keys.left) inputRight -= 1;

    if (hasJoystickMove) {
      inputFwd += this.joystickInput.y;
      inputRight += this.joystickInput.x;
    }

    const inputLen = Math.hypot(inputFwd, inputRight);
    if (inputLen > 0.05) {
      // Scale analog joystick proportionally up to 1.0 (normalize if > 1)
      const normScale = inputLen > 1 ? 1 / inputLen : 1;
      const normFwd = inputFwd * normScale;
      const normRight = inputRight * normScale;

      const moveX = (fwdX * normFwd + rightX * normRight) * speed * delta;
      const moveZ = (fwdZ * normFwd + rightZ * normRight) * speed * delta;

      const newX = this.player.x + moveX;
      const newZ = this.player.z + moveZ;

      if (this.player.isImprisoned && this.chapter === 'MAZE' && this.circusMaze) {
        // Confined inside the iron prison cage centered at prisonCagePosition
        const cage = this.circusMaze.prisonCagePosition;
        this.player.x = Math.max(cage.x - 1.8, Math.min(cage.x + 1.8, newX));
        this.player.z = Math.max(cage.z - 1.8, Math.min(cage.z + 1.8, newZ));
        return;
      }

      if (this.chapter === 'MAZE' && this.circusMaze) {
        // World Maze boundary clamp
        const bounds = this.circusMaze.getWorldBounds();
        const clampedX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
        const clampedZ = Math.max(bounds.minZ, Math.min(bounds.maxZ, newZ));

        // Collision check with maze walls, prison cage & crashed car
        if (!this.circusMaze.checkCollision(clampedX, this.player.z, 0.7)) {
          this.player.x = clampedX;
        }
        if (!this.circusMaze.checkCollision(this.player.x, clampedZ, 0.7)) {
          this.player.z = clampedZ;
        }
      } else {
        // Fairground boundary clamp (-126m to 126m)
        const clampedX = Math.max(-126, Math.min(126, newX));
        const clampedZ = Math.max(-126, Math.min(126, newZ));

        // Collision check with circus structures
        if (!this.circusMap.checkCollision(clampedX, this.player.z, 0.7)) {
          this.player.x = clampedX;
        }
        if (!this.circusMap.checkCollision(this.player.x, clampedZ, 0.7)) {
          this.player.z = clampedZ;
        }
      }

      // Rhythmic Footstep Audio
      this.playerStepTimer -= delta;
      if (this.playerStepTimer <= 0) {
        horrorAudio.playFootstep(this.player.isSprinting);
        this.playerStepTimer = this.player.isSprinting ? 0.30 : this.player.isCrouching ? 0.65 : 0.46;
      }
    } else {
      this.playerStepTimer = 0.08;
    }

    // Flashlight battery subtle drain
    if (this.player.flashlightOn) {
      this.player.flashlightBattery = Math.max(0, this.player.flashlightBattery - delta * 0.35);
      if (this.player.flashlightBattery <= 0) {
        this.toggleFlashlight();
      }
    }
  }

  private updateCamera(delta: number, elapsed: number): void {
    if (this.player.isHiding && this.currentLocker) {
      // Inside locker peephole view
      this.camera.position.set(this.currentLocker.x, 1.6, this.currentLocker.z);
      this.camera.rotation.set(0, this.currentLocker.rotationY, 0);
      this.playerFlashlight.position.copy(this.camera.position);
      return;
    }

    // Camera height (crouching lowers height to 1.0m)
    const targetHeight = this.player.isCrouching ? 0.95 : 1.7;
    this.player.y = THREE.MathUtils.damp(this.player.y, targetHeight, 10, 0.016);

    // Head bobbing while moving
    const hasJoystickMove = Math.hypot(this.joystickInput.x, this.joystickInput.y) > 0.12;
    const isMoving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right || hasJoystickMove;
    const bob = isMoving ? Math.sin(elapsed * (this.player.isSprinting ? 14 : 9)) * 0.05 : 0;

    if (!this.isThirdPerson) {
      // First Person View
      this.camera.position.set(this.player.x, this.player.y + bob, this.player.z);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.cameraYaw;
      this.camera.rotation.x = this.cameraPitch;

      // Flashlight position follows camera
      this.playerFlashlight.position.set(this.player.x, this.player.y - 0.2, this.player.z);
      const lookDist = 18;
      this.flashlightTarget.position.set(
        this.player.x - Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * lookDist,
        this.player.y + Math.sin(this.cameraPitch) * lookDist,
        this.player.z - Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * lookDist
      );
    } else {
      // Third Person Over-the-shoulder View
      const dist = 3.2;
      const camX = this.player.x + Math.sin(this.cameraYaw) * dist;
      const camZ = this.player.z + Math.cos(this.cameraYaw) * dist;
      this.camera.position.set(camX, this.player.y + 1.2, camZ);
      this.camera.lookAt(this.player.x, this.player.y + 0.8, this.player.z);

      this.playerFlashlight.position.set(this.player.x, this.player.y + 0.8, this.player.z);
      this.flashlightTarget.position.set(
        this.player.x - Math.sin(this.cameraYaw) * 15,
        this.player.y + 0.5,
        this.player.z - Math.cos(this.cameraYaw) * 15
      );
    }

    // Apply procedural screen shake (e.g. from Jacky ground slams and jumpscares)
    if (this.screenShakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity;
      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;
      this.screenShakeIntensity = Math.max(0, this.screenShakeIntensity - delta * 2.8);
    }
  }

  private checkInteractiveProximity(): void {
    if (this.player.isHiding) {
      this.nearbyLocker = null;
      this.nearbyBox = null;
      this.nearbyCheatButton = false;
      return;
    }

    // 1. Closest locker
    let foundLocker: LockerItem | null = null;
    let minLockDist = 2.6;
    for (const l of this.lockers) {
      const d = Math.hypot(l.x - this.player.x, l.z - this.player.z);
      if (d < minLockDist) {
        minLockDist = d;
        foundLocker = l;
      }
    }
    this.nearbyLocker = foundLocker;

    if (this.chapter === 'MAZE' && this.circusMaze) {
      this.nearbyBox = null;
      this.nearbyCheatButton = false;

      // Closest unfixed Circus Machine (within 3.2m)
      let foundMachine: MazeMachine | null = null;
      let minMachineDist = 3.2;
      for (const m of this.circusMaze.mazeMachines) {
        if (m.fixed) continue;
        const d = Math.hypot(m.x - this.player.x, m.z - this.player.z);
        if (d < minMachineDist) {
          minMachineDist = d;
          foundMachine = m;
        }
      }
      this.nearbyMachine = foundMachine;

      // Prison Cage Padlock (located in front courtyard at prisonDropOffPosition)
      const lockPos = this.circusMaze.prisonDropOffPosition;
      const distToCageLock = Math.hypot(lockPos.x - this.player.x, lockPos.z - this.player.z);
      this.nearbyCageUnlock = distToCageLock < 3.4 && (this.prisonCage.imprisonedBotIds.length > 0 || this.prisonCage.playerImprisoned);

      // Grand Golden Exit Door
      const distToExit = Math.hypot(this.circusMaze.exitDoorPosition.x - this.player.x, this.circusMaze.exitDoorPosition.z - this.player.z);
      this.nearbyMazeExit = distToExit < 6.0;

      // Start Maze Map Stand
      const mapPos = this.circusMaze.startMapBoardPosition;
      const distToMap = Math.hypot(mapPos.x - this.player.x, mapPos.z - this.player.z);
      this.nearbyMazeMap = distToMap < 3.8;
      if (distToMap >= 5.2 && this.showMazeMapOverlay) {
        this.showMazeMapOverlay = false;
      }
    } else {
      this.nearbyMachine = null;
      this.nearbyCageUnlock = false;
      this.nearbyMazeExit = false;
      this.nearbyMazeMap = false;
      this.showMazeMapOverlay = false;

      // Closest collectible box
      let foundBox: CollectibleBox | null = null;
      let minBoxDist = 2.8;
      for (const b of this.circusMap.collectibleBoxes) {
        if (b.collected) continue;
        const d = Math.hypot(b.x - this.player.x, b.z - this.player.z);
        if (d < minBoxDist) {
          minBoxDist = d;
          foundBox = b;
        }
      }
      this.nearbyBox = foundBox;

      // Secret Cheat Console at the corner edge near Midway game booths
      const cheatPos = this.circusMap.cheatButtonPosition;
      const distToCheat = Math.hypot(cheatPos.x - this.player.x, cheatPos.z - this.player.z);
      this.nearbyCheatButton = distToCheat < 4.2;
    }
  }

  /**
   * When caught by Jacky: Trigger Interrogation OR Game Over
   */
  private handlePlayerCaptured(): void {
    const aliveBots = this.botManager.bots.filter(b => b.isAlive);

    // If companion bots are alive and random chance succeeds (75%), Jacky interrogates the player!
    if (aliveBots.length > 0 && Math.random() < 0.85) {
      this.gameStatus = 'INTERROGATION';
      this.jacky.info.state = 'INTERROGATING';
      horrorAudio.playInterrogationStinger();
      horrorAudio.playJackyChuckle();

      const targetBot = aliveBots[Math.floor(Math.random() * aliveBots.length)];
      const targetZone = this.circusMap.getZoneAt(targetBot.x, targetBot.z);

      const prompt: InterrogationPrompt = {
        targetBot,
        dialogId: `HEHEHE... Nyengar-nyengir... Mau selamat sebentar, bocah malang? Katakan padaku: DI MANA ${targetBot.name.toUpperCase()} BERSEMBUNYI?!`,
        dialogEn: `HEHEHE... Smirking... Want to stay alive a bit longer, little survivor? Tell me: WHERE IS ${targetBot.name.toUpperCase()} HIDING?!`,
        options: [
          {
            textId: `Bocorkan: "Dia ada di ${targetZone.nameId}!" (Khianati ${targetBot.name})`,
            textEn: `Betray: "He's at ${targetZone.nameEn}!" (Sacrifice ${targetBot.name})`,
            action: 'BETRAY'
          },
          {
            textId: `Bohongi Jacky: "Dia lari keluar gerbang sirkus!" (Peluang 50%)`,
            textEn: `Bluff Jacky: "They escaped past the gates!" (50% Chance)`,
            action: 'LIE'
          },
          {
            textId: `Tolak Berbicara: "Aku tak akan mengkhianati rekanku!"`,
            textEn: `Refuse to Talk: "I will never betray my friends!"`,
            action: 'REFUSE'
          }
        ]
      };

      this.activeInterrogation = prompt;
      if (this.onInterrogationTriggered) {
        this.onInterrogationTriggered(prompt);
      }
    } else {
      // Direct Attack / Game Over
      this.player.health = 0;
      this.gameStatus = 'GAMEOVER';
      horrorAudio.playJackyJumpscare();
      if (this.onGameOver) {
        this.onGameOver('Jacky menyergapmu dan merobek jiwamu dengan cakar berengselnya!');
      }
    }
  }

  /**
   * Resolve player's choice during Jacky's interrogation
   */
  public resolveInterrogation(action: 'BETRAY' | 'REFUSE' | 'LIE' | 'TIMEOUT'): void {
    if (!this.activeInterrogation) return;
    const { targetBot } = this.activeInterrogation;

    if (action === 'BETRAY') {
      // Player lives! Grace timer 16 seconds! Jacky targets that bot!
      this.betrayedBotId = targetBot.id;
      this.botManager.triggerBetrayalTarget(targetBot.id);
      this.player.health = Math.min(this.player.health, 35); // wounded
      this.player.graceTimer = 16.0;
      this.gameStatus = 'PLAYING';
      this.jacky.info.targetType = 'BOT';
      this.jacky.info.targetBotId = targetBot.id;
      this.jacky.info.state = 'CHASING';
      this.jacky.info.isLeaping = false;

      // Displace Jacky 8 meters away in the direction of the target bot
      // to permanently eliminate the bug where Jacky was bouncing on top of the player's body!
      const dx = targetBot.x - this.player.x;
      const dz = targetBot.z - this.player.z;
      const dist = Math.hypot(dx, dz) || 1;
      const moveDist = 8.0;
      this.jacky.group.position.x = this.player.x + (dx / dist) * moveDist;
      this.jacky.group.position.z = this.player.z + (dz / dist) * moveDist;
      this.jacky.info.x = this.jacky.group.position.x;
      this.jacky.info.z = this.jacky.group.position.z;
      this.jacky.group.rotation.y = Math.atan2(dx, dz);
      horrorAudio.playJackyChuckle();
    } else if (action === 'LIE') {
      const isBluffSuccessful = Math.random() < 0.55;
      if (isBluffSuccessful) {
        // Jacky gets duped!
        this.player.graceTimer = 12.0;
        this.gameStatus = 'PLAYING';
        this.jacky.resetToPatrol(100, 100);
        this.botManager.addChatMessage(
          'Player (Anda)',
          '#10b981',
          `Bohonganku berhasil! Jacky tertipu dan lari ke tempat lain!`,
          `My bluff worked! Jacky bought it and went the other way!`,
          'INFO'
        );
      } else {
        // Jacky noticed the lie!
        this.player.health = 0;
        this.gameStatus = 'GAMEOVER';
        horrorAudio.playJackyJumpscare();
        if (this.onGameOver) {
          this.onGameOver(`Jacky tahu kamu berbohong! "KAU MENIPUKU?!" cakarnya menebas lehermu!`);
        }
      }
    } else if (action === 'TIMEOUT') {
      // 10 Seconds ran out!
      this.player.health = 0;
      this.gameStatus = 'GAMEOVER';
      horrorAudio.playJackyJumpscare();
      horrorAudio.playJackyChuckle();
      if (this.onGameOver) {
        this.onGameOver(`Waktumu 10 detik habis! Jacky nyengar-nyengir: "TERLALU LAMBAT MEMUTUSKAN!" dan langsung merobek jiwamu!`);
      }
    } else {
      // Refuse: Slashed!
      this.player.health = 0;
      this.gameStatus = 'GAMEOVER';
      horrorAudio.playJackyJumpscare();
      if (this.onGameOver) {
        this.onGameOver(`Kesetiaanmu terbayar dengan nyawa. Jacky tertawa nyengar-nyengir mencabik-cabikmu!`);
      }
    }

    this.activeInterrogation = null;
  }

  /**
   * When Jacky catches ANY bot:
   * 30% Chance the terrified bot betrays someone (Player or another Bot) to survive!
   * 70% Chance Jacky eliminates the bot immediately!
   */
  private handleBotCaptured(bot: BotCompanionState): void {
    const is30PercentBetrayal = Math.random() < 0.30;

    if (is30PercentBetrayal) {
      // Jacky corners the bot, chuckles and demands someone else's location!
      horrorAudio.playJackyChuckle();
      horrorAudio.playBetrayalCry();

      const otherAliveBots = this.botManager.bots.filter(b => b.id !== bot.id && b.isAlive);
      const isPlayerAlive = this.player.health > 0;

      // 50% chance betrays player (if alive), 50% chance betrays another companion bot
      let betrayPlayer = isPlayerAlive;
      if (isPlayerAlive && otherAliveBots.length > 0) {
        betrayPlayer = Math.random() < 0.50;
      } else if (!isPlayerAlive) {
        betrayPlayer = false;
      }

      if (betrayPlayer) {
        // Bot snitches on the PLAYER!
        const playerZone = this.circusMap.getZoneAt(this.player.x, this.player.z);
        this.botManager.addChatMessage(
          bot.name,
          bot.color,
          `AMPUN JACKY!! JANGAN BUNUH AKU!! PLAYER ADA DI ${playerZone.nameId.toUpperCase()}!! MAAFKAN AKU!!`,
          `PLEASE JACKY!! DON'T KILL ME!! PLAYER IS AT ${playerZone.nameEn.toUpperCase()}!! FORGIVE ME!!`,
          'BETRAYAL'
        );

        // Flash big red dramatic warning banner on HUD!
        this.betrayalWarning = {
          botName: bot.name,
          victimName: 'Player (Anda)',
          isPlayerTarget: true,
          timer: 7.0
        };

        // Jacky locks onto PLAYER only if player is NOT safely hidden inside a locker!
        if (!this.player.isHiding) {
          this.jacky.info.targetType = 'PLAYER';
          this.jacky.info.targetBotId = null;
          this.jacky.triggerPopOutChase();
        } else {
          this.jacky.info.targetType = 'NONE';
          this.jacky.info.targetBotId = null;
          this.jacky.info.state = 'PATROL';
        }

        // The snitching bot is spared with 35 HP and sprints to hide
        bot.health = 35;
        bot.panicLevel = 1.0;
        bot.state = 'FLEEING';
        bot.hideCooldown = 12.0;
        this.botManager.assignNewZoneTarget(bot);
      } else if (otherAliveBots.length > 0) {
        // Bot snitches on ANOTHER COMPANION BOT!
        const victimBot = otherAliveBots[Math.floor(Math.random() * otherAliveBots.length)];
        const victimZone = this.circusMap.getZoneAt(victimBot.x, victimBot.z);

        this.botManager.addChatMessage(
          bot.name,
          bot.color,
          `AMPUN JACKY!! ${victimBot.name.toUpperCase()} ADA DI ${victimZone.nameId.toUpperCase()}!! KEJAR DIA SAJA JANGAN AKU!!`,
          `PLEASE JACKY!! ${victimBot.name.toUpperCase()} IS AT ${victimZone.nameEn.toUpperCase()}!! HUNT THEM INSTEAD!!`,
          'BETRAYAL'
        );

        setTimeout(() => {
          this.botManager.addChatMessage(
            victimBot.name,
            victimBot.color,
            `TEGA BANGET KAMU ${bot.name.toUpperCase()}?! KENAPA MEMBOCORKAN POSISIKU KE JACKY?!!`,
            `HOW COULD YOU ${bot.name.toUpperCase()}?! WHY DID YOU SNITCH ON MY LOCATION TO JACKY?!!`,
            'PANIC'
          );
        }, 1200);

        // Flash betrayal warning on HUD
        this.betrayalWarning = {
          botName: bot.name,
          victimName: victimBot.name,
          isPlayerTarget: false,
          timer: 6.0
        };

        // Jacky locks onto that victim bot!
        this.betrayedBotId = victimBot.id;
        this.botManager.triggerBetrayalTarget(victimBot.id);
        this.jacky.info.targetType = 'BOT';
        this.jacky.info.targetBotId = victimBot.id;
        this.jacky.triggerPopOutChase();

        // Snitching bot is spared and flees
        bot.health = 35;
        bot.panicLevel = 1.0;
        bot.state = 'FLEEING';
        bot.hideCooldown = 12.0;
        this.botManager.assignNewZoneTarget(bot);
      } else {
        // No other targets, bot eliminated
        bot.isAlive = false;
        bot.health = 0;
        const deathZone = this.circusMap.getZoneAt(this.jacky.info.x, this.jacky.info.z);
        this.jackyTracker = {
          active: true,
          timer: 5.0,
          botName: bot.name,
          zoneName: deathZone.nameId,
          x: this.jacky.info.x,
          z: this.jacky.info.z
        };
        horrorAudio.playTrackingRadioBeep();
        this.botManager.addChatMessage(
          `${bot.name} (Radio Sekarat)`,
          '#ef4444',
          `📻 *KRESEK-KRESEK* "JACKY ADA DI ${deathZone.nameId.toUpperCase()}! KOORDINAT (${this.jacky.info.x.toFixed(0)}, ${this.jacky.info.z.toFixed(0)})! LARI!!"`,
          `📻 *STATIC* "JACKY IS AT ${deathZone.nameEn.toUpperCase()}! COORDINATES (${this.jacky.info.x.toFixed(0)}, ${this.jacky.info.z.toFixed(0)})! RUN!!"`,
          'PANIC'
        );
        horrorAudio.playBotScream();
        this.jacky.info.targetType = 'NONE';
        this.jacky.info.targetBotId = null;
        this.jacky.info.state = 'PATROL';
      }
    } else {
      // 70% Chance: Direct slash / elimination!
      bot.isAlive = false;
      bot.health = 0;
      const deathZone = this.circusMap.getZoneAt(this.jacky.info.x, this.jacky.info.z);
      this.jackyTracker = {
        active: true,
        timer: 5.0,
        botName: bot.name,
        zoneName: deathZone.nameId,
        x: this.jacky.info.x,
        z: this.jacky.info.z
      };
      horrorAudio.playTrackingRadioBeep();
      this.botManager.addChatMessage(
        `${bot.name} (Radio Sekarat)`,
        '#ef4444',
        `📻 *KRESEK-KRESEK* "JACKY ADA DI ${deathZone.nameId.toUpperCase()}! KOORDINAT (${this.jacky.info.x.toFixed(0)}, ${this.jacky.info.z.toFixed(0)})! LARI!!"`,
        `📻 *STATIC* "JACKY IS AT ${deathZone.nameEn.toUpperCase()}! COORDINATES (${this.jacky.info.x.toFixed(0)}, ${this.jacky.info.z.toFixed(0)})! RUN!!"`,
        'PANIC'
      );
      horrorAudio.playBotScream();
      horrorAudio.playJackyChuckle();
      if (this.betrayedBotId === bot.id) {
        this.betrayedBotId = null;
      }
      this.jacky.info.targetType = 'NONE';
      this.jacky.info.targetBotId = null;
      this.jacky.info.state = 'PATROL';
    }
  }

  /**
   * Starts repairing a Circus Power Machine (shows calibration puzzle periodically)
   */
  public startRepairingMachine(machineId: number): void {
    this.repairingMachineId = machineId;
    this.skillCheck.active = false;
    this.skillCheck.machineId = machineId;
    this.nextSkillCheckTimer = 1.6 + Math.random() * 1.4;
    horrorAudio.playFlashlightClick(true);
    if (this.onStateUpdate) this.onStateUpdate();
  }

  public stopRepairingMachine(): void {
    this.repairingMachineId = null;
    this.skillCheck.active = false;
  }

  /**
   * Evaluates player's Backspace key press against the rotating white bar & white target zone
   */
  public handleSkillCheckBackspace(): void {
    if (!this.skillCheck.active || !this.circusMaze) return;
    const machine = this.circusMaze.mazeMachines.find(m => m.id === this.skillCheck.machineId);
    if (!machine || machine.fixed) {
      this.stopRepairingMachine();
      return;
    }

    const deg = ((this.skillCheck.needleAngle % 360) + 360) % 360;
    const start = this.skillCheck.zoneStartAngle;
    const end = start + this.skillCheck.zoneSizeAngle;
    const hit = deg >= start - 6 && deg <= end + 6;

    if (hit) {
      machine.progress = Math.min(100, machine.progress + 22);
      horrorAudio.playSkillCheckSuccess();
      this.skillCheck.active = false;
      this.skillCheck.feedbackText = 'KALIBRASI SUKSES! (+22%)';
      this.skillCheck.feedbackType = 'SUCCESS';
      this.skillCheck.feedbackTimer = 2.0;
      this.nextSkillCheckTimer = 1.8 + Math.random() * 1.6;
      if (machine.progress >= 100) {
        this.completeMazeMachine(machine.id, 'PLAYER');
      }
    } else {
      this.failPlayerMachineCheck(machine);
    }

    if (this.onStateUpdate) this.onStateUpdate();
  }

  private failPlayerMachineCheck(machine: MazeMachine): void {
    machine.progress = Math.max(0, machine.progress - 18);
    machine.malfunctionFlashTimer = 3.2;
    this.stopRepairingMachine();
    horrorAudio.playMachineFailExplosion();
    this.screenShakeIntensity = 0.25;

    this.skillCheck.feedbackText = 'GAGAL KALIBRASI! JESTY MENDENGAR MESIN!';
    this.skillCheck.feedbackType = 'FAIL';
    this.skillCheck.feedbackTimer = 2.8;

    // Alert Jesty to rush directly to this failed machine!
    this.jesty?.investigateMachineFailure(machine.x, machine.z);

    this.botManager.addChatMessage(
      'Player (Anda)',
      '#ef4444',
      `⚡ KORSLETING! Aku gagal menekan Backspace di area putih (${machine.name}) — JESTY SEGERA MENUJU KE SINI!!`,
      `⚡ SHORT CIRCUIT! Missed Backspace calibration (${machine.name}) — JESTY IS RUSHING HERE!!`,
      'PANIC'
    );
  }

  /**
   * Completes a Circus Power Machine (called cleanly by either Player or Companion Bot)
   */
  public completeMazeMachine(machineId: number, fixer: 'PLAYER' | string): void {
    if (!this.circusMaze) return;
    if (!this.circusMaze.completeMachine(machineId, fixer)) return;

    if (this.repairingMachineId === machineId) {
      this.stopRepairingMachine();
    }

    this.mazeObjectives.machinesFixed++;
    this.mazeObjectives.keysCollected = this.mazeObjectives.machinesFixed;
    horrorAudio.playKeyCollectChime();

    const machine = this.circusMaze.mazeMachines.find(m => m.id === machineId);
    const isPlayer = fixer === 'PLAYER';
    const sender = isPlayer ? 'Player (Anda)' : fixer;
    const color = isPlayer ? '#10b981' : (this.botManager.bots.find(b => b.name === fixer)?.color || '#38bdf8');
    this.botManager.addChatMessage(
      sender,
      color,
      `⚙️ Aku berhasil memperbaiki ${machine?.name || 'Mesin'}! [Mesin ${this.mazeObjectives.machinesFixed}/20]`,
      `⚙️ I repaired ${machine?.name || 'a Machine'}! [Machines ${this.mazeObjectives.machinesFixed}/20]`,
      'INFO'
    );

    if (this.mazeObjectives.machinesFixed >= 20 && !this.mazeObjectives.exitUnlocked) {
      this.mazeObjectives.exitUnlocked = true;
      this.circusMaze.openExitDoor();
      horrorAudio.playMazeDoorUnlock();
      horrorAudio.startMazeEscapeSiren();

      // Transform the entire Maze atmosphere into a roaring RED INFERNO!
      (this.scene.background as THREE.Color).setHex(0x3a0505);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x320404);
      (this.scene.fog as THREE.FogExp2).density = 0.031;
      this.scene.environmentIntensity = 0.35;
      this.moonKey.color.setHex(0xff2a1a);
      this.moonKey.intensity = 0.6;
      this.hemiLight.color.setHex(0xaa1111);
      this.hemiLight.groundColor.setHex(0x450505);
      this.hemiLight.intensity = 0.55;

      this.botManager.addChatMessage(
        'Sistem Labirin',
        '#ef4444',
        '🔥🚨 SEMUA 20 MESIN MENYALA!! SIRINE BERBUNYI, API BERKOBAR DI MANA-MANA!! PINTU EXIT EMAS DISOROT DI UTARA — CEPAT KABUR!!',
        '🔥🚨 ALL 20 MACHINES REPAIRED!! SIRENS WAILING, FIRE RAGING EVERYWHERE!! EXIT GATE HIGHLIGHTED IN THE NORTH — ESCAPE NOW!!',
        'WARNING'
      );
    }
  }

  public restartGame(botCount: number = 6): void {
    horrorAudio.stopMazeEscapeSiren();
    horrorAudio.setMazeSilentMode(false);
    this.player.health = 100;
    this.player.stamina = 100;
    this.player.isHiding = false;
    this.player.isImprisoned = false;
    this.player.isCarriedByJesty = false;
    this.player.isCrouching = false;
    this.player.x = 0;
    this.player.y = 1.7;
    this.player.z = -100;
    this.player.graceTimer = 0;
    this.cameraYaw = 0;
    this.cameraPitch = 0;
    this.camera.position.set(0, 1.7, -100);
    this.startCountdown = 30.0;
    this.isHuntingStarted = false;
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false
    };
    this.joystickInput = { x: 0, y: 0 };
    this.mobileSprintActive = false;
    this.activeLookTouchId = null;
    this.isMouseDown = false;
    this.currentLocker = null;
    this.nearbyLocker = null;
    this.nearbyBox = null;
    this.nearbyMachine = null;
    this.repairingMachineId = null;
    this.skillCheck.active = false;
    this.skillCheck.feedbackText = null;
    this.somethingComingTimer = 0;
    this.somethingComingCooldown = 0;
    this.nearbyCageUnlock = false;
    this.nearbyMazeExit = false;
    this.nearbyMazeMap = false;
    this.nearbyCheatButton = false;
    this.isCheatMenuOpen = false;
    this.showMazeMapOverlay = false;
    this.activeInterrogation = null;
    this.betrayedBotId = null;
    this.betrayalWarning = null;
    this.jackyTracker = null;
    this.jestyTracker = null;
    this.screenShakeIntensity = 0;
    this.pistolFeedback = null;
    this.pistolTracerTimer = 0;
    this.pistolTracerMesh.visible = false;
    this.jackyBeaconBeam.visible = false;
    this.landingIndicatorGroup.visible = false;

    this.prisonCage = {
      x: this.circusMaze ? this.circusMaze.prisonCagePosition.x : 0,
      z: this.circusMaze ? this.circusMaze.prisonCagePosition.z : -296,
      playerImprisoned: false,
      imprisonedBotIds: [],
      rescuingBotId: null,
      rescueProgress: 0
    };

    this.whistle = {
      cooldownTimer: 0,
      activeRippleTime: 0,
      highlightedBotId: null,
      highlightedBotName: null,
      highlightedBotDistance: 0,
      highlightTimer: 0
    };

    this.objectives = {
      boxesTotal: 20,
      boxesCollected: 0,
      gateUnlocked: false,
      escaped: false
    };

    // Restore Fairground hiding lockers & visibility
    if (this.fairgroundLockers.length > 0) {
      this.fairgroundLockers.forEach(l => { l.isOccupied = false; });
      this.lockers = [...this.fairgroundLockers];
    }
    this.fairgroundLockerGroups.forEach(g => { g.visible = true; });

    // Respawn boxes
    this.circusMap.collectibleBoxes.forEach((b, idx) => {
      b.collected = false;
      b.collectedBy = null;
      if (this.circusMap.boxMeshes[idx]) {
        this.circusMap.boxMeshes[idx].visible = true;
      }
    });

    // Reset Blood Sky & Environment (density 0.0085 keeps Giant Labyrinth Tent visible far North!)
    this.isBloodSky = false;
    this.bloodMoonMesh.visible = false;
    this.scene.background = new THREE.Color(0x06080e);
    this.scene.fog = new THREE.FogExp2(0x080a14, 0.0085);
    this.scene.environmentIntensity = 1.0;
    this.renderer.toneMappingExposure = 1.05;
    this.moonKey.color.setHex(0x7088b0);
    this.moonKey.intensity = 0.7;
    this.hemiLight.color.setHex(0x1a2638);
    this.hemiLight.groundColor.setHex(0x0d0d12);
    this.hemiLight.intensity = 0.45;
    this.circusMap.resetExitGates();

    this.jacky.resetToPatrol(0, 0);
    this.botManager.spawnBots(botCount);

    if (this.circusMaze) {
      this.circusMaze.group.visible = true;
      this.circusMaze.setChapterMode(false);
    }
    if (this.jesty) {
      this.jesty.group.visible = false;
    }
    this.circusMap.group.visible = true;
    this.jacky.group.visible = true;
    this.chapter = 'FAIRGROUND';
    this.gameStatus = 'PLAYING';
    this.renderer.compile(this.scene, this.camera);
  }

  /**
   * Triggers the Chapter 1 Escape & Getaway Car Ambush Cutscene
   */
  public triggerCarCutscene(): void {
    horrorAudio.setMazeSilentMode(true);
    this.gameStatus = 'CAR_CUTSCENE';
    horrorAudio.startCarDriving();
    if (this.onCarCutsceneTriggered) {
      this.onCarCutsceneTriggered();
    }
    if (this.onStateUpdate) {
      this.onStateUpdate();
    }
  }

  /**
   * Triggers the Chapter 2 Maze Finale Escape Cutscene (start car -> Jesty chases -> ram Jesty lifeless -> escape!)
   */
  public triggerMazeEscapeCutscene(): void {
    horrorAudio.stopMazeEscapeSiren();
    horrorAudio.setMazeSilentMode(true);
    this.gameStatus = 'MAZE_ESCAPE_CUTSCENE';
    try {
      document.exitPointerLock?.();
    } catch {}
    if (this.onMazeEscapeCutsceneTriggered) {
      this.onMazeEscapeCutsceneTriggered();
    }
    if (this.onStateUpdate) {
      this.onStateUpdate();
    }
  }

  /**
   * Starts Chapter 2: The Expansive Circus Labyrinth (Labirin Sirkus Super Luas)
   * Physically located at z = -280 inside the Giant Circus Tent!
   */
  public startCircusMaze(): void {
    horrorAudio.stopCarDriving();
    horrorAudio.stopMazeEscapeSiren();
    horrorAudio.setMazeSilentMode(true);

    // 1. Hide Chapter 1 Fairground Assets
    this.circusMap.group.visible = false;
    this.jacky.group.visible = false;
    this.fairgroundLockerGroups.forEach(g => { g.visible = false; });
    this.landingIndicatorGroup.visible = false;
    this.jackyBeaconBeam.visible = false;
    this.isBloodSky = false;
    this.bloodMoonMesh.visible = false;

    // 2. Enable Chapter 2 Circus Labyrinth Interior (at z = -280)
    if (!this.circusMaze) {
      this.circusMaze = new CircusMaze();
      this.scene.add(this.circusMaze.group);
    }
    this.circusMaze.group.visible = true;
    this.circusMaze.setChapterMode(true);
    this.circusMaze.resetMazeRun();

    const offsetX = this.circusMaze.worldOffsetX;
    const offsetZ = this.circusMaze.worldOffsetZ;

    // 3. Setup Jesty the Clown Monster inside open North-Central plaza (guaranteed wall-free!)
    const jSpawn = this.circusMaze.getSafeJestySpawnPosition();
    if (!this.jesty) {
      this.jesty = new JestyMonster(jSpawn.x, jSpawn.z);
      this.scene.add(this.jesty.group);
    } else {
      this.jesty.resetPosition(jSpawn.x, jSpawn.z);
      this.jesty.group.visible = true;
    }

    // 4. Connect Maze Hiding Lockers
    this.lockers = this.circusMaze.lockers.map((l, idx) => ({
      id: `maze-locker-${idx}`,
      x: l.x,
      y: 0,
      z: l.z,
      rotationY: l.rotationY,
      isOccupied: false,
      mesh: new THREE.Group()
    }));

    // 5. Place Player beside Crashed Getaway Car wreckage (offsetZ - 61, safely facing North!)
    this.player.x = offsetX;
    this.player.y = 1.7;
    this.player.z = offsetZ - 61;
    this.player.health = 100;
    this.player.stamina = 100;
    this.player.isHiding = false;
    this.player.isImprisoned = false;
    this.player.isCarriedByJesty = false;
    this.player.isCrouching = false;
    this.player.graceTimer = 6.0;

    this.cameraPitch = 0;
    this.cameraYaw = Math.PI; // Facing +Z (North into the labyrinth!)
    this.camera.position.set(this.player.x, 1.7, this.player.z);
    this.joystickInput = { x: 0, y: 0 };
    this.mobileSprintActive = false;
    this.activeLookTouchId = null;

    // 6. ONLY surviving Chapter 1 companion bots enter, scattered far away across the labyrinth!
    const survivorCount = this.botManager.prepareForMaze(this.circusMaze);

    // 7. Reset Maze Objectives, Skill Check & Prison Cage
    this.nearbyMachine = null;
    this.repairingMachineId = null;
    this.nearbyMazeMap = false;
    this.nearbyCheatButton = false;
    this.isCheatMenuOpen = false;
    this.startCountdown = 0;
    this.isHuntingStarted = false;
    this.showMazeMapOverlay = false;
    this.skillCheck.active = false;
    this.skillCheck.feedbackText = null;
    this.somethingComingTimer = 0;
    this.somethingComingCooldown = 0;
    this.pistolFeedback = null;
    this.pistolTracerTimer = 0;
    this.pistolTracerMesh.visible = false;

    this.mazeObjectives = {
      machinesTotal: 20,
      machinesFixed: 0,
      keysTotal: 20,
      keysCollected: 0,
      exitUnlocked: false,
      escaped: false
    };

    this.prisonCage = {
      x: this.circusMaze.prisonCagePosition.x,
      z: this.circusMaze.prisonCagePosition.z,
      playerImprisoned: false,
      imprisonedBotIds: [],
      rescuingBotId: null,
      rescueProgress: 0
    };

    this.whistle = {
      cooldownTimer: 0,
      activeRippleTime: 0,
      highlightedBotId: null,
      highlightedBotName: null,
      highlightedBotDistance: 0,
      highlightTimer: 0
    };

    // 8. Pitch-Dark Oppressive Labyrinth Atmosphere (Flashlight & dim lanterns rule the dark!)
    this.chapter = 'MAZE';
    this.gameStatus = 'MAZE_PLAYING';
    (this.scene.background as THREE.Color).setHex(0x010205);
    (this.scene.fog as THREE.FogExp2).color.setHex(0x020308);
    (this.scene.fog as THREE.FogExp2).density = 0.044;
    this.scene.environmentIntensity = 0.14;
    this.renderer.toneMappingExposure = 0.85;
    this.moonKey.color.setHex(0x28354a);
    this.moonKey.intensity = 0.06;
    this.hemiLight.color.setHex(0x080c16);
    this.hemiLight.groundColor.setHex(0x020204);
    this.hemiLight.intensity = 0.12;

    this.botManager.addChatMessage(
      'Sistem Sirkus',
      '#fbbf24',
      survivorCount > 0
        ? `🎪 BABAK 2: Mobil hancur! Kamu terbangun di dalam Tenda Raksasa Labirin bersama ${survivorCount} rekan yang selamat! Perbaiki 20 Mesin (tekan Backspace di area putih kalibrasi) & tekan [G] Bersiul untuk melacak rekan!`
        : `🎪 BABAK 2: Semua rekanmu gugur di karnaval! Kamu terbangun sendirian di dalam Tenda Raksasa Labirin! Perbaiki 20 Mesin & waspadai Jesty!`,
      survivorCount > 0
        ? `🎪 CHAPTER 2: Car crashed! You awaken inside the Giant Labyrinth Tent with ${survivorCount} scattered survivors! Repair 20 Machines (press Backspace in the white calibration zone) & press [G] Whistle to highlight allies!`
        : `🎪 CHAPTER 2: All allies fell in the fairground! You awaken alone inside the Giant Labyrinth Tent! Repair 20 Machines & avoid Jesty!`,
      'INFO'
    );

    // Pre-compile Chapter 2 Labyrinth shaders once at transition so repairs have 0ms frame hitch
    this.renderer.compile(this.scene, this.camera);

    if (this.onStateUpdate) {
      this.onStateUpdate();
    }
  }

  private dispatchMazeRescueTeam(): void {
    if (!this.circusMaze) return;
    const cagePos = this.circusMaze.prisonDropOffPosition;
    const freeBots = this.botManager.bots.filter(
      b =>
        b.isAlive &&
        b.state !== 'IMPRISONED' &&
        b.state !== 'BEING_CARRIED' &&
        b.state !== 'HIDING' &&
        b.state !== 'ESCAPED'
    );
    if (freeBots.length === 0) return;

    freeBots.sort(
      (a, b) => Math.hypot(a.x - cagePos.x, a.z - cagePos.z) - Math.hypot(b.x - cagePos.x, b.z - cagePos.z)
    );

    // Send 1 to 4 free bots to search the labyrinth for the prison cage & free trapped allies/player!
    const teamSize = Math.min(freeBots.length, 1 + Math.floor(Math.random() * 4));
    const rescuers = freeBots.slice(0, teamSize);

    rescuers.forEach(bot => {
      bot.state = 'RESCUING_PLAYER';
      bot.targetMachineId = null;
      bot.currentDialog = 'Aku sedang mencari penjara untuk membebaskanmu!';
      bot.dialogTimer = 4.5;
    });

    this.prisonCage.rescuingBotId = rescuers[0].id;
    const names = rescuers.map(b => b.name).join(', ');
    this.botManager.addChatMessage(
      rescuers[0].name,
      rescuers[0].color,
      `🔑 ${names} (${rescuers.length} bot) sedang mencari kurungan penjara untuk membebaskan tahanan!`,
      `🔑 ${names} (${rescuers.length} bot${rescuers.length > 1 ? 's' : ''}) searching for the prison cage to rescue prisoners!`,
      'INFO'
    );
  }

  /**
   * Whistle Mechanic (Bersiul) with 20s Cooldown & 10s Highlight on Nearest Alive Companion Bot
   */
  public triggerWhistle(): void {
    if (this.whistle.cooldownTimer > 0) return;

    this.whistle.cooldownTimer = 20.0;
    this.whistle.activeRippleTime = 4.0;
    horrorAudio.playWhistle();

    // Find closest alive, non-imprisoned companion bot
    let closestBot: BotCompanionState | null = null;
    let minDist = Infinity;
    for (const bot of this.botManager.bots) {
      if (bot.isAlive && bot.state !== 'IMPRISONED' && bot.state !== 'ESCAPED') {
        const d = Math.hypot(bot.x - this.player.x, bot.z - this.player.z);
        if (d < minDist) {
          minDist = d;
          closestBot = bot;
        }
      }
    }

    if (closestBot) {
      const respBot = closestBot;
      this.whistle.highlightedBotId = respBot.id;
      this.whistle.highlightedBotName = respBot.name;
      this.whistle.highlightedBotDistance = minDist;
      this.whistle.highlightTimer = 10.0;

      setTimeout(() => {
        horrorAudio.playBotWhistleResponse();
        this.botManager.addChatMessage(
          respBot.name,
          respBot.color,
          `[Bersiul Balik] *FWHIIIT!* Aku di sini, posisiku tersorot 10 detik! (Jarak: ${minDist.toFixed(0)}m)`,
          `[Whistles back] *FWHIIIT!* I'm over here, highlighted for 10s! (Distance: ${minDist.toFixed(0)}m)`,
          'INFO'
        );
      }, 450);
    }

    if (this.onStateUpdate) {
      this.onStateUpdate();
    }
  }

  /**
   * Checks whether the active monster (Jacky or Jesty) is in range/aim of Pistol Sirkus
   */
  public isMonsterInPistolSights(): { hit: boolean; monsterName: 'JACKY' | 'JESTY'; distance: number } {
    const fwdX = -Math.sin(this.cameraYaw);
    const fwdZ = -Math.cos(this.cameraYaw);

    if (this.chapter === 'MAZE' && this.jesty) {
      const dx = this.jesty.info.x - this.player.x;
      const dz = this.jesty.info.z - this.player.z;
      const dist = Math.hypot(dx, dz);
      if (this.player.isCarriedByJesty) {
        return { hit: true, monsterName: 'JESTY', distance: dist };
      }
      if (dist <= 30) {
        const dot = dist > 0.01 ? (dx * fwdX + dz * fwdZ) / dist : 1;
        if (dist <= 7.0 || dot >= 0.42) {
          return { hit: true, monsterName: 'JESTY', distance: dist };
        }
      }
      return { hit: false, monsterName: 'JESTY', distance: dist };
    }

    const dx = this.jacky.info.x - this.player.x;
    const dz = this.jacky.info.z - this.player.z;
    const dist = Math.hypot(dx, dz);
    if (this.isHuntingStarted && dist <= 32) {
      const dot = dist > 0.01 ? (dx * fwdX + dz * fwdZ) / dist : 1;
      if (dist <= 7.0 || dot >= 0.42) {
        return { hit: true, monsterName: 'JACKY', distance: dist };
      }
    }
    return { hit: false, monsterName: 'JACKY', distance: dist };
  }

  /**
   * Fires the single-use Pistol Sirkus item to stun Jacky or Jesty for 6.5 seconds
   */
  public fireCircusPistol(): void {
    if (this.gameStatus !== 'PLAYING' && this.gameStatus !== 'MAZE_PLAYING') return;
    if (this.circusPistolCount <= 0) return;
    if (this.player.isHiding || this.player.isImprisoned) return;

    this.circusPistolCount = Math.max(0, this.circusPistolCount - 1);
    this.onPistolCountChange?.(this.circusPistolCount);
    horrorAudio.playCircusPistolShot();
    this.screenShakeIntensity = Math.max(this.screenShakeIntensity, 0.24);

    const sight = this.isMonsterInPistolSights();
    const fwdX = -Math.sin(this.cameraYaw);
    const fwdZ = -Math.cos(this.cameraYaw);

    this.pistolTracerMesh.position.set(this.player.x, this.player.y - 0.18, this.player.z);
    if (sight.hit) {
      const tx = this.chapter === 'MAZE' && this.jesty ? this.jesty.info.x : this.jacky.info.x;
      const tz = this.chapter === 'MAZE' && this.jesty ? this.jesty.info.z : this.jacky.info.z;
      this.pistolTracerMesh.lookAt(tx, 1.4, tz);
      this.pistolTracerMesh.scale.set(1, 1, Math.max(1.5, sight.distance));
    } else {
      this.pistolTracerMesh.lookAt(
        this.player.x + fwdX * 22,
        this.player.y - 0.18 + Math.sin(this.cameraPitch) * 22,
        this.player.z + fwdZ * 22
      );
      this.pistolTracerMesh.scale.set(1, 1, 22);
    }
    this.pistolTracerMesh.visible = true;
    this.pistolTracerTimer = 0.26;

    if (sight.hit) {
      horrorAudio.playMonsterStunned();
      if (this.chapter === 'MAZE' && this.jesty) {
        if (this.player.isCarriedByJesty) {
          this.player.isCarriedByJesty = false;
          this.player.graceTimer = Math.max(this.player.graceTimer, 4.0);
        }
        this.botManager.bots.forEach((b) => {
          if (b.isAlive && b.state === 'BEING_CARRIED') {
            b.state = 'SEARCHING';
            b.hideCooldown = 5.0;
          }
        });
        this.jesty.stun(6.5);
        this.player.graceTimer = Math.max(this.player.graceTimer, 3.0);
        this.pistolFeedback = {
          textId: '⚡ DOR!! JESTY TERKENA PISTOL SIRKUS — STUN 6.5 DETIK!',
          textEn: '⚡ BOOM!! JESTY HIT BY CIRCUS PISTOL — STUNNED 6.5s!',
          type: 'HIT',
          timer: 3.5
        };
        this.botManager.addChatMessage(
          'Player (Anda)',
          '#38bdf8',
          '🔫⚡ AKU MENEMBAK JESTY DENGAN PISTOL SIRKUS! Dia pingsan 6.5 detik — lari sekarang!!',
          '🔫⚡ I SHOT JESTY WITH THE CIRCUS PISTOL! He is stunned for 6.5s — run now!!',
          'INFO'
        );
      } else {
        this.jacky.stun(6.5);
        this.player.graceTimer = Math.max(this.player.graceTimer, 3.0);
        this.pistolFeedback = {
          textId: '⚡ DOR!! JACKY TERKENA PISTOL SIRKUS — STUN 6.5 DETIK!',
          textEn: '⚡ BOOM!! JACKY HIT BY CIRCUS PISTOL — STUNNED 6.5s!',
          type: 'HIT',
          timer: 3.5
        };
        this.botManager.addChatMessage(
          'Player (Anda)',
          '#38bdf8',
          '🔫⚡ AKU MENEMBAK JACKY DENGAN PISTOL SIRKUS! Dia pingsan 6.5 detik — cepat cari kotak!!',
          '🔫⚡ I SHOT JACKY WITH THE CIRCUS PISTOL! He is stunned for 6.5s — keep moving!!',
          'INFO'
        );
      }
    } else {
      this.pistolFeedback = {
        textId: '💨 TEMBAKAN MELESET! Arahkan langsung ke monster (maks 30m)!',
        textEn: '💨 SHOT MISSED! Aim directly at the monster (max 30m)!',
        type: 'MISS',
        timer: 3.0
      };
    }

    this.onStateUpdate?.();
  }

  /**
   * Cheat Option 3: Immediately trigger Panic Mode (all objectives ready, exit unlocked, red sky/inferno, unlimited stamina)
   */
  public activatePanicModeCheat(): void {
    if (this.chapter === 'FAIRGROUND') {
      this.startCountdown = 0;
      this.isHuntingStarted = true;
      this.circusMap.collectibleBoxes.forEach((b, idx) => {
        if (!b.collected) {
          b.collected = true;
          b.collectedBy = 'CHEAT';
          if (this.circusMap.boxMeshes[idx]) {
            this.circusMap.boxMeshes[idx].visible = false;
          }
        }
      });
      this.objectives.boxesCollected = this.objectives.boxesTotal;
      this.player.stamina = 100;
      this.triggerBloodSky();
      this.botManager.addChatMessage(
        'Cheat System',
        '#f472b6',
        '😏🔥 [CHEAT] PANIC MODE DIAKTIFKAN! Gerbang Utara terbuka & Stamina Unlimited!',
        '😏🔥 [CHEAT] PANIC MODE ACTIVATED! North Gate open & Unlimited Stamina!',
        'WARNING'
      );
    } else if (this.chapter === 'MAZE' && this.circusMaze) {
      this.circusMaze.mazeMachines.forEach((m) => {
        if (!m.fixed) {
          this.completeMazeMachine(m.id, 'PLAYER');
        }
      });
      this.player.stamina = 100;
    }
    this.onStateUpdate?.();
  }

  /**
   * Unstuck the player:
   * Teleports player out of any locked locker or collision mesh
   * into a flat, safe open path in the circus, resets keys, restores stamina,
   * and gives 5s grace period so Jacky doesn't spawn-kill.
   */
  public unstuckPlayer(): void {
    if (this.currentLocker) {
      this.currentLocker.isOccupied = false;
      this.currentLocker = null;
    }
    this.player.isHiding = false;
    this.player.isImprisoned = false;
    this.player.isCarriedByJesty = false;
    this.prisonCage.playerImprisoned = false;
    if (this.circusMaze) {
      this.circusMaze.setPrisonGateOpen(false);
    }
    this.nearbyLocker = null;
    this.nearbyBox = null;
    this.nearbyMachine = null;
    this.repairingMachineId = null;
    this.skillCheck.active = false;
    this.somethingComingTimer = 0;

    if (this.chapter === 'MAZE' && this.circusMaze) {
      // Teleport to open crashed car plaza inside the Circus Maze
      this.player.x = this.circusMaze.worldOffsetX;
      this.player.z = this.circusMaze.worldOffsetZ - 61;
      this.cameraYaw = Math.PI;
    } else {
      // Teleport to open safe path in Fairground
      this.player.x = 0;
      this.player.z = -75;
      this.cameraYaw = 0;
    }
    this.player.y = 1.7;
    this.cameraPitch = 0;
    this.camera.position.set(this.player.x, this.player.y, this.player.z);

    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.sprint = false;

    this.player.graceTimer = Math.max(this.player.graceTimer, 5.0);
    this.player.stamina = 100;
    horrorAudio.playBoxCollectChime();

    this.botManager.addChatMessage(
      'Sistem Sirkus',
      '#10b981',
      `🛠️ Karakter telah di-unstuck ke area terbuka sirkus. Grace period 5 detik aktif!`,
      `🛠️ Character unstuck to open grounds. 5-second grace period active!`,
      'INFO'
    );
  }

  /**
   * Return to Main Menu:
   * Cleans up active states, exits pointer lock, and resets the world to menu state
   */
  public returnToMenu(botCount: number = 6): void {
    this.gameStatus = 'MENU';
    if (this.currentLocker) {
      this.currentLocker.isOccupied = false;
      this.currentLocker = null;
    }
    this.player.isHiding = false;
    this.player.isImprisoned = false;
    this.activeInterrogation = null;
    this.betrayedBotId = null;
    this.betrayalWarning = null;
    this.jackyTracker = null;
    this.jestyTracker = null;
    this.screenShakeIntensity = 0;
    if (this.jackyBeaconBeam) this.jackyBeaconBeam.visible = false;
    if (this.landingIndicatorGroup) this.landingIndicatorGroup.visible = false;
    this.restartGame(botCount);
    this.gameStatus = 'MENU';
    try {
      document.exitPointerLock?.();
    } catch {}
  }

  private onResize = (): void => {
    if (!this.renderer || !this.camera) return;
    const parent = this.renderer.domElement.parentElement;
    if (!parent) return;
    this.camera.aspect = parent.clientWidth / parent.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(parent.clientWidth, parent.clientHeight);
  };

  public dispose(): void {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    horrorAudio.dispose();
    this.renderer.dispose();
  }
}
