/**
 * Companion Bot Players Engine (Supports 2 - 16 Survivors)
 * Features autonomous movement, box collection, sprinting, crouching,
 * hiding in lockers/stalls, flashlight management, and live chat logging!
 */

import * as THREE from 'three';
import { BotCompanionState, CollectibleBox, MazeMachine } from '../types';
import { horrorAudio } from '../audio/HorrorAudio';
import { CircusMaze } from './circusMaze';

export interface ChatMessage {
  id: string;
  sender: string;
  color: string;
  textId: string;
  textEn: string;
  timestamp: string;
  type: 'WARNING' | 'ALERT' | 'INFO' | 'PANIC' | 'BETRAYAL';
}

interface BotRosterInfo {
  name: string;
  color: string;
  shirtHex: number;
}

const BOT_ROSTER: BotRosterInfo[] = [
  { name: 'Budi', color: '#3b82f6', shirtHex: 0x2563eb },
  { name: 'Maya', color: '#06b6d4', shirtHex: 0x0891b2 },
  { name: 'Rico', color: '#ef4444', shirtHex: 0xdc2626 },
  { name: 'Siti', color: '#eab308', shirtHex: 0xca8a04 },
  { name: 'Dimas', color: '#22c55e', shirtHex: 0x16a34a },
  { name: 'Tari', color: '#a855f7', shirtHex: 0x9333ea },
  { name: 'Kevin', color: '#f97316', shirtHex: 0xea580c },
  { name: 'Rina', color: '#ec4899', shirtHex: 0xdb2777 },
  { name: 'Aris', color: '#14b8a6', shirtHex: 0x0d9488 },
  { name: 'Luna', color: '#8b5cf6', shirtHex: 0x7c3aed },
  { name: 'Gilang', color: '#d97706', shirtHex: 0xb45309 },
  { name: 'Dewi', color: '#10b981', shirtHex: 0x059669 },
  { name: 'Fajar', color: '#0ea5e9', shirtHex: 0x0284c7 },
  { name: 'Citra', color: '#f43f5e', shirtHex: 0xe11d48 },
  { name: 'Rendy', color: '#6366f1', shirtHex: 0x4f46e5 },
  { name: 'Putri', color: '#84cc16', shirtHex: 0x65a30d }
];

export const CARNIVAL_ROAM_ZONES = [
  { name: 'Tenda Sirkus Utama (Big Top)', x: 0, z: 0 },
  { name: 'Stan Lempar Balon (Midway)', x: 75, z: -55 },
  { name: 'Stan Tembak Bebek (Midway)', x: 95, z: -40 },
  { name: 'Komedi Putar (Carousel)', x: -80, z: -30 },
  { name: 'Bianglala Raksasa (Ferris Wheel)', x: -85, z: 50 },
  { name: 'Labirin Rumah Kaca (Funhouse)', x: 85, z: 80 },
  { name: 'Gerbong Kafilah Sirkus', x: -85, z: -95 },
  { name: 'Pohon Mati Barat Sirkus', x: -105, z: 75 },
  { name: 'Gerobak Popcorn Ditinggalkan', x: 95, z: 5 },
  { name: 'Pelataran Tiket Gerbang', x: 0, z: -85 },
  { name: 'Kandang Hewan Buas', x: -85, z: -110 },
  { name: 'Podium Akrobatik Sirkus', x: 10, z: 12 },
  { name: 'Bangku Penonton Sirkus', x: -20, z: -8 },
  { name: 'Gondola Bawah Bianglala', x: -85, z: 35 },
  { name: 'Stan Ramalan Nasib', x: 75, z: -20 },
  { name: 'Sudut Lampu Rahasia', x: 65, z: 105 }
];

export class BotManager {
  public group: THREE.Group = new THREE.Group();
  public bots: BotCompanionState[] = [];
  public botMeshes: THREE.Group[] = [];
  private bodyGroups: THREE.Group[] = [];
  public flashlights: THREE.SpotLight[] = [];
  public bloodPoolMeshes: THREE.Mesh[] = [];
  public slashMeshes: THREE.Mesh[][] = [];
  public highlightMarkers: THREE.Group[] = [];
  private legRefs: { left: THREE.Mesh; right: THREE.Mesh }[] = [];
  public corpseStates: { collapseProgress: number; bloodScale: number; twitchTimer: number }[] = [];
  private botMazePaths: { x: number; z: number }[][] = [];
  private botPathTimers: number[] = [];
  private botLastPos: { x: number; z: number }[] = [];
  private botStuckTimers: number[] = [];
  private botAvoidMachineId: (number | null)[] = [];
  private botKnockbacks: { active: boolean; vx: number; vy: number; vz: number }[] = [];
  public chatLog: ChatMessage[] = [];
  public onChatAdded?: (msg: ChatMessage) => void;

  private chatCooldown: number = 0;

  constructor(botCount: number = 4) {
    this.spawnBots(botCount);
  }

  public assignNewZoneTarget(bot: BotCompanionState): void {
    const zone = CARNIVAL_ROAM_ZONES[Math.floor(Math.random() * CARNIVAL_ROAM_ZONES.length)];
    bot.targetX = zone.x + (Math.random() - 0.5) * 16;
    bot.targetZ = zone.z + (Math.random() - 0.5) * 16;
    bot.assignedZoneName = zone.name;

    // 18% chance to announce roaming in radio chat
    if (this.chatCooldown <= 0 && Math.random() < 0.18) {
      this.addChatMessage(
        bot.name,
        bot.color,
        `Aku sedang menyisir area ${zone.name} untuk mencari kotak Jack-in-the-Box!`,
        `I'm searching ${zone.name} for Jack-in-the-Box collectibles!`,
        'INFO'
      );
      this.chatCooldown = 6.0;
    }
  }

