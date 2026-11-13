/**
 * Jesty the Clown (Jester Monster of the Circus Maze)
 * Features:
 * - Split Comedy & Tragedy Theater Mask with 360-degree spin swap
 * - Articulated 3D body animations (walking gait, aggressive chasing claws, Tragedy weeping, taunting)
 * - 19x19 Grid BFS pathfinding & solid wall/prison cage collision (never clips walls or bars!)
 * - Fair multi-target detection (hunts companion bots as well as the player!)
 */

import * as THREE from 'three';
import { JestyInfo, BotCompanionState } from '../types';
import { horrorAudio } from '../audio/HorrorAudio';
import { CircusMaze } from './circusMaze';

export class JestyMonster {
  public group: THREE.Group = new THREE.Group();
  public info: JestyInfo;

  private jesterMesh: THREE.Group = new THREE.Group();
  private torsoGroup: THREE.Group = new THREE.Group();
  private headGroup: THREE.Group = new THREE.Group();
  private leftArmGroup: THREE.Group = new THREE.Group();
  private rightArmGroup: THREE.Group = new THREE.Group();
  private leftLegGroup: THREE.Group = new THREE.Group();
  private rightLegGroup: THREE.Group = new THREE.Group();
  private leftBell!: THREE.Mesh;
  private rightBell!: THREE.Mesh;
  private centerBell!: THREE.Mesh;
  private jawMesh!: THREE.Mesh;
  private gazeLight!: THREE.PointLight;
  private revealedBeacon!: THREE.Mesh;

  private chuckleCooldown: number = 2.0;
  private walkPhase: number = 0;
  private maskSpinPhase: number = 0;
  private targetWaypoint: { x: number; z: number } = { x: 0, z: -280 };
  private waypointTimer: number = 0;
  private tauntingTimer: number = 0;
  private isMoving: boolean = false;
  private moveSpeed: number = 0;
  private lastPlayerDist: number = 999;
  private investigateTarget: { x: number; z: number } | null = null;
  private investigateTimer: number = 0;
  public stunTimer: number = 0;

  constructor(startX: number = 0, startZ: number = -260) {
    this.info = {
      x: startX,
      y: 0,
      z: startZ,
      rotationY: 0,
      state: 'PATROL',
      activeMask: 'COMEDY',
      maskSwapTimer: 24.0,
      targetType: 'NONE',
      targetBotId: null,
      carryingVictim: null,
      carryingVictimType: 'NONE',
      carryingVictimId: null,
      laughterTimer: 0,
      revealedTimer: 0,
      stunTimer: 0
    };

    const meshData = this.buildJestyMesh();
    this.jesterMesh = meshData.group;
    this.torsoGroup = meshData.torsoGroup;
    this.headGroup = meshData.headGroup;
    this.leftArmGroup = meshData.leftArmGroup;
    this.rightArmGroup = meshData.rightArmGroup;
    this.leftLegGroup = meshData.leftLegGroup;
    this.rightLegGroup = meshData.rightLegGroup;
    this.leftBell = meshData.leftBell;
    this.rightBell = meshData.rightBell;
    this.centerBell = meshData.centerBell;
    this.jawMesh = meshData.jawMesh;
    this.gazeLight = meshData.gazeLight;
    this.revealedBeacon = meshData.beacon;

    this.group.add(this.jesterMesh);
    this.group.position.set(startX, 0, startZ);
    this.targetWaypoint = { x: startX, z: startZ };
  }

