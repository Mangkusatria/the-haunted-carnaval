/**
 * Chapter 2: The Expansive Circus Labyrinth (Labirin Sirkus Super Duper Luas)
 * Physically separated at worldOffsetZ = -280 behind the Fairground's North Gate.
 * Includes:
 * - Colossal Giant Circus Tent Exterior ("Tenda Raksasa Labirin") visible from Chapter 1 Fairground
 * - Full Maze Roof / Ceiling with wooden rafters, tent canvas & hanging bunting
 * - Rich Horror Circus Decorations: vintage paintings, wall graffiti/coretan, claw marks & props
 * - Cleared 3x3 Prison Courtyard Plaza with hinged iron gate & proper wall/cage colliders
 * - Fast zero-alloc 19x19 Grid BFS Pathfinding for Jesty and Companion Bots
 */

import * as THREE from 'three';
import { ProceduralTextures } from './proceduralTextures';
import { LockerItem, MazeMachine } from '../types';

export interface MazeCell {
  x: number;
  z: number;
  walls: { north: boolean; south: boolean; east: boolean; west: boolean };
}

export interface JestyPaintingSpot {
  x: number;
  z: number;
  wallX: number;
  wallZ: number;
  rotY: number;
}

export class CircusMaze {
  public group: THREE.Group = new THREE.Group();
  public exteriorTentGroup: THREE.Group = new THREE.Group();
  public interiorGroup: THREE.Group = new THREE.Group();

  // Physical world placement far North past Fairground (-130..130)
  public readonly worldOffsetX: number = 0;
  public readonly worldOffsetZ: number = -280;

  public colliders: { x: number; z: number; radius: number }[] = [];
  public lockers: LockerItem[] = [];
  public jestyPaintings: JestyPaintingSpot[] = [];
  public exitDoorPosition: { x: number; z: number } = { x: 0, z: -204 };
  public exitDoorMesh: THREE.Group | null = null;
  public exitDoorOpened: boolean = false;
  public carWreckagePosition: { x: number; z: number } = { x: 0, z: -348 };
  public startMapBoardPosition: { x: number; z: number } = { x: 3.5, z: -336.5 };
  public startMapCanvasDataUrl: string = '';
  private startMapCanvas: HTMLCanvasElement | null = null;
  private startMapTexture: THREE.CanvasTexture | null = null;

  // 20 Scattered Circus Machines (Mesin Labirin) & Prison Cage (world coordinates)
  public mazeMachines: MazeMachine[] = [];
  private machineVisuals: {
    group: THREE.Group;
    gear: THREE.Mesh;
    beacon: THREE.Mesh;
    ring: THREE.Mesh;
  }[] = [];
  public prisonCagePosition: { x: number; z: number } = { x: 0, z: -296 };
  public prisonDropOffPosition: { x: number; z: number } = { x: 0, z: -291.2 };
  public prisonCageMesh: THREE.Group | null = null;
  private prisonGatePivot: THREE.Group | null = null;
  private prisonGateClosed: boolean = true;
  private exitSunBeam: THREE.SpotLight | null = null;
  private exitHighlightGroup: THREE.Group | null = null;
  private exitHighlightRing: THREE.Mesh | null = null;
  private mazeInfernoGroup: THREE.Group = new THREE.Group();
  private flameMeshes: { mesh: THREE.Mesh; phase: number; baseY: number }[] = [];

  // Grid dimensions: 19 x 19 cells, each 8m x 8m (total 152m x 152m of intricate hallways)
  public readonly gridCols = 19;
  public readonly gridRows = 19;
  public readonly cellSize = 8.0;
  public readonly halfWidth = (19 * 8.0) / 2; // 76m

  private cells: MazeCell[][] = [];

  // Reusable typed arrays for zero-GC 19x19 BFS pathfinding
  private readonly bfsVisited = new Uint8Array(19 * 19);
  private readonly bfsParent = new Int16Array(19 * 19);
  private readonly bfsQueue = new Int16Array(19 * 19);

  constructor() {
    this.group.position.set(this.worldOffsetX, 0, this.worldOffsetZ);
    this.group.add(this.exteriorTentGroup);
    this.group.add(this.interiorGroup);

    this.generateMazeData();
    this.buildGiantExteriorTent();
    this.buildMaze3D();
    this.buildMazeCeilingAndDecorations();
    this.buildPrisonCage(0, -16);
    this.build20Machines();
    this.buildMazeStartMapBoard(3.5, -56.5);
    this.buildInfernoFires();

    // Start with exterior tent visible from Fairground and interior hidden until Chapter 2
    this.setChapterMode(false);
  }

  /**
   * Switches visibility between Fairground backdrop (Giant Tent visible from afar)
   * and Chapter 2 Interior Labyrinth play mode
   */
  public setChapterMode(isInsideMaze: boolean): void {
    this.exteriorTentGroup.visible = !isInsideMaze;
    this.interiorGroup.visible = isInsideMaze;
  }

  public getWorldBounds(): { minX: number; maxX: number; minZ: number; maxZ: number } {
    return {
      minX: this.worldOffsetX - this.halfWidth + 1.5,
      maxX: this.worldOffsetX + this.halfWidth - 1.5,
      minZ: this.worldOffsetZ - this.halfWidth + 1.5,
      maxZ: this.worldOffsetZ + this.halfWidth - 1.5
    };
  }

  /**
   * Builds the colossal Giant Labyrinth Circus Tent ("Tenda Raksasa Labirin")
   * Looming over the northern horizon from Jacky's Fairground!
   */
  private buildGiantExteriorTent(): void {
    const stripeTex = ProceduralTextures.getTentStripes().clone();
    stripeTex.needsUpdate = true;
    stripeTex.wrapS = THREE.RepeatWrapping;
    stripeTex.wrapT = THREE.RepeatWrapping;
    stripeTex.repeat.set(14, 2);

    const tentWallMat = new THREE.MeshStandardMaterial({
      map: stripeTex,
      roughness: 0.78,
      metalness: 0.08,
      emissive: new THREE.Color(0x280508),
      emissiveIntensity: 0.35
    });

    const roofMat = new THREE.MeshStandardMaterial({
      map: stripeTex,
      roughness: 0.72,
      metalness: 0.1,
      emissive: new THREE.Color(0x3a070c),
      emissiveIntensity: 0.42
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.25,
      emissive: new THREE.Color(0x78350f),
      emissiveIntensity: 0.45
    });

    // Huge cylindrical outer tent skirt (radius 96m, height 18m)
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(96, 98, 18, 32, 1, false),
      tentWallMat
    );
    skirt.position.y = 9;
    this.exteriorTentGroup.add(skirt);

    // Colossal main conical big-top roof rising up to 68m high!
    const mainRoof = new THREE.Mesh(
      new THREE.ConeGeometry(102, 50, 32, 1, false),
      roofMat
    );
    mainRoof.position.y = 43;
    this.exteriorTentGroup.add(mainRoof);

