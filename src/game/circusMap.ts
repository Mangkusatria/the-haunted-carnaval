/**
 * Expansive Circus Fairground Map (260m x 260m)
 * Features Big Top Tent, Ferris Wheel, Haunted Carousel, Midway Stalls,
 * Funhouse Maze, Caravan wagons, Perimeter Fence, and 20 Collectible Boxes!
 */

import * as THREE from 'three';
import { ProceduralTextures } from './proceduralTextures';
import { CollectibleBox, CarnivalZone } from '../types';

export class CircusMap {
  public group: THREE.Group = new THREE.Group();
  public colliders: { x: number; z: number; radius: number }[] = [];
  public hidingSpots: { x: number; z: number; name: string }[] = [];
  public collectibleBoxes: CollectibleBox[] = [];
  public boxMeshes: THREE.Group[] = [];

  // Animated elements
  public carouselPlatform: THREE.Group | null = null;
  public ferrisWheelWheel: THREE.Group | null = null;
  public carouselHorses: THREE.Mesh[] = [];

  // Exit gate mesh to open when 20/20 boxes collected
  public exitGateLeft: THREE.Mesh | null = null;
  public exitGateRight: THREE.Mesh | null = null;

  // Secret Cheat Console at the corner edge near Midway game booths
  public cheatButtonPosition: { x: number; z: number } = { x: 123, z: -64 };
  private cheatButtonCap: THREE.Mesh | null = null;
  private cheatButtonAura: THREE.Mesh | null = null;

  public zones: CarnivalZone[] = [
    {
      id: 'ENTRANCE',
      nameId: 'Gerbang Masuk & Tiket',
      nameEn: 'Entrance Gate & Ticket Plaza',
      minX: -60, maxX: 60, minZ: -130, maxZ: -80,
      descriptionId: 'Gerbang besi berkarat tempat awal Anda terjebak. Kumpulkan 20 kotak untuk membuka gerbang keluar ini!',
      descriptionEn: 'The rusted iron gate where you are trapped. Collect 20 boxes to unlock this exit gate!'
    },
    {
      id: 'BIG_TOP',
      nameId: 'Tenda Sirkus Utama (Big Top)',
      nameEn: 'The Grand Big Top Tent',
      minX: -45, maxX: 45, minZ: -45, maxZ: 45,
      descriptionId: 'Tenda raksasa bergaris merah-putih. Arena sirkus tengah dengan tiang akrobatik dan bangku penonton.',
      descriptionEn: 'Massive red-striped tent. Central circus sawdust ring with acrobatic rigging and bleachers.'
    },
    {
      id: 'MIDWAY',
      nameId: 'Deretan Stan Permainan (The Midway)',
      nameEn: 'Midway Carnival Games',
      minX: 45, maxX: 125, minZ: -70, maxZ: 30,
      descriptionId: 'Stan lempar panah, penembak bebek, dan gerobak popcorn yang telah ditinggalkan.',
      descriptionEn: 'Shooting galleries, dart booths, and abandoned popcorn carts.'
    },
    {
      id: 'CAROUSEL',
      nameId: 'Komedi Putar Berhantu',
      nameEn: 'The Haunted Carousel',
      minX: -125, maxX: -45, minZ: -60, maxZ: 0,
      descriptionId: 'Komedi putar tua yang masih berputar perlahan dengan kuda kayu bermata merah.',
      descriptionEn: 'Vintage carousel still spinning slowly with glowing red-eyed wooden horses.'
    },
    {
      id: 'FERRIS_WHEEL',
      nameId: 'Bianglala Raksasa (Ferris Wheel)',
      nameEn: 'The Towering Ferris Wheel',
      minX: -125, maxX: -45, minZ: 10, maxZ: 90,
      descriptionId: 'Bianglala raksasa setinggi 35 meter yang menjulang di tengah kegelapan malam berembun.',
      descriptionEn: 'A 35-meter tall giant Ferris wheel towering in the dark misty sky.'
    },
    {
      id: 'FUNHOUSE',
      nameId: 'Labirin Rumah Kaca & Badut',
      nameEn: 'Funhouse & Mirror Maze',
      minX: 45, maxX: 125, minZ: 40, maxZ: 125,
      descriptionId: 'Lorong-lorong berliku dengan cermin retak dan pintu masuk mulut badut raksasa.',
      descriptionEn: 'Twisting corridors with cracked mirrors and a giant clown mouth entrance.'
    },
    {
      id: 'CARAVAN_YARD',
      nameId: 'Kereta Sirkus & Gudang Liar',
      nameEn: 'Circus Caravans & Freight Yard',
      minX: -125, maxX: -45, minZ: -125, maxZ: -65,
      descriptionId: 'Gerbong kayu tua tempat para pemain sirkus tidur dan mengurung hewan buas.',
      descriptionEn: 'Dilapidated circus wagons and animal cages with locked iron bars.'
    }
  ];