  /**
   * Constructs articulated Jesty Monster with Dual Comedy/Tragedy Mask faces & Bell Hat
   */
  private buildJestyMesh() {
    const root = new THREE.Group();

    const comedyMat = new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      roughness: 0.3,
      metalness: 0.1
    });
    const tragedyMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.4,
      metalness: 0.1
    });
    const goldBellMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.2
    });
    const jesterRedMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });
    const jesterBlackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
    const clawMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });

    // Torso pivot at pelvis (y = 0.85) so upper body leans forward/weeps naturally
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.85;
    root.add(torsoGroup);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.88, 0.44), jesterRedMat);
    torso.position.y = 0.44;
    torso.castShadow = true;
    torsoGroup.add(torso);

    // Harlequin diamond chest patch
    const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), jesterBlackMat);
    diamond.position.set(0, 0.48, 0.22);
    diamond.scale.set(1, 1.4, 0.25);
    torsoGroup.add(diamond);

    // Ruffled Clown Collar
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.1, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.9 })
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.92;
    torsoGroup.add(collar);

    // Head & Dual Mask Group (mounted atop torso)
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.28;

    // Front Face: COMEDY MASK
    const comedyFace = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 16, 16, 0, Math.PI),
      comedyMat
    );
    comedyFace.rotation.y = -Math.PI / 2;
    headGroup.add(comedyFace);

    const smileGeo = new THREE.TorusGeometry(0.14, 0.03, 8, 16, Math.PI);
    const smile = new THREE.Mesh(smileGeo, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    smile.rotation.x = Math.PI;
    smile.position.set(0, -0.12, 0.36);
    headGroup.add(smile);

    const eyeGeo = new THREE.SphereGeometry(0.048, 8, 8);
    const yellowEyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const cEyeR = new THREE.Mesh(eyeGeo, yellowEyeMat);
    cEyeR.position.set(0.14, 0.08, 0.35);
    headGroup.add(cEyeR);
    const cEyeL = new THREE.Mesh(eyeGeo, yellowEyeMat);
    cEyeL.position.set(-0.14, 0.08, 0.35);
    headGroup.add(cEyeL);

    // Back Face: TRAGEDY MASK
    const tragedyFace = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 16, 16, 0, Math.PI),
      tragedyMat
    );
    tragedyFace.rotation.y = Math.PI / 2;
    headGroup.add(tragedyFace);

    const frown = new THREE.Mesh(smileGeo, new THREE.MeshBasicMaterial({ color: 0x0369a1 }));
    frown.position.set(0, -0.12, -0.36);
    headGroup.add(frown);

    const tearGeo = new THREE.ConeGeometry(0.04, 0.15, 8);
    const tearMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const tearL = new THREE.Mesh(tearGeo, tearMat);
    tearL.position.set(-0.14, -0.06, -0.36);
    tearL.rotation.x = Math.PI;
    headGroup.add(tearL);
    const tearR = new THREE.Mesh(tearGeo, tearMat);
    tearR.position.set(0.14, -0.09, -0.36);
    tearR.rotation.x = Math.PI;
    headGroup.add(tearR);

    const blueEyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const tEyeR = new THREE.Mesh(eyeGeo, blueEyeMat);
    tEyeR.position.set(0.14, 0.08, -0.35);
    headGroup.add(tEyeR);
    const tEyeL = new THREE.Mesh(eyeGeo, blueEyeMat);
    tEyeL.position.set(-0.14, 0.08, -0.35);
    headGroup.add(tEyeL);

    const jawMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.15, 0.2), comedyMat);
    jawMesh.position.set(0, -0.22, 0.2);
    headGroup.add(jawMesh);

    const gazeLight = new THREE.PointLight(0xfacc15, 2.2, 16);
    gazeLight.position.set(0, 0.1, 0.5);
    headGroup.add(gazeLight);

    // Three-Horned Jester Hat with Brass Bells
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.28, 0);

    const centerHorn = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.65, 8), jesterRedMat);
    centerHorn.position.set(0, 0.32, -0.05);
    centerHorn.rotation.x = -0.25;
    hatGroup.add(centerHorn);
    const centerBell = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), goldBellMat);
    centerBell.position.set(0, 0.65, -0.15);
    hatGroup.add(centerBell);

    const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.6, 8), jesterBlackMat);
    leftHorn.position.set(-0.25, 0.25, 0);
    leftHorn.rotation.z = 0.55;
    hatGroup.add(leftHorn);
    const leftBell = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), goldBellMat);
    leftBell.position.set(-0.52, 0.45, 0);
    hatGroup.add(leftBell);

    const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.6, 8), jesterRedMat);
    rightHorn.position.set(0.25, 0.25, 0);
    rightHorn.rotation.z = -0.55;
    hatGroup.add(rightHorn);
    const rightBell = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), goldBellMat);
    rightBell.position.set(0.52, 0.45, 0);
    hatGroup.add(rightBell);

    headGroup.add(hatGroup);
    torsoGroup.add(headGroup);

    // Articulated Shoulder Pivots for Left & Right Arms
    const armGeo = new THREE.BoxGeometry(0.18, 0.85, 0.18);
    const clawGeo = new THREE.ConeGeometry(0.035, 0.22, 4);

    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.48, 0.82, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, jesterBlackMat);
    leftArmMesh.position.y = -0.4;
    leftArmGroup.add(leftArmMesh);
    for (let c = -1; c <= 1; c++) {
      const claw = new THREE.Mesh(clawGeo, clawMat);
      claw.position.set(c * 0.04, -0.9, 0.04);
      claw.rotation.x = Math.PI;
      leftArmGroup.add(claw);
    }
    torsoGroup.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.48, 0.82, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, jesterRedMat);
    rightArmMesh.position.y = -0.4;
    rightArmGroup.add(rightArmMesh);
    for (let c = -1; c <= 1; c++) {
      const claw = new THREE.Mesh(clawGeo, clawMat);
      claw.position.set(c * 0.04, -0.9, 0.04);
      claw.rotation.x = Math.PI;
      rightArmGroup.add(claw);
    }
    torsoGroup.add(rightArmGroup);

    // Articulated Hip Pivots for Left & Right Legs + Curled Jester Shoes
    const legGeo = new THREE.BoxGeometry(0.22, 0.82, 0.22);
    const shoeGeo = new THREE.BoxGeometry(0.24, 0.16, 0.44);

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.2, 0.85, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, jesterRedMat);
    leftLegMesh.position.y = -0.4;
    leftLegGroup.add(leftLegMesh);
    const leftShoe = new THREE.Mesh(shoeGeo, jesterBlackMat);
    leftShoe.position.set(0, -0.78, 0.1);
    leftLegGroup.add(leftShoe);
    root.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.2, 0.85, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, jesterBlackMat);
    rightLegMesh.position.y = -0.4;
    rightLegGroup.add(rightLegMesh);
    const rightShoe = new THREE.Mesh(shoeGeo, jesterRedMat);
    rightShoe.position.set(0, -0.78, 0.1);
    rightLegGroup.add(rightShoe);
    root.add(rightLegGroup);

    // Dying Bot Tracker Beacon Beam (visible through walls)
    const beaconGeo = new THREE.CylinderGeometry(0.38, 0.38, 40, 8);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.65,
      depthTest: false,
      side: THREE.DoubleSide
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 20;
    beacon.renderOrder = 998;
    beacon.visible = false;
    root.add(beacon);

    return {
      group: root,
      torsoGroup,
      headGroup,
      leftArmGroup,
      rightArmGroup,
      leftLegGroup,
      rightLegGroup,
      leftBell,
      rightBell,
      centerBell,
      jawMesh,
      gazeLight,
      beacon
    };
  }

  /**
   * Main AI Update for Jesty inside the Circus Maze with BFS Pathfinding & Wall Collision
   */
  public update(
    delta: number,
    elapsed: number,
    playerX: number,
    playerZ: number,
    playerIsHiding: boolean,
    playerImprisoned: boolean,
    playerGraceTimer: number,
    bots: BotCompanionState[],
    maze: CircusMaze,
    onDeliverVictim?: (victimType: 'PLAYER' | 'BOT', victimId: string | null) => void,
    isPanicMode: boolean = false
  ): void {
    this.chuckleCooldown -= delta;
    this.isMoving = false;
    this.moveSpeed = 0;
    this.lastPlayerDist = Math.hypot(playerX - this.info.x, playerZ - this.info.z);

    // 1. Revealed Tracker Countdown (From dead companion bots)
    if (this.info.revealedTimer && this.info.revealedTimer > 0) {
      this.info.revealedTimer -= delta;
      this.revealedBeacon.visible = true;
      (this.revealedBeacon.material as THREE.MeshBasicMaterial).opacity =
        0.4 + Math.sin(elapsed * 12.0) * 0.35;
    } else {
      this.revealedBeacon.visible = false;
    }

    // 1.5 Pistol Sirkus Stunned State: Drops any carried victim and stays immobilized with dizzy sway!
    if (this.stunTimer > 0) {
      this.stunTimer = Math.max(0, this.stunTimer - delta);
      this.info.stunTimer = this.stunTimer;
      this.info.state = 'STUNNED';
      this.gazeLight.color.setHex(0x38bdf8);
      this.gazeLight.intensity = Math.sin(elapsed * 24) > 0 ? 4.2 : 1.0;
      this.headGroup.rotation.z = Math.sin(elapsed * 18) * 0.35;
      this.clampAndAnimate(delta, elapsed, maze);
      if (this.stunTimer <= 0) {
        this.headGroup.rotation.z = 0;
        this.info.state = this.info.activeMask === 'COMEDY' ? 'PATROL' : 'WEEPING';
        this.info.targetType = 'NONE';
        this.info.targetBotId = null;
        this.pickRandomMazeWaypoint(maze);
      }
      return;
    }
    this.info.stunTimer = 0;
    this.headGroup.rotation.z = 0;

    // 2. Dynamic Mask Swap Ability (Panic Mode keeps Jesty furious in Comedy mask!)
    if (isPanicMode) {
      if (this.info.activeMask !== 'COMEDY') {
        this.info.activeMask = 'COMEDY';
        this.maskSpinPhase = Math.PI * 2;
        if (this.info.state === 'WEEPING') {
          this.info.state = 'PATROL';
        }
        horrorAudio.playMaskSwapComedy();
      }
      this.info.maskSwapTimer = 30.0;
    } else if (this.info.state !== 'CARRYING_VICTIM') {
      this.info.maskSwapTimer -= delta;
      if (this.info.maskSwapTimer <= 0) {
        if (this.info.activeMask === 'COMEDY') {
          this.info.activeMask = 'TRAGEDY';
          this.info.maskSwapTimer = 18.0 + Math.random() * 8.0;
          this.info.state = 'WEEPING';
          this.info.targetType = 'NONE';
          this.info.targetBotId = null;
          horrorAudio.playMaskSwapTragedy();
        } else {
          this.info.activeMask = 'COMEDY';
          this.info.maskSwapTimer = 24.0 + Math.random() * 8.0;
          this.info.state = 'PATROL';
          horrorAudio.playMaskSwapComedy();
        }
        this.maskSpinPhase = Math.PI * 2;
      }
    }

    if (this.maskSpinPhase > 0) {
      this.maskSpinPhase = Math.max(0, this.maskSpinPhase - delta * 10.0);
    }

    const targetHeadRot = this.info.activeMask === 'COMEDY' ? 0 : Math.PI;
    this.headGroup.rotation.y = targetHeadRot + this.maskSpinPhase;

    if (this.info.activeMask === 'COMEDY') {
      this.gazeLight.color.setHex(isPanicMode ? 0xff2a1a : 0xfacc15);
      this.gazeLight.intensity = isPanicMode ? 3.2 : 2.2;
    } else {
      this.gazeLight.color.setHex(0x38bdf8);
      this.gazeLight.intensity = 1.3;
    }

    // 3. Carrying a clutched victim -> Pathfind to front drop-off spot OUTSIDE prison cage bars!
    if (this.info.state === 'CARRYING_VICTIM') {
      const dropPos = maze.prisonDropOffPosition;
      const dist = Math.hypot(dropPos.x - this.info.x, dropPos.z - this.info.z);

      if (dist > 2.4) {
        this.moveWithMazePath(dropPos.x, dropPos.z, isPanicMode ? 6.4 : 4.9, delta, maze);
        if (this.chuckleCooldown <= 0 && this.lastPlayerDist < 55) {
          const vol = Math.max(0.18, 1 - this.lastPlayerDist / 55);
          horrorAudio.playJestyLaughter(vol);
          this.chuckleCooldown = isPanicMode ? 2.4 + Math.random() * 1.4 : 3.2 + Math.random() * 1.8;
        }
      } else {
        const deliveredType = this.info.carryingVictimType === 'PLAYER' ? 'PLAYER' : 'BOT';
        const deliveredId = this.info.carryingVictimId ?? null;
        horrorAudio.playPrisonDoorClang();
        horrorAudio.playJestyLaughter();
        maze.setPrisonGateOpen(false);
        this.info.state = 'TAUNTING';
        this.info.carryingVictim = null;
        this.info.carryingVictimType = 'NONE';
        this.info.carryingVictimId = null;
        this.tauntingTimer = isPanicMode ? 1.2 : 2.4;
        this.chuckleCooldown = 4.0;
        if (onDeliverVictim) {
          onDeliverVictim(deliveredType, deliveredId);
        }
      }

      this.clampAndAnimate(delta, elapsed, maze);
      return;
    }

    if (this.info.state === 'TAUNTING') {
      this.tauntingTimer -= delta;
      if (this.tauntingTimer <= 0) {
        this.info.state = this.info.activeMask === 'COMEDY' ? 'PATROL' : 'WEEPING';
        this.info.targetType = 'NONE';
        this.info.targetBotId = null;
        this.pickRandomMazeWaypoint(maze);
      }
      this.clampAndAnimate(delta, elapsed, maze);
      return;
    }

    // 4. TRAGEDY MASK MODE: Passive, weeping, DOES NOT ATTACK!
    if (this.info.activeMask === 'TRAGEDY') {
      this.info.state = 'WEEPING';
      this.info.targetType = 'NONE';
      this.info.targetBotId = null;

      this.waypointTimer -= delta;
      const d = Math.hypot(this.targetWaypoint.x - this.info.x, this.targetWaypoint.z - this.info.z);
      if (this.waypointTimer <= 0 || d < 2.2) {
        this.waypointTimer = 6.0 + Math.random() * 4.0;
        this.pickRandomMazeWaypoint(maze);
      }

      this.moveWithMazePath(this.targetWaypoint.x, this.targetWaypoint.z, 1.9, delta, maze);
      this.clampAndAnimate(delta, elapsed, maze);
      return;
    }

    // 5. COMEDY MASK MODE: Fair Multi-Target Detection across Player AND Companion Bots!
    interface PreyCandidate {
      type: 'PLAYER' | 'BOT';
      id: string | null;
      x: number;
      z: number;
      score: number;
    }

    const candidates: PreyCandidate[] = [];
    const playerDetectRange = isPanicMode ? 55 : 30;
    const botDetectRange = isPanicMode ? 55 : 34;
    const chaseSpeed = isPanicMode ? 7.35 : 5.2;
    const patrolSpeed = isPanicMode ? 5.6 : 3.2;

    const distToPlayer = Math.hypot(playerX - this.info.x, playerZ - this.info.z);
    if (!playerIsHiding && !playerImprisoned && playerGraceTimer <= 0 && distToPlayer < playerDetectRange) {
      candidates.push({
        type: 'PLAYER',
        id: null,
        x: playerX,
        z: playerZ,
        // Small fairness offset so bots are equally hunted
        score: distToPlayer + 2.5
      });
    }

    for (const bot of bots) {
      if (
        !bot.isAlive ||
        bot.state === 'HIDING' ||
        bot.state === 'IMPRISONED' ||
        bot.state === 'BEING_CARRIED' ||
        bot.state === 'ESCAPED'
      ) continue;
      const bd = Math.hypot(bot.x - this.info.x, bot.z - this.info.z);
      if (bd < botDetectRange) {
        // Slightly prioritize already-locked bot so Jesty commits cleanly to bot chases
        const stickiness = (this.info.targetType === 'BOT' && this.info.targetBotId === bot.id) ? -4.0 : 0;
        candidates.push({
          type: 'BOT',
          id: bot.id,
          x: bot.x,
          z: bot.z,
          score: bd + stickiness
        });
      }
    }

    if (this.investigateTimer > 0) {
      this.investigateTimer -= delta;
      if (this.investigateTimer <= 0) {
        this.investigateTarget = null;
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => a.score - b.score);
      const chosen = candidates[0];
      this.info.state = 'CHASING';
      this.info.targetType = chosen.type;
      this.info.targetBotId = chosen.id;

      this.moveWithMazePath(chosen.x, chosen.z, chaseSpeed, delta, maze);

      if (this.chuckleCooldown <= 0 && this.lastPlayerDist < 55) {
        const vol = Math.max(0.22, 1 - this.lastPlayerDist / 55);
        horrorAudio.playJestyLaughter(vol);
        this.chuckleCooldown = isPanicMode ? 2.1 + Math.random() * 1.4 : 2.8 + Math.random() * 2.0;
      }
    } else if (this.investigateTarget && this.investigateTimer > 0) {
      // Rush toward the machine that failed calibration!
      this.info.state = 'CHASING';
      this.info.targetType = 'NONE';
      this.info.targetBotId = null;

      const invDist = Math.hypot(this.investigateTarget.x - this.info.x, this.investigateTarget.z - this.info.z);
      if (invDist < 2.4) {
        this.investigateTarget = null;
        this.investigateTimer = 0;
      } else {
        this.moveWithMazePath(this.investigateTarget.x, this.investigateTarget.z, isPanicMode ? 7.35 : 5.4, delta, maze);
      }
      if (this.chuckleCooldown <= 0 && this.lastPlayerDist < 55) {
        const vol = Math.max(0.2, 1 - this.lastPlayerDist / 55);
        horrorAudio.playJestyLaughter(vol);
        this.chuckleCooldown = 3.4 + Math.random() * 2.2;
      }
    } else {
      // Autonomous corridor patrol across the maze
      this.info.state = 'PATROL';
      this.info.targetType = 'NONE';
      this.info.targetBotId = null;

      this.waypointTimer -= delta;
      const d = Math.hypot(this.targetWaypoint.x - this.info.x, this.targetWaypoint.z - this.info.z);
      if (this.waypointTimer <= 0 || d < 2.2) {
        this.waypointTimer = isPanicMode ? 3.5 + Math.random() * 2.5 : 5.0 + Math.random() * 4.0;
        this.pickRandomMazeWaypoint(maze);
      }

      this.moveWithMazePath(this.targetWaypoint.x, this.targetWaypoint.z, patrolSpeed, delta, maze);

      if (this.chuckleCooldown <= 0 && this.lastPlayerDist < 52) {
        const vol = Math.max(0.14, 1 - this.lastPlayerDist / 52);
        horrorAudio.playJestyLaughter(vol);
        this.chuckleCooldown = isPanicMode ? 3.2 + Math.random() * 2.2 : 4.8 + Math.random() * 3.8;
      }
    }

    this.clampAndAnimate(delta, elapsed, maze);
  }

  private pickRandomMazeWaypoint(maze: CircusMaze): void {
    const c = Math.floor(Math.random() * maze.gridCols);
    const r = Math.floor(Math.random() * maze.gridRows);
    this.targetWaypoint = maze.cellToWorld(c, r);
  }

  /**
   * Moves Jesty cleanly along open 19x19 BFS corridors with sliding wall/cage collision!
   */
  private moveWithMazePath(
    goalX: number,
    goalZ: number,
    speed: number,
    delta: number,
    maze: CircusMaze
  ): void {
    const radius = 0.65;

    // Safety depenetration: if Jesty ever overlaps a wall/locker/machine collider, push to nearest clear spot
    if (maze.checkCollision(this.info.x, this.info.z, radius)) {
      let escaped = false;
      for (const distTry of [0.35, 0.75, 1.35, 2.0]) {
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2;
          const tx = this.info.x + Math.cos(ang) * distTry;
          const tz = this.info.z + Math.sin(ang) * distTry;
          if (!maze.checkCollision(tx, tz, radius)) {
            this.info.x = tx;
            this.info.z = tz;
            escaped = true;
            break;
          }
        }
        if (escaped) break;
      }
    }

    const stepTarget = maze.findNextPathStep(this.info.x, this.info.z, goalX, goalZ);
    const dx = stepTarget.x - this.info.x;
    const dz = stepTarget.z - this.info.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.08) return;

    this.isMoving = true;
    this.moveSpeed = speed;

    const prevX = this.info.x;
    const prevZ = this.info.z;
    const stepLen = speed * delta;
    const dirX = dx / dist;
    const dirZ = dz / dist;
    const vx = dirX * stepLen;
    const vz = dirZ * stepLen;

    if (!maze.checkCollision(this.info.x + vx, this.info.z, radius)) {
      this.info.x += vx;
    }
    if (!maze.checkCollision(this.info.x, this.info.z + vz, radius)) {
      this.info.z += vz;
    }

    let movedDist = Math.hypot(this.info.x - prevX, this.info.z - prevZ);
    // Tangent steering around corridor lockers, machines, or wall corners
    if (movedDist < stepLen * 0.3) {
      const baseAngle = Math.atan2(dirZ, dirX);
      for (const offset of [0.62, -0.62, 1.05, -1.05, 1.48, -1.48]) {
        const tryAng = baseAngle + offset;
        const tx = this.info.x + Math.cos(tryAng) * stepLen;
        const tz = this.info.z + Math.sin(tryAng) * stepLen;
        if (!maze.checkCollision(tx, tz, radius)) {
          this.info.x = tx;
          this.info.z = tz;
          break;
        }
      }
      movedDist = Math.hypot(this.info.x - prevX, this.info.z - prevZ);
    }

    // If corner-snagged, nudge gently toward current grid cell center (only if center is collider-free)
    if (movedDist < stepLen * 0.15) {
      const cell = maze.worldToCell(this.info.x, this.info.z);
      const center = maze.cellToWorld(cell.c, cell.r);
      if (!maze.checkCollision(center.x, center.z, radius)) {
        const cdx = center.x - this.info.x;
        const cdz = center.z - this.info.z;
        const cd = Math.hypot(cdx, cdz);
        if (cd > 0.05) {
          const pushX = (cdx / cd) * stepLen;
          const pushZ = (cdz / cd) * stepLen;
          if (!maze.checkCollision(this.info.x + pushX, this.info.z, radius)) this.info.x += pushX;
          if (!maze.checkCollision(this.info.x, this.info.z + pushZ, radius)) this.info.z += pushZ;
        }
      }
    }

    const targetYaw = Math.atan2(dx, dz);
    let diff = targetYaw - this.info.rotationY;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.info.rotationY += diff * Math.min(1, delta * 10);
  }

  /**
   * Updates limb/torso/head/jaw 3D procedural animation & clamps to maze world bounds
   */
  private clampAndAnimate(delta: number, elapsed: number, maze: CircusMaze): void {
    const bounds = maze.getWorldBounds();
    this.info.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.info.x));
    this.info.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, this.info.z));

    this.group.position.set(this.info.x, 0, this.info.z);
    this.group.rotation.y = this.info.rotationY;

    // Advance walk cycle proportional to speed & emit Jesty footstep + bell jingle each half-stride
    const prevWalkPhase = this.walkPhase;
    const phaseRate = this.isMoving ? Math.max(3.5, this.moveSpeed * 1.9) : 2.0;
    this.walkPhase += delta * phaseRate;
    if (this.isMoving && Math.floor(prevWalkPhase / Math.PI) !== Math.floor(this.walkPhase / Math.PI)) {
      horrorAudio.playJestyFootstep(
        this.lastPlayerDist,
        this.info.state === 'CHASING' || this.info.state === 'CARRYING_VICTIM'
      );
    }

    // Bell jingle bounce
    const bellJingle = Math.sin(this.walkPhase * 2.0) * 0.07;
    this.leftBell.position.y = 0.45 + bellJingle;
    this.rightBell.position.y = 0.45 - bellJingle;
    this.centerBell.position.y = 0.65 + Math.cos(this.walkPhase * 2.0) * 0.05;

    const swing = this.isMoving ? Math.sin(this.walkPhase) : 0;

    if (this.info.state === 'STUNNED') {
      // Shocked dizzy animation: hunched back, drooping trembling arms, swaying head
      this.torsoGroup.rotation.x = THREE.MathUtils.damp(this.torsoGroup.rotation.x, -0.22, 8, delta);
      this.torsoGroup.rotation.z = Math.sin(elapsed * 16) * 0.14;
      this.headGroup.rotation.x = Math.cos(elapsed * 14) * 0.22;
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, 0.35, 8, delta);
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, 0.35, 8, delta);
      this.leftArmGroup.rotation.z = THREE.MathUtils.damp(this.leftArmGroup.rotation.z, 0.45, 8, delta);
      this.rightArmGroup.rotation.z = THREE.MathUtils.damp(this.rightArmGroup.rotation.z, -0.45, 8, delta);
      this.leftLegGroup.rotation.x = THREE.MathUtils.damp(this.leftLegGroup.rotation.x, 0, 8, delta);
      this.rightLegGroup.rotation.x = THREE.MathUtils.damp(this.rightLegGroup.rotation.x, 0, 8, delta);
      this.jesterMesh.position.y = 0;
      this.jawMesh.position.y = -0.25;
    } else if (this.info.state === 'WEEPING') {
      // Sorrowful weeping pose: hunched torso, shaking head, hands covering face
      this.torsoGroup.rotation.x = THREE.MathUtils.damp(this.torsoGroup.rotation.x, 0.34, 6, delta);
      this.torsoGroup.rotation.z = THREE.MathUtils.damp(this.torsoGroup.rotation.z, Math.sin(elapsed * 8) * 0.05, 8, delta);
      this.headGroup.rotation.x = THREE.MathUtils.damp(this.headGroup.rotation.x, 0.28 + Math.sin(elapsed * 12) * 0.05, 8, delta);
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, -1.25 + Math.sin(elapsed * 9) * 0.06, 8, delta);
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, -1.25 - Math.sin(elapsed * 9) * 0.06, 8, delta);
      this.leftArmGroup.rotation.z = THREE.MathUtils.damp(this.leftArmGroup.rotation.z, -0.25, 8, delta);
      this.rightArmGroup.rotation.z = THREE.MathUtils.damp(this.rightArmGroup.rotation.z, 0.25, 8, delta);
      this.leftLegGroup.rotation.x = swing * 0.38;
      this.rightLegGroup.rotation.x = -swing * 0.38;
      this.jesterMesh.position.y = Math.abs(swing) * 0.04;
      this.jawMesh.position.y = -0.22;
    } else if (this.info.state === 'CARRYING_VICTIM') {
      // Clutching victim tightly with both clawed arms extended forward toward prison cage
      this.torsoGroup.rotation.x = THREE.MathUtils.damp(this.torsoGroup.rotation.x, 0.14, 8, delta);
      this.torsoGroup.rotation.z = Math.cos(this.walkPhase) * 0.05;
      this.headGroup.rotation.x = THREE.MathUtils.damp(this.headGroup.rotation.x, -0.08 + Math.sin(elapsed * 12) * 0.05, 10, delta);
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, -1.4, 12, delta);
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, -1.4, 12, delta);
      this.leftArmGroup.rotation.z = THREE.MathUtils.damp(this.leftArmGroup.rotation.z, -0.18, 10, delta);
      this.rightArmGroup.rotation.z = THREE.MathUtils.damp(this.rightArmGroup.rotation.z, 0.18, 10, delta);
      this.leftLegGroup.rotation.x = swing * 0.65;
      this.rightLegGroup.rotation.x = -swing * 0.65;
      this.jesterMesh.position.y = Math.abs(swing) * 0.09;
      this.jawMesh.position.y = -0.22 - Math.abs(Math.sin(elapsed * 14)) * 0.07;
    } else if (this.info.state === 'CHASING') {
      // Predatory forward lunge, flailing clawed arms, manic chattering jaw!
      this.torsoGroup.rotation.x = THREE.MathUtils.damp(this.torsoGroup.rotation.x, 0.24, 8, delta);
      this.torsoGroup.rotation.z = Math.cos(this.walkPhase) * 0.09;
      this.headGroup.rotation.x = THREE.MathUtils.damp(this.headGroup.rotation.x, -0.1 + Math.sin(elapsed * 14) * 0.08, 10, delta);
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, -1.15 + Math.sin(this.walkPhase * 1.4) * 0.55, 10, delta);
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, -1.15 + Math.cos(this.walkPhase * 1.4) * 0.55, 10, delta);
      this.leftArmGroup.rotation.z = THREE.MathUtils.damp(this.leftArmGroup.rotation.z, 0.22, 8, delta);
      this.rightArmGroup.rotation.z = THREE.MathUtils.damp(this.rightArmGroup.rotation.z, -0.22, 8, delta);
      this.leftLegGroup.rotation.x = swing * 0.78;
      this.rightLegGroup.rotation.x = -swing * 0.78;
      this.jesterMesh.position.y = Math.abs(swing) * 0.14;
      this.jawMesh.position.y = -0.22 - Math.abs(Math.sin(elapsed * 14)) * 0.08;
    } else if (this.info.state === 'TAUNTING') {
      // Wide theatrical mocking arms & laughing torso rock
      this.torsoGroup.rotation.x = THREE.MathUtils.damp(this.torsoGroup.rotation.x, -0.12 + Math.sin(elapsed * 12) * 0.08, 8, delta);
      this.torsoGroup.rotation.z = Math.sin(elapsed * 7) * 0.1;
      this.headGroup.rotation.x = -0.18;
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, -0.4, 8, delta);
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, -0.4, 8, delta);
      this.leftArmGroup.rotation.z = THREE.MathUtils.damp(this.leftArmGroup.rotation.z, 0.95, 8, delta);
      this.rightArmGroup.rotation.z = THREE.MathUtils.damp(this.rightArmGroup.rotation.z, -0.95, 8, delta);
      this.leftLegGroup.rotation.x = THREE.MathUtils.damp(this.leftLegGroup.rotation.x, 0, 8, delta);
      this.rightLegGroup.rotation.x = THREE.MathUtils.damp(this.rightLegGroup.rotation.x, 0, 8, delta);
      this.jawMesh.position.y = -0.24 - Math.abs(Math.sin(elapsed * 16)) * 0.09;
    } else {
      // Jaunty creepy jester patrol stride
      this.torsoGroup.rotation.x = THREE.MathUtils.damp(this.torsoGroup.rotation.x, 0.06, 6, delta);
      this.torsoGroup.rotation.z = Math.cos(this.walkPhase) * 0.07;
      this.headGroup.rotation.x = THREE.MathUtils.damp(this.headGroup.rotation.x, -0.04, 6, delta);
      this.leftArmGroup.rotation.x = -swing * 0.55;
      this.rightArmGroup.rotation.x = swing * 0.55;
      this.leftArmGroup.rotation.z = THREE.MathUtils.damp(this.leftArmGroup.rotation.z, 0.14, 6, delta);
      this.rightArmGroup.rotation.z = THREE.MathUtils.damp(this.rightArmGroup.rotation.z, -0.14, 6, delta);
      this.leftLegGroup.rotation.x = swing * 0.55;
      this.rightLegGroup.rotation.x = -swing * 0.55;
      this.jesterMesh.position.y = Math.abs(swing) * 0.08;
      this.jawMesh.position.y = -0.22;
    }
  }

  public captureVictim(victimType: 'PLAYER' | 'BOT', victimId: string | null, displayName: string): void {
    this.info.state = 'CARRYING_VICTIM';
    this.info.carryingVictim = displayName;
    this.info.carryingVictimType = victimType;
    this.info.carryingVictimId = victimId;
    horrorAudio.playGrabbedSound();
    horrorAudio.playJestyLaughter();
  }

  public investigateMachineFailure(x: number, z: number): void {
    this.investigateTarget = { x, z };
    this.investigateTimer = 14.0;
    if (this.info.activeMask === 'COMEDY' && this.info.state !== 'CARRYING_VICTIM') {
      horrorAudio.playJestyLaughter();
    }
  }

  public setRevealed(duration: number = 5.0): void {
    this.info.revealedTimer = duration;
  }

  public stun(duration: number = 6.5): void {
    this.stunTimer = Math.max(this.stunTimer, duration);
    this.info.stunTimer = this.stunTimer;
    this.info.state = 'STUNNED';
    this.info.carryingVictim = null;
    this.info.carryingVictimType = 'NONE';
    this.info.carryingVictimId = null;
    this.info.targetType = 'NONE';
    this.info.targetBotId = null;
    this.investigateTarget = null;
    this.investigateTimer = 0;
  }

  public resetPosition(x: number, z: number): void {
    this.stunTimer = 0;
    this.info.stunTimer = 0;
    this.headGroup.rotation.z = 0;
    this.info.x = x;
    this.info.z = z;
    this.info.state = 'PATROL';
    this.info.activeMask = 'COMEDY';
    this.info.maskSwapTimer = 24.0;
    this.info.targetType = 'NONE';
    this.info.targetBotId = null;
    this.info.carryingVictim = null;
    this.info.carryingVictimType = 'NONE';
    this.info.carryingVictimId = null;
    this.info.revealedTimer = 0;
    this.investigateTarget = null;
    this.investigateTimer = 0;
    this.targetWaypoint = { x, z };
    this.group.position.set(x, 0, z);
  }
}