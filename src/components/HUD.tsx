/**
 * In-game Horror HUD
 * Displays:
 * - Health Bar & Stamina Bar at bottom-left corner
 * - WASD Live Control Helper with Indonesian directions
 * - Flashlight, Crouch, and Whistle [G] indicators
 * - Chapter 1 (20 Boxes + Blood Sky + Jacky AI)
 * - Chapter 2 (10 Golden Keys + Jesty Mask Swap + Prison Cage Rescue + Whistle System)
 * - Zero backdrop-blur to eliminate WebGL frame hitch/freezing!
 */

import React, { useRef, useState } from 'react';
import { GameWorld } from '../game/GameWorld';
import { DeviceMode, Language } from '../types';
import {
  Heart,
  Zap,
  Flashlight,
  Shield,
  MessageSquare,
  Lock,
  Unlock,
  EyeOff,
  AlertTriangle,
  Radio,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Wrench,
  Volume2,
  Eye,
  Hand,
  HandHeart,
  Footprints,
  Crosshair
} from 'lucide-react';

interface Props {
  gameWorld: GameWorld;
  language: Language;
  deviceMode: DeviceMode;
  onOpenRestartModal?: () => void;
}

export const HUD: React.FC<Props> = ({ gameWorld, language, deviceMode, onOpenRestartModal }) => {
  const [chatExpanded, setChatExpanded] = useState<boolean>(deviceMode !== 'MOBILE');
  const [joyKnob, setJoyKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const joyRef = useRef<HTMLDivElement>(null);
  const activePointerId = useRef<number | null>(null);
  const isId = language === 'id';
  const isMobile = deviceMode === 'MOBILE';

  const updateJoystickFromPointer = (clientX: number, clientY: number) => {
    const el = joyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.36;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setJoyKnob({ x: dx, y: dy });
    // +x = right, +y on input = forward (screen up = negative dy)
    gameWorld.joystickInput.x = dx / maxR;
    gameWorld.joystickInput.y = -dy / maxR;
  };

  const resetJoystick = () => {
    activePointerId.current = null;
    setJoyKnob({ x: 0, y: 0 });
    gameWorld.joystickInput.x = 0;
    gameWorld.joystickInput.y = 0;
  };

  const { player, objectives, mazeObjectives, chapter, startCountdown } = gameWorld;
  const currentZone = gameWorld.circusMap.getZoneAt(player.x, player.z);

  // Health and Stamina calculations
  const hpPercent = Math.max(0, Math.min(100, player.health));
  const staminaPercent = Math.max(0, Math.min(100, player.stamina));

  // Determine active interact prompt
  let interactPrompt: string | null = null;
  if (player.isCarriedByJesty) {
    interactPrompt = null;
  } else if (player.isHiding) {
    interactPrompt = isId ? '[E] KELUAR DARI LEMARI' : '[E] EXIT LOCKER';
  } else if (chapter === 'MAZE') {
    if (gameWorld.repairingMachineId !== null) {
      interactPrompt = null; // Repair UI overlay replaces center prompt while repairing
    } else if (gameWorld.nearbyMachine && !gameWorld.nearbyMachine.fixed) {
      interactPrompt = isId
        ? `[E] PERBAIKI ${gameWorld.nearbyMachine.name.toUpperCase()} (${Math.floor(gameWorld.nearbyMachine.progress)}%)`
        : `[E] REPAIR ${gameWorld.nearbyMachine.name.toUpperCase()} (${Math.floor(gameWorld.nearbyMachine.progress)}%)`;
    } else if (gameWorld.nearbyCageUnlock) {
      interactPrompt = isId ? '[E] BUKA GEMBOK PENJARA & BEBASKAN REKAN' : '[E] UNLOCK PRISON & RESCUE FRIENDS';
    } else if (gameWorld.nearbyMazeExit) {
      if (mazeObjectives.exitUnlocked || mazeObjectives.machinesFixed >= 20) {
        interactPrompt = isId ? '[E] KELUAR DARI LABIRIN SIRKUS (MENANG)!' : '[E] ESCAPE THE LABYRINTH (VICTORY)!';
      } else {
        interactPrompt = isId
          ? `[E] PINTU EXIT TERKUNCI (PERBAIKI ${20 - mazeObjectives.machinesFixed} MESIN LAGI)`
          : `[E] EXIT DOOR LOCKED (${20 - mazeObjectives.machinesFixed} MORE MACHINES)`;
      }
    } else if (gameWorld.nearbyMazeMap) {
      interactPrompt = gameWorld.showMazeMapOverlay
        ? (isId ? '[E] TUTUP PETA LABIRIN' : '[E] CLOSE MAZE MAP')
        : (isId ? '[E] LIHAT PETA LABIRIN JESTY' : '[E] VIEW JESTY MAZE MAP');
    } else if (gameWorld.nearbyLocker) {
      interactPrompt = isId ? '[E] SEMBUNYI DI DALAM LEMARI' : '[E] HIDE IN LOCKER';
    }
  } else {
    // Chapter 1 Fairground
    if (gameWorld.nearbyLocker) {
      interactPrompt = isId ? '[E] SEMBUNYI DI DALAM LEMARI' : '[E] HIDE IN LOCKER';
    } else if (gameWorld.nearbyBox) {
      interactPrompt = isId ? '[E] AMBIL KOTAK JACK-IN-THE-BOX' : '[E] COLLECT JACK-IN-THE-BOX';
    } else if (gameWorld.nearbyCheatButton) {
      interactPrompt = isId ? '[E] BUKA TOMBOL CHEAT RAHASIA 😏' : '[E] OPEN SECRET CHEAT BUTTON 😏';
    } else if (objectives.gateUnlocked) {
      const distToGate = Math.hypot(player.x - 0, player.z - (-115));
      if (distToGate < 8) {
        interactPrompt = isId ? '[E] KABUR KELUAR SIRKUS!' : '[E] ESCAPE THE CIRCUS!';
      }
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden font-sans">
      {/* 0. TOP-LEFT: MAIN ULANG / MENU AWAL & UNSTUCK BUTTON */}
      <div className="absolute top-4 left-6 pointer-events-auto z-40">
        <button
          onClick={onOpenRestartModal}
          className="px-3.5 py-2 rounded-xl bg-stone-950/95 hover:bg-red-950 border border-stone-800 hover:border-red-500/80 text-stone-300 hover:text-white text-xs font-mono font-bold shadow-2xl flex items-center gap-2 cursor-pointer transition-all group"
          title={isId ? 'Menu Utama / Main Ulang / Unstuck (Jika Stuck/Bug) - Tekan ESC' : 'Main Menu / Restart / Unstuck - Press ESC'}
        >
          <RotateCcw className="w-3.5 h-3.5 text-red-400 group-hover:rotate-180 transition-transform duration-300" />
          <span>{isId ? 'MAIN ULANG / MENU' : 'RESTART / MENU'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-400 font-bold">
            ESC
          </span>
        </button>
      </div>

      {/* 1. LOCKER INTERIOR LOUVERS / SLATS OVERLAY */}
      {player.isHiding && (
        <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none bg-black/60">
          <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-red-950/95 border border-red-500 text-red-200 text-xs font-mono font-bold tracking-widest uppercase flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-red-400" />
            {isId ? 'BERSEMBUNYI DI DALAM LEMARI (AMAN DARI MONSTER)' : 'HIDDEN IN LOCKER (SAFE FROM MONSTERS)'}
          </div>
          {/* Wood slat silhouettes */}
          <div className="w-full h-full flex flex-col justify-evenly">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="w-full h-8 bg-stone-950/95 border-y border-stone-900 shadow-md" />
            ))}
          </div>
        </div>
      )}

      {/* 1.15 CARRIED IN JESTY'S CLUTCHES OVERLAY (CHAPTER 2) */}
      {chapter === 'MAZE' && player.isCarriedByJesty && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center border-[14px] border-red-600/80 shadow-[inset_0_0_120px_rgba(220,38,38,0.8)] animate-pulse">
          <div className="bg-red-950/95 border-2 border-amber-400 rounded-2xl px-6 py-4 max-w-md text-center shadow-2xl">
            <div className="text-3xl mb-1">✋🎭⛓️</div>
            <h2 className="text-base sm:text-lg font-mono font-black text-white uppercase tracking-wider">
              {isId ? 'KAMU DICENGKRAM JESTY!!' : 'JESTY GRABBED YOU!!'}
            </h2>
            <p className="text-xs font-bold text-amber-200 mt-1">
              {isId
                ? 'Jesty sedang membawamu menuju Kurungan Penjara Sirkus! Tidak bisa bergerak...'
                : 'Jesty is dragging you straight toward the Circus Prison Cage!'}
            </p>
          </div>
        </div>
      )}

      {/* 1.2 CHAPTER 2 PRISON CAGE IMPRISONMENT OVERLAY */}
      {chapter === 'MAZE' && player.isImprisoned && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-black/40 border-[16px] border-blue-900/60 shadow-[inset_0_0_120px_rgba(2,132,199,0.7)] animate-pulse">
          <div className="bg-stone-950/95 border-2 border-amber-500 rounded-2xl p-5 max-w-md text-center shadow-2xl">
            <span className="text-3xl mb-2 block">⛓️ 🔒 🎪</span>
            <h2 className="text-base font-mono font-black text-amber-400 uppercase tracking-wider mb-1">
              {isId ? 'KAMU TERKURUNG DI PENJARA SIRKUS!' : 'YOU ARE LOCKED IN THE CIRCUS PRISON!'}
            </h2>
            <p className="text-xs text-stone-200 mb-3">
              {isId
                ? 'Jesty mengurungmu di dalam sangkar besi! Rekan bot yang masih hidup sedang bergegas mencarimu untuk membuka kuncinya. Tekan [G] Bersiul untuk memanggil rekan!'
                : 'Jesty locked you inside the cage! A surviving bot companion is heading to unlock you. Press [G] to whistle for help!'}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-600 text-amber-300 font-mono text-xs font-bold">
              <Volume2 className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>{isId ? 'Tekan [G] Bersiul Memanggil Rekan' : 'Press [G] to Whistle'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 1.5 BLOOD SKY / MAZE INFERNO RED ATMOSPHERIC VIGNETTE */}
      {(gameWorld.isBloodSky || (chapter === 'MAZE' && mazeObjectives.exitUnlocked)) && (
        <div className="absolute inset-0 pointer-events-none border-[12px] border-red-600/70 shadow-[inset_0_0_130px_rgba(239,68,68,0.6)] animate-pulse z-10" />
      )}

      {/* 1.8 WHISTLE SONIC RIPPLE EFFECT */}
      {gameWorld.whistle.activeRippleTime > 0 && (
        <div className="absolute inset-0 pointer-events-none border-4 border-amber-400/50 shadow-[inset_0_0_80px_rgba(245,158,11,0.35)] animate-ping z-10" />
      )}

      {/* 2. INJURY VIGNETTE (LOW HEALTH) */}
      {player.health < 40 && (
        <div className="absolute inset-0 pointer-events-none border-[16px] border-red-900/60 shadow-[inset_0_0_100px_rgba(180,0,0,0.7)] animate-pulse" />
      )}

      {/* 2.5 DRAMATIC BETRAYAL ALERT BANNER (CHANCE 30% BOT SNITCHES!) */}
      {gameWorld.betrayalWarning && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 max-w-lg w-full px-4 animate-bounce">
          <div className="w-full bg-red-950/95 border-2 border-red-500 rounded-xl p-3.5 shadow-2xl text-white text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-mono font-black text-red-300 tracking-widest uppercase mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>{isId ? '⚠️ PERINGATAN PENGKHIANATAN!!' : '⚠️ BETRAYAL ALERT!!'}</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-red-100">
              {gameWorld.betrayalWarning.isPlayerTarget
                ? (isId
                    ? `⚠️ ${gameWorld.betrayalWarning.botName.toUpperCase()} MEMBOCORKAN LOKASIMU KE JACKY! LARI ATAU SEMBUNYI DI LEMARI SEKARANG!!`
                    : `⚠️ ${gameWorld.betrayalWarning.botName.toUpperCase()} SNITCHED YOUR LOCATION TO JACKY! RUN OR HIDE IN A LOCKER NOW!!`)
                : (isId
                    ? `⚠️ ${gameWorld.betrayalWarning.botName} membocorkan lokasi ${gameWorld.betrayalWarning.victimName} ke Jacky! Jacky beralih memburunya!`
                    : `⚠️ ${gameWorld.betrayalWarning.botName} snitched ${gameWorld.betrayalWarning.victimName}'s location to Jacky!`)}
            </p>
          </div>
        </div>
      )}

      {/* 2.6 JACKY MEGA LEAP WARNING BANNER */}
      {gameWorld.jacky.info.isLeaping && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 max-w-lg w-full px-4 animate-bounce">
          <div className="w-full bg-red-950/95 border-2 border-red-500 rounded-xl p-3.5 shadow-2xl text-white text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-mono font-black text-amber-300 tracking-widest uppercase mb-1">
              <span className="text-lg">⚠️</span>
              <span>{isId ? 'AWAS!! JACKY MELOMPAT TINGGI KE UDARA!!' : 'BEWARE!! JACKY IS LEAPING SKY HIGH!!'}</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-red-100">
              {isId
                ? 'JACKY AKAN MENDARAT MENGHANTAM TANAH! JAUHI LINGKARAN MERAH DI TANAH!'
                : 'JACKY WILL CRASH-LAND ON THE GROUND! AVOID THE RED LANDING ZONE!'}
            </p>
          </div>
        </div>
      )}

      {/* 2.7 JESTY MASK STATUS BANNER (CHAPTER 2) */}
      {chapter === 'MAZE' && gameWorld.jesty && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-35 max-w-lg w-full px-4 transition-all">
          {gameWorld.jesty.info.activeMask === 'COMEDY' ? (
            <div className="w-full bg-red-950/95 border-2 border-amber-500 rounded-xl px-4 py-2 text-white flex items-center justify-between shadow-2xl animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎭</span>
                <div>
                  <div className="text-[10px] font-mono font-black text-amber-300 uppercase">
                    {isId ? 'JESTY: TOPENG KOMEDI (AGRESIF!)' : 'JESTY: COMEDY MASK (AGGRESSIVE!)'}
                  </div>
                  <div className="text-xs font-bold text-red-100">
                    {isId ? 'Jesty tertawa memburu & menculik pemain ke penjara! LARI!' : 'Jesty is actively kidnapping survivors into the cage! RUN!'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold">
                {gameWorld.jesty.info.maskSwapTimer.toFixed(0)}s
              </span>
            </div>
          ) : (
            <div className="w-full bg-sky-950/95 border-2 border-sky-400 rounded-xl px-4 py-2 text-white flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">😭</span>
                <div>
                  <div className="text-[10px] font-mono font-black text-sky-300 uppercase">
                    {isId ? 'JESTY: TOPENG TRAGEDI (AMAN / MENANGIS)' : 'JESTY: TRAGEDY MASK (PASSIVE / WEEPING)'}
                  </div>
                  <div className="text-xs font-bold text-sky-100">
                    {isId ? 'Jesty sedang menangis & TIDAK AKAN MENYERANG! Waktu aman memperbaiki mesin!' : 'Jesty is weeping and WILL NOT ATTACK! Safe to repair machines!'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-sky-300 font-bold">
                {gameWorld.jesty.info.maskSwapTimer.toFixed(0)}s
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2.72 "ADA SESUATU YANG DATANG" JESTY APPROACH WARNING WHILE REPAIRING */}
      {chapter === 'MAZE' && gameWorld.somethingComingTimer > 0 && (
        <div className="absolute top-44 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-bounce">
          <div className="w-full bg-red-950 border-2 border-red-400 rounded-xl px-5 py-3 shadow-[0_0_30px_rgba(239,68,68,0.85)] text-center">
            <div className="text-base sm:text-lg font-mono font-black tracking-widest text-white uppercase drop-shadow">
              ⚠️ {isId ? 'ADA SESUATU YANG DATANG' : 'SOMETHING IS COMING'} ⚠️
            </div>
            <div className="text-xs font-bold text-amber-300 mt-0.5">
              {isId
                ? 'Jesty mendeteksimu di mesin! Segera hentikan perbaikan [E] dan lari!'
                : 'Jesty spotted you at the machine! Stop repairing [E] and run!'}
            </div>
          </div>
        </div>
      )}

      {/* 2.74 PISTOL SIRKUS STUN / SHOT FEEDBACK BANNER */}
      {gameWorld.pistolFeedback && gameWorld.pistolFeedback.timer > 0 && (
        <div className="absolute top-44 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
          <div
            className={`w-full border-2 rounded-xl px-4 py-2.5 shadow-2xl text-center font-mono font-black text-xs sm:text-sm ${
              gameWorld.pistolFeedback.type === 'HIT'
                ? 'bg-cyan-950/95 border-cyan-400 text-cyan-200 animate-pulse'
                : 'bg-stone-950/95 border-amber-500 text-amber-300'
            }`}
          >
            {isId ? gameWorld.pistolFeedback.textId : gameWorld.pistolFeedback.textEn}
          </div>
        </div>
      )}

      {/* Active Monster Stun Countdown Pill */}
      {((chapter === 'FAIRGROUND' && gameWorld.jacky.stunTimer > 0) ||
        (chapter === 'MAZE' && gameWorld.jesty && gameWorld.jesty.stunTimer > 0)) && (
        <div className="absolute top-56 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-cyan-950/95 border-2 border-cyan-400 text-cyan-200 font-mono font-black text-xs shadow-xl">
          ⚡ {chapter === 'MAZE' ? 'JESTY' : 'JACKY'} STUNNED:{' '}
          {(chapter === 'MAZE' ? gameWorld.jesty!.stunTimer : gameWorld.jacky.stunTimer).toFixed(1)}s
        </div>
      )}

      {/* 2.75 WHISTLE 10-SECOND NEAREST COMPANION HIGHLIGHT RADAR */}
      {gameWorld.whistle.highlightTimer > 0 && gameWorld.whistle.highlightedBotName && (
        <div className="absolute top-20 left-6 z-40 max-w-xs w-full">
          <div className="bg-emerald-950/95 border-2 border-emerald-400 rounded-xl p-3 shadow-2xl text-white">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-300 mb-1">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{isId ? 'REKAN TERDEKAT DISOROT' : 'NEAREST ALLY HIGHLIGHTED'}</span>
              </div>
              <span className="text-emerald-200 font-mono font-black text-sm">
                {gameWorld.whistle.highlightTimer.toFixed(1)}s
              </span>
            </div>
            <p className="text-xs font-bold text-emerald-100 leading-tight">
              {isId
                ? `🧭 ${gameWorld.whistle.highlightedBotName.toUpperCase()} — Jarak ${gameWorld.whistle.highlightedBotDistance.toFixed(0)}m (Terlihat menembus dinding!)`
                : `🧭 ${gameWorld.whistle.highlightedBotName.toUpperCase()} — ${gameWorld.whistle.highlightedBotDistance.toFixed(0)}m away (X-Ray active!)`}
            </p>
            <div className="w-full bg-stone-950 h-1.5 rounded-full mt-2 overflow-hidden border border-emerald-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-100"
                style={{ width: `${Math.max(0, (gameWorld.whistle.highlightTimer / 10.0) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2.76 CARRIED COMPANION BOT BANNER (SARUNG TANGAN SIRKUS - 10s CARRY) */}
      {gameWorld.carriedBot && (
        <div className="absolute top-44 left-6 z-40 max-w-xs w-full">
          <div className="bg-emerald-950/95 border-2 border-emerald-400 rounded-xl p-3 shadow-2xl text-white">
            <div className="flex items-center justify-between text-xs font-mono font-black text-emerald-300 mb-1">
              <div className="flex items-center gap-1.5">
                <HandHeart className="w-4 h-4 text-emerald-300 animate-bounce" />
                <span>{isId ? 'SARUNG TANGAN SIRKUS' : 'CIRCUS GLOVES'}</span>
              </div>
              <span className="text-emerald-200 text-sm">
                {gameWorld.carriedBot.timer.toFixed(1)}s
              </span>
            </div>
            <p className="text-xs font-bold text-emerald-100 leading-tight">
              {isId
                ? `🧤 Menggendong ${gameWorld.carriedBot.botName.toUpperCase()} — Aman dari monster! ([T] Taruh)`
                : `🧤 Carrying ${gameWorld.carriedBot.botName.toUpperCase()} — Safe from monsters! ([T] Drop)`}
            </p>
            <div className="w-full bg-stone-950 h-1.5 rounded-full mt-2 overflow-hidden border border-emerald-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-lime-300 transition-all duration-100"
                style={{ width: `${Math.max(0, (gameWorld.carriedBot.timer / 10.0) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2.77 MONSTER RADAR ACTIVE BANNER (10 SECONDS THROUGH-WALLS HIGHLIGHT) */}
      {gameWorld.monsterRadar && gameWorld.monsterRadar.active && (
        <div className="absolute top-44 right-6 z-40 max-w-xs w-full">
          <div className="bg-rose-950/95 border-2 border-rose-400 rounded-xl p-3 shadow-2xl text-white">
            <div className="flex items-center justify-between text-xs font-mono font-black text-rose-300 mb-1">
              <div className="flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-rose-400 animate-spin" />
                <span>{isId ? 'MONSTER RADAR AKTIF' : 'MONSTER RADAR ACTIVE'}</span>
              </div>
              <span className="text-rose-200 text-sm">
                {gameWorld.monsterRadar.timer.toFixed(1)}s
              </span>
            </div>
            <p className="text-xs font-bold text-rose-100 leading-tight">
              {isId
                ? `📡 ${gameWorld.monsterRadar.monsterName} — ${gameWorld.monsterRadar.distance.toFixed(0)}m (${gameWorld.monsterRadar.zoneName})`
                : `📡 ${gameWorld.monsterRadar.monsterName} — ${gameWorld.monsterRadar.distance.toFixed(0)}m (${gameWorld.monsterRadar.zoneName})`}
            </p>
            <div className="w-full bg-stone-950 h-1.5 rounded-full mt-2 overflow-hidden border border-rose-800">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-100"
                style={{ width: `${Math.max(0, (gameWorld.monsterRadar.timer / 10.0) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2.78 JESTY 5-SECOND CAPTURE/DEATH LOCATION REVEAL (CHAPTER 2) */}
      {chapter === 'MAZE' && gameWorld.jesty && (gameWorld.jesty.info.revealedTimer ?? 0) > 0 && (
        <div className="absolute top-20 right-6 z-40 max-w-xs w-full animate-pulse">
          <div className="bg-red-950/95 border-2 border-amber-500 rounded-xl p-3 shadow-2xl text-white">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300 mb-1">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-red-400 animate-spin" />
                <span>{isId ? 'LOKASI JESTY TERDETEKSI' : 'JESTY LOCATION REVEALED'}</span>
              </div>
              <span className="text-red-400 font-mono font-black text-sm">
                {(gameWorld.jesty.info.revealedTimer ?? 0).toFixed(1)}s
              </span>
            </div>
            <p className="text-xs font-bold text-red-100 leading-tight">
              {isId
                ? `🚨 Pilar cahaya merah menunjukkan posisi Jesty selama 5 detik! Jarak: ${Math.hypot(gameWorld.jesty.info.x - player.x, gameWorld.jesty.info.z - player.z).toFixed(0)}m`
                : `🚨 Red light pillar reveals Jesty's position! Distance: ${Math.hypot(gameWorld.jesty.info.x - player.x, gameWorld.jesty.info.z - player.z).toFixed(0)}m`}
            </p>
          </div>
        </div>
      )}

      {/* 2.8 DYING BOT MONSTER LOCATION BEACON (5 SECONDS TRACKER) */}
      {gameWorld.jackyTracker && gameWorld.jackyTracker.active && (
        <div className="absolute top-20 right-6 z-40 max-w-xs w-full animate-pulse">
          <div className="bg-red-950/95 border-2 border-amber-500 rounded-xl p-3 shadow-2xl text-white">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300 mb-1">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-red-400 animate-spin" />
                <span>{isId ? 'RADAR BOT SEKARAT' : 'DYING BOT RADAR'}</span>
              </div>
              <span className="text-red-400 font-mono font-black text-sm">
                {gameWorld.jackyTracker.timer.toFixed(1)}s
              </span>
            </div>
            <p className="text-xs font-bold text-red-100 leading-tight">
              {isId
                ? `🚨 ${gameWorld.jackyTracker.botName.toUpperCase()}: "JACKY ADA DI ${gameWorld.jackyTracker.zoneName.toUpperCase()}!"`
                : `🚨 ${gameWorld.jackyTracker.botName.toUpperCase()}: "JACKY IS AT ${gameWorld.jackyTracker.zoneName.toUpperCase()}!"`}
            </p>
            <div className="w-full bg-stone-950 h-1.5 rounded-full mt-2 overflow-hidden border border-amber-900">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-amber-400 transition-all duration-100"
                style={{ width: `${Math.max(0, (gameWorld.jackyTracker.timer / 5.0) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. TOP BANNER: MISSION OBJECTIVES & ENVIRONMENT STATUS */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 max-w-lg w-full px-4">
        {chapter === 'MAZE' ? (
          /* Chapter 2: Circus Labyrinth 20 Machines Objective Banner */
          <>
            <div className="w-full bg-stone-950/95 border border-amber-600/80 rounded-xl px-4 py-2.5 shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-amber-400 animate-pulse" />
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-amber-400 font-mono font-bold">
                    {isId ? 'BABAK 2: LABIRIN SIRKUS' : 'CHAPTER 2: CIRCUS LABYRINTH'}
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-stone-100 flex items-center gap-2">
                    <span>{isId ? 'Perbaiki Mesin:' : 'Repair Machines:'}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-600 text-amber-300 font-mono">
                      {mazeObjectives.machinesFixed} / {mazeObjectives.machinesTotal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Exit Door Status Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800">
                {mazeObjectives.exitUnlocked || mazeObjectives.machinesFixed >= 20 ? (
                  <>
                    <Unlock className="w-4 h-4 text-emerald-400 animate-bounce" />
                    <span className="text-xs font-bold text-emerald-300 font-mono uppercase">
                      {isId ? 'EXIT TERBUKA!' : 'EXIT OPEN!'}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-red-300 font-mono uppercase">
                      {isId ? 'PINTU TERKUNCI' : 'LOCKED'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {mazeObjectives.exitUnlocked && gameWorld.circusMaze && (
              <div className="w-full bg-red-950/95 border-2 border-emerald-400 rounded-xl px-4 py-2 shadow-2xl flex items-center justify-between animate-pulse">
                <span className="text-xs font-mono font-black text-amber-300 uppercase">
                  🔥🚨 {isId ? 'API BERKOBAR & SIRINE AKTIF! PINTU EXIT DISOROT!' : 'INFERNO & SIRENS ACTIVE! EXIT HIGHLIGHTED!'}
                </span>
                <span className="text-xs font-mono font-black text-emerald-300">
                  🧭 {Math.hypot(gameWorld.circusMaze.exitDoorPosition.x - player.x, gameWorld.circusMaze.exitDoorPosition.z - player.z).toFixed(0)}m
                </span>
              </div>
            )}
          </>
        ) : startCountdown > 0 ? (
          /* Chapter 1: Initial 30s Grace countdown */
          <div className="w-full bg-stone-900/95 border-2 border-amber-600/80 rounded-xl px-5 py-3 shadow-2xl flex flex-col items-center animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm sm:text-base tracking-wider uppercase font-mono">
              <span className="animate-spin text-lg">⏳</span>
              <span>
                {isId
                  ? `JACKY MEMUTAR KOTAK MUSIK: ${Math.ceil(startCountdown)}s LAGI!`
                  : `JACKY WINDING MUSIC BOX: ${Math.ceil(startCountdown)}s LEFT!`}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-stone-950 h-2 rounded-full mt-2 overflow-hidden border border-stone-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-200"
                style={{ width: `${(startCountdown / 30) * 100}%` }}
              />
            </div>
            <div className="text-[11px] text-stone-400 mt-1 font-mono">
              {isId ? 'Cepat menyebar mencari kotak dan cari lemari!' : 'Scatter, find boxes, and locate lockers!'}
            </div>
          </div>
        ) : gameWorld.isBloodSky ? (
          /* Blood Sky Apocalypse Emergency Banner */
          <div className="w-full bg-red-950/95 border-2 border-red-500 rounded-xl px-4 py-2.5 shadow-2xl flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🩸</span>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-red-300 font-mono font-black">
                  {isId ? '🔴 LANGIT MERAH DARAH AKTIF!' : '🔴 BLOOD SKY ACTIVE!'}
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-white">
                  {isId
                    ? 'JACKY MENGETAHUI SEMUA LOKASI! KABUR KE GERBANG UTARA!'
                    : 'JACKY KNOWS ALL LOCATIONS! SPRINT TO NORTH GATE!'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-800 border border-red-400">
              <Unlock className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span className="text-xs font-black text-white font-mono uppercase">
                {isId ? 'GERBANG UTARA' : 'NORTH GATE'}
              </span>
            </div>
          </div>
        ) : (
          /* Main Mission Objective Banner (20 Boxes) */
          <div className="w-full bg-stone-950/95 border border-stone-800 rounded-xl px-4 py-2.5 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🎁</span>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-stone-400 font-mono">
                  {isId ? 'Misi Sirkus Babak 1' : 'Circus Mission Chapter 1'}
                </div>
                <div className="text-sm sm:text-base font-extrabold text-stone-100 flex items-center gap-2">
                  <span>{isId ? 'Kumpulkan Kotak Jack-in-the-Box:' : 'Collect Jack-in-the-Boxes:'}</span>
                  <span className="px-2 py-0.5 rounded bg-red-950 border border-red-700 text-red-400 font-mono">
                    {objectives.boxesCollected} / {objectives.boxesTotal}
                  </span>
                </div>
              </div>
            </div>

            {/* Exit Gate Status Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800">
              {objectives.gateUnlocked ? (
                <>
                  <Unlock className="w-4 h-4 text-emerald-400 animate-bounce" />
                  <span className="text-xs font-bold text-emerald-300 font-mono uppercase">
                    {isId ? 'GERBANG TERBUKA!' : 'GATE UNLOCKED!'}
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold text-red-300 font-mono uppercase">
                    {isId ? 'GERBANG TERKUNCI' : 'GATE LOCKED'}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Current Zone & Difficulty Tag */}
        <div className="px-3 py-0.5 rounded-full bg-stone-950/90 border border-stone-800 text-[11px] text-stone-400 font-mono flex items-center gap-2">
          <span>
            📍 {chapter === 'MAZE' ? (isId ? 'Labirin Sirkus & Penjara Besi' : 'Circus Labyrinth & Prison') : (isId ? currentZone.nameId : currentZone.nameEn)}
          </span>
          <span className="text-stone-700">•</span>
          <span
            className={
              gameWorld.difficulty === 'NIGHTMARE'
                ? 'text-fuchsia-400 font-black'
                : gameWorld.difficulty === 'HARD'
                ? 'text-red-400 font-black'
                : 'text-emerald-400 font-bold'
            }
          >
            {gameWorld.difficulty === 'NIGHTMARE'
              ? '💀 NIGHTMARE'
              : gameWorld.difficulty === 'HARD'
              ? '🔥 HARD'
              : 'NORMAL'}
          </span>
        </div>
      </div>

      {/* 4. CENTER INTERACTION PROMPT (Tappable directly on Mobile/Android too!) */}
      {interactPrompt && !gameWorld.showMazeMapOverlay && (
        <button
          type="button"
          onClick={() => {
            if (isMobile) gameWorld.handleInteract();
          }}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-stone-900/95 border-2 border-red-500 text-stone-100 shadow-[0_0_20px_rgba(239,68,68,0.7)] text-xs sm:text-base font-bold font-mono tracking-wider animate-pulse ${
            isMobile ? 'pointer-events-auto cursor-pointer active:scale-95' : 'pointer-events-none'
          }`}
        >
          <span>{interactPrompt}</span>
        </button>
      )}

      {/* 4.1 START AREA LABYRINTH MAP INSPECT MODAL */}
      {chapter === 'MAZE' && gameWorld.showMazeMapOverlay && gameWorld.circusMaze?.startMapCanvasDataUrl && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 pointer-events-auto p-4">
          <div className="bg-stone-950 border-2 border-amber-500 rounded-2xl p-3 sm:p-4 max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.5)] flex flex-col items-center">
            <img
              src={gameWorld.circusMaze.startMapCanvasDataUrl}
              alt="Peta Labirin Jesty"
              className="w-full aspect-square rounded-xl border border-stone-800 object-contain"
            />
            <button
              onClick={() => {
                gameWorld.showMazeMapOverlay = false;
                gameWorld.onStateUpdate?.();
              }}
              className="mt-3 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-mono font-black text-xs uppercase tracking-wider cursor-pointer"
            >
              [E] {isId ? 'Tutup Peta' : 'Close Map'}
            </button>
          </div>
        </div>
      )}

      {/* 4.2 MACHINE REPAIR & ROTATING CALIBRATION BAR (BACKSPACE PUZZLE) */}
      {chapter === 'MAZE' && gameWorld.repairingMachineId !== null && gameWorld.circusMaze && (() => {
        const machine = gameWorld.circusMaze.mazeMachines.find(m => m.id === gameWorld.repairingMachineId);
        if (!machine) return null;
        const sc = gameWorld.skillCheck;
        const radius = 58;
        const cx = 80;
        const cy = 80;
        const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
        const zStart = toRad(sc.zoneStartAngle);
        const zEnd = toRad(sc.zoneStartAngle + sc.zoneSizeAngle);
        const arcX1 = cx + radius * Math.cos(zStart);
        const arcY1 = cy + radius * Math.sin(zStart);
        const arcX2 = cx + radius * Math.cos(zEnd);
        const arcY2 = cy + radius * Math.sin(zEnd);
        const nRad = toRad(sc.needleAngle);
        const needleX2 = cx + (radius + 11) * Math.cos(nRad);
        const needleY2 = cy + (radius + 11) * Math.sin(nRad);

        return (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3 pointer-events-auto">
            {sc.active && (
              <div className="bg-stone-950/95 border-2 border-white/80 rounded-2xl p-4 shadow-[0_0_35px_rgba(255,255,255,0.25)] flex flex-col items-center">
                <div className="text-[11px] font-mono font-black text-amber-300 uppercase tracking-widest mb-1">
                  ⚡ {isId ? 'KALIBRASI MESIN — TEKAN [BACKSPACE]!' : 'MACHINE CALIBRATION — PRESS [BACKSPACE]!'}
                </div>
                <svg width="160" height="160" viewBox="0 0 160 160" className="overflow-visible">
                  {/* Dark outer bar ring */}
                  <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#27272a" strokeWidth="14" />
                  {/* Bright WHITE target area (area putih) */}
                  <path
                    d={`M ${arcX1} ${arcY1} A ${radius} ${radius} 0 0 1 ${arcX2} ${arcY2}`}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="16"
                    strokeLinecap="butt"
                  />
                  {/* Rotating WHITE needle line (garis putih muter-muter) */}
                  <line
                    x1={cx}
                    y1={cy}
                    x2={needleX2}
                    y2={needleY2}
                    stroke="#ffffff"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <circle cx={cx} cy={cy} r="6" fill="#ffffff" />
                </svg>
                <button
                  onClick={() => gameWorld.handleSkillCheckBackspace()}
                  className="mt-1 px-4 py-1.5 rounded-lg bg-white text-stone-950 hover:bg-amber-300 font-mono font-black text-xs tracking-wider cursor-pointer shadow-lg"
                >
                  [BACKSPACE] {isId ? 'TEKAN DI AREA PUTIH' : 'HIT WHITE ZONE'}
                </button>
              </div>
            )}

            {/* Machine Repair Progress Panel */}
            <div className="w-72 bg-stone-950/95 border-2 border-amber-500 rounded-xl px-4 py-3 shadow-2xl text-center">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 animate-spin" />
                  {machine.name}
                </span>
                <span>{Math.floor(machine.progress)}%</span>
              </div>
              <div className="w-full bg-stone-900 h-3 rounded-full overflow-hidden border border-stone-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-100"
                  style={{ width: `${Math.min(100, machine.progress)}%` }}
                />
              </div>
              <div className="text-[10px] font-mono text-stone-400 mt-1.5">
                {isId ? 'Tekan [E] atau bergerak untuk berhenti' : 'Press [E] or move to cancel'}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 4.3 CALIBRATION SUCCESS / FAIL FEEDBACK TOAST */}
      {chapter === 'MAZE' && gameWorld.skillCheck.feedbackText && (gameWorld.skillCheck.feedbackTimer ?? 0) > 0 && (
        <div className="absolute top-[64%] left-1/2 -translate-x-1/2 z-40">
          <div
            className={`px-4 py-2 rounded-xl border-2 font-mono font-black text-xs sm:text-sm shadow-2xl ${
              gameWorld.skillCheck.feedbackType === 'SUCCESS'
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
                : 'bg-red-950/95 border-red-500 text-red-200 animate-bounce'
            }`}
          >
            {gameWorld.skillCheck.feedbackText}
          </div>
        </div>
      )}

      {/* =======================================================
          5. BOTTOM-LEFT CORNER:
             - PC MODE: WASD Keyboard Helper + Health & Stamina Bars + Action Status
             - MOBILE/ANDROID MODE: Compact HP/Stamina + Analog Joystick + Small Action Buttons tucked neatly on bottom-left
          ======================================================= */}
      {isMobile ? (
        <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 z-30 pointer-events-auto">
          {/* Ultra-compact 1-row Health + Stamina Strip */}
          {(() => {
            const isUnlimitedStamina = gameWorld.isStaminaUnlimited();
            return (
              <div className="flex items-center gap-1.5 bg-stone-950/90 border border-stone-800 rounded-lg px-2 py-1 shadow-xl w-[228px]">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[9px] font-mono font-bold text-red-400 mb-0.5">
                    <span className="flex items-center gap-1">
                      <Heart className="w-2.5 h-2.5 fill-red-500 text-red-500" />
                      HP
                    </span>
                    <span>{Math.round(hpPercent)}%</span>
                  </div>
                  <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                </div>

                <div className="w-px h-5 bg-stone-800" />

                <div className="flex-1">
                  <div className="flex items-center justify-between text-[9px] font-mono font-bold text-cyan-400 mb-0.5">
                    <span className="flex items-center gap-1">
                      <Zap className={`w-2.5 h-2.5 ${isUnlimitedStamina ? 'text-amber-400 fill-amber-400' : 'text-cyan-400 fill-cyan-400'}`} />
                      {isUnlimitedStamina ? '∞' : 'STM'}
                    </span>
                    <span className={isUnlimitedStamina ? 'text-amber-300' : 'text-cyan-300'}>
                      {isUnlimitedStamina ? 'MAX' : `${Math.round(staminaPercent)}%`}
                    </span>
                  </div>
                  <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isUnlimitedStamina
                          ? 'bg-gradient-to-r from-amber-400 to-red-500'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-400'
                      }`}
                      style={{ width: `${isUnlimitedStamina ? 100 : staminaPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Compact Mobile Shop/Reward Item Buttons when owned (>0) or actively carrying */}
          {!player.isHiding && !player.isImprisoned && (
            <div className="flex flex-col gap-1 w-[228px]">
              {gameWorld.circusPistolCount > 0 && (() => {
                const sight = gameWorld.isMonsterInPistolSights();
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      gameWorld.fireCircusPistol();
                    }}
                    className={`w-full py-1 px-2.5 rounded-lg border font-mono font-black text-[10px] flex items-center justify-between shadow-lg active:scale-95 transition-all ${
                      sight.hit
                        ? 'bg-cyan-500 border-white text-stone-950 animate-pulse'
                        : 'bg-cyan-950/95 border-cyan-400 text-cyan-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>{isId ? 'TEMBAK PISTOL SIRKUS' : 'FIRE CIRCUS PISTOL'}</span>
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-black/30">
                      {sight.hit ? '🎯 HIT!' : `x${gameWorld.circusPistolCount}`}
                    </span>
                  </button>
                );
              })()}

              {gameWorld.monsterRadarCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    gameWorld.activateMonsterRadar();
                  }}
                  className="w-full py-1 px-2.5 rounded-lg border bg-rose-950/95 border-rose-400 text-rose-200 font-mono font-black text-[10px] flex items-center justify-between shadow-lg active:scale-95 transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" />
                    <span>{isId ? 'MONSTER RADAR (10s)' : 'MONSTER RADAR (10s)'}</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-black/30">
                    x{gameWorld.monsterRadarCount}
                  </span>
                </button>
              )}

              {(gameWorld.circusGlovesCount > 0 || gameWorld.carriedBot) && !player.isCarriedByJesty && (
                <button
                  type="button"
                  disabled={!gameWorld.carriedBot && !gameWorld.nearbyCarryBot}
                  onClick={(e) => {
                    e.stopPropagation();
                    gameWorld.toggleCarryBotGloves();
                  }}
                  className={`w-full py-1 px-2.5 rounded-lg border font-mono font-black text-[10px] flex items-center justify-between shadow-lg active:scale-95 transition-all ${
                    gameWorld.carriedBot
                      ? 'bg-emerald-500 border-white text-stone-950 animate-pulse'
                      : gameWorld.nearbyCarryBot
                      ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
                      : 'bg-stone-950/90 border-stone-700 text-stone-500 opacity-75'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <HandHeart className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {gameWorld.carriedBot
                        ? (isId ? `TARUH ${gameWorld.carriedBot.botName.toUpperCase()}` : `DROP ${gameWorld.carriedBot.botName.toUpperCase()}`)
                        : gameWorld.nearbyCarryBot
                        ? (isId ? `GENDONG ${gameWorld.nearbyCarryBot.name.toUpperCase()}` : `CARRY ${gameWorld.nearbyCarryBot.name.toUpperCase()}`)
                        : (isId ? 'SARUNG TANGAN (DEKATI BOT)' : 'GLOVES (APPROACH BOT)')}
                    </span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-black/30 shrink-0">
                    {gameWorld.carriedBot ? `${gameWorld.carriedBot.timer.toFixed(0)}s` : `x${gameWorld.circusGlovesCount}`}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Analog Joystick + Small Side Action Buttons Row */}
          <div className="flex items-end gap-2">
            {/* Compact Virtual Analog Joystick */}
            <div
              ref={joyRef}
              onPointerDown={(e) => {
                e.stopPropagation();
                (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                activePointerId.current = e.pointerId;
                updateJoystickFromPointer(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (activePointerId.current !== e.pointerId) return;
                e.stopPropagation();
                updateJoystickFromPointer(e.clientX, e.clientY);
              }}
              onPointerUp={(e) => {
                if (activePointerId.current !== e.pointerId) return;
                e.stopPropagation();
                resetJoystick();
              }}
              onPointerCancel={(e) => {
                if (activePointerId.current !== e.pointerId) return;
                resetJoystick();
              }}
              className="relative w-24 h-24 rounded-full bg-stone-950/80 border-2 border-stone-700/80 shadow-2xl flex items-center justify-center touch-none select-none shrink-0"
            >
              {/* Directional Crosshair Dots */}
              <span className="absolute top-1.5 text-[8px] font-mono text-stone-500 font-bold">▲</span>
              <span className="absolute bottom-1.5 text-[8px] font-mono text-stone-500 font-bold">▼</span>
              <span className="absolute left-1.5 text-[8px] font-mono text-stone-500 font-bold">◀</span>
              <span className="absolute right-1.5 text-[8px] font-mono text-stone-500 font-bold">▶</span>

              {/* Draggable Inner Thumb Knob */}
              <div
                className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 border-2 border-red-300/80 shadow-[0_0_15px_rgba(220,38,38,0.6)] pointer-events-none"
                style={{
                  transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)`
                }}
              />
            </div>

            {/* Small Compact Action Buttons beside Joystick (keep phone viewport clean!) */}
            <div className="grid grid-cols-3 gap-1 touch-none">
              {/* Lari / Sprint Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  gameWorld.mobileSprintActive = !gameWorld.mobileSprintActive;
                  gameWorld.onStateUpdate?.();
                }}
                className={`w-11 h-9 rounded-lg border flex flex-col items-center justify-center text-[9px] font-mono font-bold transition-all active:scale-95 ${
                  gameWorld.mobileSprintActive
                    ? 'bg-amber-600/90 border-amber-300 text-stone-950 shadow-md'
                    : 'bg-stone-950/90 border-stone-700/80 text-stone-300'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>{isId ? 'LARI' : 'RUN'}</span>
              </button>

              {/* Jongkok / Crouch Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  gameWorld.player.isCrouching = !gameWorld.player.isCrouching;
                  gameWorld.onStateUpdate?.();
                }}
                className={`w-11 h-9 rounded-lg border flex flex-col items-center justify-center text-[9px] font-mono font-bold transition-all active:scale-95 ${
                  player.isCrouching
                    ? 'bg-blue-700/90 border-blue-400 text-white shadow-md'
                    : 'bg-stone-950/90 border-stone-700/80 text-stone-300'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{isId ? 'JONGKOK' : 'CROUCH'}</span>
              </button>

              {/* Aksi / Interact [E] */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  gameWorld.handleInteract();
                }}
                className={`w-11 h-9 rounded-lg border flex flex-col items-center justify-center text-[9px] font-mono font-bold transition-all active:scale-95 ${
                  interactPrompt
                    ? 'bg-emerald-600/95 border-emerald-300 text-white shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse'
                    : 'bg-stone-950/90 border-stone-700/80 text-stone-400'
                }`}
              >
                <Hand className="w-3.5 h-3.5" />
                <span>{isId ? 'AKSI' : 'USE'}</span>
              </button>

              {/* Senter / Flashlight */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  gameWorld.toggleFlashlight();
                  gameWorld.onStateUpdate?.();
                }}
                className={`w-11 h-9 rounded-lg border flex flex-col items-center justify-center text-[9px] font-mono font-bold transition-all active:scale-95 ${
                  player.flashlightOn
                    ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                    : 'bg-stone-950/90 border-stone-700/80 text-stone-500'
                }`}
              >
                <Flashlight className="w-3.5 h-3.5" />
                <span>{isId ? 'SENTER' : 'LIGHT'}</span>
              </button>

              {/* Siul / Whistle [G] */}
              <button
                type="button"
                disabled={gameWorld.whistle.cooldownTimer > 0}
                onClick={(e) => {
                  e.stopPropagation();
                  gameWorld.triggerWhistle();
                  gameWorld.onStateUpdate?.();
                }}
                className={`w-11 h-9 rounded-lg border flex flex-col items-center justify-center text-[9px] font-mono font-bold transition-all active:scale-95 ${
                  gameWorld.whistle.cooldownTimer <= 0
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                    : 'bg-stone-950/90 border-stone-800 text-stone-500'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>
                  {gameWorld.whistle.cooldownTimer > 0
                    ? `${Math.ceil(gameWorld.whistle.cooldownTimer)}s`
                    : (isId ? 'SIUL' : 'WHST')}
                </span>
              </button>

              {/* Kamera 1st/3rd Person [V] */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  gameWorld.isThirdPerson = !gameWorld.isThirdPerson;
                  gameWorld.onStateUpdate?.();
                }}
                className="w-11 h-9 rounded-lg border bg-stone-950/90 border-stone-700/80 text-blue-300 flex flex-col items-center justify-center text-[9px] font-mono font-bold transition-all active:scale-95"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{gameWorld.isThirdPerson ? '3RD' : '1ST'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-6 left-6 flex flex-col gap-2.5 min-w-[240px] sm:min-w-[280px]">
          {/* WASD Live Key Indicator (PC Only) */}
          <div className="bg-stone-950/95 border border-stone-800/90 rounded-xl p-2 shadow-2xl">
            <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 mb-1">
              <span className="font-bold text-stone-300">KONTROL WASD PC</span>
              <span className="text-[9px] text-stone-500">Klik layar untuk Mouse Look</span>
            </div>
            <div className="flex items-center gap-2.5">
              {/* Keys Cluster */}
              <div className="flex flex-col items-center gap-1 font-mono text-xs font-bold">
                {/* W */}
                <div
                  className={`w-7 h-6 rounded flex items-center justify-center border transition-all ${
                    gameWorld.keys.forward
                      ? 'bg-red-600 border-red-400 text-white shadow-md'
                      : 'bg-stone-900 border-stone-700 text-stone-300'
                  }`}
                >
                  W
                </div>
                {/* ASD */}
                <div className="flex items-center gap-1">
                  <div
                    className={`w-7 h-6 rounded flex items-center justify-center border transition-all ${
                      gameWorld.keys.left
                        ? 'bg-red-600 border-red-400 text-white shadow-md'
                        : 'bg-stone-900 border-stone-700 text-stone-300'
                    }`}
                  >
                    A
                  </div>
                  <div
                    className={`w-7 h-6 rounded flex items-center justify-center border transition-all ${
                      gameWorld.keys.backward
                        ? 'bg-red-600 border-red-400 text-white shadow-md'
                        : 'bg-stone-900 border-stone-700 text-stone-300'
                    }`}
                  >
                    S
                  </div>
                  <div
                    className={`w-7 h-6 rounded flex items-center justify-center border transition-all ${
                      gameWorld.keys.right
                        ? 'bg-red-600 border-red-400 text-white shadow-md'
                        : 'bg-stone-900 border-stone-700 text-stone-300'
                    }`}
                  >
                    D
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="text-[10px] font-mono text-stone-400 leading-tight border-l border-stone-800/80 pl-2">
                <div><span className="text-red-400 font-bold">W</span>: Maju</div>
                <div><span className="text-red-400 font-bold">A</span>: Ke Kiri</div>
                <div><span className="text-red-400 font-bold">S</span>: Mundur</div>
                <div><span className="text-red-400 font-bold">D</span>: Ke Kanan</div>
              </div>
            </div>
          </div>

          {/* Health Bar */}
          <div className="bg-stone-950/95 border border-stone-800/90 rounded-xl p-3 shadow-2xl">
            <div className="flex items-center justify-between mb-1.5 text-xs font-bold text-stone-300">
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                <span>{isId ? 'KESEHATAN (HP)' : 'HEALTH'}</span>
              </div>
              <span className="font-mono text-red-400">{Math.round(hpPercent)}%</span>
            </div>
            <div className="w-full bg-stone-900 h-3 rounded-full overflow-hidden p-0.5 border border-stone-800">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-300"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Stamina Bar (Unlimited during Panic Mode or Infinite Stamina Cheat) */}
          {(() => {
            const isUnlimitedStamina = gameWorld.isStaminaUnlimited();
            const isCheatOnly = gameWorld.infiniteStaminaCheat && !gameWorld.isPanicModeActive();
            return (
              <div
                className={`bg-stone-950/95 rounded-xl p-3 shadow-2xl border ${
                  isUnlimitedStamina ? (isCheatOnly ? 'border-emerald-400/90' : 'border-amber-500/90') : 'border-stone-800/90'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 text-xs font-bold text-stone-300">
                  <div className="flex items-center gap-1.5">
                    <Zap
                      className={`w-4 h-4 ${
                        isUnlimitedStamina
                          ? (isCheatOnly ? 'text-emerald-400 fill-emerald-400 animate-pulse' : 'text-amber-400 fill-amber-400 animate-pulse')
                          : 'text-cyan-400 fill-cyan-400'
                      }`}
                    />
                    <span>
                      {isUnlimitedStamina
                        ? isCheatOnly
                          ? (isId ? 'STAMINA CHEAT (∞)' : 'CHEAT STAMINA (∞)')
                          : (isId ? 'STAMINA PANIC MODE' : 'PANIC STAMINA')
                        : (isId ? 'STAMINA (SHIFT: LARI)' : 'STAMINA (SHIFT)')}
                    </span>
                  </div>
                  <span
                    className={`font-mono font-black ${
                      isUnlimitedStamina
                        ? (isCheatOnly ? 'text-emerald-300 animate-pulse' : 'text-amber-300 animate-pulse')
                        : 'text-cyan-400'
                    }`}
                  >
                    {isUnlimitedStamina ? '∞ UNLIMITED' : `${Math.round(staminaPercent)}%`}
                  </span>
                </div>
                <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-stone-800">
                  <div
                    className={`h-full rounded-full transition-all duration-150 ${
                      isUnlimitedStamina
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-red-500 animate-pulse'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-400'
                    }`}
                    style={{ width: `${isUnlimitedStamina ? 100 : staminaPercent}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Action Status Pills: Flashlight, Crouch, and Whistle */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Flashlight [F] */}
            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 shadow-md ${
                player.flashlightOn
                  ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                  : 'bg-stone-900/90 border-stone-700 text-stone-500'
              }`}
            >
              <Flashlight className="w-3.5 h-3.5" />
              <span>[F] {player.flashlightOn ? 'SENTER HIDUP' : 'SENTER MATI'}</span>
            </div>

            {/* Crouch [C] */}
            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 shadow-md ${
                player.isCrouching
                  ? 'bg-blue-950/90 border-blue-500 text-blue-200'
                  : 'bg-stone-900/90 border-stone-700 text-stone-400'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>[C] {player.isCrouching ? 'JONGKOK' : 'BERDIRI'}</span>
            </div>

            {/* Whistle [G] with 20s cooldown button */}
            <button
              onClick={() => gameWorld.triggerWhistle()}
              disabled={gameWorld.whistle.cooldownTimer > 0}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 shadow-md cursor-pointer pointer-events-auto transition-all ${
                gameWorld.whistle.cooldownTimer <= 0
                  ? 'bg-emerald-950/90 hover:bg-emerald-900 border-emerald-500 text-emerald-200'
                  : 'bg-stone-900/90 border-stone-800 text-stone-500 cursor-not-allowed'
              }`}
              title={isId ? 'Bersiul untuk mencari lokasi rekan bot (Cooldown 20s)' : 'Whistle to locate companions (20s Cooldown)'}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>
                [G] {isId ? 'BERSIUL' : 'WHISTLE'}{' '}
                {gameWorld.whistle.cooldownTimer > 0 ? `(${Math.ceil(gameWorld.whistle.cooldownTimer)}s)` : '(SIAP)'}
              </span>
            </button>

            {/* Pistol Sirkus [Q] Single-use stun item */}
            {gameWorld.circusPistolCount > 0 && (() => {
              const sight = gameWorld.isMonsterInPistolSights();
              return (
                <button
                  onClick={() => gameWorld.fireCircusPistol()}
                  disabled={player.isHiding || Boolean(player.isImprisoned)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-black flex items-center gap-1.5 shadow-md cursor-pointer pointer-events-auto transition-all ${
                    sight.hit
                      ? 'bg-cyan-500 hover:bg-cyan-400 border-white text-stone-950 animate-pulse'
                      : 'bg-cyan-950/95 hover:bg-cyan-900 border-cyan-400 text-cyan-200'
                  }`}
                  title={isId ? 'Tembak Pistol Sirkus untuk stun Jacky/Jesty 6.5 detik (Sekali Pakai)' : 'Fire Circus Pistol to stun Jacky/Jesty for 6.5s (Single-Use)'}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>
                    [Q] PISTOL SIRKUS (x{gameWorld.circusPistolCount}) {sight.hit ? '🎯 TERKUNCI!' : ''}
                  </span>
                </button>
              );
            })()}

            {/* Monster Radar [R] Single-use 10s monster highlight */}
            {gameWorld.monsterRadarCount > 0 && (
              <button
                onClick={() => gameWorld.activateMonsterRadar()}
                disabled={player.isHiding || Boolean(player.isImprisoned)}
                className="px-3 py-1.5 rounded-lg border text-xs font-mono font-black flex items-center gap-1.5 shadow-md cursor-pointer pointer-events-auto transition-all bg-rose-950/95 hover:bg-rose-900 border-rose-400 text-rose-200"
                title={isId ? 'Aktifkan Monster Radar untuk menyorot monster terdekat selama 10 detik (Sekali Pakai)' : 'Activate Monster Radar to highlight nearest monster for 10s (Single-Use)'}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>[R] RADAR MONSTER (x{gameWorld.monsterRadarCount})</span>
              </button>
            )}

            {/* Sarung Tangan Sirkus [T] Single-use 10s Carry Bot */}
            {(gameWorld.circusGlovesCount > 0 || gameWorld.carriedBot) && (
              <button
                onClick={() => gameWorld.toggleCarryBotGloves()}
                disabled={
                  player.isHiding ||
                  Boolean(player.isImprisoned) ||
                  Boolean(player.isCarriedByJesty) ||
                  (!gameWorld.carriedBot && !gameWorld.nearbyCarryBot)
                }
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-black flex items-center gap-1.5 shadow-md pointer-events-auto transition-all ${
                  gameWorld.carriedBot
                    ? 'bg-emerald-500 hover:bg-emerald-400 border-white text-stone-950 cursor-pointer animate-pulse'
                    : gameWorld.nearbyCarryBot
                    ? 'bg-emerald-950/95 hover:bg-emerald-900 border-emerald-400 text-emerald-200 cursor-pointer'
                    : 'bg-stone-900/90 border-stone-700 text-stone-500 cursor-not-allowed'
                }`}
                title={isId ? 'Gendong teman bot terdekat selama 10 detik dengan Sarung Tangan Sirkus (Sekali Pakai)' : 'Carry nearest companion bot safely for 10s with Circus Gloves (Single-Use)'}
              >
                <HandHeart className="w-3.5 h-3.5" />
                <span>
                  {gameWorld.carriedBot
                    ? `[T] ${isId ? 'TARUH' : 'DROP'} ${gameWorld.carriedBot.botName.toUpperCase()} (${gameWorld.carriedBot.timer.toFixed(0)}s)`
                    : gameWorld.nearbyCarryBot
                    ? `[T] ${isId ? 'GENDONG' : 'CARRY'} ${gameWorld.nearbyCarryBot.name.toUpperCase()} (x${gameWorld.circusGlovesCount})`
                    : `[T] SARUNG TANGAN (x${gameWorld.circusGlovesCount})`}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* =======================================================
          6. BOTTOM-RIGHT / SIDE: LIVE REACTIVE CHAT LOG
          ======================================================= */}
      <div className={`absolute ${isMobile ? 'bottom-3 right-3 max-w-[215px]' : 'bottom-6 right-6 max-w-sm'} pointer-events-auto w-full`}>
        <div className="bg-stone-950/95 border border-stone-800 rounded-xl shadow-2xl overflow-hidden">
          {/* Chat Header */}
          <div
            onClick={() => setChatExpanded(!chatExpanded)}
            className="px-3 py-2 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between cursor-pointer text-xs font-mono font-bold text-stone-300"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-red-500" />
              <span>{isMobile ? (isId ? 'CHAT' : 'CHAT') : (isId ? 'RADIO CHAT REKAN BOT' : 'COMPANION RADIO CHAT')}</span>
              <span className="px-1.5 py-0.2 rounded bg-stone-800 text-[10px] text-stone-400">
                {gameWorld.botManager.getAliveBotCount()} {isId ? 'Hidup' : 'Alive'}
              </span>
            </div>
            {chatExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>

          {/* Chat Messages */}
          {chatExpanded && (
            <div className="p-2.5 max-h-48 overflow-y-auto space-y-1.5 font-sans text-xs scrollbar-thin">
              {gameWorld.botManager.chatLog.slice(-6).map((msg) => (
                <div key={msg.id} className="leading-snug bg-stone-900/50 p-1.5 rounded border border-stone-800/40">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-[11px]" style={{ color: msg.color }}>
                      {msg.sender}:
                    </span>
                    <span className="text-[10px] text-stone-600 font-mono">{msg.timestamp}</span>
                  </div>
                  <p className="text-stone-300 text-[11px]">
                    {isId ? msg.textId : msg.textEn}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