    // Decorative golden trim ring between wall and roof
    const ring = new THREE.Mesh(new THREE.TorusGeometry(97, 1.2, 8, 36), goldMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 18;
    this.exteriorTentGroup.add(ring);

    // Tall central spire pole & glowing pennant banner
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, 16, 10), goldMat);
    spire.position.y = 74;
    this.exteriorTentGroup.add(spire);

    const crownOrb = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
    );
    crownOrb.position.y = 82;
    this.exteriorTentGroup.add(crownOrb);

    // Glowing marquee arch facing South (+Z toward Jacky's Fairground North Gate)
    const marqueeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const marqueeSign = new THREE.Mesh(new THREE.BoxGeometry(36, 7, 2.5), new THREE.MeshStandardMaterial({ color: 0x450a0a, roughness: 0.6 }));
    marqueeSign.position.set(0, 14, 96.5);
    this.exteriorTentGroup.add(marqueeSign);

    for (let lx = -15; lx <= 15; lx += 5) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), marqueeMat);
      bulb.position.set(lx, 17, 98);
      this.exteriorTentGroup.add(bulb);
    }

    // Exterior floodlights illuminating the giant tent silhouette at night
    const topGlow = new THREE.PointLight(0xff4433, 6.0, 220, 0.7);
    topGlow.position.set(0, 86, 40);
    this.exteriorTentGroup.add(topGlow);

    const frontFlood = new THREE.PointLight(0xfbbf24, 5.5, 160, 0.8);
    frontFlood.position.set(0, 22, 112);
    this.exteriorTentGroup.add(frontFlood);
  }

  /**
   * Generates a fully solvable 19x19 maze using Recursive Backtracking algorithm
   * Ensures broad accessible corridors, multiple loops, and an OPEN 3x3 Prison Courtyard Plaza!
   */
  private generateMazeData(): void {
    // 1. Initialize all cells with all 4 walls closed
    this.cells = [];
    for (let r = 0; r < this.gridRows; r++) {
      const row: MazeCell[] = [];
      for (let c = 0; c < this.gridCols; c++) {
        row.push({
          x: c,
          z: r,
          walls: { north: true, south: true, east: true, west: true }
        });
      }
      this.cells.push(row);
    }

    // 2. Depth-first search recursive backtracker
    const visited: boolean[][] = Array.from({ length: this.gridRows }, () =>
      Array(this.gridCols).fill(false)
    );

    const stack: [number, number][] = [];
    const startC = Math.floor(this.gridCols / 2);
    const startR = 0;
    visited[startR][startC] = true;
    stack.push([startC, startR]);

    while (stack.length > 0) {
      const [currC, currR] = stack[stack.length - 1];
      const neighbors: { c: number; r: number; dir: 'north' | 'south' | 'east' | 'west'; opp: 'north' | 'south' | 'east' | 'west' }[] = [];

      if (currR > 0 && !visited[currR - 1][currC]) {
        neighbors.push({ c: currC, r: currR - 1, dir: 'north', opp: 'south' });
      }
      if (currR < this.gridRows - 1 && !visited[currR + 1][currC]) {
        neighbors.push({ c: currC, r: currR + 1, dir: 'south', opp: 'north' });
      }
      if (currC < this.gridCols - 1 && !visited[currR][currC + 1]) {
        neighbors.push({ c: currC + 1, r: currR, dir: 'east', opp: 'west' });
      }
      if (currC > 0 && !visited[currR][currC - 1]) {
        neighbors.push({ c: currC - 1, r: currR, dir: 'west', opp: 'east' });
      }

      if (neighbors.length > 0) {
        const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
        this.cells[currR][currC].walls[chosen.dir] = false;
        this.cells[chosen.r][chosen.c].walls[chosen.opp] = false;
        visited[chosen.r][chosen.c] = true;
        stack.push([chosen.c, chosen.r]);
      } else {
        stack.pop();
      }
    }

    // 3. Braiding: Knock down dead-end walls to create loops and multiple escape paths
    for (let r = 1; r < this.gridRows - 1; r++) {
      for (let c = 1; c < this.gridCols - 1; c++) {
        const cell = this.cells[r][c];
        const wallCount =
          (cell.walls.north ? 1 : 0) +
          (cell.walls.south ? 1 : 0) +
          (cell.walls.east ? 1 : 0) +
          (cell.walls.west ? 1 : 0);

        if (wallCount >= 3 || Math.random() < 0.18) {
          if (cell.walls.east && c < this.gridCols - 1) {
            cell.walls.east = false;
            this.cells[r][c + 1].walls.west = false;
          } else if (cell.walls.south && r < this.gridRows - 1) {
            cell.walls.south = false;
            this.cells[r + 1][c].walls.north = false;
          }
        }
      }
    }

    const midC = Math.floor(this.gridCols / 2); // c = 9

    // 4. Open up central entrance plaza (Crashed car plaza: r = 0..2, c = 8..10)
    for (let r = 0; r <= 2; r++) {
      for (let c = midC - 1; c <= midC + 1; c++) {
        if (c < midC + 1) {
          this.cells[r][c].walls.east = false;
          this.cells[r][c + 1].walls.west = false;
        }
        if (r < 2) {
          this.cells[r][c].walls.south = false;
          this.cells[r + 1][c].walls.north = false;
        }
      }
    }

    // 5. Open up a spacious 3x3 PRISON COURTYARD PLAZA around (c = 9, r = 7) => local (0, -16)
    // Guarantees the Prison Cage door (+Z facing r = 8) NEVER faces any wall!
    for (let r = 6; r <= 8; r++) {
      for (let c = midC - 1; c <= midC + 1; c++) {
        if (c < midC + 1) {
          this.cells[r][c].walls.east = false;
          this.cells[r][c + 1].walls.west = false;
        }
        if (r < 8) {
          this.cells[r][c].walls.south = false;
          this.cells[r + 1][c].walls.north = false;
        }
      }
    }
    // Ensure exits out of the courtyard to all 4 cardinal directions
    this.cells[6][midC].walls.north = false;
    this.cells[5][midC].walls.south = false;
    this.cells[8][midC].walls.south = false;
    this.cells[9][midC].walls.north = false;
    this.cells[7][midC - 1].walls.west = false;
    this.cells[7][midC - 2].walls.east = false;
    this.cells[7][midC + 1].walls.east = false;
    this.cells[7][midC + 2].walls.west = false;

    // 6. Open up Grand Exit Door plaza at the far end (r = 16..18, c = 8..10)
    const exitR = this.gridRows - 1;
    for (let r = exitR - 2; r <= exitR; r++) {
      for (let c = midC - 1; c <= midC + 1; c++) {
        if (c < midC + 1) {
          this.cells[r][c].walls.east = false;
          this.cells[r][c + 1].walls.west = false;
        }
        if (r < exitR) {
          this.cells[r][c].walls.south = false;
          this.cells[r + 1][c].walls.north = false;
        }
      }
    }
  }

  /**
   * Builds the 3D meshes for the labyrinth interior
   */
  private buildMaze3D(): void {
    // 1. Muddy Labyrinth Ground Floor
    const groundGeo = new THREE.PlaneGeometry(180, 180, 16, 16);
    const mudTex = ProceduralTextures.getGround();
    const groundMat = new THREE.MeshStandardMaterial({
      map: mudTex,
      roughness: 0.95,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.interiorGroup.add(ground);

    // 2. Circus Striped Canvas Wall Material
    const stripeTex = ProceduralTextures.getTentStripes().clone();
    stripeTex.needsUpdate = true;
    stripeTex.wrapS = THREE.RepeatWrapping;
    stripeTex.wrapT = THREE.RepeatWrapping;
    stripeTex.repeat.set(3, 1);
    const wallMat = new THREE.MeshStandardMaterial({
      map: stripeTex,
      roughness: 0.8,
      metalness: 0.1
    });

    const wallHeight = 4.6;
    const wallThickness = 0.8;
    const wallLength = this.cellSize;

    const horizWallGeo = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
    const vertWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);

    const totalW = this.gridCols * this.cellSize;
    const totalH = this.gridRows * this.cellSize;

    // West outer boundary wall
    const westBound = new THREE.Mesh(new THREE.BoxGeometry(wallThickness * 2, wallHeight + 1, totalH), wallMat);
    westBound.position.set(-this.halfWidth, wallHeight / 2, 0);
    this.interiorGroup.add(westBound);
    this.addBoxCollider(-this.halfWidth, 0, wallThickness, totalH / 2);

    // East outer boundary wall
    const eastBound = new THREE.Mesh(new THREE.BoxGeometry(wallThickness * 2, wallHeight + 1, totalH), wallMat);
    eastBound.position.set(this.halfWidth, wallHeight / 2, 0);
    this.interiorGroup.add(eastBound);
    this.addBoxCollider(this.halfWidth, 0, wallThickness, totalH / 2);

    // South outer boundary wall (behind start car)
    const southBound = new THREE.Mesh(new THREE.BoxGeometry(totalW, wallHeight + 1, wallThickness * 2), wallMat);
    southBound.position.set(0, wallHeight / 2, -this.halfWidth);
    this.interiorGroup.add(southBound);
    this.addBoxCollider(0, -this.halfWidth, totalW / 2, wallThickness);

    // North outer boundary wall (with gap for Golden Exit Door)
    const northBoundLeft = new THREE.Mesh(new THREE.BoxGeometry(totalW / 2 - 8, wallHeight + 1, wallThickness * 2), wallMat);
    northBoundLeft.position.set(-totalW / 4 - 4, wallHeight / 2, this.halfWidth);
    this.interiorGroup.add(northBoundLeft);
    this.addBoxCollider(-totalW / 4 - 4, this.halfWidth, (totalW / 2 - 8) / 2, wallThickness);

    const northBoundRight = new THREE.Mesh(new THREE.BoxGeometry(totalW / 2 - 8, wallHeight + 1, wallThickness * 2), wallMat);
    northBoundRight.position.set(totalW / 4 + 4, wallHeight / 2, this.halfWidth);
    this.interiorGroup.add(northBoundRight);
    this.addBoxCollider(totalW / 4 + 4, this.halfWidth, (totalW / 2 - 8) / 2, wallThickness);

    // Decor materials prepared once (Zero per-wall material allocations)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3b2718, roughness: 0.7, metalness: 0.25 });
    const paintingMats = [0, 1, 2].map(v => new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getCircusPaintingTexture(v),
      roughness: 0.65
    }));
    const graffitiMats = [0, 1, 2].map(v => new THREE.MeshBasicMaterial({
      map: ProceduralTextures.getGraffitiDecalTexture(v),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      side: THREE.DoubleSide
    }));
    const paintingGeo = new THREE.PlaneGeometry(1.5, 1.9);
    const paintingFrameGeo = new THREE.BoxGeometry(1.72, 2.12, 0.08);
    const graffitiGeo = new THREE.PlaneGeometry(3.4, 1.7);

    // Build Internal Maze Walls + Wall-Mounted Paintings & Graffiti
    let decorCounter = 0;
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const cell = this.cells[r][c];
        const localX = (c + 0.5) * this.cellSize - this.halfWidth;
        const localZ = (r + 0.5) * this.cellSize - this.halfWidth;

        // North wall of this cell (z = localZ - cellSize/2)
        if (cell.walls.north && r > 0) {
          const wallZ = localZ - this.cellSize / 2;
          const w = new THREE.Mesh(horizWallGeo, wallMat);
          w.position.set(localX, wallHeight / 2, wallZ);
          this.interiorGroup.add(w);
          this.addBoxCollider(localX, wallZ, wallLength / 2, wallThickness / 2);

          decorCounter++;
          if (decorCounter % 5 === 0) {
            const varA = decorCounter % 3;
            const varB = (decorCounter + 1) % 3;
            this.mountWallDecoration(localX, wallZ + wallThickness / 2 + 0.04, 0, paintingGeo, paintingFrameGeo, paintingMats[varA], frameMat, graffitiGeo, graffitiMats[varA], decorCounter % 2 === 0, varA === 0);
            this.mountWallDecoration(localX, wallZ - wallThickness / 2 - 0.04, Math.PI, paintingGeo, paintingFrameGeo, paintingMats[varB], frameMat, graffitiGeo, graffitiMats[varB], decorCounter % 3 === 0, varB === 0);
          }
        }

        // West wall of this cell (x = localX - cellSize/2)
        if (cell.walls.west && c > 0) {
          const wallX = localX - this.cellSize / 2;
          const w = new THREE.Mesh(vertWallGeo, wallMat);
          w.position.set(wallX, wallHeight / 2, localZ);
          this.interiorGroup.add(w);
          this.addBoxCollider(wallX, localZ, wallThickness / 2, wallLength / 2);

          decorCounter++;
          if (decorCounter % 6 === 0) {
            const varA = decorCounter % 3;
            const varB = (decorCounter + 2) % 3;
            this.mountWallDecoration(wallX + wallThickness / 2 + 0.04, localZ, Math.PI / 2, paintingGeo, paintingFrameGeo, paintingMats[varA], frameMat, graffitiGeo, graffitiMats[varA], decorCounter % 2 === 1, varA === 0);
            this.mountWallDecoration(wallX - wallThickness / 2 - 0.04, localZ, -Math.PI / 2, paintingGeo, paintingFrameGeo, paintingMats[varB], frameMat, graffitiGeo, graffitiMats[varB], decorCounter % 3 === 1, varB === 0);
          }
        }

        // Ceiling / overhead lanterns in periodic cells (visual bulbs everywhere, PointLight only on 9 junction plazas!)
        if ((r + c) % 4 === 0 && ((r * 3 + c) % 2 === 0)) {
          const isJunctionLight = (r === 3 || r === 9 || r === 15) && (c === 3 || c === 9 || c === 15);
          this.createCorridorLantern(localX, localZ, isJunctionLight);
        }

        // Exit direction signs
        if ((r * 7 + c) % 13 === 0 && r < this.gridRows - 3) {
          this.createExitSignArrow(localX, localZ);
        }
      }
    }

    // 3. Build Crashed Getaway Car at Entrance Plaza (local x = 0, z = -68)
    this.buildCrashedCar(0, -68);

    // 4. Build Grand Golden Exit Door at Far End Plaza (local x = 0, z = +76)
    this.buildGrandExitDoor(0, this.halfWidth);

    // 5. Build 8 Carnival Lockers around the maze corridors
    this.buildMazeLockers();

    // Filter Jesty portrait spots so emergence points never collide with nearby lockers or props
    this.jestyPaintings = this.jestyPaintings.filter(
      (spot) => !this.checkCollision(spot.x, spot.z, 0.72)
    );
  }

  /**
   * Mounts a framed haunted circus painting or creepy wall graffiti onto an existing wall face
   */
  private mountWallDecoration(
    x: number,
    z: number,
    rotY: number,
    paintingGeo: THREE.PlaneGeometry,
    frameGeo: THREE.BoxGeometry,
    paintingMat: THREE.Material,
    frameMat: THREE.Material,
    graffitiGeo: THREE.PlaneGeometry,
    graffitiMat: THREE.Material,
    isPainting: boolean,
    isJestyPortrait: boolean = false
  ): void {
    const holder = new THREE.Group();
    holder.position.set(x, isPainting ? 2.35 : 1.9, z);
    holder.rotation.y = rotY;

    if (isPainting) {
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.rotation.z = (Math.random() - 0.5) * 0.14; // Slightly crooked creepy painting
      const art = new THREE.Mesh(paintingGeo, paintingMat);
      art.position.z = 0.05;
      frame.add(art);
      holder.add(frame);

      if (isJestyPortrait) {
        const emergeDist = 1.45;
        this.jestyPaintings.push({
          wallX: this.worldOffsetX + x,
          wallZ: this.worldOffsetZ + z,
          x: this.worldOffsetX + x + Math.sin(rotY) * emergeDist,
          z: this.worldOffsetZ + z + Math.cos(rotY) * emergeDist,
          rotY
        });
      }
    } else {
      const decal = new THREE.Mesh(graffitiGeo, graffitiMat);
      holder.add(decal);
    }
    this.interiorGroup.add(holder);
  }

  /**
   * Builds the Full Circus Tent Roof / Ceiling, Rafters, Buntings, and Floor Props
   */
  private buildMazeCeilingAndDecorations(): void {
    const ceilingTex = ProceduralTextures.getTentCeilingTexture();
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: ceilingTex,
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // Main tent canopy ceiling enclosing the top of the labyrinth (y = 4.65m edge rising to y = 13.5m peak)
    const canopyGeo = new THREE.ConeGeometry(118, 9.5, 24, 1, true);
    const canopy = new THREE.Mesh(canopyGeo, ceilingMat);
    canopy.position.set(0, 9.4, 0);
    this.interiorGroup.add(canopy);

    // Flat perimeter ceiling border to seal corners around the 152x152 square maze cleanly
    const flatCeilingGeo = new THREE.PlaneGeometry(164, 164);
    const flatCeiling = new THREE.Mesh(flatCeilingGeo, ceilingMat);
    flatCeiling.rotation.x = Math.PI / 2;
    flatCeiling.position.set(0, 4.68, 0);
    this.interiorGroup.add(flatCeiling);

    // Wooden overhead cross-rafters using InstancedMesh for optimal FPS
    const timberMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getWood(),
      roughness: 0.85
    });
    const beamGeo = new THREE.BoxGeometry(154, 0.32, 0.36);
    const beamCount = 10;
    const rafters = new THREE.InstancedMesh(beamGeo, timberMat, beamCount * 2);
    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let i = 0; i < beamCount; i++) {
      const offset = -this.halfWidth + 8 + i * (this.cellSize * 2);
      // East-West beams
      dummy.position.set(0, 4.55, offset);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      rafters.setMatrixAt(idx++, dummy.matrix);

      // North-South beams
      dummy.position.set(offset, 4.52, 0);
      dummy.rotation.set(0, Math.PI / 2, 0);
      dummy.updateMatrix();
      rafters.setMatrixAt(idx++, dummy.matrix);
    }
    rafters.instanceMatrix.needsUpdate = true;
    this.interiorGroup.add(rafters);

    // Decorative triangular carnival bunting pennants hanging from rafters (InstancedMesh)
    const flagGeo = new THREE.ConeGeometry(0.28, 0.55, 3);
    const flagMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 });
    const flagCount = 96;
    const flags = new THREE.InstancedMesh(flagGeo, flagMat, flagCount);
    const colorAlt = new THREE.Color();
    for (let f = 0; f < flagCount; f++) {
      const rowZ = -68 + (f % 8) * 18;
      const colX = -60 + Math.floor(f / 8) * 11;
      dummy.position.set(colX, 4.18, rowZ);
      dummy.rotation.set(Math.PI, (f % 4) * 0.4, 0);
      dummy.updateMatrix();
      flags.setMatrixAt(f, dummy.matrix);
      colorAlt.setHex(f % 3 === 0 ? 0x991b1b : f % 3 === 1 ? 0xd97706 : 0xe5dec9);
      flags.setColorAt(f, colorAlt);
    }
    flags.instanceMatrix.needsUpdate = true;
    if (flags.instanceColor) flags.instanceColor.needsUpdate = true;
    this.interiorGroup.add(flags);

    // Circus crates & weathered props along wide plazas (kept clear of doorways)
    const crateMat = new THREE.MeshStandardMaterial({ map: ProceduralTextures.getWood(), roughness: 0.85 });
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8, metalness: 0.25 });
    const propCoords = [
      { x: -10, z: -26, kind: 'crate' },
      { x: 10, z: -26, kind: 'barrel' },
      { x: -10, z: -6, kind: 'barrel' },
      { x: 10, z: -6, kind: 'crate' },
      { x: -10, z: -64, kind: 'crate' },
      { x: 10, z: -64, kind: 'barrel' },
      { x: -9, z: 66, kind: 'crate' },
      { x: 9, z: 66, kind: 'barrel' }
    ];
    propCoords.forEach((p, i) => {
      if (p.kind === 'crate') {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 1.3), crateMat);
        crate.position.set(p.x, 0.65, p.z);
        crate.rotation.y = i * 0.5;
        this.interiorGroup.add(crate);
        this.addBoxCollider(p.x, p.z, 0.7, 0.7);
      } else {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.25, 12), barrelMat);
        barrel.position.set(p.x, 0.62, p.z);
        this.interiorGroup.add(barrel);
        this.addBoxCollider(p.x, p.z, 0.6, 0.6);
      }
    });
  }

  /**
   * Creates a detailed 3D Crashed Getaway Car wreckage
   */
  private buildCrashedCar(localX: number, localZ: number): void {
    const carGroup = new THREE.Group();
    carGroup.position.set(localX, 0, localZ);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.7,
      metalness: 0.8
    });
    const rustMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.9,
      metalness: 0.3
    });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 4.8), metalMat);
    chassis.position.set(0, 0.8, 0);
    chassis.rotation.x = 0.15;
    chassis.rotation.z = -0.12;
    carGroup.add(chassis);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 1.8), rustMat);
    hood.position.set(0, 0.7, 2.2);
    hood.rotation.x = -0.3;
    carGroup.add(hood);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 2.4), metalMat);
    roof.position.set(0, 1.6, -0.4);
    carGroup.add(roof);

    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
    const wheelPositions = [
      [-1.2, 0.45, 1.5],
      [1.2, 0.35, 1.4],
      [-1.2, 0.55, -1.6],
      [1.2, 0.5, -1.5]
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, wy, wz);
      carGroup.add(w);
    });

    const hazardLight = new THREE.PointLight(0xf59e0b, 2.2, 16);
    hazardLight.position.set(0, 1.4, 0.6);
    carGroup.add(hazardLight);

    const smokeGeo = new THREE.SphereGeometry(0.7, 8, 8);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x78716c, transparent: true, opacity: 0.35 });
    const smoke = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.set(0.3, 1.5, 2.5);
    carGroup.add(smoke);

    this.interiorGroup.add(carGroup);
    this.addBoxCollider(localX, localZ, 1.6, 2.8);
    this.carWreckagePosition = {
      x: this.worldOffsetX + localX,
      z: this.worldOffsetZ + localZ
    };
  }

  /**
   * Builds an illuminated 3D Labyrinth Map Stand right at the starting plaza
   * showing the exact 19x19 maze corridors, 20 machines, prison cage, and north exit!
   */
  private buildMazeStartMapBoard(localX: number, localZ: number): void {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 768;
    this.startMapCanvas = canvas;

    const mapTex = new THREE.CanvasTexture(canvas);
    mapTex.colorSpace = THREE.SRGBColorSpace;
    this.startMapTexture = mapTex;

    this.refreshMazeMapTexture();

    const standGroup = new THREE.Group();
    standGroup.position.set(localX, 0, localZ);
    // Face toward the player spawn at (0, -61) looking South-West
    standGroup.rotation.y = Math.PI * 0.82;

    const woodMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getWood(),
      roughness: 0.78
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.7,
      roughness: 0.3
    });

    // Two sturdy support posts
    const postGeo = new THREE.BoxGeometry(0.18, 2.9, 0.18);
    const leftPost = new THREE.Mesh(postGeo, woodMat);
    leftPost.position.set(-1.35, 1.45, 0);
    standGroup.add(leftPost);

    const rightPost = new THREE.Mesh(postGeo, woodMat);
    rightPost.position.set(1.35, 1.45, 0);
    standGroup.add(rightPost);

    // Backing wooden frame
    const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(2.86, 2.76, 0.14), woodMat);
    boardFrame.position.set(0, 1.85, 0);
    standGroup.add(boardFrame);

    // Self-lit map canvas face (fog: false on border glow so players immediately spot it at spawn)
    const mapFace = new THREE.Mesh(
      new THREE.PlaneGeometry(2.58, 2.58),
      new THREE.MeshBasicMaterial({ map: mapTex })
    );
    mapFace.position.set(0, 1.85, 0.08);
    standGroup.add(mapFace);

    // Overhead glowing circus lamp bar illuminating the map stand
    const lampHood = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.38), goldMat);
    lampHood.position.set(0, 3.25, 0.2);
    standGroup.add(lampHood);

    const lampBulb = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.08, 0.16),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, fog: false })
    );
    lampBulb.position.set(0, 3.16, 0.25);
    standGroup.add(lampBulb);

    this.interiorGroup.add(standGroup);
    this.addBoxCollider(localX, localZ, 0.9, 0.5);
    this.startMapBoardPosition = {
      x: this.worldOffsetX + localX,
      z: this.worldOffsetZ + localZ
    };
  }

  /**
   * Redraws the 19x19 Labyrinth Map Canvas & updates the 3D Map Stand texture + Inspect Data URL:
   * - Completed machines -> Round GREEN dots (#10b981)
   * - Incomplete machines -> Round RED dots (#ef4444)
   */
  public refreshMazeMapTexture(): void {
    const canvas = this.startMapCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Blueprint dark carnival background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 768, 768);

    // Outer crimson/gold frame
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 10;
    ctx.strokeRect(12, 12, 744, 744);

    // Header Banner
    ctx.fillStyle = '#1e1b2e';
    ctx.fillRect(22, 22, 724, 66);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PETA LABIRIN JESTY (19x19)', 384, 65);

    const mapPadX = 84;
    const mapPadY = 104;
    const mapSize = 600;
    const cellPx = mapSize / this.gridCols;

    ctx.fillStyle = '#111827';
    ctx.fillRect(mapPadX, mapPadY, mapSize, mapSize);

    const drawCellTint = (c: number, r: number, color: string) => {
      const px = mapPadX + c * cellPx;
      const py = mapPadY + (this.gridRows - 1 - r) * cellPx;
      ctx.fillStyle = color;
      ctx.fillRect(px + 1, py + 1, cellPx - 2, cellPx - 2);
    };

    for (let r = 0; r <= 2; r++) {
      for (let c = 8; c <= 10; c++) drawCellTint(c, r, 'rgba(6, 182, 212, 0.14)');
    }
    for (let r = 6; r <= 8; r++) {
      for (let c = 8; c <= 10; c++) drawCellTint(c, r, 'rgba(239, 68, 68, 0.14)');
    }
    for (let r = 16; r <= 18; r++) {
      for (let c = 8; c <= 10; c++) drawCellTint(c, r, 'rgba(16, 185, 129, 0.18)');
    }

    // Draw exact 19x19 maze walls
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'square';
    ctx.beginPath();
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const cell = this.cells[r][c];
        const px = mapPadX + c * cellPx;
        const py = mapPadY + (this.gridRows - 1 - r) * cellPx;
        if (cell.walls.north) {
          ctx.moveTo(px, py + cellPx);
          ctx.lineTo(px + cellPx, py + cellPx);
        }
        if (cell.walls.south && !(r === this.gridRows - 1 && c === 9)) {
          ctx.moveTo(px, py);
          ctx.lineTo(px + cellPx, py);
        }
        if (cell.walls.west) {
          ctx.moveTo(px, py);
          ctx.lineTo(px, py + cellPx);
        }
        if (cell.walls.east) {
          ctx.moveTo(px + cellPx, py);
          ctx.lineTo(px + cellPx, py + cellPx);
        }
      }
    }
    ctx.stroke();

    // Plot all 20 Machines: GREEN circle when completed (fixed), RED circle when uncompleted!
    this.mazeMachines.forEach((m) => {
      const cell = this.worldToCell(m.x, m.z);
      const cx = mapPadX + (cell.c + 0.5) * cellPx;
      const cy = mapPadY + (this.gridRows - 1 - cell.r + 0.5) * cellPx;
      ctx.fillStyle = m.fixed ? '#22c55e' : '#ef4444';
      ctx.beginPath();
      ctx.arc(cx, cy, cellPx * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = m.fixed ? '#bbf7d0' : '#fecaca';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Plot Prison Cage at (9, 7)
    {
      const px = mapPadX + (9 + 0.5) * cellPx;
      const py = mapPadY + (this.gridRows - 1 - 7 + 0.5) * cellPx;
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(px - cellPx * 0.36, py - cellPx * 0.36, cellPx * 0.72, cellPx * 0.72);
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px - cellPx * 0.36, py - cellPx * 0.36, cellPx * 0.72, cellPx * 0.72);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('SEL', px, py + 4);
    }

    // Plot Player Start at (9, 1)
    {
      const sx = mapPadX + (9 + 0.5) * cellPx;
      const sy = mapPadY + (this.gridRows - 1 - 1 + 0.5) * cellPx;
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(sx, sy, cellPx * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#083344';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('YOU', sx, sy + 4);
    }

    // Plot Grand Exit Door at (9, 18) top
    {
      const ex = mapPadX + (9 + 0.5) * cellPx;
      const ey = mapPadY + 0.4 * cellPx;
      ctx.fillStyle = '#10b981';
      ctx.fillRect(ex - cellPx * 0.55, ey - 10, cellPx * 1.1, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('EXIT', ex, ey + 5);
    }

    // Compass N/S
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('▲ UTARA (EXIT) ▲', 384, 98);

    // Legend Footer
    ctx.fillStyle = '#111827';
    ctx.fillRect(22, 712, 724, 38);
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('🔵 START   🟢 SELESAI   🔴 BELUM   🟥 PENJARA   🟩 EXIT', 384, 737);

    if (this.startMapTexture) {
      this.startMapTexture.needsUpdate = true;
    }
    this.startMapCanvasDataUrl = canvas.toDataURL();
  }

  /**
   * Builds the Grand Golden Exit Door (Pintu Keluar Sirkus) at the end of the maze
   */
  private buildGrandExitDoor(localX: number, localZ: number): void {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(localX, 0, localZ);

    const archMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.7, metalness: 0.5 });
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 5.8, 1.0), archMat);
    leftPillar.position.set(-3.2, 2.9, 0);
    doorGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 5.8, 1.0), archMat);
    rightPillar.position.set(3.2, 2.9, 0);
    doorGroup.add(rightPillar);

    const topLintel = new THREE.Mesh(new THREE.BoxGeometry(7.4, 1.2, 1.2), archMat);
    topLintel.position.set(0, 5.5, 0);
    doorGroup.add(topLintel);

    const signGeo = new THREE.BoxGeometry(4.8, 1.1, 0.3);
    const signMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 4.3, -0.5);
    doorGroup.add(sign);

    const exitLight = new THREE.PointLight(0x10b981, 3.8, 26);
    exitLight.position.set(0, 4.3, -1.6);
    doorGroup.add(exitLight);

    const doorTex = ProceduralTextures.getWood();
    const doorMat = new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.8 });
    const doorLeafGeo = new THREE.BoxGeometry(2.6, 4.6, 0.25);

    const leftLeaf = new THREE.Mesh(doorLeafGeo, doorMat);
    leftLeaf.position.set(-1.35, 2.3, 0);
    doorGroup.add(leftLeaf);

    const rightLeaf = new THREE.Mesh(doorLeafGeo, doorMat);
    rightLeaf.position.set(1.35, 2.3, 0);
    doorGroup.add(rightLeaf);

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), goldMat);
    lock.position.set(0, 2.2, -0.3);
    doorGroup.add(lock);

    const sunBeam = new THREE.SpotLight(0xfff5cc, 0, 50, Math.PI / 3, 0.2, 1.0);
    sunBeam.position.set(0, 3.5, -4);
    sunBeam.target.position.set(0, 0, -25);
    doorGroup.add(sunBeam);
    doorGroup.add(sunBeam.target);
    this.exitSunBeam = sunBeam;

    // Pre-allocated X-Ray Exit Door Highlight Beacon (toggled visible when 20/20 machines fixed, ZERO runtime shader hitches)
    const hlGroup = new THREE.Group();
    hlGroup.visible = false;

    const outerBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 2.0, 60, 14),
      new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.42,
        depthTest: false,
        fog: false,
        side: THREE.DoubleSide
      })
    );
    outerBeam.position.set(0, 24, 0);
    outerBeam.renderOrder = 999;
    hlGroup.add(outerBeam);

    const innerBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.65, 60, 12),
      new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.78,
        depthTest: false,
        fog: false
      })
    );
    innerBeam.position.set(0, 24, 0);
    innerBeam.renderOrder = 999;
    hlGroup.add(innerBeam);

    const haloRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.22, 8, 28),
      new THREE.MeshBasicMaterial({
        color: 0x34d399,
        depthTest: false,
        fog: false
      })
    );
    haloRing.position.set(0, 7.2, 0);
    haloRing.renderOrder = 999;
    hlGroup.add(haloRing);
    this.exitHighlightRing = haloRing;

    doorGroup.add(hlGroup);
    this.exitHighlightGroup = hlGroup;

    this.exitDoorMesh = doorGroup;
    this.exitDoorPosition = {
      x: this.worldOffsetX + localX,
      z: this.worldOffsetZ + localZ
    };
    this.interiorGroup.add(doorGroup);
  }

  public openExitDoor(): void {
    if (!this.exitDoorMesh || this.exitDoorOpened) return;
    this.exitDoorOpened = true;

    const leftLeaf = this.exitDoorMesh.children.find(c => c.position.x < 0 && c.position.y < 3);
    const rightLeaf = this.exitDoorMesh.children.find(c => c.position.x > 0 && c.position.y < 3);
    if (leftLeaf) leftLeaf.rotation.y = -Math.PI / 2.2;
    if (rightLeaf) rightLeaf.rotation.y = Math.PI / 2.2;

    if (this.exitSunBeam) {
      this.exitSunBeam.intensity = 8.0;
    }
    if (this.exitHighlightGroup) {
      this.exitHighlightGroup.visible = true;
    }
    this.mazeInfernoGroup.visible = true;
  }

  /**
   * Builds 8 Carnival Hiding Lockers placed safely in alcoves (world coords exposed)
   */
  private buildMazeLockers(): void {
    const woodTex = ProceduralTextures.getWood();
    const lockerMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.7 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.6, metalness: 0.4 });

    const lockerLocations = [
      { x: -32, z: -40, rot: 0, name: 'Lemari Lorong Barat Daya' },
      { x: 32, z: -40, rot: Math.PI, name: 'Lemari Lorong Tenggara' },
      { x: -48, z: 0, rot: Math.PI / 2, name: 'Lemari Sayap Barat' },
      { x: 48, z: 8, rot: -Math.PI / 2, name: 'Lemari Sayap Timur' },
      { x: -24, z: 32, rot: 0, name: 'Lemari Tikungan Barat Laut' },
      { x: 24, z: 40, rot: Math.PI, name: 'Lemari Lorong Timur Laut' },
      { x: 0, z: 24, rot: 0, name: 'Lemari Koridor Tengah' },
      { x: -16, z: 56, rot: Math.PI / 2, name: 'Lemari Dekat Area Exit' }
    ];

    lockerLocations.forEach((loc, idx) => {
      const g = new THREE.Group();
      g.position.set(loc.x, 0, loc.z);
      g.rotation.y = loc.rot;

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.6, 1.0), lockerMat);
      body.position.y = 1.3;
      body.castShadow = true;
      g.add(body);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.28, 2.68, 0.1), frameMat);
      frame.position.set(0, 1.3, 0.48);
      g.add(frame);

      for (let i = 0; i < 4; i++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.04), frameMat);
        slat.position.set(0, 1.8 + i * 0.14, 0.52);
        g.add(slat);
      }

      this.interiorGroup.add(g);
      this.addBoxCollider(loc.x, loc.z, 0.75, 0.75);
      this.lockers.push({
        id: idx + 1,
        x: this.worldOffsetX + loc.x,
        z: this.worldOffsetZ + loc.z,
        rotationY: loc.rot,
        isOccupied: false
      });
    });
  }

  private createCorridorLantern(localX: number, localZ: number, addPointLight: boolean = false): void {
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(localX, 4.1, localZ);

    const postMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9), postMat);
    lanternGroup.add(post);

    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfdba74 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), bulbMat);
    bulb.position.y = -0.5;
    lanternGroup.add(bulb);

    if (addPointLight) {
      const light = new THREE.PointLight(0xff9f43, 1.05, 16.0, 1.4);
      light.position.y = -0.5;
      lanternGroup.add(light);
    }

    this.interiorGroup.add(lanternGroup);
  }

  private createExitSignArrow(localX: number, localZ: number): void {
    const signGeo = new THREE.PlaneGeometry(1.4, 0.6);
    const signMat = new THREE.MeshBasicMaterial({ color: 0x059669, side: THREE.DoubleSide });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(localX, 2.2, localZ + 3.45);
    sign.rotation.y = Math.PI;
    this.interiorGroup.add(sign);
  }

  /**
   * Builds the Circus Prison Cage (Kurungan Penjara Sirkus) inside the cleared 3x3 Plaza.
   * Front door faces +Z into wide-open courtyard so opening the gate ALWAYS lets the player walk right out!
   */
  public buildPrisonCage(localX: number, localZ: number): void {
    const cage = new THREE.Group();
    cage.position.set(localX, 0, localZ);

    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      metalness: 0.9,
      roughness: 0.4
    });
    const rustMat = new THREE.MeshStandardMaterial({
      color: 0x7c2d12,
      metalness: 0.6,
      roughness: 0.7
    });

    const w = 5.0;
    const h = 3.6;
    const d = 5.0;

    const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, d), rustMat);
    base.position.y = 0.12;
    cage.add(base);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, d), rustMat);
    roof.position.y = h;
    cage.add(roof);

    const cornerGeo = new THREE.BoxGeometry(0.22, h, 0.22);
    [
      [-w / 2 + 0.1, -d / 2 + 0.1],
      [w / 2 - 0.1, -d / 2 + 0.1],
      [-w / 2 + 0.1, d / 2 - 0.1],
      [w / 2 - 0.1, d / 2 - 0.1]
    ].forEach(([cx, cz]) => {
      const p = new THREE.Mesh(cornerGeo, ironMat);
      p.position.set(cx, h / 2, cz);
      cage.add(p);
    });

    const barGeo = new THREE.CylinderGeometry(0.045, 0.045, h - 0.2, 8);
    const barSpacing = 0.44;

    // Back wall bars
    for (let bx = -w / 2 + 0.35; bx <= w / 2 - 0.35; bx += barSpacing) {
      const b = new THREE.Mesh(barGeo, ironMat);
      b.position.set(bx, h / 2, -d / 2 + 0.1);
      cage.add(b);
    }
    // Left & Right wall bars
    for (let bz = -d / 2 + 0.35; bz <= d / 2 - 0.35; bz += barSpacing) {
      const bl = new THREE.Mesh(barGeo, ironMat);
      bl.position.set(-w / 2 + 0.1, h / 2, bz);
      cage.add(bl);

      const br = new THREE.Mesh(barGeo, ironMat);
      br.position.set(w / 2 - 0.1, h / 2, bz);
      cage.add(br);
    }

    // Front fixed side bars (leaving 2.0m center door opening [-1.0, +1.0])
    for (let bx = -w / 2 + 0.35; bx <= w / 2 - 0.35; bx += barSpacing) {
      if (Math.abs(bx) < 0.98) continue;
      const b = new THREE.Mesh(barGeo, ironMat);
      b.position.set(bx, h / 2, d / 2 - 0.1);
      cage.add(b);
    }

    // Hinged swinging Iron Gate in the front opening (pivoted on left post x = -0.95)
    const gatePivot = new THREE.Group();
    gatePivot.position.set(-0.95, 0, d / 2 - 0.1);
    for (let gx = 0.25; gx <= 1.75; gx += 0.38) {
      const gb = new THREE.Mesh(barGeo, ironMat);
      gb.position.set(gx, h / 2, 0);
      gatePivot.add(gb);
    }
    const crossBar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.14, 0.14), ironMat);
    crossBar.position.set(0.95, 1.7, 0);
    gatePivot.add(crossBar);

    const lockMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.3), lockMat);
    lock.position.set(1.75, 1.6, 0.15);
    gatePivot.add(lock);

    cage.add(gatePivot);
    this.prisonGatePivot = gatePivot;

    // Ominous cold light from inside cage
    const cageLight = new THREE.PointLight(0x0284c7, 1.5, 10);
    cageLight.position.set(0, 2.5, 0);
    cage.add(cageLight);

    this.prisonCageMesh = cage;
    this.prisonCagePosition = {
      x: this.worldOffsetX + localX,
      z: this.worldOffsetZ + localZ
    };
    this.prisonDropOffPosition = {
      x: this.worldOffsetX + localX,
      z: this.worldOffsetZ + localZ + d / 2 + 2.3
    };
    this.interiorGroup.add(cage);

    // Solid colliders on back, left, right, and front pillars so Jesty NEVER clips through prison bars!
    this.addBoxCollider(localX - w / 2, localZ, 0.45, d / 2);
    this.addBoxCollider(localX + w / 2, localZ, 0.45, d / 2);
    this.addBoxCollider(localX, localZ - d / 2, w / 2, 0.45);
    this.addBoxCollider(localX - 1.75, localZ + d / 2, 0.8, 0.45);
    this.addBoxCollider(localX + 1.75, localZ + d / 2, 0.8, 0.45);

    this.setPrisonGateOpen(false);
  }

  /**
   * Swings the physical prison cage gate open or closed
   */
  public setPrisonGateOpen(open: boolean): void {
    this.prisonGateClosed = !open;
    if (this.prisonGatePivot) {
      this.prisonGatePivot.rotation.y = open ? -Math.PI * 0.65 : 0;
    }
  }

  /**
   * Pre-allocates raging 3D Inferno Flames across maze corridors (activated on 20/20 escape, ZERO PointLights!)
   */
  private buildInfernoFires(): void {
    this.mazeInfernoGroup.visible = false;
    this.flameMeshes = [];

    const outerFlameGeo = new THREE.ConeGeometry(0.85, 2.5, 6);
    const innerFlameGeo = new THREE.ConeGeometry(0.45, 1.75, 5);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0.85,
      fog: false
    });
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.92,
      fog: false
    });

    // Scatter 46 roaring fire clusters along wall edges and intersections across the 19x19 maze
    for (let i = 0; i < 46; i++) {
      const c = (i * 5 + 1) % this.gridCols;
      const r = (i * 7 + 1) % this.gridRows;
      // Offset toward corridor edge so player doesn't get camera-blocked in center
      const offsetSide = (i % 2 === 0 ? 1 : -1) * 2.5;
      const localX = (c + 0.5) * this.cellSize - this.halfWidth + offsetSide;
      const localZ = (r + 0.5) * this.cellSize - this.halfWidth + ((i % 3) - 1) * 2.1;

      const outerFlame = new THREE.Mesh(outerFlameGeo, outerMat);
      outerFlame.position.set(localX, 1.25, localZ);
      this.mazeInfernoGroup.add(outerFlame);
      this.flameMeshes.push({ mesh: outerFlame, phase: i * 0.7, baseY: 1.25 });

      const innerFlame = new THREE.Mesh(innerFlameGeo, innerMat);
      innerFlame.position.set(localX, 0.9, localZ);
      this.mazeInfernoGroup.add(innerFlame);
      this.flameMeshes.push({ mesh: innerFlame, phase: i * 0.7 + 1.2, baseY: 0.9 });
    }

    // Extra twin inferno braziers flanking the Grand Golden Exit Gate!
    [-4.5, 4.5].forEach((fx, idx) => {
      const localZ = this.halfWidth - 4.0;
      const outerFlame = new THREE.Mesh(outerFlameGeo, outerMat);
      outerFlame.position.set(fx, 1.6, localZ);
      outerFlame.scale.set(1.4, 1.6, 1.4);
      this.mazeInfernoGroup.add(outerFlame);
      this.flameMeshes.push({ mesh: outerFlame, phase: idx * 1.5, baseY: 1.6 });
    });

    this.interiorGroup.add(this.mazeInfernoGroup);
  }

  /**
   * Builds 20 Scattered Circus Power Machines across open maze corridors (Zero PointLights = Zero shader lag!)
   */
  public build20Machines(): void {
    const machineCells: { id: number; name: string; c: number; r: number }[] = [
      { id: 1, name: 'Mesin Selatan Barat 1', c: 2, r: 2 },
      { id: 2, name: 'Mesin Selatan Dalam 2', c: 6, r: 2 },
      { id: 3, name: 'Mesin Selatan Timur 3', c: 12, r: 2 },
      { id: 4, name: 'Mesin Pojok Tenggara 4', c: 16, r: 2 },
      { id: 5, name: 'Mesin Sayap Barat Bawah 5', c: 1, r: 5 },
      { id: 6, name: 'Mesin Lorong Tengah Barat 6', c: 5, r: 5 },
      { id: 7, name: 'Mesin Lorong Tengah Timur 7', c: 13, r: 5 },
      { id: 8, name: 'Mesin Sayap Timur Bawah 8', c: 17, r: 5 },
      { id: 9, name: 'Mesin Tepi Barat 9', c: 2, r: 9 },
      { id: 10, name: 'Mesin Dekat Penjara Barat 10', c: 6, r: 9 },
      { id: 11, name: 'Mesin Dekat Penjara Timur 11', c: 12, r: 9 },
      { id: 12, name: 'Mesin Tepi Timur 12', c: 16, r: 9 },
      { id: 13, name: 'Mesin Sayap Barat Atas 13', c: 1, r: 13 },
      { id: 14, name: 'Mesin Koridor Barat Laut 14', c: 5, r: 13 },
      { id: 15, name: 'Mesin Koridor Timur Laut 15', c: 13, r: 13 },
      { id: 16, name: 'Mesin Sayap Timur Atas 16', c: 17, r: 13 },
      { id: 17, name: 'Mesin Sektor Utara Barat 17', c: 3, r: 16 },
      { id: 18, name: 'Mesin Dekat Exit Barat 18', c: 7, r: 16 },
      { id: 19, name: 'Mesin Dekat Exit Timur 19', c: 11, r: 16 },
      { id: 20, name: 'Mesin Sektor Utara Timur 20', c: 15, r: 16 }
    ];

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      metalness: 0.75,
      roughness: 0.45
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.85,
      roughness: 0.25
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      roughness: 0.65
    });

    this.mazeMachines = [];
    this.machineVisuals = [];

    machineCells.forEach((coord) => {
      const localX = (coord.c + 0.5) * this.cellSize - this.halfWidth;
      const localZ = (coord.r + 0.5) * this.cellSize - this.halfWidth;

      const machineGroup = new THREE.Group();
      machineGroup.position.set(localX, 0, localZ);

      // Generator metal cabinet
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.4, 1.05), bodyMat);
      cabinet.position.y = 0.7;
      cabinet.castShadow = true;
      machineGroup.add(cabinet);

      // Red carnival side plates
      const plate = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.45, 0.9), trimMat);
      plate.position.y = 0.7;
      machineGroup.add(plate);

      // Copper turbine coils
      for (let t = -0.35; t <= 0.35; t += 0.35) {
        const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.5, 10), brassMat);
        coil.position.set(t, 1.55, -0.2);
        machineGroup.add(coil);
      }

      // Rotating brass flywheel gear on top
      const gear = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 8, 14), brassMat);
      gear.position.set(0, 1.72, 0.25);
      machineGroup.add(gear);

      // Status Beacon Bulb (MeshBasicMaterial: Red -> Amber -> Emerald Green! ZERO PointLights!)
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444, fog: false });
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), beaconMat);
      beacon.position.set(0, 2.25, 0);
      machineGroup.add(beacon);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.75, 8), bodyMat);
      post.position.set(0, 1.82, 0);
      machineGroup.add(post);

      // Unlit glowing floor indicator halo ring
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.12, 24), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.04;
      machineGroup.add(ring);

      this.interiorGroup.add(machineGroup);
      this.addBoxCollider(localX, localZ, 0.68, 0.56);

      this.machineVisuals.push({ group: machineGroup, gear, beacon, ring });
      this.mazeMachines.push({
        id: coord.id,
        name: coord.name,
        x: this.worldOffsetX + localX,
        y: 1.0,
        z: this.worldOffsetZ + localZ,
        progress: 0,
        fixed: false,
        fixedBy: null,
        malfunctionFlashTimer: 0
      });
    });
  }

  /**
   * Resets Maze Machines, Exit Door, Inferno Fires, and Prison Gate cleanly for a new run
   */
  public resetMazeRun(): void {
    this.exitDoorOpened = false;
    if (this.exitSunBeam) {
      this.exitSunBeam.intensity = 0;
    }
    if (this.exitHighlightGroup) {
      this.exitHighlightGroup.visible = false;
    }
    this.mazeInfernoGroup.visible = false;
    this.setPrisonGateOpen(false);
    if (this.exitDoorMesh) {
      const leftLeaf = this.exitDoorMesh.children.find(c => c.position.x < 0 && c.position.y < 3);
      const rightLeaf = this.exitDoorMesh.children.find(c => c.position.x > 0 && c.position.y < 3);
      if (leftLeaf) leftLeaf.rotation.y = 0;
      if (rightLeaf) rightLeaf.rotation.y = 0;
    }

    this.mazeMachines.forEach((m, idx) => {
      m.progress = 0;
      m.fixed = false;
      m.fixedBy = null;
      m.malfunctionFlashTimer = 0;
      const vis = this.machineVisuals[idx];
      if (vis) {
        (vis.beacon.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
        (vis.ring.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
      }
    });
    this.refreshMazeMapTexture();
  }

  /**
   * Animates machine gears, status indicator beacons, malfunction flashes, exit highlight & roaring inferno flames
   */
  public update(delta: number, elapsed: number): void {
    this.mazeMachines.forEach((m, idx) => {
      const vis = this.machineVisuals[idx];
      if (!vis) return;

      if (m.malfunctionFlashTimer > 0) {
        m.malfunctionFlashTimer = Math.max(0, m.malfunctionFlashTimer - delta);
      }

      const beaconMat = vis.beacon.material as THREE.MeshBasicMaterial;
      const ringMat = vis.ring.material as THREE.MeshBasicMaterial;

      if (m.fixed) {
        vis.gear.rotation.z += delta * 6.0;
        beaconMat.color.setHex(0x10b981);
        ringMat.color.setHex(0x10b981);
        vis.beacon.scale.setScalar(1.0);
      } else if (m.malfunctionFlashTimer > 0) {
        // Rapidly flashing orange-red spark alert!
        const flashOn = Math.floor(elapsed * 14) % 2 === 0;
        beaconMat.color.setHex(flashOn ? 0xfef08a : 0xff0000);
        ringMat.color.setHex(flashOn ? 0xf59e0b : 0xef4444);
        vis.beacon.scale.setScalar(flashOn ? 1.5 : 0.9);
      } else if (m.progress > 0) {
        vis.gear.rotation.z += delta * 2.5;
        beaconMat.color.setHex(0xf59e0b);
        ringMat.color.setHex(0xf59e0b);
        vis.beacon.scale.setScalar(1.0 + Math.sin(elapsed * 6 + idx) * 0.12);
      } else {
        beaconMat.color.setHex(0xef4444);
        ringMat.color.setHex(0xef4444);
        vis.beacon.scale.setScalar(0.95 + Math.sin(elapsed * 3 + idx) * 0.1);
      }
    });

    if (this.exitDoorOpened) {
      if (this.exitHighlightRing) {
        this.exitHighlightRing.rotation.y += delta * 2.5;
        this.exitHighlightRing.position.y = 7.2 + Math.sin(elapsed * 4.0) * 0.6;
      }
      if (this.mazeInfernoGroup.visible) {
        for (let i = 0; i < this.flameMeshes.length; i++) {
          const f = this.flameMeshes[i];
          const flicker = 0.8 + Math.sin(elapsed * 15 + f.phase) * 0.35 + Math.cos(elapsed * 9 + f.phase) * 0.15;
          f.mesh.scale.y = Math.max(0.4, flicker);
          f.mesh.rotation.y = elapsed * 2.2 + f.phase;
          f.mesh.position.y = f.baseY * f.mesh.scale.y;
        }
      }
    }
  }

  public completeMachine(machineId: number, fixer: 'PLAYER' | string): boolean {
    const machine = this.mazeMachines.find(m => m.id === machineId);
    if (!machine || machine.fixed) return false;
    machine.progress = 100;
    machine.fixed = true;
    machine.fixedBy = fixer;
    machine.malfunctionFlashTimer = 0;
    this.refreshMazeMapTexture();
    return true;
  }

  /**
   * Returns spread-out Maze spawn positions away from the crashed car, including mid-range wings so players encounter bots!
   */
  public getScatteredBotSpawnPositions(count: number): { x: number; z: number }[] {
    const spreadCells: [number, number][] = [
      [5, 4],   // Medium-distance South-West wing
      [13, 4],  // Medium-distance South-East wing
      [6, 8],   // Central Prison Courtyard West flank
      [12, 8],  // Central Prison Courtyard East flank
      [2, 5],   // Far West-South corridor
      [16, 5],  // Far East-South corridor
      [1, 10],  // West mid wing
      [17, 10], // East mid wing
      [4, 14],  // North-West maze wing
      [14, 14], // North-East maze wing
      [3, 7],   // West courtyard corridor
      [15, 7],  // East courtyard corridor
      [9, 13],  // North central corridor
      [2, 16],  // Deep North-West
      [16, 16], // Deep North-East
      [9, 16]   // Near North Exit plaza
    ];

    const positions: { x: number; z: number }[] = [];
    for (let i = 0; i < count; i++) {
      const [c, r] = spreadCells[i % spreadCells.length];
      positions.push(this.cellToWorld(c, r));
    }
    return positions;
  }

  /**
   * Returns a guaranteed collision-free open cell center in the North-Central Maze Plaza for Jesty's spawn
   * (never on cell-boundary walls like localZ = 20 or inside props/lockers).
   */
  public getSafeJestySpawnPosition(): { x: number; z: number } {
    const candidates: [number, number][] = [
      [9, 16], // Center of guaranteed open 3x3 North Plaza (0, +56 local)
      [8, 16],
      [10, 16],
      [9, 17],
      [9, 14],
      [9, 13],
      [8, 14],
      [10, 14]
    ];
    for (const [c, r] of candidates) {
      const wp = this.cellToWorld(c, r);
      if (!this.checkCollision(wp.x, wp.z, 0.9)) {
        return wp;
      }
    }
    return this.cellToWorld(9, 16);
  }

  public worldToCell(worldX: number, worldZ: number): { c: number; r: number } {
    const localX = worldX - this.worldOffsetX;
    const localZ = worldZ - this.worldOffsetZ;
    const c = Math.max(0, Math.min(this.gridCols - 1, Math.floor((localX + this.halfWidth) / this.cellSize)));
    const r = Math.max(0, Math.min(this.gridRows - 1, Math.floor((localZ + this.halfWidth) / this.cellSize)));
    return { c, r };
  }

  public cellToWorld(c: number, r: number): { x: number; z: number } {
    const localX = (c + 0.5) * this.cellSize - this.halfWidth;
    const localZ = (r + 0.5) * this.cellSize - this.halfWidth;
    return {
      x: this.worldOffsetX + localX,
      z: this.worldOffsetZ + localZ
    };
  }

  private isBlockedBfsCell(c: number, r: number, startC: number, startR: number, goalC: number, goalR: number): boolean {
    // Solid Prison Cage sits centered inside cell (9, 7); route around it via courtyard unless starting/ending there
    if (c === 9 && r === 7 && !(startC === 9 && startR === 7) && !(goalC === 9 && goalR === 7)) {
      return true;
    }
    return false;
  }

  /**
   * 19x19 Grid BFS Shortest-Path Solver (Zero allocations, < 0.05ms per query!)
   * Keeps Jesty and Companion Bots cleanly navigating inside open corridors instead of walking through walls!
   */
  public findNextPathStep(fromWorldX: number, fromWorldZ: number, toWorldX: number, toWorldZ: number): { x: number; z: number } {
    const start = this.worldToCell(fromWorldX, fromWorldZ);
    const goal = this.worldToCell(toWorldX, toWorldZ);

    if (start.c === goal.c && start.r === goal.r) {
      return { x: toWorldX, z: toWorldZ };
    }

    const cols = this.gridCols;
    const rows = this.gridRows;
    const startIdx = start.r * cols + start.c;
    const goalIdx = goal.r * cols + goal.c;

    this.bfsVisited.fill(0);
    this.bfsParent.fill(-1);

    let head = 0;
    let tail = 0;
    this.bfsQueue[tail++] = startIdx;
    this.bfsVisited[startIdx] = 1;

    let found = false;
    while (head < tail) {
      const curr = this.bfsQueue[head++];
      if (curr === goalIdx) {
        found = true;
        break;
      }

      const cr = Math.floor(curr / cols);
      const cc = curr % cols;
      const cell = this.cells[cr][cc];

      // North (r - 1)
      if (!cell.walls.north && cr > 0 && !this.isBlockedBfsCell(cc, cr - 1, start.c, start.r, goal.c, goal.r)) {
        const nextIdx = (cr - 1) * cols + cc;
        if (!this.bfsVisited[nextIdx]) {
          this.bfsVisited[nextIdx] = 1;
          this.bfsParent[nextIdx] = curr;
          this.bfsQueue[tail++] = nextIdx;
        }
      }
      // South (r + 1)
      if (!cell.walls.south && cr < rows - 1 && !this.isBlockedBfsCell(cc, cr + 1, start.c, start.r, goal.c, goal.r)) {
        const nextIdx = (cr + 1) * cols + cc;
        if (!this.bfsVisited[nextIdx]) {
          this.bfsVisited[nextIdx] = 1;
          this.bfsParent[nextIdx] = curr;
          this.bfsQueue[tail++] = nextIdx;
        }
      }
      // West (c - 1)
      if (!cell.walls.west && cc > 0 && !this.isBlockedBfsCell(cc - 1, cr, start.c, start.r, goal.c, goal.r)) {
        const nextIdx = cr * cols + (cc - 1);
        if (!this.bfsVisited[nextIdx]) {
          this.bfsVisited[nextIdx] = 1;
          this.bfsParent[nextIdx] = curr;
          this.bfsQueue[tail++] = nextIdx;
        }
      }
      // East (c + 1)
      if (!cell.walls.east && cc < cols - 1 && !this.isBlockedBfsCell(cc + 1, cr, start.c, start.r, goal.c, goal.r)) {
        const nextIdx = cr * cols + (cc + 1);
        if (!this.bfsVisited[nextIdx]) {
          this.bfsVisited[nextIdx] = 1;
          this.bfsParent[nextIdx] = curr;
          this.bfsQueue[tail++] = nextIdx;
        }
      }
    }

    if (!found) {
      return this.cellToWorld(start.c, start.r);
    }

    // Trace back from goal to find the immediate next cell after start
    let step = goalIdx;
    while (this.bfsParent[step] !== -1 && this.bfsParent[step] !== startIdx) {
      step = this.bfsParent[step];
    }

    const nextR = Math.floor(step / cols);
    const nextC = step % cols;
    return this.cellToWorld(nextC, nextR);
  }

  /**
   * Computes full ordered BFS corridor waypoints from start to goal
   */
  public findShortestPath(fromWorldX: number, fromWorldZ: number, toWorldX: number, toWorldZ: number): { x: number; z: number }[] {
    const start = this.worldToCell(fromWorldX, fromWorldZ);
    const goal = this.worldToCell(toWorldX, toWorldZ);

    if (start.c === goal.c && start.r === goal.r) {
      return [{ x: toWorldX, z: toWorldZ }];
    }

    const cols = this.gridCols;
    const rows = this.gridRows;
    const startIdx = start.r * cols + start.c;
    const goalIdx = goal.r * cols + goal.c;

    this.bfsVisited.fill(0);
    this.bfsParent.fill(-1);

    let head = 0;
    let tail = 0;
    this.bfsQueue[tail++] = startIdx;
    this.bfsVisited[startIdx] = 1;

    let found = false;
    while (head < tail) {
      const curr = this.bfsQueue[head++];
      if (curr === goalIdx) {
        found = true;
        break;
      }

      const cr = Math.floor(curr / cols);
      const cc = curr % cols;
      const cell = this.cells[cr][cc];

      if (!cell.walls.north && cr > 0 && !this.isBlockedBfsCell(cc, cr - 1, start.c, start.r, goal.c, goal.r)) {
        const nextIdx = (cr - 1) * cols + cc;
        if (!this.bfsVisited[nextIdx]) {
          this.bfsVisited[nextIdx] = 1;
          this.bfsParent[nextIdx] = curr;
          this.bfsQueue[tail++] = nextIdx;
        }
      }
      if (!cell.walls.south && cr < rows - 1 && !this.isBlockedBfsCell(cc, cr + 1, start.c, start.r, goal.c, goal.r)) {
        const nextIdx = (cr + 1) * cols + cc;
        if (!this.bfsVisited[nextIdx]) {
          this.bfsVisited[nextIdx] = 1;
          this.bfsParent[nextIdx] = curr;
          this.bfsQueue[tail++] = nextIdx;
        }
      }
      if (!cell.walls.west && cc > 0 && !this.isBlockedBfsCell(cc - 1, cr, start.c, start.r, goal.c, goal.r)) {
        const nextIdx = cr * cols + (cc - 1);
        if (!this.bfsVisited[nextIdx]) {
          this.bfsVisited[nextIdx] = 1;
          this.bfsParent[nextIdx] = curr;
          this.bfsQueue[tail++] = nextIdx;
        }
      }
      if (!cell.walls.east && cc < cols - 1 && !this.isBlockedBfsCell(cc + 1, cr, start.c, start.r, goal.c, goal.r)) {
        const nextIdx = cr * cols + (cc + 1);
        if (!this.bfsVisited[nextIdx]) {
          this.bfsVisited[nextIdx] = 1;
          this.bfsParent[nextIdx] = curr;
          this.bfsQueue[tail++] = nextIdx;
        }
      }
    }

    if (!found) {
      return [this.cellToWorld(start.c, start.r)];
    }

    const reversed: { x: number; z: number }[] = [{ x: toWorldX, z: toWorldZ }];
    let step = this.bfsParent[goalIdx];
    while (step !== -1 && step !== startIdx) {
      const sr = Math.floor(step / cols);
      const sc = step % cols;
      reversed.push(this.cellToWorld(sc, sr));
      step = this.bfsParent[step];
    }
    reversed.reverse();
    return reversed;
  }

  /**
   * Finds the best open corridor destination away from a threat (Jesty) using BFS reachability
   */
  public findBestFleeDestination(
    fromWorldX: number,
    fromWorldZ: number,
    threatWorldX: number,
    threatWorldZ: number
  ): { x: number; z: number } {
    const start = this.worldToCell(fromWorldX, fromWorldZ);
    const cols = this.gridCols;
    const rows = this.gridRows;
    const startIdx = start.r * cols + start.c;

    this.bfsVisited.fill(0);
    this.bfsParent.fill(0); // store BFS step depth here

    let head = 0;
    let tail = 0;
    this.bfsQueue[tail++] = startIdx;
    this.bfsVisited[startIdx] = 1;
    this.bfsParent[startIdx] = 0;

    let bestWorld = this.cellToWorld(start.c, start.r);
    let bestScore = -Infinity;

    while (head < tail) {
      const curr = this.bfsQueue[head++];
      const depth = this.bfsParent[curr];
      const cr = Math.floor(curr / cols);
      const cc = curr % cols;
      const wp = this.cellToWorld(cc, cr);
      const distFromThreat = Math.hypot(wp.x - threatWorldX, wp.z - threatWorldZ);
      const score = distFromThreat + depth * 1.4;

      if (depth >= 2 && score > bestScore) {
        bestScore = score;
        bestWorld = wp;
      }

      if (depth >= 6) continue;

      const cell = this.cells[cr][cc];
      const tryPush = (nc: number, nr: number) => {
        if (nc === 9 && nr === 7) return;
        const nIdx = nr * cols + nc;
        if (!this.bfsVisited[nIdx]) {
          this.bfsVisited[nIdx] = 1;
          this.bfsParent[nIdx] = depth + 1;
          this.bfsQueue[tail++] = nIdx;
        }
      };

      if (!cell.walls.north && cr > 0) tryPush(cc, cr - 1);
      if (!cell.walls.south && cr < rows - 1) tryPush(cc, cr + 1);
      if (!cell.walls.west && cc > 0) tryPush(cc - 1, cr);
      if (!cell.walls.east && cc < cols - 1) tryPush(cc + 1, cr);
    }

    return bestWorld;
  }

  private addBoxCollider(localX: number, localZ: number, halfW: number, halfD: number): void {
    const worldX = this.worldOffsetX + localX;
    const worldZ = this.worldOffsetZ + localZ;
    const radius = Math.max(0.55, Math.min(halfW, halfD));
    const step = radius * 1.5;
    for (let cx = -halfW + radius; cx <= halfW; cx += step) {
      for (let cz = -halfD + radius; cz <= halfD; cz += step) {
        this.colliders.push({
          x: worldX + cx,
          z: worldZ + cz,
          radius
        });
      }
    }
  }

  /**
   * Checks collision against all Maze walls, Prison Cage walls/gate, Car wreckage & Lockers (World Coords)
   */
  public checkCollision(worldX: number, worldZ: number, entityRadius: number = 0.65): boolean {
    for (const c of this.colliders) {
      const distSq = (worldX - c.x) ** 2 + (worldZ - c.z) ** 2;
      const minDist = c.radius + entityRadius;
      if (distSq < minDist * minDist) {
        return true;
      }
    }

    // Dynamic front prison cage gate collider (blocks entry/exit when closed)
    if (this.prisonGateClosed) {
      const gx = this.prisonCagePosition.x;
      const gz = this.prisonCagePosition.z + 2.4;
      if (Math.abs(worldX - gx) < 1.15 + entityRadius && Math.abs(worldZ - gz) < 0.45 + entityRadius) {
        return true;
      }
    }

    return false;
  }
}