  constructor() {
    this.buildMap();
    this.spawn20CollectibleBoxes();
  }

  private buildMap(): void {
    const tentTex = ProceduralTextures.getTentStripes();
    const woodTex = ProceduralTextures.getWood();
    const groundTex = ProceduralTextures.getGround();
    const archBannerTex = ProceduralTextures.getCircusArchBanner();

    // 1. Vast Terrain Ground (300m x 300m)
    const groundGeo = new THREE.PlaneGeometry(300, 300, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    // 2. Perimeter Fences & Wall Barriers
    this.buildPerimeterFences();

    // 3. Entrance Plaza & Exit Gates (North Gate at z = -115)
    this.buildEntrancePlaza(archBannerTex, woodTex);

    // 4. Central Grand Big Top Circus Tent (x: 0, z: 0)
    this.buildBigTopTent(tentTex, woodTex);

    // 5. Midway Carnival Stalls (x: 80, z: -20)
    this.buildMidwayStalls(woodTex, tentTex);

    // 6. Haunted Carousel (x: -80, z: -30)
    this.buildCarousel(woodTex, tentTex);

    // 7. Towering Ferris Wheel (x: -85, z: 50)
    this.buildFerrisWheel();

    // 8. Funhouse Maze & Clown Mouth (x: 85, z: 80)
    this.buildFunhouse(woodTex, tentTex);

    // 9. Circus Caravans & Wagons (x: -85, z: -95)
    this.buildCircusCaravans(woodTex);

    // 10. Scattered Lampposts, Dead Trees & Carnival String Lights
    this.buildAtmosphericProps();

    // 11. Secret Cheat Button Console at the corner edge near Midway Stalls
    this.buildSecretCheatButton(woodTex);
  }

  private buildPerimeterFences(): void {
    const halfSize = 130;
    const fenceMat = new THREE.MeshStandardMaterial({
      color: 0x1f1d1d,
      roughness: 0.7,
      metalness: 0.8
    });

    const postGeo = new THREE.CylinderGeometry(0.15, 0.15, 4.5, 6);
    const wireGeo = new THREE.BoxGeometry(10, 3.5, 0.1);

    const placeFenceLine = (startX: number, startZ: number, endX: number, endZ: number) => {
      const dx = endX - startX;
      const dz = endZ - startZ;
      const length = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);
      const segments = Math.floor(length / 10);

      for (let i = 0; i < segments; i++) {
        const frac = i / segments;
        const px = startX + dx * frac;
        const pz = startZ + dz * frac;

        const post = new THREE.Mesh(postGeo, fenceMat);
        post.position.set(px, 2.25, pz);
        this.group.add(post);

        const wire = new THREE.Mesh(wireGeo, fenceMat);
        wire.position.set(px + (dx / segments) * 0.5, 2.0, pz + (dz / segments) * 0.5);
        wire.rotation.y = angle;
        this.group.add(wire);

        this.colliders.push({ x: px, z: pz, radius: 1.5 });
      }
    };

    // Four sides of the perimeter, leaving gap for main gate at z = -130
    placeFenceLine(-halfSize, -halfSize, -20, -halfSize);
    placeFenceLine(20, -halfSize, halfSize, -halfSize);
    placeFenceLine(halfSize, -halfSize, halfSize, halfSize);
    placeFenceLine(halfSize, halfSize, -halfSize, halfSize);
    placeFenceLine(-halfSize, halfSize, -halfSize, -halfSize);
  }

