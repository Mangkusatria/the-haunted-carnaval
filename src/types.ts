/**
 * Types & Interfaces for Jacky's Carnival: Circus Horror
 */

export type GameStatus =
  | 'MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAMEOVER'
  | 'VICTORY'
  | 'INTERROGATION'
  | 'CAR_CUTSCENE'
  | 'MAZE_PLAYING'
  | 'MAZE_ESCAPE_CUTSCENE'
  | 'MAZE_VICTORY';

export type Language = 'id' | 'en';

export type ChapterMode = 'FAIRGROUND' | 'MAZE';

export type DeviceMode = 'PC' | 'MOBILE';

export type Difficulty = 'NORMAL' | 'NIGHTMARE' | 'CASUAL';

export interface LockerItem {
  id: number | string;
  x: number;
  z: number;
  rotationY: number;
  isOccupied: boolean;
}

export interface CollectibleBox {
  id: number;
  name: string;
  zone: string;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  collectedBy: 'PLAYER' | string | null; // Player or Bot name
  glowPhase: number;
}

export interface ObjectiveState {
  boxesTotal: number;
  boxesCollected: number;
  gateUnlocked: boolean;
  escaped: boolean;
  bloodSkyActive?: boolean;
}

export interface MazeKey {
  id: number;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  collectedBy: 'PLAYER' | string | null;
}

export interface MazeMachine {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  progress: number; // 0 to 100
  fixed: boolean;
  fixedBy: 'PLAYER' | string | null;
  malfunctionFlashTimer: number;
}

export interface MachineSkillCheckState {
  active: boolean;
  machineId: number;
  needleAngle: number; // 0..540 degrees
  zoneStartAngle: number; // degrees 0..360
  zoneSizeAngle: number; // degrees width of white target area
  speedDegPerSec: number;
  feedbackText?: string | null;
  feedbackType?: 'SUCCESS' | 'FAIL' | null;
  feedbackTimer?: number;
}

export interface MazeObjectiveState {
  keysTotal: number;
  keysCollected: number;
  machinesTotal: number;
  machinesFixed: number;
  exitUnlocked: boolean;
  escaped: boolean;
}

export type JestyState = 'PATROL' | 'STALKING' | 'CHASING' | 'CARRYING_VICTIM' | 'TAUNTING' | 'WEEPING' | 'STUNNED';

export interface JestyInfo {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  state: JestyState;
  activeMask: 'COMEDY' | 'TRAGEDY';
  maskSwapTimer: number;
  targetType: 'NONE' | 'PLAYER' | 'BOT';
  targetBotId: string | null;
  carryingVictim: 'PLAYER' | string | null;
  carryingVictimType?: 'NONE' | 'PLAYER' | 'BOT';
  carryingVictimId?: string | null;
  laughterTimer: number;
  revealedTimer?: number;
  stunTimer?: number;
}

export interface JestyTracker {
  active: boolean;
  timer: number;
  botName: string;
  x: number;
  z: number;
}

export interface PrisonCageState {
  x: number;
  z: number;
  playerImprisoned: boolean;
  imprisonedBotIds: string[];
  rescuingBotId: string | null;
  rescueProgress: number;
}

export interface WhistleState {
  cooldownTimer: number; // 20.0s cooldown
  activeRippleTime: number;
  highlightedBotId: string | null;
  highlightedBotName: string | null;
  highlightedBotDistance: number;
  highlightTimer: number; // 10.0s duration highlight on nearest companion
}

export interface BotCompanionState {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  color: string;
  health: number; // 0 to 100
  isAlive: boolean;
  state:
    | 'SEARCHING'
    | 'FOLLOWING'
    | 'FLEEING'
    | 'HIDING'
    | 'DOWNED'
    | 'BETRAYED_TARGET'
    | 'ESCAPING'
    | 'ESCAPED'
    | 'IMPRISONED'
    | 'BEING_CARRIED'
    | 'RESCUING_PLAYER'
    | 'REPAIRING';
  flashlightOn: boolean;
  currentDialog: string | null;
  dialogTimer: number;
  panicLevel: number; // 0 to 1
  boxesFound: number;
  targetX: number;
  targetZ: number;
  hideCooldown: number;
  assignedZoneName?: string;
  waypointWaitTimer?: number;
  targetMachineId?: number | null;
  botSkillCheckTimer?: number;
}

export interface PlayerStats {
  health: number; // 0 to 100
  stamina: number; // 0 to 100
  isSprinting: boolean;
  isCrouching: boolean;
  isHiding: boolean;
  flashlightOn: boolean;
  flashlightBattery: number; // 0 to 100
  x: number;
  y: number;
  z: number;
  rotationY: number;
  graceTimer: number; // Invulnerability seconds after interrogation
  isImprisoned?: boolean;
  isCarriedByJesty?: boolean;
}

export type JackyState = 'PATROL' | 'INVESTIGATING' | 'STALKING' | 'CHASING' | 'SMIRKING' | 'INTERROGATING' | 'ATTACKING' | 'BLOOD_HUNT' | 'LEAP_PREPARE' | 'LEAP_AIRBORNE' | 'LEAP_LANDING' | 'STUNNED';

export interface JackyInfo {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  state: JackyState;
  targetType: 'NONE' | 'PLAYER' | 'BOT';
  targetBotId: string | null;
  distanceToPlayer: number;
  isPoppedOut: boolean;
  crankAngle: number;
  smirkIntensity: number; // 0 to 1 for animated grin & nyengar-nyengir
  chuckleTimer: number;
  alertLevel: number; // 0 to 1
  isBloodHunt?: boolean;
  omniscientTargetName?: string | null;
  isLeaping?: boolean;
  leapTargetX?: number;
  leapTargetZ?: number;
  leapProgress?: number; // 0 to 1
  stunTimer?: number;
}

export interface CarnivalZone {
  id: string;
  nameId: string;
  nameEn: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  descriptionId: string;
  descriptionEn: string;
}

export interface InterrogationPrompt {
  targetBot: BotCompanionState;
  dialogId: string;
  dialogEn: string;
  options: {
    textId: string;
    textEn: string;
    action: 'BETRAY' | 'REFUSE' | 'LIE' | 'TIMEOUT';
  }[];
}

export interface GameSettings {
  language: Language;
  difficulty: Difficulty;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  mouseSensitivity: number;
  botCount: number; // 2 to 16 bots!
  thirdPerson: boolean;
}
