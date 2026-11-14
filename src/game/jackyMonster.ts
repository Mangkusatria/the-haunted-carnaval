/**
 * Jacky (Jack-in-the-Box) Monster Engine & 3D Composite Model
 * Features mechanical spinning crank, opening box lid, coiled spring,
 * elongated clown body, razor claws, glowing eyes, and animated "nyengar-nyengir" smirk!
 */

import * as THREE from 'three';
import { ProceduralTextures } from './proceduralTextures';
import { BotCompanionState, Difficulty, JackyInfo, JackyState } from '../types';
import { horrorAudio } from '../audio/HorrorAudio';

export class JackyMonster {
  public group: THREE.Group = new THREE.Group();
  public info: JackyInfo;

  // 3D Model Parts (Composite THREE.Group: 10+ distinct parts)
  private boxMesh: THREE.Mesh;
  private lidMesh: THREE.Mesh;
  private crankPivot: THREE.Group;
  private springMesh: THREE.Mesh;
  private upperBodyGroup: THREE.Group;
  private headMesh: THREE.Mesh;
  private jawMesh: THREE.Mesh;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private eyeLightLeft: THREE.PointLight;
  private eyeLightRight: THREE.PointLight;
  private spotlightGaze: THREE.SpotLight;

  // Animation & AI Variables
  private crankSpeed: number = 2.0;
  private springHeight: number = 0.5; // 0.2 (hidden in box) to 2.2 (fully popped out)
  private targetSpringHeight: number = 0.5;
  private smirkTimer: number = 0;
  private giggleInterval: number = 5.0; // time between "nyengar-nyengir" giggles
  private giggleTimer: number = 0;
  private attackCooldown: number = 0;
  private stateTimer: number = 0;
  private patrolTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Leap / Mega Jump Ability
  private leapCooldown: number = 18.0;
  private leapTimer: number = 0;
  private leapStartX: number = 0;
  private leapStartZ: number = 0;
  private leapTargetX: number = 0;
  private leapTargetZ: number = 0;
  private leapDuration: number = 2.4;
  public stunTimer: number = 0;
  private currentDifficulty: Difficulty = 'NORMAL';
  public nightmareBotKillCount: number = 0;
  public onScreenShake?: (intensity: number) => void;
  public onLeapSlamLanded?: (landX: number, landZ: number) => void;