  private buildEntrancePlaza(bannerTex: THREE.CanvasTexture, woodTex: THREE.CanvasTexture): void {
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, -115);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.5, metalness: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.8 });

    // Arch Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.8, 0.9, 10, 8);
    const p1 = new THREE.Mesh(pillarGeo, metalMat);
    p1.position.set(-10, 5, 0);
    const p2 = new THREE.Mesh(pillarGeo, metalMat);
    p2.position.set(10, 5, 0);
    archGroup.add(p1, p2);

    // Arch Beam & Banner
    const beamGeo = new THREE.BoxGeometry(22, 1.2, 1.2);
    const beam = new THREE.Mesh(beamGeo, metalMat);
    beam.position.set(0, 10, 0);
    archGroup.add(beam);

    const bannerGeo = new THREE.PlaneGeometry(16, 4);
    const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, 8, 0);
    archGroup.add(banner);

    // Double Exit Gates (Iron bars with red lock warning)
    const gateGeo = new THREE.BoxGeometry(9.6, 7, 0.2);
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x4d1616, roughness: 0.6, metalness: 0.6 });

    this.exitGateLeft = new THREE.Mesh(gateGeo, gateMat);
    this.exitGateLeft.position.set(-5, 3.5, 0);
    archGroup.add(this.exitGateLeft);

    this.exitGateRight = new THREE.Mesh(gateGeo, gateMat);
    this.exitGateRight.position.set(5, 3.5, 0);
    archGroup.add(this.exitGateRight);

    // Ticket Booths left & right
    [-16, 16].forEach((tx) => {
      const booth = new THREE.Group();
      booth.position.set(tx, 0, 0);
      const boothMesh = new THREE.Mesh(new THREE.BoxGeometry(5, 4.5, 5), woodMat);
      boothMesh.position.y = 2.25;
      booth.add(boothMesh);

      // Roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 2, 4), new THREE.MeshStandardMaterial({ color: 0x8a1b24 }));
      roof.position.y = 5.5;
      roof.rotation.y = Math.PI / 4;
      booth.add(roof);

      archGroup.add(booth);
      this.colliders.push({ x: tx, z: -115, radius: 3.5 });
      this.hidingSpots.push({ x: tx, z: -115 + 4, name: 'Loket Tiket (Ticket Booth)' });
    });

    this.group.add(archGroup);
  }

  private buildBigTopTent(tentTex: THREE.CanvasTexture, woodTex: THREE.CanvasTexture): void {
    const tentGroup = new THREE.Group();
    tentGroup.position.set(0, 0, 0);

    const tentMat = new THREE.MeshStandardMaterial({
      map: tentTex,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    // Outer conical roof (radius 32m, height 18m)
    const roofGeo = new THREE.ConeGeometry(34, 18, 24, 1, true);
    const roof = new THREE.Mesh(roofGeo, tentMat);
    roof.position.y = 17;
    tentGroup.add(roof);

    // Cylindrical wall with 4 wide arched openings
    const wallGeo = new THREE.CylinderGeometry(34, 34, 9, 24, 1, true);
    const wall = new THREE.Mesh(wallGeo, tentMat);
    wall.position.y = 4.5;
    tentGroup.add(wall);

    // 4 High Center Mast Spires with Flags
    const mastGeo = new THREE.CylinderGeometry(0.3, 0.4, 28, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.8 });
    const flagGeo = new THREE.PlaneGeometry(3, 1.8);
    const flagMat = new THREE.MeshBasicMaterial({ color: 0x8b1820, side: THREE.DoubleSide });

    const mastOffsets = [
      [-10, -10], [10, -10], [-10, 10], [10, 10]
    ];
    mastOffsets.forEach(([mx, mz]) => {
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.set(mx, 14, mz);
      tentGroup.add(mast);

      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(mx + 1.5, 27, mz);
      tentGroup.add(flag);

      this.colliders.push({ x: mx, z: mz, radius: 1.0 });
    });

    // Center Circus Sawdust Ring Barrier
    const ringGeo = new THREE.TorusGeometry(12, 0.6, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x8a1b24, roughness: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.3;
    tentGroup.add(ring);

    // Center Podium / Jester Box Pedestal
    const podGeo = new THREE.CylinderGeometry(2.5, 3.0, 1.2, 12);
    const podMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.8 });
    const pod = new THREE.Mesh(podGeo, podMat);
    pod.position.set(0, 0.6, 0);
    tentGroup.add(pod);

    // Bleachers (tiered spectator wooden benches)
    for (let r = 18; r < 30; r += 3) {
      const benchGeo = new THREE.RingGeometry(r, r + 1.8, 16, 1, 0.4, Math.PI * 1.6);
      const bench = new THREE.Mesh(benchGeo, podMat);
      bench.rotation.x = -Math.PI / 2;
      bench.position.y = (r - 18) * 0.7 + 0.5;
      tentGroup.add(bench);
    }

    // Inside Circus Spotlight
    const spotLight = new THREE.SpotLight(0xffeedd, 3.5, 45, Math.PI / 4, 0.4, 1.0);
    spotLight.position.set(0, 24, 0);
    spotLight.target = pod;
    tentGroup.add(spotLight);

    // Hiding spots inside circus under bleachers
    this.hidingSpots.push({ x: -18, z: 12, name: 'Bawah Bangku Sirkus (Under Bleachers)' });
    this.hidingSpots.push({ x: 18, z: -14, name: 'Peti Properti Akrobat (Acrobat Trunk)' });

    // Colliders around perimeter of tent walls except entrances
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      // Keep 4 cardinal entrances open (North, South, East, West)
      const isEntrance = (
        Math.abs(a) < 0.25 ||
        Math.abs(a - Math.PI / 2) < 0.25 ||
        Math.abs(a - Math.PI) < 0.25 ||
        Math.abs(a - 3 * Math.PI / 2) < 0.25
      );
      if (!isEntrance) {
        this.colliders.push({
          x: Math.cos(a) * 33.5,
          z: Math.sin(a) * 33.5,
          radius: 2.5
        });
      }
    }

    this.group.add(tentGroup);
  }

  private buildMidwayStalls(woodTex: THREE.CanvasTexture, tentTex: THREE.CanvasTexture): void {
    const stallWoodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.8 });
    const awningMat = new THREE.MeshStandardMaterial({ map: tentTex, roughness: 0.7, side: THREE.DoubleSide });

    const stallPositions = [
      { x: 75, z: -55, label: 'Lempar Balon (Balloon Pop)' },
      { x: 95, z: -55, label: 'Tembak Bebek (Duck Gallery)' },
      { x: 115, z: -55, label: 'Ketuk Kaleng (Milk Bottle)' },
      { x: 75, z: -25, label: 'Ramalan Nasib (Fortune Teller)' },
      { x: 115, z: -25, label: 'Gula-gula Kapas (Cotton Candy)' },
      { x: 75, z: 5, label: 'Lempar Gelang (Ring Toss)' },
      { x: 95, z: 5, label: 'Gerobak Popcorn (Popcorn Stand)' },
      { x: 115, z: 5, label: 'Topeng Misteri (Mask Stall)' },
    ];

    const bulbMeshMat = new THREE.MeshBasicMaterial({ color: 0xffb366 });
    const bulbGeo = new THREE.SphereGeometry(0.16, 8, 8);

    stallPositions.forEach((stall, sIdx) => {
      const g = new THREE.Group();
      g.position.set(stall.x, 0, stall.z);

      // Base counter
      const counter = new THREE.Mesh(new THREE.BoxGeometry(6, 2.8, 4), stallWoodMat);
      counter.position.y = 1.4;
      g.add(counter);

      // Back wall with prize shelves
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 0.4), stallWoodMat);
      backWall.position.set(0, 2.5, -2);
      g.add(backWall);

      // Slanted striped awning
      const awning = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.2, 4.8), awningMat);
      awning.position.set(0, 5, 0);
      awning.rotation.x = 0.2;
      g.add(awning);

      // Glowing lantern bulb mesh on every stall, PointLight on every 3rd stall
      const bulbMesh = new THREE.Mesh(bulbGeo, bulbMeshMat);
      bulbMesh.position.set(0, 3.2, 0);
      g.add(bulbMesh);

      if (sIdx % 3 === 0) {
        const bulb = new THREE.PointLight(0xff9944, 1.2, 16);
        bulb.position.set(0, 3.2, 0);
        g.add(bulb);
      }

      this.group.add(g);
      this.colliders.push({ x: stall.x, z: stall.z, radius: 3.2 });
      this.hidingSpots.push({ x: stall.x, z: stall.z - 2.8, name: `Belakang ${stall.label}` });
    });
  }

  private buildCarousel(woodTex: THREE.CanvasTexture, tentTex: THREE.CanvasTexture): void {
    const carouselGroup = new THREE.Group();
    carouselGroup.position.set(-80, 0, -30);

    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.8 });
    const tentMat = new THREE.MeshStandardMaterial({ map: tentTex, roughness: 0.7, side: THREE.DoubleSide });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4a034, metalness: 0.8, roughness: 0.3 });

    // Rotating platform
    this.carouselPlatform = new THREE.Group();
    const platGeo = new THREE.CylinderGeometry(14, 14.5, 0.8, 16);
    const plat = new THREE.Mesh(platGeo, woodMat);
    plat.position.y = 0.4;
    this.carouselPlatform.add(plat);

    // Center mirrored pillar
    const pillarGeo = new THREE.CylinderGeometry(3.5, 3.5, 8, 12);
    const pillar = new THREE.Mesh(pillarGeo, goldMat);
    pillar.position.y = 4.4;
    this.carouselPlatform.add(pillar);

    // 8 Carousel Horses on Brass Poles
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 7.5, 6);
    const horseGeo = new THREE.BoxGeometry(1.8, 1.2, 0.6);
    const horseMat = new THREE.MeshStandardMaterial({ color: 0x8a2028, roughness: 0.5 });

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const hx = Math.cos(angle) * 9;
      const hz = Math.sin(angle) * 9;

      const pole = new THREE.Mesh(poleGeo, goldMat);
      pole.position.set(hx, 4.2, hz);
      this.carouselPlatform.add(pole);

      const horse = new THREE.Mesh(horseGeo, horseMat);
      horse.position.set(hx, 2.5, hz);
      horse.rotation.y = angle + Math.PI / 2;
      this.carouselPlatform.add(horse);
      this.carouselHorses.push(horse);
    }

    carouselGroup.add(this.carouselPlatform);

    // Conical Ornate Canopy Roof
    const canopyGeo = new THREE.ConeGeometry(15, 6, 16);
    const canopy = new THREE.Mesh(canopyGeo, tentMat);
    canopy.position.y = 9.5;
    carouselGroup.add(canopy);

    this.group.add(carouselGroup);
    this.colliders.push({ x: -80, z: -30, radius: 13.5 });
    this.hidingSpots.push({ x: -80, z: -30, name: 'Tengah Komedi Putar (Carousel Center)' });
  }

  private buildFerrisWheel(): void {
    const fwGroup = new THREE.Group();
    fwGroup.position.set(-85, 0, 50);

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x332626, metalness: 0.8, roughness: 0.4 });
    const gondolaMat = new THREE.MeshStandardMaterial({ color: 0x9e1e24, roughness: 0.6 });

    // A-Frame Support Legs
    const legGeo = new THREE.CylinderGeometry(0.6, 0.8, 38, 8);
    const leg1 = new THREE.Mesh(legGeo, steelMat);
    leg1.position.set(-8, 18, 0);
    leg1.rotation.z = 0.22;

    const leg2 = new THREE.Mesh(legGeo, steelMat);
    leg2.position.set(8, 18, 0);
    leg2.rotation.z = -0.22;

    fwGroup.add(leg1, leg2);

    // Rotating Wheel Structure
    this.ferrisWheelWheel = new THREE.Group();
    this.ferrisWheelWheel.position.set(0, 20, 0);

    const rimGeo = new THREE.TorusGeometry(18, 0.4, 8, 24);
    const rim1 = new THREE.Mesh(rimGeo, steelMat);
    rim1.position.z = -2;
    const rim2 = new THREE.Mesh(rimGeo, steelMat);
    rim2.position.z = 2;
    this.ferrisWheelWheel.add(rim1, rim2);

    // Spokes and 12 Gondolas
    const gondolaGeo = new THREE.BoxGeometry(2.4, 2.2, 2.4);
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const spokeGeo = new THREE.CylinderGeometry(0.12, 0.12, 36, 6);
      const spoke = new THREE.Mesh(spokeGeo, steelMat);
      spoke.rotation.z = angle;
      this.ferrisWheelWheel.add(spoke);

      const gx = Math.cos(angle) * 18;
      const gy = Math.sin(angle) * 18;
      const gondola = new THREE.Mesh(gondolaGeo, gondolaMat);
      gondola.position.set(gx, gy, 0);
      this.ferrisWheelWheel.add(gondola);
    }

    fwGroup.add(this.ferrisWheelWheel);
    this.group.add(fwGroup);

    this.colliders.push({ x: -85, z: 50, radius: 9 });
    this.hidingSpots.push({ x: -85, z: 50, name: 'Kabin Bawah Bianglala (Ferris Base)' });
  }

  private buildFunhouse(woodTex: THREE.CanvasTexture, tentTex: THREE.CanvasTexture): void {
    const fhGroup = new THREE.Group();
    fhGroup.position.set(85, 0, 80);

    const wallMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.7 });
    const clownMat = new THREE.MeshStandardMaterial({ color: 0x991822, roughness: 0.5 });

    // Big Clown Facade Entrance
    const facadeGeo = new THREE.BoxGeometry(16, 12, 1);
    const facade = new THREE.Mesh(facadeGeo, wallMat);
    facade.position.set(0, 6, -15);
    fhGroup.add(facade);

    // Clown Mouth Entrance Arch
    const mouthGeo = new THREE.TorusGeometry(3.5, 0.8, 8, 16, Math.PI);
    const mouth = new THREE.Mesh(mouthGeo, clownMat);
    mouth.position.set(0, 3.5, -14.4);
    mouth.rotation.z = Math.PI;
    fhGroup.add(mouth);

    // Labyrinth Partition Walls (Corridors)
    const wallSegments = [
      { x: -6, z: -8, w: 1, h: 4, d: 14 },
      { x: 0, z: -2, w: 10, h: 4, d: 1 },
      { x: 6, z: 4, w: 1, h: 4, d: 12 },
      { x: -3, z: 8, w: 8, h: 4, d: 1 },
      { x: -8, z: 12, w: 1, h: 4, d: 8 },
      { x: 4, z: 14, w: 10, h: 4, d: 1 },
    ];

    wallSegments.forEach((seg) => {
      const wMesh = new THREE.Mesh(new THREE.BoxGeometry(seg.w, seg.h, seg.d), wallMat);
      wMesh.position.set(seg.x, seg.h / 2, seg.z);
      fhGroup.add(wMesh);
      this.colliders.push({ x: 85 + seg.x, z: 80 + seg.z, radius: Math.max(seg.w, seg.d) / 2 });
    });

    this.group.add(fhGroup);
    this.hidingSpots.push({ x: 85 - 5, z: 80 + 5, name: 'Sudut Cermin Rumah Hantu (Mirror Corner)' });
    this.hidingSpots.push({ x: 85 + 5, z: 80 + 10, name: 'Loker Kostum Badut (Clown Locker)' });
  }

  private buildCircusCaravans(woodTex: THREE.CanvasTexture): void {
    const caravanPositions = [
      { x: -90, z: -90, rot: 0.1, label: 'Kafilah Direktur Sirkus' },
      { x: -70, z: -95, rot: -0.3, label: 'Gerbong Ruang Ganti' },
      { x: -85, z: -110, rot: 0.4, label: 'Kandang Binatang Buas' }
    ];

    const carMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.8 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f1917, roughness: 0.9 });

    caravanPositions.forEach((cp) => {
      const c = new THREE.Group();
      c.position.set(cp.x, 0, cp.z);
      c.rotation.y = cp.rot;

      // Caravan Box Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(9, 4, 4.5), carMat);
      body.position.y = 2.8;
      c.add(body);

      // Curved barrel roof
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 9.2, 12, 1, false, 0, Math.PI), carMat);
      roof.rotation.z = Math.PI / 2;
      roof.position.y = 4.8;
      c.add(roof);

      // 4 Heavy Spoke Wheels
      [-3.2, 3.2].forEach((wx) => {
        [-2.3, 2.3].forEach((wz) => {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.4, 12), wheelMat);
          wheel.rotation.x = Math.PI / 2;
          wheel.position.set(wx, 0.9, wz);
          c.add(wheel);
        });
      });

      this.group.add(c);
      this.colliders.push({ x: cp.x, z: cp.z, radius: 4.5 });
      this.hidingSpots.push({ x: cp.x, z: cp.z - 3.5, name: `Belakang ${cp.label}` });
    });
  }

  private buildAtmosphericProps(): void {
    // 16 Lampposts with eerie amber glow
    const lampGeo = new THREE.CylinderGeometry(0.12, 0.16, 7, 8);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x1f1f23, metalness: 0.8, roughness: 0.4 });

    const lampPositions = [
      [0, -90], [0, -50], [0, 50], [0, 90],
      [-40, -20], [-40, 20], [40, -20], [40, 20],
      [-70, -60], [-70, 0], [-70, 70],
      [70, -60], [70, 0], [70, 70],
      [-100, -30], [100, -30]
    ];

    const postBulbGeo = new THREE.SphereGeometry(0.24, 8, 8);
    const postBulbMat = new THREE.MeshBasicMaterial({ color: 0xffcc88 });

    lampPositions.forEach(([lx, lz], lIdx) => {
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(lx, 3.5, lz);
      this.group.add(lamp);

      const postBulb = new THREE.Mesh(postBulbGeo, postBulbMat);
      postBulb.position.set(lx, 7.0, lz);
      this.group.add(postBulb);

      if (lIdx % 2 === 0) {
        const bulb = new THREE.PointLight(0xffaa55, 1.5, 32, 1.2);
        bulb.position.set(lx, 6.8, lz);
        this.group.add(bulb);
      }

      this.colliders.push({ x: lx, z: lz, radius: 0.8 });
    });

    // 24 Gnarly Dead Trees along the carnival edges
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.9, 9, 7);
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x181412, roughness: 0.95 });

    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const dist = 115 + (Math.sin(i * 3) * 12);
      const tx = Math.cos(angle) * dist;
      const tz = Math.sin(angle) * dist;

      const tree = new THREE.Group();
      tree.position.set(tx, 0, tz);

      const trunk = new THREE.Mesh(trunkGeo, treeMat);
      trunk.position.y = 4.5;
      trunk.rotation.z = (Math.random() - 0.5) * 0.2;
      tree.add(trunk);

      // Dead branches
      for (let b = 0; b < 4; b++) {
        const branchGeo = new THREE.CylinderGeometry(0.1, 0.2, 4, 5);
        const branch = new THREE.Mesh(branchGeo, treeMat);
        branch.position.set(0, 6 + b * 0.8, 0);
        branch.rotation.set((Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 1.5, 0.8 + Math.random() * 0.5);
        tree.add(branch);
      }

      this.group.add(tree);
      this.colliders.push({ x: tx, z: tz, radius: 1.8 });
    }
  }

  /**
   * Builds a secret Cheat Console Pedestal tucked into the far-east corner edge near the Midway game booths
   */
  private buildSecretCheatButton(woodTex: THREE.CanvasTexture): void {
    const { x, z } = this.cheatButtonPosition;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = -Math.PI * 0.72;

    const baseMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.7 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.85, roughness: 0.25 });

    // Pedestal stand
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.15, 1.0), baseMat);
    pedestal.position.y = 0.575;
    g.add(pedestal);

    // Metallic console top plate
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 1.1), metalMat);
    plate.position.y = 1.22;
    g.add(plate);

    // Glowing Magenta/Red Cheat Dome Button
    const capMat = new THREE.MeshBasicMaterial({ color: 0xe879f9 });
    this.cheatButtonCap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.22, 16), capMat);
    this.cheatButtonCap.position.y = 1.38;
    g.add(this.cheatButtonCap);

    // Subtle pulsing aura halo (zero PointLight for zero shader hitch)
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xd946ef,
      transparent: true,
      opacity: 0.32,
      depthWrite: false
    });
    this.cheatButtonAura = new THREE.Mesh(new THREE.SphereGeometry(0.75, 12, 12), auraMat);
    this.cheatButtonAura.position.y = 1.45;
    g.add(this.cheatButtonAura);

    // Crisp canvas sign reading "CHEAT"
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, 256, 128);
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 8;
      ctx.strokeRect(6, 6, 244, 116);
      ctx.fillStyle = '#f0abfc';
      ctx.font = 'bold 42px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CHEAT 😏', 128, 66);
    }
    const signTex = new THREE.CanvasTexture(canvas);
    signTex.colorSpace = THREE.SRGBColorSpace;
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 0.58),
      new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
    );
    signMesh.position.set(0, 1.88, -0.35);
    g.add(signMesh);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), metalMat);
    post.position.set(0, 1.55, -0.38);
    g.add(post);

    this.group.add(g);
    this.colliders.push({ x, z, radius: 0.85 });
  }

  /**
   * Spawns exactly 20 Jack-in-the-Box collectible items across the vast circus!
   */
  private spawn20CollectibleBoxes(): void {
    const boxTexture = ProceduralTextures.getBoxItemTexture();
    const boxMat = new THREE.MeshStandardMaterial({
      map: boxTexture,
      roughness: 0.4,
      metalness: 0.6
    });
    const crankMat = new THREE.MeshStandardMaterial({ color: 0xd4a034, metalness: 0.9, roughness: 0.2 });

    // 20 Strategic, atmospheric locations across all zones
    const spawnPoints = [
      { name: 'Kotak 1: Loket Tiket Gerbang', zone: 'Gerbang Masuk', x: -16, z: -112, y: 1.2 },
      { name: 'Kotak 2: Belakang Patung Badut Masuk', zone: 'Gerbang Masuk', x: 18, z: -110, y: 1.2 },
      { name: 'Kotak 3: Podium Sirkus Utama', zone: 'Tenda Utama', x: 0, z: 0, y: 1.5 },
      { name: 'Kotak 4: Bangku Penonton Sisi Utara', zone: 'Tenda Utama', x: -22, z: -8, y: 2.2 },
      { name: 'Kotak 5: Bawah Tiang Akrobatik', zone: 'Tenda Utama', x: 10, z: 10, y: 0.8 },
      { name: 'Kotak 6: Stan Lempar Balon', zone: 'Stan Permainan', x: 75, z: -53, y: 1.6 },
      { name: 'Kotak 7: Meja Penembak Bebek', zone: 'Stan Permainan', x: 95, z: -53, y: 1.6 },
      { name: 'Kotak 8: Kotak Ramalan Nasib', zone: 'Stan Permainan', x: 75, z: -23, y: 1.6 },
      { name: 'Kotak 9: Gerobak Popcorn Ditinggalkan', zone: 'Stan Permainan', x: 95, z: 7, y: 1.6 },
      { name: 'Kotak 10: Pelataran Kuda Komedi Putar', zone: 'Komedi Putar', x: -80, z: -23, y: 1.2 },
      { name: 'Kotak 11: Belakang Tiang Cermin Komedi Putar', zone: 'Komedi Putar', x: -80, z: -35, y: 1.2 },
      { name: 'Kotak 12: Penyangga Bianglala Barat', zone: 'Bianglala', x: -93, z: 50, y: 1.0 },
      { name: 'Kotak 13: Gondola Bawah Bianglala', zone: 'Bianglala', x: -85, z: 34, y: 2.8 },
      { name: 'Kotak 14: Mulut Badut Rumah Kaca', zone: 'Rumah Kaca', x: 85, z: 66, y: 1.0 },
      { name: 'Kotak 15: Lorong Cermin Buntu Rumah Hantu', zone: 'Rumah Kaca', x: 82, z: 86, y: 1.0 },
      { name: 'Kotak 16: Loker Kostum Badut', zone: 'Rumah Kaca', x: 92, z: 92, y: 1.0 },
      { name: 'Kotak 17: Kafilah Direktur Sirkus', zone: 'Kereta Sirkus', x: -90, z: -86, y: 1.5 },
      { name: 'Kotak 18: Kandang Besi Binatang', zone: 'Kereta Sirkus', x: -84, z: -106, y: 1.5 },
      { name: 'Kotak 19: Pohon Mati Pojok Barat Laut', zone: 'Tepi Sirkus', x: -105, z: 75, y: 0.8 },
      { name: 'Kotak 20: Tiang Lampu Rahasia Sudut Tenggara', zone: 'Tepi Sirkus', x: 65, z: 105, y: 0.8 }
    ];

    spawnPoints.forEach((sp, idx) => {
      const boxData: CollectibleBox = {
        id: idx + 1,
        name: sp.name,
        zone: sp.zone,
        x: sp.x,
        y: sp.y,
        z: sp.z,
        collected: false,
        collectedBy: null,
        glowPhase: Math.random() * Math.PI * 2
      };
      this.collectibleBoxes.push(boxData);

      // Create 3D miniature Jack-in-the-Box mesh
      const boxG = new THREE.Group();
      boxG.position.set(sp.x, sp.y, sp.z);

      // Cube box
      const cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), boxMat);
      boxG.add(cubeMesh);

      // Little brass crank
      const crankHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), crankMat);
      crankHandle.rotation.z = Math.PI / 2;
      crankHandle.position.set(0.45, 0, 0);
      boxG.add(crankHandle);

      // Unlit eerie golden aura halo (ZERO PointLights -> ZERO shader recompilation freeze when collecting boxes!)
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0.28,
        depthWrite: false
      });
      const aura = new THREE.Mesh(new THREE.SphereGeometry(0.65, 10, 10), auraMat);
      boxG.add(aura);

      this.group.add(boxG);
      this.boxMeshes.push(boxG);
    });
  }

  /**
   * Animates map components: Carousel spinning, horses bobbing, Ferris wheel rotating,
   * and collectible boxes gently levitating with music-box twinkle!
   */
  public update(delta: number, elapsed: number): void {
    // 1. Carousel Rotation & Horse Bobbing
    if (this.carouselPlatform) {
      this.carouselPlatform.rotation.y += delta * 0.25;
      this.carouselHorses.forEach((horse, idx) => {
        horse.position.y = 2.2 + Math.sin(elapsed * 2.5 + idx * 0.8) * 0.45;
      });
    }

    // 2. Ferris Wheel Slow Rotation
    if (this.ferrisWheelWheel) {
      this.ferrisWheelWheel.rotation.z -= delta * 0.06;
    }

    // 3. Collectible Boxes floating & rotating
    this.boxMeshes.forEach((mesh, idx) => {
      const data = this.collectibleBoxes[idx];
      if (data && !data.collected) {
        mesh.rotation.y += delta * 1.2;
        mesh.position.y = data.y + Math.sin(elapsed * 2.0 + data.glowPhase) * 0.12;
      }
    });

    // 4. Secret Cheat Button pulse
    if (this.cheatButtonCap && this.cheatButtonAura) {
      this.cheatButtonCap.position.y = 1.38 + Math.sin(elapsed * 4.0) * 0.035;
      const auraScale = 0.95 + Math.sin(elapsed * 3.5) * 0.16;
      this.cheatButtonAura.scale.set(auraScale, auraScale, auraScale);
    }
  }

  /**
   * Unlocks and swings open the grand exit gates
   */
  public unlockExitGates(): void {
    if (this.exitGateLeft && this.exitGateRight) {
      this.exitGateLeft.rotation.y = -Math.PI / 2.2;
      this.exitGateRight.rotation.y = Math.PI / 2.2;
    }
  }

  public resetExitGates(): void {
    if (this.exitGateLeft && this.exitGateRight) {
      this.exitGateLeft.rotation.y = 0;
      this.exitGateRight.rotation.y = 0;
    }
  }

  public getZoneAt(x: number, z: number): CarnivalZone {
    for (const zDef of this.zones) {
      if (x >= zDef.minX && x <= zDef.maxX && z >= zDef.minZ && z <= zDef.maxZ) {
        return zDef;
      }
    }
    return {
      id: 'OUTSKIRTS',
      nameId: 'Halaman Sirkus Berkabut',
      nameEn: 'Misty Fairground Outskirts',
      minX: -150, maxX: 150, minZ: -150, maxZ: 150,
      descriptionId: 'Kegelapan di antara wahana sirkus yang terbengkalai.',
      descriptionEn: 'The cold darkness between abandoned carnival rides.'
    };
  }

  public checkCollision(x: number, z: number, playerRadius: number = 0.6): boolean {
    for (const c of this.colliders) {
      const distSq = (x - c.x) ** 2 + (z - c.z) ** 2;
      const minDist = c.radius + playerRadius;
      if (distSq < minDist * minDist) {
        return true;
      }
    }
    return false;
  }
}
