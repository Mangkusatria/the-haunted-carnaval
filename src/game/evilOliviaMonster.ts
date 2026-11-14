/**
 * Evil Olivia (Nightmare Mode Companion Monster to Jesty in Chapter 2 Maze)
 * Corrupted jester woman who stalks the Circus Labyrinth corridors alongside Jesty
 * and kidnaps caught players/bots straight into the iron Prison Cage.
 * Note: Evil Olivia NEVER teleports through paintings (only Jesty teleports to paintings).
 */

import * as THREE from 'three';
import { BotCompanionState, JestyState } from '../types';
import { horrorAudio } from '../audio/HorrorAudio';
import { CircusMaze } from './circusMaze';

export interface EvilOliviaInfo {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  state: JestyState;
  targetType: 'NONE' | 'PLAYER' | 'BOT';
  targetBotId: string | null;
  carryingVictim: string | null;
  carryingVictimType: 'NONE' | 'PLAYER' | 'BOT';
  carryingVictimId: string | null;
  revealedTimer: number;
  stunTimer: number;
}

export class EvilOliviaMonster {
  public group: THREE.Group = new THREE.Group();
  public info: EvilOliviaInfo;

  private bodyPivot: THREE.Group = new THREE.Group();
  private headGroup: THREE.Group = new THREE.Group();
  private leftArmGroup: THREE.Group = new THREE.Group();
  private rightArmGroup: THREE.Group = new THREE.Group();
  private gazeLight!: THREE.PointLight;
  private revealedBeacon!: THREE.Mesh;

  private walkPhase: number = 0;
  private chuckleCooldown: number = 3.5;
  private targetWaypoint: { x: number; z: number } = { x: 0, z: -260 };
  private waypointTimer: number = 0;
  private tauntingTimer: number = 0;
  private isMoving: boolean = false;
  private moveSpeed: number = 0;
  private lastPlayerDist: number = 999;
  private investigateTarget: { x: number; z: number } | null = null;
  private investigateTimer: number = 0;
  public stunTimer: number = 0;

  private cachedPath: { x: number; z: number }[] = [];
  private pathRecalcTimer: number = 0;

  constructor(startX: number = 24, startZ: number = -256) {
    this.info = {
      x: startX,
      y: 0,
      z: startZ,
      rotationY: 0,
      state: 'PATROL',
      targetType: 'NONE',
      targetBotId: null,
      carryingVictim: null,
      carryingVictimType: 'NONE',
      carryingVictimId: null,
      revealedTimer: 0,
      stunTimer: 0
    };

    this.buildEvilOliviaMesh();
    this.group.position.set(startX, 0, startZ);
    this.targetWaypoint = { x: startX, z: startZ };
  }