  constructor(startX: number = 40, startZ: number = 40) {
    this.info = {
      x: startX,
      y: 0,
      z: startZ,
      rotationY: 0,
      state: 'PATROL',
      targetType: 'NONE',
      targetBotId: null,
      distanceToPlayer: 100,
      isPoppedOut: false,
      crankAngle: 0,
      smirkIntensity: 0.3,
      chuckleTimer: 0,
      alertLevel: 0,
      stunTimer: 0
    };

    this.group.position.set(startX, 0, startZ);

    // Materials
    const boxTex = ProceduralTextures.getHarlequin();
    const boxMat = new THREE.MeshStandardMaterial({
      map: boxTex,
      roughness: 0.4,
      metalness: 0.5
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xc99c36,
      metalness: 0.9,
      roughness: 0.2
    });

    const steelSpringMat = new THREE.MeshStandardMaterial({
      color: 0x5a585a,
      metalness: 0.95,
      roughness: 0.25
    });

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x82131b,
      roughness: 0.7,
      metalness: 0.1
    });

    const clawMat = new THREE.MeshStandardMaterial({
      color: 0xb52222,
      metalness: 0.8,
      roughness: 0.2
    });

    const faceTex = ProceduralTextures.getJackyFace(0.6);
    const faceMat = new THREE.MeshStandardMaterial({
      map: faceTex,
      roughness: 0.3,
      metalness: 0.1
    });

    // 1. The Box Base (1.6m x 1.6m x 1.5m)
    const boxGeo = new THREE.BoxGeometry(1.6, 1.5, 1.6);
    this.boxMesh = new THREE.Mesh(boxGeo, boxMat);
    this.boxMesh.position.y = 0.75;
    this.boxMesh.castShadow = true;
    this.group.add(this.boxMesh);

    // Brass corner brackets on box
    const bracketGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const cornerOffsets = [
      [-0.8, 0.0, -0.8], [0.8, 0.0, -0.8],
      [-0.8, 0.0, 0.8], [0.8, 0.0, 0.8],
      [-0.8, 1.5, -0.8], [0.8, 1.5, -0.8],
      [-0.8, 1.5, 0.8], [0.8, 1.5, 0.8]
    ];
    cornerOffsets.forEach(([cx, cy, cz]) => {
      const b = new THREE.Mesh(bracketGeo, brassMat);
      b.position.set(cx, cy, cz);
      this.group.add(b);
    });

    // 2. The Box Lid (Hinged at back)
    const lidGeo = new THREE.BoxGeometry(1.65, 0.12, 1.65);
    this.lidMesh = new THREE.Mesh(lidGeo, boxMat);
    this.lidMesh.position.set(0, 1.55, -0.8);
    this.lidMesh.geometry.translate(0, 0, 0.8); // pivot along back edge
    this.group.add(this.lidMesh);

    // 3. Side Mechanical Hand-Crank
    this.crankPivot = new THREE.Group();
    this.crankPivot.position.set(0.85, 0.75, 0); // on right flank of box

    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8), brassMat);
    axle.rotation.z = Math.PI / 2;
    this.crankPivot.add(axle);

    const crankArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), brassMat);
    crankArm.position.set(0.12, 0.2, 0);
    this.crankPivot.add(crankArm);

    const handleKnob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), brassMat);
    handleKnob.position.set(0.18, 0.4, 0);
    this.crankPivot.add(handleKnob);

    this.group.add(this.crankPivot);

    // 4. Coiled Heavy Spring
    const springCurve = new THREE.CatmullRomCurve3(this.createSpringPoints(1.2));
    const springGeo = new THREE.TubeGeometry(springCurve, 40, 0.05, 8, false);
    this.springMesh = new THREE.Mesh(springGeo, steelSpringMat);
    this.springMesh.position.y = 0.5;
    this.group.add(this.springMesh);

    // 5. Upper Body Puppet Group
    this.upperBodyGroup = new THREE.Group();
    this.upperBodyGroup.position.set(0, 1.2, 0);

    // Elongated Torso
    const torsoGeo = new THREE.CylinderGeometry(0.35, 0.25, 1.1, 10);
    const torsoMesh = new THREE.Mesh(torsoGeo, bodyMat);
    torsoMesh.position.y = 0.55;
    this.upperBodyGroup.add(torsoMesh);

    // Clown Jester Ruff / Frilly Collar
    const ruffGeo = new THREE.TorusGeometry(0.48, 0.16, 8, 16);
    const ruffMesh = new THREE.Mesh(ruffGeo, new THREE.MeshStandardMaterial({ color: 0xdecbb2, roughness: 0.6 }));
    ruffMesh.rotation.x = Math.PI / 2;
    ruffMesh.position.y = 1.1;
    this.upperBodyGroup.add(ruffMesh);

    // Porcelain Clown Head
    const headGeo = new THREE.SphereGeometry(0.38, 16, 16);
    this.headMesh = new THREE.Mesh(headGeo, faceMat);
    this.headMesh.position.y = 1.48;
    this.upperBodyGroup.add(this.headMesh);

    // Nyengar-nyengir Lower Jaw (unhinged for grotesque smirk!)
    const jawGeo = new THREE.BoxGeometry(0.28, 0.14, 0.26);
    this.jawMesh = new THREE.Mesh(jawGeo, faceMat);
    this.jawMesh.position.set(0, 1.24, 0.2);
    this.upperBodyGroup.add(this.jawMesh);

    // Jester Cap with bells
    const hatGeo = new THREE.ConeGeometry(0.28, 0.7, 8);
    const hatMesh = new THREE.Mesh(hatGeo, new THREE.MeshStandardMaterial({ color: 0x7a111a, roughness: 0.6 }));
    hatMesh.position.set(0, 1.88, -0.05);
    hatMesh.rotation.x = -0.3;
    this.upperBodyGroup.add(hatMesh);

    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), brassMat);
    bell.position.set(0, 2.2, -0.2);
    this.upperBodyGroup.add(bell);

    // Glowing Crimson Eyes
    this.eyeLightLeft = new THREE.PointLight(0xff0022, 1.5, 4);
    this.eyeLightLeft.position.set(-0.12, 1.5, 0.35);
    this.upperBodyGroup.add(this.eyeLightLeft);

    this.eyeLightRight = new THREE.PointLight(0xff0022, 1.5, 4);
    this.eyeLightRight.position.set(0.12, 1.5, 0.35);
    this.upperBodyGroup.add(this.eyeLightRight);

    // Ominous Gaze Spotlight into fog
    this.spotlightGaze = new THREE.SpotLight(0xff1122, 2.5, 22, Math.PI / 5, 0.4, 1.2);
    this.spotlightGaze.position.set(0, 1.5, 0.3);
    const gazeTarget = new THREE.Object3D();
    gazeTarget.position.set(0, 0.5, 8);
    this.upperBodyGroup.add(gazeTarget);
    this.spotlightGaze.target = gazeTarget;
    this.upperBodyGroup.add(this.spotlightGaze);

    // 6. Lanky Arms with Claws
    this.leftArmGroup = this.createArm(true, bodyMat, clawMat);
    this.rightArmGroup = this.createArm(false, bodyMat, clawMat);
    this.upperBodyGroup.add(this.leftArmGroup);
    this.upperBodyGroup.add(this.rightArmGroup);

    this.group.add(this.upperBodyGroup);
  }

  private createArm(isLeft: boolean, bodyMat: THREE.Material, clawMat: THREE.Material): THREE.Group {
    const armG = new THREE.Group();
    const sign = isLeft ? -1 : 1;
    armG.position.set(sign * 0.45, 0.95, 0);

    // Upper arm
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.7, 6), bodyMat);
    upper.position.set(sign * 0.18, -0.28, 0);
    upper.rotation.z = -sign * 0.5;
    armG.add(upper);

    // Forearm
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.75, 6), bodyMat);
    lower.position.set(sign * 0.45, -0.75, 0.2);
    lower.rotation.x = 0.6;
    armG.add(lower);

    // Sharp Metal Claws
    for (let c = 0; c < 3; c++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.35, 4), clawMat);
      claw.position.set(sign * (0.4 + c * 0.05), -1.15, 0.45 + c * 0.04);
      claw.rotation.x = Math.PI / 1.8;
      armG.add(claw);
    }

    return armG;
  }

  private createSpringPoints(height: number): THREE.Vector3[] {
    const pts: THREE.Vector3[] = [];
    const coils = 6;
    const r = 0.28;
    for (let i = 0; i <= 36; i++) {
      const theta = (i / 36) * Math.PI * 2 * coils;
      const y = (i / 36) * height;
      pts.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
    }
    return pts;
  }

  /**
   * Main AI Update Loop
   */
  public update(
    delta: number,
    elapsed: number,
    playerX: number,
    playerZ: number,
    playerHiding: boolean,
    playerFlashlight: boolean,
    bots: BotCompanionState[],
    betrayedBotId: string | null = null,
    isBloodSky: boolean = false,
    playerGraceTimer: number = 0,
    difficulty: Difficulty = 'NORMAL'
  ): void {
    this.currentDifficulty = difficulty;
    const pos = this.group.position;
    this.info.x = pos.x;
    this.info.y = pos.y;
    this.info.z = pos.z;
    this.info.rotationY = this.group.rotation.y;

    // Calculate distance to player
    const distToPlayer = Math.hypot(playerX - pos.x, playerZ - pos.z);
    this.info.distanceToPlayer = distToPlayer;

    // Audio proximity & heartbeat
    horrorAudio.updateJackyProximity(distToPlayer, this.info.state === 'CHASING');

    // 0. Pistol Sirkus Stunned State: Immobilized, dizzy head wobble, cyan shocked eyes!
    if (this.stunTimer > 0) {
      this.stunTimer = Math.max(0, this.stunTimer - delta);
      this.info.stunTimer = this.stunTimer;
      this.info.state = 'STUNNED';
      this.info.isLeaping = false;
      this.info.isPoppedOut = true;
      pos.y = 0;
      this.boxMesh.rotation.set(0, 0, Math.sin(elapsed * 22) * 0.08);
      this.springHeight = THREE.MathUtils.damp(this.springHeight, 1.35, 8, delta);
      this.upperBodyGroup.position.y = 0.8 + this.springHeight;
      this.lidMesh.rotation.x = THREE.MathUtils.damp(this.lidMesh.rotation.x, -Math.PI / 1.5, 10, delta);
      this.headMesh.rotation.z = Math.sin(elapsed * 20) * 0.45;
      this.headMesh.rotation.y = Math.cos(elapsed * 15) * 0.55;
      this.leftArmGroup.rotation.x = 0.2 + Math.sin(elapsed * 18) * 0.15;
      this.rightArmGroup.rotation.x = 0.2 - Math.sin(elapsed * 18) * 0.15;
      const shockPulse = Math.sin(elapsed * 28) > 0 ? 4.5 : 1.0;
      this.eyeLightLeft.color.setHex(0x38bdf8);
      this.eyeLightRight.color.setHex(0x38bdf8);
      this.eyeLightLeft.intensity = shockPulse;
      this.eyeLightRight.intensity = shockPulse;
      this.spotlightGaze.color.setHex(0x38bdf8);
      this.spotlightGaze.intensity = 1.5;

      if (this.stunTimer <= 0) {
        this.boxMesh.rotation.set(0, 0, 0);
        this.eyeLightLeft.color.setHex(0xff0022);
        this.eyeLightRight.color.setHex(0xff0022);
        this.eyeLightLeft.intensity = 1.5;
        this.eyeLightRight.intensity = 1.5;
        this.spotlightGaze.color.setHex(0xff1122);
        this.spotlightGaze.intensity = 2.5;
        this.info.state = isBloodSky ? 'BLOOD_HUNT' : 'PATROL';
        this.info.targetType = 'NONE';
        this.info.targetBotId = null;
        this.pickNewPatrolTarget(playerX, playerZ);
      }
      return;
    }
    this.info.stunTimer = 0;

    // 1. Check for betrayed bot target (overrides player if player snitched!)
    if (betrayedBotId) {
      const betrayedBot = bots.find(b => b.id === betrayedBotId && b.isAlive);
      if (betrayedBot) {
        this.info.targetType = 'BOT';
        this.info.targetBotId = betrayedBotId;
        this.info.state = 'CHASING';
      }
    }

    // 2. Animated Nyengar-Nyengir (grotesque smirk & chuckles)
    this.giggleTimer += delta;
    if (this.giggleTimer >= this.giggleInterval) {
      this.giggleTimer = 0;
      this.giggleInterval = 4.0 + Math.random() * 4.0;
      // Nyengar-nyengir smirk trigger!
      this.info.smirkIntensity = 1.0;
      horrorAudio.playJackyChuckle();
    }
    // Decay smirk back to baseline
    this.info.smirkIntensity = Math.max(0.3, this.info.smirkIntensity - delta * 0.4);

    // Smirk jaw animation
    this.jawMesh.position.y = 1.24 - this.info.smirkIntensity * 0.08;
    this.jawMesh.rotation.z = Math.sin(elapsed * 8) * (this.info.smirkIntensity * 0.15);

    // Head erratic twitching
    this.headMesh.rotation.z = Math.sin(elapsed * 2.3) * 0.2 + (Math.random() < 0.05 ? (Math.random() - 0.5) * 0.4 : 0);
    this.headMesh.rotation.y = Math.sin(elapsed * 1.5) * 0.3;

    // 3. Crank rotation & clicking
    this.info.crankAngle += delta * this.crankSpeed;
    this.crankPivot.rotation.x = this.info.crankAngle;
    if (Math.floor(this.info.crankAngle / (Math.PI / 2)) !== Math.floor((this.info.crankAngle - delta * this.crankSpeed) / (Math.PI / 2))) {
      horrorAudio.playCrankClick();
    }

    // 4. Spring height & Lid Open/Close
    this.springHeight = THREE.MathUtils.damp(this.springHeight, this.targetSpringHeight, 8, delta);
    this.upperBodyGroup.position.y = 0.8 + this.springHeight;

    if (this.info.isPoppedOut) {
      this.targetSpringHeight = 1.8 + Math.sin(elapsed * 6) * 0.25;
      this.lidMesh.rotation.x = THREE.MathUtils.damp(this.lidMesh.rotation.x, -Math.PI / 1.5, 10, delta);
    } else {
      this.targetSpringHeight = 0.5;
      this.lidMesh.rotation.x = THREE.MathUtils.damp(this.lidMesh.rotation.x, 0, 10, delta);
    }

    // Arms animation
    if (this.info.state === 'CHASING' || this.info.state === 'ATTACKING') {
      this.leftArmGroup.rotation.x = Math.sin(elapsed * 8) * 0.8 + 0.4;
      this.rightArmGroup.rotation.x = Math.cos(elapsed * 8) * 0.8 + 0.4;
    } else {
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, 0, 4, delta);
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, 0, 4, delta);
    }

    // 4.5. Leap / Mega Jump Ability Execution
    if (this.info.state === 'LEAP_PREPARE') {
      this.leapTimer += delta;
      this.info.isPoppedOut = false;
      this.targetSpringHeight = 0.2;
      this.lidMesh.rotation.x = THREE.MathUtils.damp(this.lidMesh.rotation.x, 0, 14, delta);

      // Box vibrates intensely with coiled tension
      pos.x = this.leapStartX + (Math.random() - 0.5) * 0.18;
      pos.z = this.leapStartZ + (Math.random() - 0.5) * 0.18;
      this.crankSpeed = 16.0;

      const prepareTime = this.currentDifficulty === 'NIGHTMARE' ? 0.9 : 1.2;
      if (this.leapTimer >= prepareTime) {
        this.info.state = 'LEAP_AIRBORNE';
        this.leapTimer = 0;
        horrorAudio.playSpringLaunch();
      }
      return;
    }

    if (this.info.state === 'LEAP_AIRBORNE') {
      this.leapTimer += delta;
      const activeLeapDuration = this.currentDifficulty === 'NIGHTMARE' ? 1.85 : this.leapDuration;
      const progress = Math.min(1.0, this.leapTimer / activeLeapDuration);
      this.info.leapProgress = progress;

      // Parabolic flight arc up to 32 meters high in the circus sky!
      pos.x = this.leapStartX + (this.leapTargetX - this.leapStartX) * progress;
      pos.z = this.leapStartZ + (this.leapTargetZ - this.leapStartZ) * progress;
      pos.y = Math.sin(progress * Math.PI) * 32.0;

      // Box spins wildly during flight
      this.boxMesh.rotation.x += delta * 4.5;
      this.boxMesh.rotation.z += delta * 3.5;

      if (progress >= 1.0) {
        // Slam down into the landing zone!
        pos.set(this.leapTargetX, 0, this.leapTargetZ);
        this.boxMesh.rotation.set(0, 0, 0);
        this.info.state = 'LEAP_LANDING';
        this.leapTimer = 0;
        this.targetSpringHeight = 2.2;
        this.lidMesh.rotation.x = -Math.PI / 1.5;
        this.info.isPoppedOut = true;
        this.info.smirkIntensity = 1.0;
        horrorAudio.playLandingThud();
        horrorAudio.playJackyChuckle();
        if (this.onScreenShake) {
          this.onScreenShake(0.65);
        }
        if (this.onLeapSlamLanded) {
          this.onLeapSlamLanded(this.leapTargetX, this.leapTargetZ);
        }
      }
      return;
    }

    if (this.info.state === 'LEAP_LANDING') {
      this.leapTimer += delta;
      this.info.isPoppedOut = true;
      this.targetSpringHeight = 2.0 + Math.sin(elapsed * 12) * 0.3;
      this.lidMesh.rotation.x = -Math.PI / 1.5;

      if (this.leapTimer >= 0.7) {
        this.info.isLeaping = false;
        this.leapCooldown =
          this.currentDifficulty === 'NIGHTMARE'
            ? 2.2 + Math.random() * 2.1
            : this.currentDifficulty === 'HARD'
            ? 5.5 + Math.random() * 4.0
            : 22.0 + Math.random() * 12.0;
        if (isBloodSky) {
          this.info.state = 'BLOOD_HUNT';
        } else {
          this.info.state = 'CHASING';
        }
      }
      return;
    }

    // Check if Jacky can trigger a Mega Jump leap (HARD leaps often; NIGHTMARE leaps even more frequently!)
    this.leapCooldown -= delta;
    if (this.info.state !== 'INTERROGATING' && this.leapCooldown <= 0) {
      const isNightmare = this.currentDifficulty === 'NIGHTMARE';
      const isHard = this.currentDifficulty === 'HARD' || isNightmare;
      const minLeapDist = isNightmare ? 7 : isHard ? 11 : 22;
      const targetChance = isNightmare ? 0.96 : isHard ? 0.85 : 0.45;
      const patrolChance = isNightmare ? 0.88 : isHard ? 0.65 : 0.2;

      let shouldLeap = false;
      let targetX = playerX;
      let targetZ = playerZ;

      if (this.info.targetType === 'PLAYER' && playerGraceTimer <= 0 && !playerHiding) {
        const d = Math.hypot(playerX - pos.x, playerZ - pos.z);
        if (d > minLeapDist && Math.random() < targetChance) {
          shouldLeap = true;
          const angle = Math.random() * Math.PI * 2;
          const distOffset = isNightmare ? (1.2 + Math.random() * 2.5) : isHard ? (2 + Math.random() * 3.5) : (6 + Math.random() * 6);
          targetX = playerX + Math.cos(angle) * distOffset;
          targetZ = playerZ + Math.sin(angle) * distOffset;
        }
      } else if (this.info.targetType === 'BOT' && this.info.targetBotId) {
        const b = bots.find(bot => bot.id === this.info.targetBotId && bot.isAlive && bot.state !== 'ESCAPED' && !bot.isCarriedByPlayer);
        if (b) {
          const d = Math.hypot(b.x - pos.x, b.z - pos.z);
          if (d > minLeapDist && Math.random() < targetChance) {
            shouldLeap = true;
            const spread = isNightmare ? 2.5 : isHard ? 3.5 : 8;
            targetX = b.x + (Math.random() - 0.5) * spread;
            targetZ = b.z + (Math.random() - 0.5) * spread;
          }
        }
      } else if (Math.random() < patrolChance) {
        shouldLeap = true;
        if (isHard && !playerHiding && playerGraceTimer <= 0 && Math.random() < (isNightmare ? 0.8 : 0.65)) {
          // On HARD/NIGHTMARE mode, Jacky frequently ambushes toward the player
          const angle = Math.random() * Math.PI * 2;
          targetX = playerX + Math.cos(angle) * (2.2 + Math.random() * 3.2);
          targetZ = playerZ + Math.sin(angle) * (2.2 + Math.random() * 3.2);
        } else {
          targetX = (Math.random() - 0.5) * 160;
          targetZ = (Math.random() - 0.5) * 160;
        }
      }

      if (shouldLeap) {
        this.info.state = 'LEAP_PREPARE';
        this.leapStartX = pos.x;
        this.leapStartZ = pos.z;
        this.leapTargetX = Math.max(-122, Math.min(122, targetX));
        this.leapTargetZ = Math.max(-122, Math.min(122, targetZ));
        this.info.leapTargetX = this.leapTargetX;
        this.info.leapTargetZ = this.leapTargetZ;
        this.info.isLeaping = true;
        this.info.leapProgress = 0;
        this.leapTimer = 0;
        horrorAudio.playJackyChuckle();
        return;
      } else if (isHard) {
        // Retry quickly on HARD/NIGHTMARE if roll missed
        this.leapCooldown = isNightmare ? 0.9 : 2.0;
      }
    }

    // 5. Blood Sky Enraged Omniscient Hunt Mode
    if (isBloodSky) {
      this.info.isBloodHunt = true;
      this.info.isPoppedOut = true;
      this.crankSpeed = 10.5;
      this.info.smirkIntensity = 1.0;

      // Fiery Crimson Eyes & Spotlight
      this.eyeLightLeft.color.setHex(0xff0000);
      this.eyeLightLeft.intensity = 5.0;
      this.eyeLightRight.color.setHex(0xff0000);
      this.eyeLightRight.intensity = 5.0;
      this.spotlightGaze.color.setHex(0xff1111);
      this.spotlightGaze.intensity = 6.0;

      // Wild claw flailing animation
      this.leftArmGroup.rotation.x = Math.sin(elapsed * 12) * 1.1 + 0.5;
      this.rightArmGroup.rotation.x = Math.cos(elapsed * 12) * 1.1 + 0.5;

      // OMNISCIENCE: Jacky knows the exact location of EVERY living survivor!
      interface OmniscientSurvivor {
        type: 'PLAYER' | 'BOT';
        id: string | null;
        name: string;
        x: number;
        z: number;
        dist: number;
      }

      const allSurvivors: OmniscientSurvivor[] = [];

      // If a bot was betrayed, Jacky prioritizes that bot above all!
      if (betrayedBotId) {
        const betrayedBot = bots.find(b => b.id === betrayedBotId && b.isAlive);
        if (betrayedBot) {
          allSurvivors.push({
            type: 'BOT',
            id: betrayedBot.id,
            name: betrayedBot.name,
            x: betrayedBot.x,
            z: betrayedBot.z,
            dist: Math.hypot(betrayedBot.x - pos.x, betrayedBot.z - pos.z)
          });
        }
      }

      // If no betrayed bot override, evaluate survivors
      if (allSurvivors.length === 0) {
        // Player: Only if NOT hiding in a locker and NOT in grace timer
        if (!playerHiding && playerGraceTimer <= 0) {
          allSurvivors.push({
            type: 'PLAYER',
            id: null,
            name: 'Player',
            x: playerX,
            z: playerZ,
            dist: Math.hypot(playerX - pos.x, playerZ - pos.z)
          });
        }

        // All living companion bots
        for (const b of bots) {
          if (b.isAlive && b.state !== 'ESCAPED' && !b.isCarriedByPlayer) {
            allSurvivors.push({
              type: 'BOT',
              id: b.id,
              name: b.name,
              x: b.x,
              z: b.z,
              dist: Math.hypot(b.x - pos.x, b.z - pos.z)
            });
          }
        }
      }

      // Target closest survivor
      allSurvivors.sort((a, b) => a.dist - b.dist);
      const target = allSurvivors[0];

      if (target) {
        this.info.targetType = target.type;
        this.info.targetBotId = target.id;
        this.info.omniscientTargetName = target.name;

        // Furious bounding sprint (8.4 m/s base, scales per bot kill in NIGHTMARE!)
        const bloodKillBoost = this.currentDifficulty === 'NIGHTMARE' ? 1 + this.nightmareBotKillCount * 0.22 : 1.0;
        this.moveTowards(target.x, target.z, 8.4 * bloodKillBoost, delta);
        pos.y = Math.abs(Math.sin(elapsed * 9)) * 0.55;

        // Catch range
        if (target.dist < 2.3) {
          this.info.state = 'ATTACKING';
          this.stateTimer = 0;
          this.lookAtTarget(target.x, target.z);
        } else {
          this.info.state = 'BLOOD_HUNT';
        }
      } else {
        // Nobody exposed right now -> turn away and patrol far from hiding locker!
        this.info.targetType = 'NONE';
        this.info.targetBotId = null;
        this.info.state = 'PATROL';
        const pDist = Math.hypot(this.patrolTarget.x - pos.x, this.patrolTarget.z - pos.z);
        const patrolNearPlayer = Math.hypot(this.patrolTarget.x - playerX, this.patrolTarget.z - playerZ) < 35;
        if (pDist < 5 || (playerHiding && patrolNearPlayer)) {
          this.pickNewPatrolTarget(playerHiding ? playerX : undefined, playerHiding ? playerZ : undefined);
        }
        this.moveTowards(this.patrolTarget.x, this.patrolTarget.z, 5.6, delta);
      }
      return;
    }

    this.info.isBloodHunt = false;

    // Immediately drop aggro if player is hiding in a locker or has grace timer, and pivot to another bot!
    if (this.info.targetType === 'PLAYER' && (playerGraceTimer > 0 || playerHiding)) {
      this.onPlayerHidInLocker(bots, playerX, playerZ);
    }

    // 6. Normal State Machine Logic
    this.stateTimer += delta;

    switch (this.info.state) {
      case 'PATROL': {
        this.info.isPoppedOut = false;
        const isFastDiff = this.currentDifficulty === 'HARD' || this.currentDifficulty === 'NIGHTMARE';
        const killBoost = this.currentDifficulty === 'NIGHTMARE' ? 1 + this.nightmareBotKillCount * 0.22 : 1.0;
        this.crankSpeed = isFastDiff ? 5.0 * killBoost : 2.5;
        const patrolSpeedMult = (isFastDiff ? 2.0 : 1.0) * killBoost;

        // If player is hiding and patrol point or Jacky is right beside locker, immediately pick far zone & turn around!
        if (playerHiding && distToPlayer < 16) {
          this.onPlayerHidInLocker(bots, playerX, playerZ);
        }

        // Roam towards patrol target
        const pDist = Math.hypot(this.patrolTarget.x - pos.x, this.patrolTarget.z - pos.z);
        if (pDist < 5 || this.stateTimer > 18) {
          this.pickNewPatrolTarget(playerHiding ? playerX : undefined, playerHiding ? playerZ : undefined);
        } else {
          const basePatrolSpeed = playerHiding && distToPlayer < 22 ? 5.2 : 3.4;
          this.moveTowards(this.patrolTarget.x, this.patrolTarget.z, basePatrolSpeed * patrolSpeedMult, delta);
        }

        // Fair Multi-Target Detection: Evaluates Player AND all alive Bots equally!
        interface SurvivorCandidate {
          type: 'PLAYER' | 'BOT';
          id: string | null;
          x: number;
          z: number;
          threatScore: number;
        }

        const candidates: SurvivorCandidate[] = [];

        // Check Player (Respect graceTimer!)
        if (!playerHiding && playerGraceTimer <= 0) {
          const maxSight = playerFlashlight ? 48 : 26;
          if (distToPlayer < maxSight) {
            candidates.push({
              type: 'PLAYER',
              id: null,
              x: playerX,
              z: playerZ,
              threatScore: distToPlayer - (playerFlashlight ? 14 : 0) + 4.0
            });
          }
        }

        // Check all alive Bots (Slightly broader sight so Jacky actively hunts bots too!)
        for (const b of bots) {
          if (!b.isAlive || b.state === 'ESCAPED' || b.state === 'HIDING' || b.isCarriedByPlayer) continue;
          const bDist = Math.hypot(b.x - pos.x, b.z - pos.z);
          const maxSight = b.flashlightOn ? 62 : 34;
          if (bDist < maxSight) {
            candidates.push({
              type: 'BOT',
              id: b.id,
              x: b.x,
              z: b.z,
              threatScore: bDist - (b.flashlightOn ? 18 : 0) - (b.state === 'FLEEING' ? 12 : 4)
            });
          }
        }

        // Pick most noticeable survivor (lowest threat score)
        if (candidates.length > 0) {
          candidates.sort((a, b) => a.threatScore - b.threatScore);
          const target = candidates[0];
          this.triggerAlert(target.type, target.x, target.z, target.id);
        }
        break;
      }

      case 'STALKING': {
        this.info.isPoppedOut = false;
        const isFastDiff = this.currentDifficulty === 'HARD' || this.currentDifficulty === 'NIGHTMARE';
        const killBoost = this.currentDifficulty === 'NIGHTMARE' ? 1 + this.nightmareBotKillCount * 0.22 : 1.0;
        const stalkMult = (isFastDiff ? 2.0 : 1.0) * killBoost;
        this.crankSpeed = 4.5 * stalkMult; // faster winding

        if (this.info.targetType === 'PLAYER' && (playerHiding || playerGraceTimer > 0)) {
          this.info.state = 'PATROL';
          this.info.targetType = 'NONE';
          this.info.targetBotId = null;
          this.pickNewPatrolTarget();
          break;
        }

        // Sneak towards target
        const targetX = this.info.targetType === 'PLAYER' ? playerX : (bots.find(b => b.id === this.info.targetBotId)?.x ?? 0);
        const targetZ = this.info.targetType === 'PLAYER' ? playerZ : (bots.find(b => b.id === this.info.targetBotId)?.z ?? 0);
        const tDist = Math.hypot(targetX - pos.x, targetZ - pos.z);

        this.moveTowards(targetX, targetZ, 4.2 * stalkMult, delta);

        if (tDist < 12) {
          // POP OUT! Jumpscare Chase!
          this.triggerPopOutChase();
        } else if (this.stateTimer > 12) {
          this.info.state = 'PATROL';
          this.pickNewPatrolTarget();
        }
        break;
      }

      case 'CHASING': {
        this.info.isPoppedOut = true;
        this.crankSpeed = 7.0;

        if (this.info.targetType === 'PLAYER' && (playerHiding || playerGraceTimer > 0)) {
          // Player hid inside a locker! Immediately lose player and return to patrol!
          this.info.state = 'PATROL';
          this.info.targetType = 'NONE';
          this.info.targetBotId = null;
          this.pickNewPatrolTarget();
          break;
        }

        let chaseX = playerX;
        let chaseZ = playerZ;

        if (this.info.targetType === 'BOT' && this.info.targetBotId) {
          const targetBot = bots.find(b => b.id === this.info.targetBotId && b.isAlive && b.state !== 'ESCAPED' && !b.isCarriedByPlayer);
          if (targetBot) {
            chaseX = targetBot.x;
            chaseZ = targetBot.z;
          } else {
            this.info.state = 'PATROL';
            this.info.targetType = 'NONE';
            this.info.targetBotId = null;
            this.pickNewPatrolTarget();
            break;
          }
        } else if (this.info.targetType === 'PLAYER') {
          // If an active non-hiding bot is noticeably closer than the player, Jacky can pivot to them!
          let closerBot: BotCompanionState | null = null;
          let minBotDist = distToPlayer - 6.0;
          for (const b of bots) {
            if (!b.isAlive || b.state === 'HIDING' || b.state === 'ESCAPED' || b.isCarriedByPlayer) continue;
            const bd = Math.hypot(b.x - pos.x, b.z - pos.z);
            if (bd < minBotDist) {
              minBotDist = bd;
              closerBot = b;
            }
          }
          if (closerBot && !betrayedBotId) {
            this.info.targetType = 'BOT';
            this.info.targetBotId = closerBot.id;
            chaseX = closerBot.x;
            chaseZ = closerBot.z;
          }
        }

        // Fast bounding movement - 2X faster in HARD/NIGHTMARE outside Panic Mode, plus +22% per bot kill in NIGHTMARE
        const chaseDist = Math.hypot(chaseX - pos.x, chaseZ - pos.z);
        const isFastDiff = this.currentDifficulty === 'HARD' || this.currentDifficulty === 'NIGHTMARE';
        const killBoost = this.currentDifficulty === 'NIGHTMARE' ? 1 + this.nightmareBotKillCount * 0.22 : 1.0;
        const speed = 7.8 * (isFastDiff ? 2.0 : 1.0) * killBoost;
        this.moveTowards(chaseX, chaseZ, speed, delta);

        // Bounding hop
        pos.y = Math.abs(Math.sin(elapsed * 7)) * 0.45;

        // Catch distance
        if (chaseDist < 2.2) {
          this.info.state = 'ATTACKING';
          this.stateTimer = 0;
        }
        break;
      }

      case 'ATTACKING': {
        this.info.isPoppedOut = true;
        this.crankSpeed = 8.0;

        // Never freeze in ATTACKING! If player is hiding or target invalid/moved away, turn and resume hunting!
        if (this.info.targetType === 'PLAYER' && (playerHiding || playerGraceTimer > 0)) {
          this.onPlayerHidInLocker(bots, playerX, playerZ);
          break;
        }
        const targetBot = this.info.targetType === 'BOT'
          ? bots.find(b => b.id === this.info.targetBotId && b.isAlive && b.state !== 'ESCAPED' && !b.isCarriedByPlayer)
          : null;
        if (this.info.targetType === 'NONE' || (this.info.targetType === 'BOT' && !targetBot)) {
          this.info.state = 'PATROL';
          this.info.targetType = 'NONE';
          this.info.targetBotId = null;
          this.pickNewPatrolTarget(playerHiding ? playerX : undefined, playerHiding ? playerZ : undefined);
          break;
        }

        const targetX = this.info.targetType === 'PLAYER' ? playerX : targetBot!.x;
        const targetZ = this.info.targetType === 'PLAYER' ? playerZ : targetBot!.z;
        this.lookAtTarget(targetX, targetZ);

        // Resume chase if target slipped out of melee range or 1.2s elapsed
        const targetDist = Math.hypot(targetX - pos.x, targetZ - pos.z);
        if (targetDist > 2.8 || this.stateTimer > 1.2) {
          this.info.state = 'CHASING';
          this.stateTimer = 0;
        }
        break;
      }

      case 'INTERROGATING': {
        this.info.isPoppedOut = true;
        this.crankSpeed = 1.0;
        // In interrogation, Jacky is right in player's face, smirk is max!
        this.info.smirkIntensity = 1.0;
        this.lookAtTarget(playerX, playerZ);
        break;
      }
    }
  }

  /**
   * Called immediately when player enters a locker:
   * Jacky NEVER freezes or camps outside the locker — he immediately turns around and chases another surviving bot
   * (or heads straight to a distant fairground zone >= 55m away if no bots are exposed).
   */
  public onPlayerHidInLocker(bots: BotCompanionState[], playerX: number, playerZ: number): void {
    if (this.info.state === 'LEAP_PREPARE' && this.info.targetType === 'PLAYER') {
      this.info.isLeaping = false;
      this.leapTimer = 0;
    }

    const exposedBots = bots.filter(
      b => b.isAlive && b.state !== 'ESCAPED' && b.state !== 'HIDING' && !b.isCarriedByPlayer
    );

    if (exposedBots.length > 0) {
      // Pick closest or random exposed companion bot and turn straight toward them!
      exposedBots.sort(
        (a, b) =>
          Math.hypot(a.x - this.group.position.x, a.z - this.group.position.z) -
          Math.hypot(b.x - this.group.position.x, b.z - this.group.position.z)
      );
      const nextBot = exposedBots[0];
      this.info.targetType = 'BOT';
      this.info.targetBotId = nextBot.id;
      this.info.state = this.isBloodHuntFallback() ? 'BLOOD_HUNT' : 'CHASING';
      this.info.isPoppedOut = true;
      this.stateTimer = 0;
      this.lookAtTarget(nextBot.x, nextBot.z);
    } else {
      this.info.targetType = 'NONE';
      this.info.targetBotId = null;
      this.info.state = 'PATROL';
      this.info.isPoppedOut = false;
      this.stateTimer = 0;
      this.pickNewPatrolTarget(playerX, playerZ);
      this.lookAtTarget(this.patrolTarget.x, this.patrolTarget.z);
    }
  }

  private isBloodHuntFallback(): boolean {
    return Boolean(this.info.isBloodHunt);
  }

  private pickNewPatrolTarget(avoidX?: number, avoidZ?: number): void {
    this.stateTimer = 0;
    // Roam to key carnival zones
    const zones = [
      { x: 0, z: 0 },       // Big Top
      { x: 80, z: -25 },    // Midway
      { x: -80, z: -30 },   // Carousel
      { x: -85, z: 50 },    // Ferris Wheel
      { x: 85, z: 80 },     // Funhouse
      { x: -90, z: -90 },   // Caravans
      { x: 0, z: -80 }      // Entrance Plaza
    ];

    let candidates = zones;
    if (avoidX !== undefined && avoidZ !== undefined) {
      const farZones = zones.filter(z => Math.hypot(z.x - avoidX, z.z - avoidZ) >= 55);
      if (farZones.length > 0) {
        candidates = farZones;
      }
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    this.patrolTarget.set(picked.x + (Math.random() - 0.5) * 16, 0, picked.z + (Math.random() - 0.5) * 16);
  }

  private moveTowards(targetX: number, targetZ: number, speed: number, delta: number): void {
    const dx = targetX - this.group.position.x;
    const dz = targetZ - this.group.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.1) {
      const moveDist = Math.min(dist, speed * delta);
      this.group.position.x += (dx / dist) * moveDist;
      this.group.position.z += (dz / dist) * moveDist;

      // Smooth rotation
      const targetAngle = Math.atan2(dx, dz);
      this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, targetAngle, 8, delta);
    }
  }

  private lookAtTarget(targetX: number, targetZ: number): void {
    const dx = targetX - this.group.position.x;
    const dz = targetZ - this.group.position.z;
    this.group.rotation.y = Math.atan2(dx, dz);
  }

  public triggerAlert(type: 'PLAYER' | 'BOT', x: number, z: number, botId: string | null = null): void {
    this.info.targetType = type;
    this.info.targetBotId = botId;
    this.info.state = 'STALKING';
    this.stateTimer = 0;
    horrorAudio.playJackyChuckle();
  }

  public triggerPopOutChase(): void {
    this.info.state = 'CHASING';
    this.info.isPoppedOut = true;
    this.stateTimer = 0;
    horrorAudio.playJackyJumpscare();
  }

  public stun(duration: number = 6.5): void {
    this.stunTimer = Math.max(this.stunTimer, duration);
    this.info.stunTimer = this.stunTimer;
    this.info.state = 'STUNNED';
    this.info.isLeaping = false;
    this.info.isPoppedOut = true;
    this.info.targetType = 'NONE';
    this.info.targetBotId = null;
    this.group.position.y = 0;
    this.crankSpeed = 0;
  }

  public recordBotKill(): number {
    this.nightmareBotKillCount += 1;
    return this.nightmareBotKillCount;
  }

  public triggerImmediateLeapTo(targetX: number, targetZ: number): void {
    this.stunTimer = 0;
    this.info.stunTimer = 0;
    this.info.state = 'LEAP_PREPARE';
    this.leapStartX = this.group.position.x;
    this.leapStartZ = this.group.position.z;
    this.leapTargetX = Math.max(-122, Math.min(122, targetX));
    this.leapTargetZ = Math.max(-122, Math.min(122, targetZ));
    this.info.leapTargetX = this.leapTargetX;
    this.info.leapTargetZ = this.leapTargetZ;
    this.info.isLeaping = true;
    this.info.leapProgress = 0;
    this.leapTimer = 0.55; // Immediate surge launch straight toward the gate!
    horrorAudio.playSpringLaunch();
    horrorAudio.playJackyChuckle();
  }

  public resetToPatrol(awayX: number = 50, awayZ: number = 50, difficulty?: Difficulty): void {
    if (difficulty) this.currentDifficulty = difficulty;
    this.nightmareBotKillCount = 0;
    this.leapCooldown =
      this.currentDifficulty === 'NIGHTMARE' ? 3.0 : this.currentDifficulty === 'HARD' ? 6.0 : 18.0;
    this.stunTimer = 0;
    this.info.stunTimer = 0;
    this.boxMesh.rotation.set(0, 0, 0);
    this.eyeLightLeft.color.setHex(0xff0022);
    this.eyeLightRight.color.setHex(0xff0022);
    this.eyeLightLeft.intensity = 1.5;
    this.eyeLightRight.intensity = 1.5;
    this.spotlightGaze.color.setHex(0xff1122);
    this.spotlightGaze.intensity = 2.5;
    this.info.state = 'PATROL';
    this.info.targetType = 'NONE';
    this.info.targetBotId = null;
    this.info.isPoppedOut = false;
    this.group.position.set(awayX, 0, awayZ);
    this.pickNewPatrolTarget();
  }
}
