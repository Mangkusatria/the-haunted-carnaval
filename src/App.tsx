/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameWorld } from './game/GameWorld';
import { GameStatus, Language, InterrogationPrompt, DeviceMode } from './types';
import { MainMenuModal } from './components/MainMenuModal';
import { HUD } from './components/HUD';
import { InterrogationModal } from './components/InterrogationModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { RestartModal } from './components/RestartModal';
import { CarCrashCutscene } from './components/CarCrashCutscene';
import { MazeEscapeCutscene } from './components/MazeEscapeCutscene';
import { CheatModal } from './components/CheatModal';
import { Volume2, VolumeX, Eye, HelpCircle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { horrorAudio } from './audio/HorrorAudio';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameWorldRef = useRef<GameWorld | null>(null);

  // App UI State
  const [gameStatus, setGameStatus] = useState<GameStatus>('MENU');
  const [language, setLanguage] = useState<Language>('id');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() => {
    if (typeof window !== 'undefined') {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const smallScreen = window.innerWidth <= 920;
      return hasTouch && smallScreen ? 'MOBILE' : 'PC';
    }
    return 'PC';
  });
  const [botCount, setBotCount] = useState<number>(6); // Default 6 companion bots (selectable 2 to 16)
  const [interrogationPrompt, setInterrogationPrompt] = useState<InterrogationPrompt | null>(null);
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showBottomDock, setShowBottomDock] = useState<boolean>(true);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState<boolean>(false);
  const [isCheatModalOpen, setIsCheatModalOpen] = useState<boolean>(false);
  const [rerenderTick, setRerenderTick] = useState<number>(0);

  const PISTOL_STORAGE_KEY = 'jacky_circus_pistol_count';
  const [circusPistolCount, setCircusPistolCount] = useState<number>(() => {
    try {
      const saved = parseInt(localStorage.getItem(PISTOL_STORAGE_KEY) || '0', 10);
      return Number.isFinite(saved) && saved > 0 ? saved : 0;
    } catch {
      return 0;
    }
  });
  const circusPistolCountRef = useRef<number>(circusPistolCount);
  const victoryRewardGrantedRef = useRef<boolean>(false);

  const updatePistolInventory = (nextCount: number) => {
    const safeCount = Math.max(0, nextCount);
    circusPistolCountRef.current = safeCount;
    setCircusPistolCount(safeCount);
    try {
      localStorage.setItem(PISTOL_STORAGE_KEY, String(safeCount));
    } catch {}
    if (gameWorldRef.current) {
      gameWorldRef.current.circusPistolCount = safeCount;
    }
  };

  const grantCircusPistolReward = () => {
    if (victoryRewardGrantedRef.current) return;
    victoryRewardGrantedRef.current = true;
    updatePistolInventory(circusPistolCountRef.current + 1);
  };

  useEffect(() => {
    if (gameWorldRef.current) {
      gameWorldRef.current.deviceMode = deviceMode;
    }
  }, [deviceMode]);

  // Initialize Three.js GameWorld
  useEffect(() => {
    if (!mountRef.current) return;

    const gw = new GameWorld(mountRef.current, botCount);
    gw.circusPistolCount = circusPistolCountRef.current;
    gameWorldRef.current = gw;

    // Connect callbacks
    gw.onStateUpdate = () => {
      // Throttle React state sync
      setRerenderTick((t) => (t + 1) % 1000);
    };

    gw.onPistolCountChange = (newCount: number) => {
      updatePistolInventory(newCount);
    };

    gw.onCheatMenuOpened = () => {
      setIsCheatModalOpen(true);
    };

    gw.onInterrogationTriggered = (prompt) => {
      setInterrogationPrompt(prompt);
      setGameStatus('INTERROGATION');
    };

    gw.onGameOver = (reason) => {
      setGameOverReason(reason);
      setGameStatus('GAMEOVER');
    };

    gw.onVictory = () => {
      grantCircusPistolReward();
      setGameStatus('VICTORY');
    };

    gw.onCarCutsceneTriggered = () => {
      setGameStatus('CAR_CUTSCENE');
    };

    gw.onMazeEscapeCutsceneTriggered = () => {
      setGameStatus('MAZE_ESCAPE_CUTSCENE');
    };

    gw.onMazeVictory = () => {
      grantCircusPistolReward();
      setGameStatus('MAZE_VICTORY');
    };

    return () => {
      gw.dispose();
      gameWorldRef.current = null;
    };
  }, []);

  // Listen for Escape key to toggle Restart / Unstuck / Main Menu modal (or close Cheat modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.key === 'Escape') {
        if (isCheatModalOpen) {
          setIsCheatModalOpen(false);
          if (gameWorldRef.current) {
            gameWorldRef.current.isCheatMenuOpen = false;
            gameWorldRef.current.player.graceTimer = Math.max(gameWorldRef.current.player.graceTimer, 2.0);
          }
          return;
        }
        if (gameStatus === 'PLAYING' || gameStatus === 'MAZE_PLAYING') {
          setIsRestartModalOpen((prev) => !prev);
          try {
            document.exitPointerLock?.();
          } catch {}
        } else if (isRestartModalOpen) {
          setIsRestartModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, isRestartModalOpen, isCheatModalOpen]);

  const handleStartGame = () => {
    victoryRewardGrantedRef.current = false;
    const gw = gameWorldRef.current;
    if (gw) {
      gw.deviceMode = deviceMode;
      gw.circusPistolCount = circusPistolCountRef.current;
      gw.restartGame(botCount);
      gw.gameStatus = 'PLAYING';
      if (deviceMode === 'PC') {
        try {
          gw.renderer.domElement.requestPointerLock?.();
        } catch {}
      }
    }
    setIsRestartModalOpen(false);
    setIsCheatModalOpen(false);
    setGameStatus('PLAYING');
  };

  const handleInterrogationChoice = (action: 'BETRAY' | 'REFUSE' | 'LIE' | 'TIMEOUT') => {
    const gw = gameWorldRef.current;
    if (gw) {
      gw.resolveInterrogation(action);
      setInterrogationPrompt(null);
      if (gw.gameStatus === 'PLAYING') {
        setGameStatus('PLAYING');
      }
    }
  };

  const handleRestart = () => {
    victoryRewardGrantedRef.current = false;
    const gw = gameWorldRef.current;
    if (gw) {
      gw.deviceMode = deviceMode;
      gw.circusPistolCount = circusPistolCountRef.current;
      gw.restartGame(botCount);
      gw.gameStatus = 'PLAYING';
      if (deviceMode === 'PC') {
        try {
          gw.renderer.domElement.requestPointerLock?.();
        } catch {}
      }
    }
    setInterrogationPrompt(null);
    setGameOverReason('');
    setIsRestartModalOpen(false);
    setIsCheatModalOpen(false);
    setGameStatus('PLAYING');
  };

  const handleReturnToMenu = () => {
    victoryRewardGrantedRef.current = false;
    const gw = gameWorldRef.current;
    if (gw) {
      gw.circusPistolCount = circusPistolCountRef.current;
      gw.returnToMenu(botCount);
    }
    setIsRestartModalOpen(false);
    setIsCheatModalOpen(false);
    setInterrogationPrompt(null);
    setGameOverReason('');
    setGameStatus('MENU');
  };

  const handleUnstuck = () => {
    const gw = gameWorldRef.current;
    if (gw) {
      gw.unstuckPlayer();
      if (deviceMode === 'PC') {
        try {
          gw.renderer.domElement.requestPointerLock?.();
        } catch {}
      }
    }
    setIsRestartModalOpen(false);
  };

  const handleResume = () => {
    setIsRestartModalOpen(false);
    const gw = gameWorldRef.current;
    if (gw && deviceMode === 'PC') {
      try {
        gw.renderer.domElement.requestPointerLock?.();
      } catch {}
    }
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (next) {
      horrorAudio.setVolumes(0, 0, 0);
    } else {
      horrorAudio.setVolumes(0.8, 0.7, 0.8);
    }
  };

  const toggleCameraMode = () => {
    if (gameWorldRef.current) {
      gameWorldRef.current.isThirdPerson = !gameWorldRef.current.isThirdPerson;
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 1. DEDICATED WebGL CANVAS CONTAINER */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* 2. IN-GAME HORROR HUD (WHEN PLAYING CHAPTER 1 OR CHAPTER 2) */}
      {(gameStatus === 'PLAYING' || gameStatus === 'MAZE_PLAYING') && gameWorldRef.current && (
        <HUD
          gameWorld={gameWorldRef.current}
          language={language}
          deviceMode={deviceMode}
          onOpenRestartModal={() => setIsRestartModalOpen(true)}
        />
      )}

      {/* 2.5 CHAPTER 1 ESCAPE -> GETAWAY CAR AMBUSH CUTSCENE */}
      {gameStatus === 'CAR_CUTSCENE' && gameWorldRef.current && (
        <CarCrashCutscene
          language={language}
          survivingBotCount={gameWorldRef.current.botManager.getAliveBotCount()}
          onEnterMaze={() => {
            gameWorldRef.current?.startCircusMaze();
            setGameStatus('MAZE_PLAYING');
          }}
          onSkip={() => {
            gameWorldRef.current?.startCircusMaze();
            setGameStatus('MAZE_PLAYING');
          }}
        />
      )}

      {/* 2.6 CHAPTER 2 MAZE FINALE -> GETAWAY CAR RAMMING JESTY CUTSCENE */}
      {gameStatus === 'MAZE_ESCAPE_CUTSCENE' && gameWorldRef.current && (
        <MazeEscapeCutscene
          language={language}
          survivingBotCount={gameWorldRef.current.botManager.getAliveBotCount()}
          onCompleteEscape={() => {
            if (gameWorldRef.current) {
              gameWorldRef.current.gameStatus = 'MAZE_VICTORY';
            }
            grantCircusPistolReward();
            horrorAudio.playMazeDoorUnlock();
            setGameStatus('MAZE_VICTORY');
          }}
          onSkip={() => {
            if (gameWorldRef.current) {
              gameWorldRef.current.gameStatus = 'MAZE_VICTORY';
            }
            grantCircusPistolReward();
            horrorAudio.playMazeDoorUnlock();
            setGameStatus('MAZE_VICTORY');
          }}
        />
      )}

      {/* 3. MAIN MENU MODAL (Tombol Start di tengah, opsi bot 2-16 & pilih device di atas, tips & hint di bawah) */}
      {gameStatus === 'MENU' && (
        <MainMenuModal
          botCount={botCount}
          setBotCount={setBotCount}
          deviceMode={deviceMode}
          setDeviceMode={setDeviceMode}
          language={language}
          setLanguage={setLanguage}
          circusPistolCount={circusPistolCount}
          onStartGame={handleStartGame}
        />
      )}

      {/* 4. JACKY INTERROGATION / BETRAYAL MODAL */}
      {gameStatus === 'INTERROGATION' && interrogationPrompt && (
        <InterrogationModal
          prompt={interrogationPrompt}
          language={language}
          onChoice={handleInterrogationChoice}
        />
      )}

      {/* 5. GAME OVER MODAL */}
      {gameStatus === 'GAMEOVER' && gameWorldRef.current && (
        <GameOverModal
          reason={gameOverReason}
          language={language}
          boxesCollected={gameWorldRef.current.objectives.boxesCollected}
          onRestart={handleRestart}
          onReturnToMenu={handleReturnToMenu}
        />
      )}

      {/* 6. VICTORY MODAL (CHAPTER 1 OR CHAPTER 2) */}
      {(gameStatus === 'VICTORY' || gameStatus === 'MAZE_VICTORY') && gameWorldRef.current && (
        <VictoryModal
          language={language}
          boxesCollected={gameWorldRef.current.objectives.boxesCollected}
          survivingBots={gameWorldRef.current.botManager.getAliveBotCount()}
          totalBots={botCount}
          isMazeVictory={gameStatus === 'MAZE_VICTORY'}
          circusPistolCount={circusPistolCount}
          onRestart={handleRestart}
          onReturnToMenu={handleReturnToMenu}
        />
      )}

      {/* 6.5 IN-GAME MAIN ULANG & UNSTUCK MODAL (JIKA STUCK / BUG) */}
      {isRestartModalOpen && (
        <RestartModal
          language={language}
          onResume={handleResume}
          onReturnToMenu={handleReturnToMenu}
          onUnstuck={handleUnstuck}
        />
      )}

      {/* 6.6 SECRET CARNIVAL CHEAT MODAL (3 CHEAT OPTIONS) */}
      {isCheatModalOpen && gameWorldRef.current && (
        <CheatModal
          language={language}
          circusPistolCount={circusPistolCount}
          onGivePistol={() => {
            updatePistolInventory(circusPistolCountRef.current + 1);
            horrorAudio.playKeyCollectChime();
            gameWorldRef.current?.botManager.addChatMessage(
              'Cheat System',
              '#f472b6',
              '😏 [CHEAT] Mendapatkan +1 Pistol Sirkus!',
              '😏 [CHEAT] Granted +1 Circus Pistol!',
              'INFO'
            );
          }}
          onSkipChapter1={() => {
            const gw = gameWorldRef.current;
            setIsCheatModalOpen(false);
            if (gw) {
              gw.isCheatMenuOpen = false;
              gw.startCircusMaze();
              setGameStatus('MAZE_PLAYING');
              if (deviceMode === 'PC') {
                try {
                  gw.renderer.domElement.requestPointerLock?.();
                } catch {}
              }
            }
          }}
          onActivatePanicMode={() => {
            const gw = gameWorldRef.current;
            setIsCheatModalOpen(false);
            if (gw) {
              gw.isCheatMenuOpen = false;
              gw.activatePanicModeCheat();
              if (deviceMode === 'PC') {
                try {
                  gw.renderer.domElement.requestPointerLock?.();
                } catch {}
              }
            }
          }}
          onClose={() => {
            const gw = gameWorldRef.current;
            setIsCheatModalOpen(false);
            if (gw) {
              gw.isCheatMenuOpen = false;
              gw.player.graceTimer = Math.max(gw.player.graceTimer, 2.0);
              if (deviceMode === 'PC') {
                try {
                  gw.renderer.domElement.requestPointerLock?.();
                } catch {}
              }
            }
          }}
        />
      )}

      {/* 7. UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK (PC ONLY — hidden on Mobile to keep phone viewport clean) */}
      {deviceMode === 'PC' && (gameStatus === 'PLAYING' || gameStatus === 'MAZE_PLAYING') && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-auto">
          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => setShowBottomDock(!showBottomDock)}
            className="px-3 py-1 bg-stone-900/80 hover:bg-stone-800 border-t border-x border-stone-800 text-stone-400 hover:text-stone-200 text-[11px] font-mono rounded-t-lg flex items-center gap-1 transition-colors cursor-pointer"
          >
            {showBottomDock ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            <span>{showBottomDock ? 'Hide Dock' : 'Controls & Dock'}</span>
          </button>

          {/* Dock Bar */}
          {showBottomDock && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-stone-950/90 border border-stone-800 rounded-xl shadow-2xl text-xs font-mono text-stone-300 backdrop-blur-md">
              {/* Main Ulang / Menu Awal & Unstuck */}
              <button
                onClick={() => setIsRestartModalOpen(true)}
                className="px-2.5 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-700/70 hover:border-red-500 flex items-center gap-1.5 cursor-pointer text-red-200 hover:text-white transition-all shadow-sm"
                title={language === 'id' ? 'Menu Utama / Main Ulang & Unstuck (ESC)' : 'Main Menu / Restart & Unstuck (ESC)'}
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                <span>{language === 'id' ? '[ESC] Menu / Unstuck' : '[ESC] Menu / Unstuck'}</span>
              </button>

              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700/60 flex items-center gap-1.5 cursor-pointer text-stone-300 hover:text-white"
                title="Mute/Unmute Audio"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isMuted ? 'Muted' : 'Audio On'}</span>
              </button>

              {/* View Perspective Toggle */}
              <button
                onClick={toggleCameraMode}
                className="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700/60 flex items-center gap-1.5 cursor-pointer text-stone-300 hover:text-white"
                title="Toggle 1st / 3rd Person View (Key V)"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>[V] {gameWorldRef.current?.isThirdPerson ? '3rd Person' : '1st Person'}</span>
              </button>

              {/* Language Switch */}
              <button
                onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
                className="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700/60 text-stone-300 hover:text-white cursor-pointer"
              >
                {language === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