  public spawnBots(count: number): void {
    // Clear existing
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.bots = [];
    this.botMeshes = [];
    this.bodyGroups = [];
    this.flashlights = [];
    this.bloodPoolMeshes = [];
    this.slashMeshes = [];
    this.highlightMarkers = [];
    this.legRefs = [];
    this.corpseStates = [];
    this.botMazePaths = [];
    this.botPathTimers = [];
    this.botLastPos = [];
    this.botStuckTimers = [];
    this.botAvoidMachineId = [];
    this.botKnockbacks = [];

    const clampedCount = Math.max(2, Math.min(16, count));

    for (let i = 0; i < clampedCount; i++) {
      const roster = BOT_ROSTER[i % BOT_ROSTER.length];
      const startAngle = (i / clampedCount) * Math.PI * 2;
      const startRadius = 6 + (i % 3) * 3;
      const startX = -5 + Math.cos(startAngle) * startRadius;
      const startZ = -100 + Math.sin(startAngle) * startRadius;

      // Assign initial varied destinations across circus fairground
      const initialZone = CARNIVAL_ROAM_ZONES[i % CARNIVAL_ROAM_ZONES.length];

      const state: BotCompanionState = {
        id: `bot_${i + 1}`,
        name: roster.name,
        x: startX,
        y: 0,
        z: startZ,
        rotationY: Math.random() * Math.PI * 2,
        color: roster.color,
        health: 100,
        isAlive: true,
        state: 'SEARCHING',
        flashlightOn: true,
        currentDialog: null,
        dialogTimer: 0,
        panicLevel: 0,
        boxesFound: 0,
        targetX: initialZone.x + (Math.random() - 0.5) * 12,
        targetZ: initialZone.z + (Math.random() - 0.5) * 12,
        hideCooldown: 0,
        assignedZoneName: initialZone.name,
        waypointWaitTimer: 0,
        targetMachineId: null,
        botSkillCheckTimer: 2.8,
        isCarriedByPlayer: false
      };
      this.bots.push(state);

      // Create 3D Survivor Character with glowing trim, nameplate & flashlight cone
      const botG = this.createBotMesh(roster.shirtHex, roster.name, roster.color);
      botG.position.set(startX, 0, startZ);
      this.group.add(botG);
      this.botMeshes.push(botG);
      this.corpseStates.push({
        collapseProgress: 0,
        bloodScale: 0.1,
        twitchTimer: 1.6
      });
      this.botKnockbacks.push({ active: false, vx: 0, vy: 0, vz: 0 });
    }

    // Initial greeting in chat
    setTimeout(() => {
      this.addChatMessage(
        'Sistem',
        '#9ca3af',
        `Kalian masuk bersama ${clampedCount} rekan survivor. Tetap waspada dan kumpulkan 20 kotak Jack-in-the-Box!`,
        `You entered with ${clampedCount} companion survivors. Stay alert and collect 20 Jack-in-the-Box items!`,
        'INFO'
      );
    }, 1000);
  }