  private buildEvilOliviaMesh(): void {
    const darkCrimsonMat = new THREE.MeshStandardMaterial({ color: 0x450a1e, roughness: 0.58, metalness: 0.14 });
    const voidPlumMat = new THREE.MeshStandardMaterial({ color: 0x1a0826, roughness: 0.65, metalness: 0.12 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.28 });
    const paleMaskMat = new THREE.MeshStandardMaterial({ color: 0xe9dce5, roughness: 0.42 });
    const eyeGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff1e56,
      emissive: 0xff0044,
      emissiveIntensity: 1.9,
      roughness: 0.2
    });
    const clawMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.22 });

    this.bodyPivot.position.y = 0;
    this.group.add(this.bodyPivot);

    // Tapered tattered harlequin gown
    const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.52, 1.15, 12), voidPlumMat);
    dress.position.y = 0.58;
    dress.castShadow = true;
    this.bodyPivot.add(dress);

    // Upper bodice
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.27, 0.68, 12), darkCrimsonMat);
    torso.position.y = 1.48;
    torso.castShadow = true;
    this.bodyPivot.add(torso);

    // Crimson chest diamond patch
    const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), brassMat);
    diamond.scale.set(0.85, 1.3, 0.35);
    diamond.position.set(0, 1.54, 0.23);
    this.bodyPivot.add(diamond);

    // Jagged Jester Collar
    const collarGroup = new THREE.Group();
    collarGroup.position.y = 1.84;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.24, 5),
        i % 2 === 0 ? darkCrimsonMat : voidPlumMat
      );
      petal.position.set(Math.cos(angle) * 0.22, 0, Math.sin(angle) * 0.22);
      petal.rotation.z = -Math.cos(angle) * 1.15;
      petal.rotation.x = Math.sin(angle) * 1.15;
      collarGroup.add(petal);
    }
    this.bodyPivot.add(collarGroup);

    // Head + Corrupted 3-Horned Jester Cap
    this.headGroup.position.set(0, 2.08, 0);
    this.bodyPivot.add(this.headGroup);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 16), paleMaskMat);
    headMesh.scale.set(0.95, 1.1, 0.96);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    for (const side of [-1, 1]) {
      const mark = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), voidPlumMat);
      mark.scale.set(0.7, 1.4, 0.3);
      mark.position.set(side * 0.085, 0.02, 0.205);
      this.headGroup.add(mark);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), eyeGlowMat);
      eye.position.set(side * 0.085, 0.025, 0.225);
      this.headGroup.add(eye);
    }

    const grin = new THREE.Mesh(
      new THREE.TorusGeometry(0.085, 0.014, 6, 14, Math.PI * 0.9),
      eyeGlowMat
    );
    grin.position.set(0, -0.055, 0.215);
    grin.rotation.z = Math.PI + Math.PI * 0.05;
    this.headGroup.add(grin);

    // 3-Horned Evil Jester Cap with Brass Bells
    const horns: { x: number; z: number; rz: number; rx: number; h: number; mat: THREE.Material }[] = [
      { x: -0.1, z: -0.02, rz: 0.72, rx: 0.1, h: 0.42, mat: darkCrimsonMat },
      { x: 0.1, z: -0.02, rz: -0.72, rx: 0.1, h: 0.42, mat: voidPlumMat },
      { x: 0, z: -0.04, rz: 0, rx: -0.2, h: 0.44, mat: darkCrimsonMat }
    ];
    for (const h of horns) {
      const hg = new THREE.Group();
      hg.position.set(h.x, 0.18, h.z);
      hg.rotation.set(h.rx, 0, h.rz);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.095, h.h, 10), h.mat);
      cone.position.y = h.h * 0.5;
      hg.add(cone);
      const bell = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), brassMat);
      bell.position.y = h.h + 0.02;
      hg.add(bell);
      this.headGroup.add(hg);
    }

    // Piercing Magenta-Red Gaze Light
    this.gazeLight = new THREE.PointLight(0xff0055, 2.4, 14, 1.5);
    this.gazeLight.position.set(0, 0.04, 0.35);
    this.headGroup.add(this.gazeLight);

    // Clawed Arms
    const buildArm = (side: -1 | 1): THREE.Group => {
      const armP = new THREE.Group();
      armP.position.set(side * 0.32, 1.72, 0);

      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.42, 8), darkCrimsonMat);
      upper.position.set(0, -0.2, 0.05);
      armP.add(upper);

      const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.42, 8), voidPlumMat);
      fore.position.set(0, -0.46, 0.24);
      fore.rotation.x = -0.85;
      armP.add(fore);

      for (let c = -1; c <= 1; c++) {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.18, 5), clawMat);
        claw.position.set(c * 0.032, -0.6, 0.42);
        claw.rotation.x = Math.PI * 0.65;
        armP.add(claw);
      }

      return armP;
    };
    this.leftArmGroup = buildArm(-1);
    this.rightArmGroup = buildArm(1);
    this.bodyPivot.add(this.leftArmGroup, this.rightArmGroup);

    // X-Ray Radar Revealed Beacon
    const beaconGeo = new THREE.CylinderGeometry(0.28, 0.28, 28, 12);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xe879f9,
      transparent: true,
      opacity: 0.5,
      depthTest: false
    });
    this.revealedBeacon = new THREE.Mesh(beaconGeo, beaconMat);
    this.revealedBeacon.position.y = 14;
    this.revealedBeacon.visible = false;
    this.group.add(this.revealedBeacon);
  }

  public setRevealed(duration: number = 10.0): void {
    this.info.revealedTimer = Math.max(this.info.revealedTimer, duration);
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
    this.cachedPath = [];
  }

  public captureVictim(type: 'PLAYER' | 'BOT', botId: string | null, name: string): void {
    this.info.state = 'CARRYING_VICTIM';
    this.info.carryingVictim = name;
    this.info.carryingVictimType = type;
    this.info.carryingVictimId = botId;
    this.info.targetType = 'NONE';
    this.info.targetBotId = null;
    this.cachedPath = [];
    this.pathRecalcTimer = 0;
    horrorAudio.playJackyJumpscare();
  }

  public investigateMachineFailure(mx: number, mz: number): void {
    if (this.info.state === 'CARRYING_VICTIM' || this.stunTimer > 0) return;
    this.investigateTarget = { x: mx, z: mz };
    this.investigateTimer = 10.0;
    this.pathRecalcTimer = 0;
  }

  public resetPosition(x: number, z: number): void {
    this.info.x = x;
    this.info.y = 0;
    this.info.z = z;
    this.info.rotationY = 0;
    this.info.state = 'PATROL';
    this.info.targetType = 'NONE';
    this.info.targetBotId = null;
    this.info.carryingVictim = null;
    this.info.carryingVictimType = 'NONE';
    this.info.carryingVictimId = null;
    this.info.revealedTimer = 0;
    this.info.stunTimer = 0;
    this.stunTimer = 0;
    this.tauntingTimer = 0;
    this.investigateTarget = null;
    this.investigateTimer = 0;
    this.cachedPath = [];
    this.group.position.set(x, 0, z);
  }

  public update(
    delta: number,
    elapsed: number,
    playerX: number,
    playerZ: number,
    playerIsHiding: boolean,
    playerImprisoned: boolean,
    playerBeingCarried: boolean,
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

    if (this.info.revealedTimer > 0) {
      this.info.revealedTimer = Math.max(0, this.info.revealedTimer - delta);
      this.revealedBeacon.visible = true;
      (this.revealedBeacon.material as THREE.MeshBasicMaterial).opacity =
        0.38 + Math.sin(elapsed * 12) * 0.3;
    } else {
      this.revealedBeacon.visible = false;
    }

    // 1. Stunned by Pistol Sirkus
    if (this.stunTimer > 0) {
      this.stunTimer = Math.max(0, this.stunTimer - delta);
      this.info.stunTimer = this.stunTimer;
      this.info.state = 'STUNNED';
      this.gazeLight.color.setHex(0x38bdf8);
      this.gazeLight.intensity = Math.sin(elapsed * 22) > 0 ? 4.0 : 0.8;
      this.headGroup.rotation.z = Math.sin(elapsed * 16) * 0.35;
      this.animateAndClamp(delta, elapsed, maze);
      if (this.stunTimer <= 0) {
        this.headGroup.rotation.z = 0;
        this.info.state = 'PATROL';
        this.pickRandomWaypoint(maze);
      }
      return;
    }
    this.info.stunTimer = 0;
    this.headGroup.rotation.z = 0;
    this.gazeLight.color.setHex(isPanicMode ? 0xff1133 : 0xe879f9);
    this.gazeLight.intensity = isPanicMode ? 3.4 : 2.3;

    // 2. Carrying Victim Straight to Prison Cage
    if (this.info.state === 'CARRYING_VICTIM') {
      const dropPos = maze.prisonDropOffPosition;
      const dist = Math.hypot(dropPos.x - this.info.x, dropPos.z - this.info.z);
      if (dist > 2.4) {
        const carrySpeed = isPanicMode ? 7.8 : 8.8;
        this.moveWithMazePath(dropPos.x, dropPos.z, carrySpeed, delta, maze);
      } else {
        const deliveredType = this.info.carryingVictimType === 'PLAYER' ? 'PLAYER' : 'BOT';
        const deliveredId = this.info.carryingVictimId;
        horrorAudio.playPrisonDoorClang();
        horrorAudio.playJackyChuckle();
        maze.setPrisonGateOpen(false);
        this.info.state = 'TAUNTING';
        this.info.carryingVictim = null;
        this.info.carryingVictimType = 'NONE';
        this.info.carryingVictimId = null;
        this.tauntingTimer = 1.6;
        onDeliverVictim?.(deliveredType, deliveredId);
      }
      this.animateAndClamp(delta, elapsed, maze);
      return;
    }

    if (this.info.state === 'TAUNTING') {
      this.tauntingTimer -= delta;
      if (this.tauntingTimer <= 0) {
        this.info.state = 'PATROL';
        this.pickRandomWaypoint(maze);
      }
      this.animateAndClamp(delta, elapsed, maze);
      return;
    }

    // 3. Multi-target Prey Detection (Player & Surviving Companion Bots)
    interface TargetCand {
      type: 'PLAYER' | 'BOT';
      id: string | null;
      x: number;
      z: number;
      score: number;
    }
    const candidates: TargetCand[] = [];
    const detectRange = isPanicMode ? 58 : 34;

    if (!playerIsHiding && !playerImprisoned && !playerBeingCarried && playerGraceTimer <= 0) {
      const dp = Math.hypot(playerX - this.info.x, playerZ - this.info.z);
      if (dp < detectRange) {
        candidates.push({ type: 'PLAYER', id: null, x: playerX, z: playerZ, score: dp + 1.5 });
      }
    }

    for (const bot of bots) {
      if (
        !bot.isAlive ||
        bot.state === 'HIDING' ||
        bot.state === 'IMPRISONED' ||
        bot.state === 'BEING_CARRIED' ||
        bot.state === 'ESCAPED' ||
        bot.isCarriedByPlayer
      ) continue;
      const bd = Math.hypot(bot.x - this.info.x, bot.z - this.info.z);
      if (bd < detectRange) {
        const stick = this.info.targetType === 'BOT' && this.info.targetBotId === bot.id ? -3.5 : 0;
        candidates.push({ type: 'BOT', id: bot.id, x: bot.x, z: bot.z, score: bd + stick });
      }
    }

    if (this.investigateTimer > 0) {
      this.investigateTimer -= delta;
      if (this.investigateTimer <= 0) this.investigateTarget = null;
    }

    const chaseSpeed = isPanicMode ? 7.8 : 9.4;
    const patrolSpeed = isPanicMode ? 6.0 : 5.8;

    if (candidates.length > 0) {
      candidates.sort((a, b) => a.score - b.score);
      const chosen = candidates[0];
      this.info.state = 'CHASING';
      this.info.targetType = chosen.type;
      this.info.targetBotId = chosen.id;
      this.moveWithMazePath(chosen.x, chosen.z, chaseSpeed, delta, maze);
      if (this.chuckleCooldown <= 0 && this.lastPlayerDist < 50) {
        horrorAudio.playJackyChuckle();
        this.chuckleCooldown = 4.2 + Math.random() * 2.5;
      }
    } else if (this.investigateTarget && this.investigateTimer > 0) {
      this.info.state = 'CHASING';
      this.info.targetType = 'NONE';
      this.info.targetBotId = null;
      const invDist = Math.hypot(this.investigateTarget.x - this.info.x, this.investigateTarget.z - this.info.z);
      if (invDist < 2.2) {
        this.investigateTarget = null;
        this.investigateTimer = 0;
      } else {
        this.moveWithMazePath(this.investigateTarget.x, this.investigateTarget.z, chaseSpeed, delta, maze);
      }
    } else {
      this.info.state = 'PATROL';
      this.info.targetType = 'NONE';
      this.info.targetBotId = null;
      this.waypointTimer -= delta;
      const wd = Math.hypot(this.targetWaypoint.x - this.info.x, this.targetWaypoint.z - this.info.z);
      if (this.waypointTimer <= 0 || wd < 2.4) {
        this.waypointTimer = 7.0 + Math.random() * 5.0;
        this.pickRandomWaypoint(maze);
      }
      this.moveWithMazePath(this.targetWaypoint.x, this.targetWaypoint.z, patrolSpeed, delta, maze);
    }

    this.animateAndClamp(delta, elapsed, maze);
  }

  private pickRandomWaypoint(maze: CircusMaze): void {
    const col = Math.floor(Math.random() * maze.gridCols);
    const row = Math.floor(Math.random() * maze.gridRows);
    const pos = maze.cellToWorld(col, row);
    this.targetWaypoint = { x: pos.x, z: pos.z };
    this.pathRecalcTimer = 0;
  }

  private moveWithMazePath(targetX: number, targetZ: number, speed: number, delta: number, maze: CircusMaze): void {
    this.pathRecalcTimer -= delta;
    if (this.pathRecalcTimer <= 0 || this.cachedPath.length === 0) {
      const nextStep = maze.findNextPathStep(this.info.x, this.info.z, targetX, targetZ);
      this.cachedPath = [nextStep];
      this.pathRecalcTimer = 0.25;
    }

    const wp = this.cachedPath[0] ?? { x: targetX, z: targetZ };
    const dx = wp.x - this.info.x;
    const dz = wp.z - this.info.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.08) {
      const step = Math.min(dist, speed * delta);
      const nx = this.info.x + (dx / dist) * step;
      const nz = this.info.z + (dz / dist) * step;
      const resolved = maze.clampAndResolveCollision(this.info.x, this.info.z, nx, nz, 0.55);
      this.info.x = resolved.x;
      this.info.z = resolved.z;

      const targetYaw = Math.atan2(dx, dz);
      this.info.rotationY = THREE.MathUtils.damp(this.info.rotationY, targetYaw, 9, delta);
      this.isMoving = true;
      this.moveSpeed = speed;
    }
  }

  private animateAndClamp(delta: number, elapsed: number, maze: CircusMaze): void {
    const clamped = maze.clampAndResolveCollision(this.info.x, this.info.z, this.info.x, this.info.z, 0.55);
    this.info.x = clamped.x;
    this.info.z = clamped.z;

    const hoverY = this.stunTimer > 0 ? 0 : Math.sin(elapsed * 3.4) * 0.09 + 0.08;
    this.info.y = hoverY;
    this.group.position.set(this.info.x, hoverY, this.info.z);
    this.group.rotation.y = this.info.rotationY;

    if (this.isMoving) {
      this.walkPhase += delta * (this.moveSpeed * 1.1);
      this.bodyPivot.rotation.x = 0.14 + Math.sin(this.walkPhase) * 0.06;
    } else {
      this.bodyPivot.rotation.x = THREE.MathUtils.damp(this.bodyPivot.rotation.x, 0.04, 6, delta);
    }

    if (this.info.state === 'CARRYING_VICTIM') {
      this.leftArmGroup.rotation.x = -1.25;
      this.rightArmGroup.rotation.x = -1.25;
    } else if (this.info.state === 'CHASING') {
      this.leftArmGroup.rotation.x = -0.85 + Math.sin(elapsed * 9) * 0.25;
      this.rightArmGroup.rotation.x = -0.85 + Math.cos(elapsed * 9) * 0.25;
    } else {
      this.leftArmGroup.rotation.x = Math.sin(elapsed * 2.2) * 0.12;
      this.rightArmGroup.rotation.x = -Math.sin(elapsed * 2.2) * 0.12;
    }
  }
}