  private createBotNameplate(name: string, cssColor: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(10, 12, 18, 0.85)';
      ctx.strokeStyle = cssColor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(8, 8, 240, 48, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name.toUpperCase(), 128, 33);
    }
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      fog: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.6, 0.4, 1);
    sprite.position.set(0, 2.35, 0);
    return sprite;
  }

  private createBotMesh(shirtColor: number, botName: string, cssColor: string): THREE.Group {
    const g = new THREE.Group();
    const bodyGroup = new THREE.Group();
    g.add(bodyGroup);
    this.bodyGroups.push(bodyGroup);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: shirtColor,
      roughness: 0.65,
      emissive: new THREE.Color(shirtColor),
      emissiveIntensity: 0.25
    });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const backpackMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });

    // Torso (Survivor Jacket) + Glowing Reflective Safety Strip so bots stay visible in dark corridors
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.4), shirtMat);
    torso.position.y = 1.1;
    torso.castShadow = true;
    bodyGroup.add(torso);

    const vestStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.74, 0.14, 0.44),
      new THREE.MeshBasicMaterial({ color: shirtColor, fog: false })
    );
    vestStrip.position.y = 1.22;
    bodyGroup.add(vestStrip);

    // Backpack
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.25), backpackMat);
    backpack.position.set(0, 1.1, -0.3);
    bodyGroup.add(backpack);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), skinMat);
    head.position.y = 1.75;
    bodyGroup.add(head);

    // Hair / Cap
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.4), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    cap.position.set(0, 1.9, 0.05);
    bodyGroup.add(cap);

    // Floating 3D Survivor Nameplate above head (clearly visible in dark corridors!)
    const namePlate = this.createBotNameplate(botName, cssColor);
    bodyGroup.add(namePlate);

    // Legs (with hip pivot translation for natural walking stride)
    const leftLegGeo = new THREE.BoxGeometry(0.22, 0.75, 0.22);
    leftLegGeo.translate(0, -0.375, 0);
    const leftLeg = new THREE.Mesh(leftLegGeo, pantsMat);
    leftLeg.position.set(-0.18, 0.75, 0);
    bodyGroup.add(leftLeg);

    const rightLegGeo = new THREE.BoxGeometry(0.22, 0.75, 0.22);
    rightLegGeo.translate(0, -0.375, 0);
    const rightLeg = new THREE.Mesh(rightLegGeo, pantsMat);
    rightLeg.position.set(0.18, 0.75, 0);
    bodyGroup.add(rightLeg);
    this.legRefs.push({ left: leftLeg, right: rightLeg });

    // Flashlight Hand + Visible Volumetric Flashlight Cone + SpotLight on root g
    const flashlightMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.25, 6),
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 })
    );
    flashlightMesh.rotation.x = Math.PI / 2;
    flashlightMesh.position.set(0.4, 0.95, 0.35);
    bodyGroup.add(flashlightMesh);

    const lensMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfef9c3, fog: false })
    );
    lensMesh.position.set(0.4, 0.95, 0.48);
    bodyGroup.add(lensMesh);

    const beamConeGeo = new THREE.ConeGeometry(1.4, 5.5, 12, 1, true);
    beamConeGeo.translate(0, -2.75, 0);
    beamConeGeo.rotateX(Math.PI / 2);
    const beamCone = new THREE.Mesh(
      beamConeGeo,
      new THREE.MeshBasicMaterial({
        color: 0xfef3c7,
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    beamCone.position.set(0.4, 0.95, 0.48);
    bodyGroup.add(beamCone);

    const spot = new THREE.SpotLight(0xfffaed, 2.8, 26, Math.PI / 5, 0.3, 1.0);
    spot.position.set(0.4, 0.95, 0.4);
    const targetObj = new THREE.Object3D();
    targetObj.position.set(0.4, 0.2, 8);
    g.add(targetObj);
    spot.target = targetObj;
    g.add(spot);
    this.flashlights.push(spot);

    // Blood Puddle underneath the corpse on carnival mud
    const bloodPoolGeo = new THREE.CircleGeometry(1.6, 24);
    const bloodPoolMat = new THREE.MeshStandardMaterial({
      color: 0x5a0202,
      roughness: 0.12,
      metalness: 0.25
    });
    const bloodPool = new THREE.Mesh(bloodPoolGeo, bloodPoolMat);
    bloodPool.rotation.x = -Math.PI / 2;
    bloodPool.position.set(0, 0.02, 0);
    bloodPool.scale.set(0.001, 0.001, 0.001);
    bloodPool.visible = false;
    bodyGroup.add(bloodPool);
    this.bloodPoolMeshes.push(bloodPool);

    // Bloody Claw Slash Marks across the jacket
    const slashMat = new THREE.MeshBasicMaterial({ color: 0x990000 });
    const slash1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.05), slashMat);
    slash1.position.set(0.05, 1.2, 0.22);
    slash1.rotation.z = -0.4;
    slash1.visible = false;
    bodyGroup.add(slash1);

    const slash2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.05), slashMat);
    slash2.position.set(-0.05, 1.05, 0.22);
    slash2.rotation.z = -0.3;
    slash2.visible = false;
    bodyGroup.add(slash2);
    this.slashMeshes.push([slash1, slash2]);

    // 10-Second X-Ray Whistle Highlight Beacon (fog: false so it is 100% visible through dark maze fog & walls!)
    const markerGroup = new THREE.Group();
    markerGroup.visible = false;

    const xrayRingMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthTest: false,
      fog: false
    });
    const feetRing = new THREE.Mesh(new THREE.RingGeometry(0.65, 1.05, 24), xrayRingMat);
    feetRing.rotation.x = -Math.PI / 2;
    feetRing.position.y = 0.08;
    feetRing.renderOrder = 999;
    markerGroup.add(feetRing);

    const auraColumnMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.48,
      depthTest: false,
      side: THREE.DoubleSide,
      fog: false
    });
    const auraColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 20, 14, 1, true), auraColumnMat);
    auraColumn.position.y = 10.0;
    auraColumn.renderOrder = 999;
    markerGroup.add(auraColumn);

    const diamondMat = new THREE.MeshBasicMaterial({
      color: 0x6ee7b7,
      transparent: true,
      opacity: 0.98,
      depthTest: false,
      fog: false
    });
    const overheadDiamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), diamondMat);
    overheadDiamond.position.y = 2.95;
    overheadDiamond.renderOrder = 1000;
    markerGroup.add(overheadDiamond);

    bodyGroup.add(markerGroup);
    this.highlightMarkers.push(markerGroup);

    return g;
  }

  public update(
    delta: number,
    elapsed: number,
    playerX: number,
    playerZ: number,
    jackyX: number,
    jackyZ: number,
    jackyState: string,
    collectibleBoxes: CollectibleBox[],
    hidingSpots: { x: number; z: number; name: string }[],
    onBoxCollectedByBot: (boxId: number, botName: string) => void,
    isBloodSky: boolean = false
  ): void {
    this.chatCooldown -= delta;

    this.bots.forEach((bot, idx) => {
      const mesh = this.botMeshes[idx];
      const spot = this.flashlights[idx];
      const bloodPool = this.bloodPoolMeshes[idx];
      const slashes = this.slashMeshes[idx];
      const corpse = this.corpseStates[idx];

      // If Bot is DEAD (Mayat yang ada darah nya dan jatuh roboh ke tanah, tidak diam tegak saja!)
      if (!bot.isAlive) {
        if (corpse && mesh) {
          corpse.collapseProgress = Math.min(1.0, corpse.collapseProgress + delta * 3.5);
          corpse.bloodScale = Math.min(2.2, corpse.bloodScale + delta * 0.45);

          // Rotate body to fall onto the ground and lay flat
          mesh.position.y = THREE.MathUtils.damp(mesh.position.y, 0.22, 6, delta);
          mesh.rotation.x = THREE.MathUtils.damp(mesh.rotation.x, 1.55, 6, delta);
          mesh.rotation.z = THREE.MathUtils.damp(mesh.rotation.z, 0.42, 6, delta);

          // Early eerie death twitch (life fading away)
          if (corpse.twitchTimer > 0) {
            corpse.twitchTimer -= delta;
            mesh.rotation.z += (Math.random() - 0.5) * 0.035;
          }

          // Show bloody claw slashes on torso
          if (slashes) {
            slashes.forEach(s => (s.visible = true));
          }

          // Expand blood puddle beneath the corpse on the dirt
          if (bloodPool) {
            bloodPool.visible = true;
            bloodPool.scale.set(corpse.bloodScale, corpse.bloodScale, 1);
            bloodPool.position.y = 0.02 - mesh.position.y;
          }

          // Flashlight dropped on ground flickers out
          if (spot) {
            spot.position.set(bot.x + 0.4, 0.15, bot.z + 0.2);
            spot.target.position.set(bot.x + 1.8, 0.05, bot.z + 0.5);
            spot.intensity = Math.max(0, spot.intensity - delta * 0.8) * (Math.random() < 0.2 ? 0.2 : 0.85);
          }
        }
        return;
      }

      if (bot.state === 'ESCAPED') return;

      if (bot.isCarriedByPlayer) {
        mesh.scale.set(1.0, 0.9, 1.0);
        mesh.position.set(bot.x, bot.y, bot.z);
        mesh.rotation.set(0, bot.rotationY, 0);
        spot.intensity = 1.6;
        const legs = this.legRefs[idx];
        if (legs) {
          const kick = Math.sin(elapsed * 8 + idx) * 0.25;
          legs.left.rotation.x = kick;
          legs.right.rotation.x = -kick;
        }
        return;
      }

      const distToJacky = Math.hypot(jackyX - bot.x, jackyZ - bot.z);
      const distToPlayer = Math.hypot(playerX - bot.x, playerZ - bot.z);

      // Blood Sky Emergency: All bots know hiding is useless, sprint to North Gate!
      if (isBloodSky) {
        bot.state = 'ESCAPING';
        bot.panicLevel = 1.0;

        const gateX = 0;
        const gateZ = -115;
        const distToGate = Math.hypot(gateX - bot.x, gateZ - bot.z);

        if (distToGate < 7.5) {
          // Successfully escaped! Hide visual bodyGroup only, keep SpotLight visible with intensity 0
          bot.state = 'ESCAPED';
          if (this.bodyGroups[idx]) this.bodyGroups[idx].visible = false;
          spot.intensity = 0;
          this.addChatMessage(
            bot.name,
            bot.color,
            `AKU BERHASIL KELUAR MELEWATI GERBANG UTARA!! CEPAT LARI KESINI SEMUANYA!!`,
            `I ESCAPED THROUGH THE NORTH GATE!! SPRINT OVER HERE EVERYONE!!`,
            'INFO'
          );
          return;
        }

        // Sprint towards the gate
        const dx = gateX - bot.x;
        const dz = gateZ - bot.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.1) {
          bot.x += (dx / d) * 7.2 * delta;
          bot.z += (dz / d) * 7.2 * delta;
          bot.rotationY = Math.atan2(dx, dz);
        }

        if (distToJacky < 25 && this.chatCooldown <= 0 && Math.random() < 0.2) {
          this.addChatMessage(
            bot.name,
            bot.color,
            `JACKY TEPAT DI BELAKANGKU!! GERBANG SUDAH DI DEPAN MATA!!`,
            `JACKY IS RIGHT BEHIND ME!! THE GATE IS IN SIGHT!!`,
            'PANIC'
          );
          horrorAudio.playBotScream();
          this.chatCooldown = 5.0;
        }

        mesh.scale.set(1.0, 1.0, 1.0);
        bot.flashlightOn = true;
        spot.intensity = 2.8;
        mesh.position.set(bot.x, 0, bot.z);
        mesh.rotation.y = bot.rotationY;
        return;
      }

      // Panic level update
      if (distToJacky < 35 && jackyState === 'CHASING') {
        bot.panicLevel = 1.0;
      } else if (distToJacky < 25) {
        bot.panicLevel = Math.max(0.5, bot.panicLevel);
      } else {
        bot.panicLevel = Math.max(0, bot.panicLevel - delta * 0.1);
      }

      // Check for state transitions
      if (bot.state === 'BETRAYED_TARGET') {
        // Jacky was told this bot's location! SPRINT FOR YOUR LIFE!
        bot.panicLevel = 1.0;
        this.fleeFrom(bot, jackyX, jackyZ, 6.8, delta);
      } else if (distToJacky < 22 && jackyState === 'CHASING') {
        // Run away / SPRINT!
        bot.state = 'FLEEING';
        this.fleeFrom(bot, jackyX, jackyZ, 6.5, delta);

        if (this.chatCooldown <= 0 && Math.random() < 0.15) {
          this.addChatMessage(
            bot.name,
            bot.color,
            `JACKY MENGEJAR AKU!! LARI SEMUANYA!!`,
            `JACKY IS CHASING ME!! EVERYONE RUN!!`,
            'PANIC'
          );
          horrorAudio.playBotScream();
          this.chatCooldown = 5.0;
        }
      } else if (distToJacky < 30 && bot.panicLevel > 0.4) {
        // Try to hide in a nearby stall/locker or crouch
        bot.state = 'HIDING';
        this.hideNear(bot, hidingSpots, delta);
      } else {
        // Normal state: Search for 20 collectible boxes or follow player
        bot.state = 'SEARCHING';
        this.searchOrFollow(bot, playerX, playerZ, distToPlayer, collectibleBoxes, onBoxCollectedByBot, delta);
      }

      // Crouch visual posture
      if (bot.state === 'HIDING') {
        mesh.scale.set(1.0, 0.65, 1.0); // crouching down
        bot.flashlightOn = false;
        spot.intensity = 0;
      } else {
        mesh.scale.set(1.0, 1.0, 1.0);
        bot.flashlightOn = true;
        spot.intensity = 2.8;
      }

      // Apply Jacky High Jump slam knockback arc ("mental") if hit!
      const kb = this.botKnockbacks[idx];
      if (kb && kb.active) {
        bot.x = Math.max(-125, Math.min(125, bot.x + kb.vx * delta));
        bot.z = Math.max(-125, Math.min(125, bot.z + kb.vz * delta));
        bot.y += kb.vy * delta;
        kb.vy -= 22.0 * delta;
        if (bot.y <= 0) {
          bot.y = 0;
          kb.active = false;
          kb.vx = 0;
          kb.vy = 0;
          kb.vz = 0;
        }
        mesh.scale.set(1.0, 1.0, 1.0);
        mesh.position.set(bot.x, bot.y, bot.z);
        mesh.rotation.y = bot.rotationY;
        return;
      }

      // Update 3D mesh position, leg stride, highlight beacon & smooth rotation
      mesh.position.set(bot.x, bot.y, bot.z);
      mesh.rotation.y = bot.rotationY;
      const legs = this.legRefs[idx];
      if (legs) {
        const stride = bot.state === 'HIDING' ? 0 : Math.sin(elapsed * (bot.state === 'FLEEING' ? 12 : 7) + idx) * 0.55;
        legs.left.rotation.x = stride;
        legs.right.rotation.x = -stride;
      }
      const marker = this.highlightMarkers[idx];
      if (marker) {
        marker.visible = false;
      }
    });
  }

  /**
   * HARD Mode: Flings ("mental") ONLY bots standing inside Jacky's landing indicator zone
   */
  public applyJackySlamKnockback(
    landX: number,
    landZ: number,
    radius: number,
    onBotKilledBySlam: (bot: BotCompanionState) => void
  ): void {
    this.bots.forEach((bot, idx) => {
      if (!bot.isAlive || bot.state === 'ESCAPED' || bot.state === 'HIDING' || bot.isCarriedByPlayer) return;
      const dx = bot.x - landX;
      const dz = bot.z - landZ;
      const dist = Math.hypot(dx, dz);
      if (dist > radius) return;

      const ang = dist > 0.05 ? Math.atan2(dx, dz) : Math.random() * Math.PI * 2;
      const dirX = Math.sin(ang);
      const dirZ = Math.cos(ang);

      const kb = this.botKnockbacks[idx];
      if (kb) {
        kb.active = true;
        kb.vx = dirX * 18.0;
        kb.vy = 8.2;
        kb.vz = dirZ * 18.0;
      }
      bot.y = 0.25;
      bot.health = Math.max(0, bot.health - 35);
      bot.panicLevel = 1.0;
      bot.state = 'FLEEING';
      bot.hideCooldown = 3.0;
      this.assignNewZoneTarget(bot);

      if (bot.health <= 0) {
        bot.isAlive = false;
        horrorAudio.playBotScream();
        onBotKilledBySlam(bot);
      } else {
        this.addChatMessage(
          bot.name,
          bot.color,
          `💥 ADUH!! Aku mental terkena hantaman lompatan tinggi Jacky! (-35 HP)`,
          `💥 OUCH!! I got flung by Jacky's high-jump slam! (-35 HP)`,
          'PANIC'
        );
      }
    });
  }

  /**
   * Transitions ONLY surviving Chapter 1 bots into Chapter 2 Circus Maze,
   * scattered across distant corridors far from the crashed car spawn!
   */
  public prepareForMaze(maze: CircusMaze): number {
    const aliveBots = this.bots.filter(b => b.isAlive);
    const spawnPoints = maze.getScatteredBotSpawnPositions(Math.max(1, aliveBots.length));

    let aliveIndex = 0;
    this.bots.forEach((bot, idx) => {
      const mesh = this.botMeshes[idx];
      const bodyGroup = this.bodyGroups[idx];
      const spot = this.flashlights[idx];
      const bloodPool = this.bloodPoolMeshes[idx];
      const slashes = this.slashMeshes[idx];
      const marker = this.highlightMarkers[idx];

      if (marker) marker.visible = false;

      if (!bot.isAlive) {
        // Dead bots from Chapter 1 DO NOT enter the maze (hide bodyGroup only, keep SpotLight visible with intensity 0)
        if (bodyGroup) bodyGroup.visible = false;
        if (spot) spot.intensity = 0;
        if (bloodPool) bloodPool.visible = false;
        if (slashes) slashes.forEach(s => { s.visible = false; });
        return;
      }

      const pos = spawnPoints[aliveIndex % spawnPoints.length];
      aliveIndex++;

      bot.x = pos.x;
      bot.y = 0;
      bot.z = pos.z;
      bot.rotationY = Math.random() * Math.PI * 2;
      bot.state = 'SEARCHING';
      bot.health = 100;
      bot.panicLevel = 0;
      bot.flashlightOn = true;
      bot.hideCooldown = 0;
      bot.waypointWaitTimer = 0;
      bot.targetMachineId = null;
      bot.isCarriedByPlayer = false;
      bot.botSkillCheckTimer = 2.4 + Math.random() * 1.5;

      // Pick an initial patrol cell far away
      const randC = Math.floor(Math.random() * maze.gridCols);
      const randR = Math.floor(Math.random() * maze.gridRows);
      const dest = maze.cellToWorld(randC, randR);
      bot.targetX = dest.x;
      bot.targetZ = dest.z;

      if (bodyGroup) bodyGroup.visible = true;
      if (mesh) {
        mesh.visible = true;
        mesh.position.set(bot.x, 0, bot.z);
        mesh.rotation.set(0, bot.rotationY, 0);
        mesh.scale.set(1, 1, 1);
      }
      if (bloodPool) bloodPool.visible = false;
      if (slashes) slashes.forEach(s => { s.visible = false; });
      if (spot) {
        spot.intensity = 2.8;
        spot.position.set(0.4, 0.95, 0.4);
      }

      this.botMazePaths[idx] = [];
      this.botPathTimers[idx] = 0;
      this.botLastPos[idx] = { x: bot.x, z: bot.z };
      this.botStuckTimers[idx] = 0;
      this.botAvoidMachineId[idx] = null;
    });

    return aliveBots.length;
  }

  /**
   * Chapter 2 Maze Update for Surviving Bots:
   * - Visible 3D nameplates, glowing safety strips, flashlights & 10s Whistle X-ray beacons
   * - Uses 19x19 Grid BFS pathfinding to navigate & repair the 20 Circus Machines (~15s repair time)
   * - While repairing: 40% fail chance (alerts Jesty!) & 30% calibration success boost
   * - Supports BEING_CARRIED in Jesty's clutches, immediately flees COMEDY Jesty, rescues player, and escapes at 20/20
   */
  public updateMazeBots(
    delta: number,
    elapsed: number,
    maze: CircusMaze,
    jestyX: number,
    jestyZ: number,
    jestyRotY: number,
    jestyMask: 'COMEDY' | 'TRAGEDY',
    playerImprisoned: boolean,
    imprisonedBotCount: number,
    exitUnlocked: boolean,
    highlightedBotId: string | null,
    onMachineFixed: (machineId: number, botName: string) => void,
    onMachineFailed: (machine: MazeMachine, botName: string) => void,
    onRescuePrisoners: (rescuer: BotCompanionState) => void,
    onBotEscaped: (bot: BotCompanionState) => void,
    evilOlivia?: { x: number; z: number; rotationY: number; active: boolean; isStunned: boolean } | null,
    isScreamSlowed: boolean = false
  ): void {
    this.chatCooldown -= delta;

    this.bots.forEach((bot, idx) => {
      const mesh = this.botMeshes[idx];
      const bodyGroup = this.bodyGroups[idx];
      const spot = this.flashlights[idx];
      const marker = this.highlightMarkers[idx];
      const legs = this.legRefs[idx];

      if (!bot.isAlive || bot.state === 'ESCAPED') {
        if (bodyGroup) bodyGroup.visible = false;
        if (spot) spot.intensity = 0;
        if (marker) marker.visible = false;
        return;
      }

      if (bodyGroup) bodyGroup.visible = true;
      if (mesh) mesh.visible = true;

      // Update 10-second X-Ray Highlight Beacon
      if (marker) {
        const isHighlighted = highlightedBotId === bot.id;
        marker.visible = isHighlighted;
        if (isHighlighted) {
          marker.children[0].rotation.z += delta * 2.5;
          marker.children[2].rotation.y += delta * 3.0;
          marker.children[2].position.y = 2.85 + Math.sin(elapsed * 5.0) * 0.25;
        }
      }

      if (bot.hideCooldown > 0) {
        bot.hideCooldown = Math.max(0, bot.hideCooldown - delta);
      }

      // 0. Safely carried ("digendong") by the Player via Sarung Tangan Sirkus!
      if (bot.isCarriedByPlayer) {
        if (mesh) {
          mesh.position.set(bot.x, bot.y, bot.z);
          mesh.rotation.set(0, bot.rotationY, 0);
          mesh.scale.set(1, 0.9, 1);
        }
        if (spot) spot.intensity = 1.6;
        if (legs) {
          const kick = Math.sin(elapsed * 8 + idx) * 0.25;
          legs.left.rotation.x = kick;
          legs.right.rotation.x = -kick;
        }
        return;
      }

      // 1. Being physically carried in Jesty's or Evil Olivia's clutches toward prison cage!
      if (bot.state === 'BEING_CARRIED') {
        const useOlivia = bot.carriedByMonster === 'EVIL_OLIVIA' && evilOlivia?.active;
        const cx = useOlivia ? evilOlivia!.x : jestyX;
        const cz = useOlivia ? evilOlivia!.z : jestyZ;
        const cRot = useOlivia ? evilOlivia!.rotationY : jestyRotY;
        const carryX = cx + Math.sin(cRot) * 1.05;
        const carryZ = cz + Math.cos(cRot) * 1.05;
        bot.x = carryX;
        bot.z = carryZ;
        if (mesh) {
          mesh.position.set(carryX, 0.72 + Math.sin(elapsed * 16 + idx) * 0.06, carryZ);
          mesh.rotation.set(0.2, cRot + Math.PI, 0);
          mesh.scale.set(1, 0.94, 1);
        }
        if (spot) spot.intensity = 1.6;
        if (legs) {
          const kick = Math.sin(elapsed * 22 + idx) * 0.85;
          legs.left.rotation.x = kick;
          legs.right.rotation.x = -kick;
        }
        return;
      }

      // 1b. Imprisoned inside cage
      if (bot.state === 'IMPRISONED') {
        if (mesh) {
          mesh.position.set(bot.x, 0, bot.z);
          mesh.rotation.set(0, elapsed * 0.6 + idx, 0);
          mesh.scale.set(1, 0.92, 1);
        }
        if (spot) spot.intensity = 0.8;
        if (legs) {
          legs.left.rotation.x = 0;
          legs.right.rotation.x = 0;
        }
        return;
      }

      let moveSpeed = 4.0;
      let goalX = bot.targetX;
      let goalZ = bot.targetZ;
      let isRepairingStationary = false;

      const distToJesty = Math.hypot(jestyX - bot.x, jestyZ - bot.z);
      const anyPrisonerTrapped = playerImprisoned || imprisonedBotCount > 0;

      const distToOlivia =
        evilOlivia && evilOlivia.active && !evilOlivia.isStunned
          ? Math.hypot(evilOlivia.x - bot.x, evilOlivia.z - bot.z)
          : 999;

      if (bot.state === 'RESCUING_PLAYER' && !anyPrisonerTrapped) {
        bot.state = 'SEARCHING';
      }

      // 2. Rescuing Imprisoned Player or Companion Bots takes priority (1-4 rescuers search for the prison cage!)
      if (bot.state === 'RESCUING_PLAYER' && anyPrisonerTrapped) {
        const dropPos = maze.prisonDropOffPosition;
        const lockDist = Math.hypot(dropPos.x - bot.x, dropPos.z - bot.z);
        if (jestyMask === 'COMEDY' && distToJesty < 7.5 && lockDist > 5.0 && bot.hideCooldown <= 0) {
          const evadeDest = maze.findBestFleeDestination(bot.x, bot.z, jestyX, jestyZ);
          goalX = evadeDest.x;
          goalZ = evadeDest.z;
          moveSpeed = 5.4;
        } else if (distToOlivia < 7.5 && lockDist > 5.0 && bot.hideCooldown <= 0 && evilOlivia) {
          const evadeDest = maze.findBestFleeDestination(bot.x, bot.z, evilOlivia.x, evilOlivia.z);
          goalX = evadeDest.x;
          goalZ = evadeDest.z;
          moveSpeed = 5.4;
        } else if (lockDist > 2.4) {
          goalX = dropPos.x;
          goalZ = dropPos.z;
          moveSpeed = 5.15;
        } else {
          onRescuePrisoners(bot);
          bot.state = 'SEARCHING';
          bot.hideCooldown = 5.0;
        }
      } else if (distToOlivia < 18 && bot.hideCooldown <= 0 && evilOlivia && (jestyMask !== 'COMEDY' || distToOlivia < distToJesty)) {
        // Flee from Evil Olivia in Nightmare mode!
        bot.state = 'FLEEING';
        bot.targetMachineId = null;
        moveSpeed = 5.4;
        const fleeDest = maze.findBestFleeDestination(bot.x, bot.z, evilOlivia.x, evilOlivia.z);
        goalX = fleeDest.x;
        goalZ = fleeDest.z;
      } else if (jestyMask === 'COMEDY' && distToJesty < 19 && bot.hideCooldown <= 0) {
        // 3. Flee away from aggressive Jesty using BFS corridor reachability (never runs blind into dead-ends!)
        const wasRepairing = bot.state === 'REPAIRING';
        bot.state = 'FLEEING';
        bot.targetMachineId = null;
        moveSpeed = 5.4;
        const fleeDest = maze.findBestFleeDestination(bot.x, bot.z, jestyX, jestyZ);
        goalX = fleeDest.x;
        goalZ = fleeDest.z;

        if (wasRepairing || (this.chatCooldown <= 0 && Math.random() < 0.1)) {
          this.addChatMessage(
            bot.name,
            bot.color,
            wasRepairing
              ? `JESTY MENEMUKANKU SAAT BENERIN MESIN!! AKU LARI!!`
              : `AWAS!! Jesty bertopeng Komedi mengejarku di lorong labirin!!`,
            wasRepairing
              ? `JESTY SPOTTED ME REPAIRING A MACHINE!! RUNNING AWAY!!`
              : `WATCH OUT!! Comedy Jesty is chasing me down the maze corridors!!`,
            'PANIC'
          );
          this.chatCooldown = 6.5;
        }
      } else if (exitUnlocked) {
        // 4. All 20 Machines repaired -> Escape via BFS toward Grand Golden Exit Door!
        bot.state = 'ESCAPING';
        moveSpeed = 5.2;
        goalX = maze.exitDoorPosition.x;
        goalZ = maze.exitDoorPosition.z - 2.0;

        if (Math.hypot(goalX - bot.x, goalZ - bot.z) < 3.2) {
          bot.state = 'ESCAPED';
          if (bodyGroup) bodyGroup.visible = false;
          if (spot) spot.intensity = 0;
          if (marker) marker.visible = false;
          onBotEscaped(bot);
          return;
        }
      } else {
        // 5. Hunt & Repair the 20 Scattered Circus Machines using BFS corridor pathfinding!
        const unfixed = maze.mazeMachines.filter(m => !m.fixed);

        if (unfixed.length > 0) {
          let chosenMachine: MazeMachine | undefined = unfixed.find(m => m.id === bot.targetMachineId);
          if (!chosenMachine) {
            const claimedMachineIds = new Set<number>();
            for (const other of this.bots) {
              if (other.id !== bot.id && other.isAlive && other.targetMachineId != null) {
                claimedMachineIds.add(other.targetMachineId);
              }
            }

            const unfixedNow = maze.mazeMachines.filter(m => !m.fixed);
            const avoidId = this.botAvoidMachineId[idx];
            let bestScore = Infinity;
            for (let mIdx = 0; mIdx < unfixedNow.length; mIdx++) {
              const m = unfixedNow[mIdx];
              const md = Math.hypot(m.x - bot.x, m.z - bot.z);
              const claimedPenalty = claimedMachineIds.has(m.id) ? 35.0 : 0;
              const avoidPenalty = avoidId === m.id && unfixedNow.length > 1 ? 90.0 : 0;
              const score = md + claimedPenalty + avoidPenalty;
              if (score < bestScore) {
                bestScore = score;
                chosenMachine = m;
              }
            }
            bot.targetMachineId = chosenMachine ? chosenMachine.id : null;
            this.botMazePaths[idx] = [];
            this.botPathTimers[idx] = 0;
          }

          if (chosenMachine) {
            const mDist = Math.hypot(chosenMachine.x - bot.x, chosenMachine.z - bot.z);
            if (mDist <= 2.35) {
              // Bot is right beside the machine -> REPAIRING (~15 seconds)!
              bot.state = 'REPAIRING';
              isRepairingStationary = true;
              bot.rotationY = Math.atan2(chosenMachine.x - bot.x, chosenMachine.z - bot.z);

              chosenMachine.progress = Math.min(100, chosenMachine.progress + delta * (100 / 15));
              bot.botSkillCheckTimer = (bot.botSkillCheckTimer ?? 4.8) - delta;

              if (bot.botSkillCheckTimer <= 0) {
                bot.botSkillCheckTimer = 4.6 + Math.random() * 1.4;
                const roll = Math.random();
                if (roll < 0.40) {
                  // 40% Chance: Bot FAILS calibration -> sparks & alerts Jesty!
                  chosenMachine.progress = Math.max(0, chosenMachine.progress - 10);
                  chosenMachine.malfunctionFlashTimer = 3.0;
                  onMachineFailed(chosenMachine, bot.name);
                } else if (roll < 0.70) {
                  // 30% Chance: Bot SUCCEEDS skill check boost!
                  chosenMachine.progress = Math.min(100, chosenMachine.progress + 10);
                }
              }

              if (chosenMachine.progress >= 100) {
                onMachineFixed(chosenMachine.id, bot.name);
                bot.boxesFound++;
                bot.targetMachineId = null;
                this.botAvoidMachineId[idx] = null;
                this.botMazePaths[idx] = [];
                this.botPathTimers[idx] = 0;
                bot.state = 'SEARCHING';

                // Immediately pick next unfixed machine on completion so bot walks away right away
                const nextUnfixed = maze.mazeMachines.filter(m => !m.fixed);
                if (nextUnfixed.length > 0) {
                  const claimedNext = new Set<number>();
                  for (const other of this.bots) {
                    if (other.id !== bot.id && other.isAlive && other.targetMachineId != null) {
                      claimedNext.add(other.targetMachineId);
                    }
                  }
                  let nextChoice: MazeMachine | undefined;
                  let nextBestScore = Infinity;
                  for (const nm of nextUnfixed) {
                    const score = Math.hypot(nm.x - bot.x, nm.z - bot.z) + (claimedNext.has(nm.id) ? 35.0 : 0);
                    if (score < nextBestScore) {
                      nextBestScore = score;
                      nextChoice = nm;
                    }
                  }
                  if (nextChoice) {
                    bot.targetMachineId = nextChoice.id;
                    goalX = nextChoice.x;
                    goalZ = nextChoice.z;
                    moveSpeed = 4.2;
                    isRepairingStationary = false;
                  }
                }
              }
            } else {
              bot.state = 'SEARCHING';
              goalX = chosenMachine.x;
              goalZ = chosenMachine.z;
              moveSpeed = 4.2;
            }
          }
        } else {
          bot.state = 'SEARCHING';
          if (Math.hypot(bot.targetX - bot.x, bot.targetZ - bot.z) < 3.0) {
            const randC = Math.floor(Math.random() * maze.gridCols);
            const randR = Math.floor(Math.random() * maze.gridRows);
            const nextCell = maze.cellToWorld(randC, randR);
            bot.targetX = nextCell.x;
            bot.targetZ = nextCell.z;
            this.botMazePaths[idx] = [];
          }
          goalX = bot.targetX;
          goalZ = bot.targetZ;
        }
      }

      // Execute Cached Multi-Step BFS Pathfinding + Tangent Steering + Safe Unstick Recovery
      let didMove = false;
      const botRadius = 0.50;

      // Safety depenetration: if bot ever overlaps a machine/locker/wall collider, gently push to nearest clear spot
      if (maze.checkCollision(bot.x, bot.z, botRadius)) {
        let escapedOverlap = false;
        for (const distTry of [0.35, 0.75, 1.25, 1.85]) {
          for (let a = 0; a < 8; a++) {
            const ang = (a / 8) * Math.PI * 2;
            const tx = bot.x + Math.cos(ang) * distTry;
            const tz = bot.z + Math.sin(ang) * distTry;
            if (!maze.checkCollision(tx, tz, botRadius)) {
              bot.x = tx;
              bot.z = tz;
              escapedOverlap = true;
              break;
            }
          }
          if (escapedOverlap) break;
        }
      }

      if (!isRepairingStationary) {
        this.botPathTimers[idx] = (this.botPathTimers[idx] ?? 0) - delta;
        let path = this.botMazePaths[idx] ?? [];
        const lastWp = path.length > 0 ? path[path.length - 1] : null;
        const goalChanged = !lastWp || Math.hypot(lastWp.x - goalX, lastWp.z - goalZ) > 3.0;

        if (this.botPathTimers[idx] <= 0 || path.length === 0 || goalChanged) {
          path = maze.findShortestPath(bot.x, bot.z, goalX, goalZ);
          this.botMazePaths[idx] = path;
          this.botPathTimers[idx] = 0.45 + (idx % 4) * 0.08;
        }

        // Advance intermediate BFS waypoints early enough that bots smoothly arc around cell-center machines!
        while (path.length > 1) {
          const wpDist = Math.hypot(path[0].x - bot.x, path[0].z - bot.z);
          const wpHasCollider = maze.checkCollision(path[0].x, path[0].z, botRadius);
          if (wpDist < (wpHasCollider ? 2.45 : 1.75)) {
            path.shift();
          } else {
            break;
          }
        }

        const step = path.length > 0 ? path[0] : maze.findNextPathStep(bot.x, bot.z, goalX, goalZ);
        const dx = step.x - bot.x;
        const dz = step.z - bot.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.12) {
          const prevX = bot.x;
          const prevZ = bot.z;
          const effectiveSpeed = isScreamSlowed ? moveSpeed * 0.45 : moveSpeed;
          const stepLen = effectiveSpeed * delta;
          const dirX = dx / dist;
          const dirZ = dz / dist;
          const vx = dirX * stepLen;
          const vz = dirZ * stepLen;

          if (!maze.checkCollision(bot.x + vx, bot.z, botRadius)) {
            bot.x += vx;
            didMove = true;
          }
          if (!maze.checkCollision(bot.x, bot.z + vz, botRadius)) {
            bot.z += vz;
            didMove = true;
          }

          // Tangent steering around cell-center machines/lockers/crates when head-on path is blocked!
          let movedDist = Math.hypot(bot.x - prevX, bot.z - prevZ);
          if (movedDist < stepLen * 0.32) {
            const hand = idx % 2 === 0 ? 1 : -1;
            const angles = [
              hand * 0.62, -hand * 0.62,
              hand * 1.05, -hand * 1.05,
              hand * 1.48, -hand * 1.48,
              hand * 2.05, -hand * 2.05
            ];
            const baseAngle = Math.atan2(dirZ, dirX);
            for (const offset of angles) {
              const tryAngle = baseAngle + offset;
              const tx = bot.x + Math.cos(tryAngle) * stepLen;
              const tz = bot.z + Math.sin(tryAngle) * stepLen;
              if (!maze.checkCollision(tx, tz, botRadius)) {
                bot.x = tx;
                bot.z = tz;
                didMove = true;
                break;
              }
            }
            movedDist = Math.hypot(bot.x - prevX, bot.z - prevZ);
          }

          if (movedDist < stepLen * 0.18) {
            this.botStuckTimers[idx] = (this.botStuckTimers[idx] ?? 0) + delta;
            const cell = maze.worldToCell(bot.x, bot.z);
            const cPos = maze.cellToWorld(cell.c, cell.r);
            // Only nudge toward cell center if the cell center is NOT occupied by a machine/locker collider!
            if (!maze.checkCollision(cPos.x, cPos.z, botRadius)) {
              const cdx = cPos.x - bot.x;
              const cdz = cPos.z - bot.z;
              const cd = Math.hypot(cdx, cdz);
              if (cd > 0.1) {
                const nx = bot.x + (cdx / cd) * stepLen * 0.7;
                const nz = bot.z + (cdz / cd) * stepLen * 0.7;
                if (!maze.checkCollision(nx, nz, botRadius)) {
                  bot.x = nx;
                  bot.z = nz;
                  didMove = true;
                }
              }
            }
            if (this.botStuckTimers[idx] > 0.65) {
              this.botMazePaths[idx] = [];
              this.botPathTimers[idx] = 0;
              this.botStuckTimers[idx] = 0;
              if (bot.state === 'SEARCHING' && bot.targetMachineId != null) {
                this.botAvoidMachineId[idx] = bot.targetMachineId;
                bot.targetMachineId = null;
              }
            }
          } else {
            this.botStuckTimers[idx] = 0;
          }

          const bounds = maze.getWorldBounds();
          bot.x = Math.max(bounds.minX, Math.min(bounds.maxX, bot.x));
          bot.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, bot.z));

          const faceDx = bot.x - prevX;
          const faceDz = bot.z - prevZ;
          const targetAngle = Math.hypot(faceDx, faceDz) > 0.005
            ? Math.atan2(faceDx, faceDz)
            : Math.atan2(dx, dz);
          let diff = targetAngle - bot.rotationY;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          bot.rotationY += diff * Math.min(1, delta * 10);
        }
      } else {
        this.botStuckTimers[idx] = 0;
      }

      // Apply transforms & animated walk/repair posture
      if (mesh) {
        mesh.scale.set(1, isRepairingStationary ? 0.86 : 1, 1);
        mesh.position.set(bot.x, didMove ? Math.abs(Math.sin(elapsed * 9 + idx)) * 0.05 : 0, bot.z);
        mesh.rotation.set(0, bot.rotationY, 0);
      }
      if (legs) {
        const swing = didMove ? Math.sin(elapsed * (moveSpeed * 2.2) + idx) * 0.65 : 0;
        legs.left.rotation.x = swing;
        legs.right.rotation.x = -swing;
      }
      if (spot) {
        spot.intensity = 2.8;
        bot.flashlightOn = true;
      }
    });
  }

  private fleeFrom(bot: BotCompanionState, fromX: number, fromZ: number, speed: number, delta: number): void {
    const dx = bot.x - fromX;
    const dz = bot.z - fromZ;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.1) {
      bot.x += (dx / dist) * speed * delta;
      bot.z += (dz / dist) * speed * delta;
      // Clamp to map boundaries
      bot.x = Math.max(-125, Math.min(125, bot.x));
      bot.z = Math.max(-125, Math.min(125, bot.z));
      bot.rotationY = Math.atan2(dx, dz);
    }
  }

  private hideNear(bot: BotCompanionState, hidingSpots: { x: number; z: number; name: string }[], delta: number): void {
    // Find closest hiding spot
    let closest = hidingSpots[0];
    let minDist = 999;
    for (const h of hidingSpots) {
      const d = Math.hypot(h.x - bot.x, h.z - bot.z);
      if (d < minDist) {
        minDist = d;
        closest = h;
      }
    }

    if (closest && minDist > 1.5) {
      const dx = closest.x - bot.x;
      const dz = closest.z - bot.z;
      const d = Math.hypot(dx, dz);
      bot.x += (dx / d) * 4.0 * delta;
      bot.z += (dz / d) * 4.0 * delta;
      bot.rotationY = Math.atan2(dx, dz);
    } else {
      // Safely hiding!
      if (this.chatCooldown <= 0 && Math.random() < 0.1) {
        this.addChatMessage(
          bot.name,
          bot.color,
          `Aku sedang jongkok sembunyi di ${closest?.name || 'lemari'}... Jangan buat suara!`,
          `I'm crouching hidden in ${closest?.name || 'a locker'}... Shh, stay quiet!`,
          'INFO'
        );
        this.chatCooldown = 8.0;
      }
    }
  }

  private searchOrFollow(
    bot: BotCompanionState,
    playerX: number,
    playerZ: number,
    distToPlayer: number,
    collectibleBoxes: CollectibleBox[],
    onBoxCollected: (boxId: number, botName: string) => void,
    delta: number
  ): void {
    // 1. Actively search for uncollected boxes across the circus (detection range up to 70m)
    let nearestBox: CollectibleBox | null = null;
    let minBoxDist = 70;

    for (const b of collectibleBoxes) {
      if (b.collected) continue;
      const d = Math.hypot(b.x - bot.x, b.z - bot.z);
      if (d < minBoxDist) {
        minBoxDist = d;
        nearestBox = b;
      }
    }

    if (nearestBox) {
      // Jog towards the discovered box
      const dx = nearestBox.x - bot.x;
      const dz = nearestBox.z - bot.z;
      const d = Math.hypot(dx, dz);
      if (d > 1.3) {
        bot.x += (dx / d) * 3.8 * delta;
        bot.z += (dz / d) * 3.8 * delta;
        bot.rotationY = Math.atan2(dx, dz);
      } else {
        // Collect box!
        onBoxCollected(nearestBox.id, bot.name);
        bot.boxesFound++;
        this.addChatMessage(
          bot.name,
          bot.color,
          `Aku menemukan satu kotak Jack-in-the-Box di ${nearestBox.zone}! [Kotak ke-${bot.boxesFound} olehku]`,
          `I found a Jack-in-the-Box item at ${nearestBox.zone}! [${bot.boxesFound} collected by me]`,
          'INFO'
        );
        this.chatCooldown = 4.0;
        // After collecting, pick a new zone to explore
        this.assignNewZoneTarget(bot);
      }
      return;
    }

    // 2. Autonomous Fairground Roaming (Doesn't cling to player!)
    if (bot.waypointWaitTimer && bot.waypointWaitTimer > 0) {
      bot.waypointWaitTimer -= delta;
      // Head/body swivel while investigating the attraction
      bot.rotationY += delta * 0.4;
      return;
    }

    const tDist = Math.hypot(bot.targetX - bot.x, bot.targetZ - bot.z);
    if (tDist < 3.0 || Math.random() < 0.003) {
      // Reached waypoint! Pause 2.5 to 5s to look around and then head to another ride/zone
      bot.waypointWaitTimer = 2.5 + Math.random() * 3.5;
      this.assignNewZoneTarget(bot);
    } else {
      const dx = bot.targetX - bot.x;
      const dz = bot.targetZ - bot.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.2) {
        const speed = 3.5;
        bot.x += (dx / d) * speed * delta;
        bot.z += (dz / d) * speed * delta;
        // Clamp to map bounds (-125m to 125m)
        bot.x = Math.max(-125, Math.min(125, bot.x));
        bot.z = Math.max(-125, Math.min(125, bot.z));
        bot.rotationY = Math.atan2(dx, dz);
      }
    }
  }

  public triggerBetrayalTarget(botId: string): void {
    const target = this.bots.find(b => b.id === botId);
    if (target) {
      target.state = 'BETRAYED_TARGET';
      this.addChatMessage(
        target.name,
        target.color,
        `APA?! Kenapa Jacky tiba-tiba melompat ke arahku?! Siapa yang membocorkan posisiku?!!`,
        `WHAT?! Why did Jacky suddenly leap straight at me?! Who snitched on my location?!!`,
        'BETRAYAL'
      );
      horrorAudio.playBetrayalCry();
    }
  }

  public addChatMessage(sender: string, color: string, textId: string, textEn: string, type: ChatMessage['type'] = 'INFO'): void {
    const msg: ChatMessage = {
      id: `chat_${Date.now()}_${Math.random()}`,
      sender,
      color,
      textId,
      textEn,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type
    };
    this.chatLog.push(msg);
    if (this.chatLog.length > 25) {
      this.chatLog.shift();
    }
    if (this.onChatAdded) {
      this.onChatAdded(msg);
    }
  }

  public getAliveBotCount(): number {
    return this.bots.filter(b => b.isAlive).length;
  }
}
