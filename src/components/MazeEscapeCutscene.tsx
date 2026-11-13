/**
 * Maze Escape Car Cutscene (Chapter 2 Finale)
 * Triggered upon escaping through the unlocked Golden Exit Gate:
 * 1. BOARDING: Enter the getaway car & crank the ignition key to start the engine
 * 2. JESTY_CHASE: Jesty bursts out of the burning tent & sprints furiously after the car
 * 3. RAMMING_IMPACT: Slam the gas pedal and run Jesty down at full speed!
 * 4. JESTY_LIFELESS: Rearview shows Jesty collapsed motionless beside his shattered masks
 * 5. ESCAPE_FREEDOM: Speed off down the midnight highway into freedom -> Victory!
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Language } from '../types';
import { horrorAudio } from '../audio/HorrorAudio';
import { SkipForward, Key, Flame, Gauge, Trophy, Skull } from 'lucide-react';

interface Props {
  language: Language;
  survivingBotCount: number;
  onCompleteEscape: () => void;
  onSkip: () => void;
}

type CutscenePhase =
  | 'BOARDING'
  | 'JESTY_CHASE'
  | 'RAMMING_IMPACT'
  | 'JESTY_LIFELESS'
  | 'ESCAPE_FREEDOM';

export const MazeEscapeCutscene: React.FC<Props> = ({
  language,
  survivingBotCount,
  onCompleteEscape,
  onSkip
}) => {
  const isId = language === 'id';
  const [phase, setPhase] = useState<CutscenePhase>('BOARDING');
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [engineStarted, setEngineStarted] = useState<boolean>(false);
  const phaseRef = useRef<CutscenePhase>('BOARDING');
  phaseRef.current = phase;

  const igniteAndDrive = useCallback(() => {
    if (phaseRef.current !== 'BOARDING') return;
    setEngineStarted(true);
    horrorAudio.playCarIgnition();
    setTimeout(() => {
      horrorAudio.startCarDriving();
    }, 650);
    setSpeedKmh(42);
    setPhase('JESTY_CHASE');
    setTimeout(() => {
      horrorAudio.playJestyLaughter();
    }, 350);
  }, []);

  const ramJestyNow = useCallback(() => {
    if (phaseRef.current !== 'JESTY_CHASE') return;
    setSpeedKmh(128);
    setPhase('RAMMING_IMPACT');
    horrorAudio.playCarCrash();
    horrorAudio.playJestyDefeat();
  }, []);

  // Automatic cinematic progression timers so the scene flows smoothly even without clicks
  useEffect(() => {
    let timer: number | undefined;

    if (phase === 'BOARDING') {
      timer = window.setTimeout(() => {
        igniteAndDrive();
      }, 3600);
    } else if (phase === 'JESTY_CHASE') {
      timer = window.setTimeout(() => {
        ramJestyNow();
      }, 4200);
    } else if (phase === 'RAMMING_IMPACT') {
      timer = window.setTimeout(() => {
        setSpeedKmh(65);
        setPhase('JESTY_LIFELESS');
      }, 2700);
    } else if (phase === 'JESTY_LIFELESS') {
      timer = window.setTimeout(() => {
        setSpeedKmh(110);
        horrorAudio.startCarDriving();
        setPhase('ESCAPE_FREEDOM');
      }, 3800);
    }

    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [phase, igniteAndDrive, ramJestyNow]);

  // Cleanup car audio on unmount
  useEffect(() => {
    return () => {
      horrorAudio.stopCarDriving();
    };
  }, []);

  // Space / Enter shortcut for interactive cutscene actions
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (phaseRef.current === 'BOARDING') {
          igniteAndDrive();
        } else if (phaseRef.current === 'JESTY_CHASE') {
          ramJestyNow();
        } else if (phaseRef.current === 'ESCAPE_FREEDOM') {
          horrorAudio.stopCarDriving();
          onCompleteEscape();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [igniteAndDrive, ramJestyNow, onCompleteEscape]);

  const handleSkipClick = () => {
    horrorAudio.stopCarDriving();
    onSkip();
  };

  const handleFinishClick = () => {
    horrorAudio.stopCarDriving();
    onCompleteEscape();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between select-none overflow-hidden font-sans">
      {/* Top Bar: Cutscene Header & Skip Button */}
      <div className="relative z-40 w-full flex items-center justify-between px-6 pt-5">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-300">
          <Gauge className="w-4 h-4 text-amber-400" />
          <span className="font-black text-amber-300">{speedKmh} KM/H</span>
          <span className="text-stone-600">•</span>
          <span className={engineStarted ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
            {engineStarted
              ? (isId ? 'MESIN MENYALA' : 'ENGINE RUNNING')
              : (isId ? 'MESIN MATI' : 'ENGINE OFF')}
          </span>
        </div>

        <button
          onClick={handleSkipClick}
          className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition-colors"
        >
          <span>{isId ? 'Lewati Cutscene' : 'Skip Cutscene'}</span>
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* =========================================================
          CENTER CINEMATIC STAGE (WINDSHIELD / ROAD VISUAL)
          ========================================================= */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-center px-4">
        {/* Background inferno / highway horizon glow */}
        <div
          className={`absolute inset-0 pointer-events-none transition-colors duration-700 ${
            phase === 'BOARDING'
              ? 'bg-gradient-to-b from-red-950/70 via-stone-950 to-black'
              : phase === 'JESTY_CHASE'
              ? 'bg-gradient-to-b from-red-950/85 via-zinc-950 to-black'
              : phase === 'RAMMING_IMPACT'
              ? 'bg-red-900/90 animate-pulse'
              : phase === 'JESTY_LIFELESS'
              ? 'bg-gradient-to-b from-stone-950 via-neutral-950 to-black'
              : 'bg-gradient-to-b from-slate-900 via-stone-950 to-black'
          }`}
        />

        {/* Road Perspective Strip */}
        <div className="relative w-full max-w-3xl h-72 sm:h-80 rounded-3xl border-4 border-stone-800 bg-stone-950 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col items-center justify-center">
          {/* Crimson inferno flames burning behind the tent */}
          {(phase === 'BOARDING' || phase === 'JESTY_CHASE') && (
            <div className="absolute top-3 inset-x-0 flex justify-center gap-6 opacity-80 pointer-events-none">
              <Flame className="w-8 h-8 text-orange-500 animate-bounce" />
              <Flame className="w-10 h-10 text-red-500 animate-pulse" />
              <Flame className="w-8 h-8 text-amber-400 animate-bounce" />
            </div>
          )}

          {/* Twin Headlight Cones */}
          {engineStarted && (
            <div className="absolute inset-x-0 bottom-0 h-56 pointer-events-none flex justify-center gap-16 opacity-35">
              <div className="w-36 h-full bg-gradient-to-t from-amber-200 via-amber-100/20 to-transparent -skew-x-12" />
              <div className="w-36 h-full bg-gradient-to-t from-amber-200 via-amber-100/20 to-transparent skew-x-12" />
            </div>
          )}

          {/* PHASE 1: BOARDING & STARTING CAR */}
          {phase === 'BOARDING' && (
            <div className="relative z-20 flex flex-col items-center text-center px-6">
              <div className="text-6xl sm:text-7xl mb-3">🚗</div>
              <div className="px-4 py-1.5 rounded-full bg-amber-950 border border-amber-500 text-amber-300 font-mono font-black text-xs uppercase tracking-widest mb-3">
                {isId ? 'DI LUAR GERBANG LABIRIN YANG TERBAKAR' : 'OUTSIDE THE BURNING LABYRINTH GATE'}
              </div>
              <button
                onClick={igniteAndDrive}
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 border-2 border-amber-300 text-black font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.8)] flex items-center gap-2 cursor-pointer animate-bounce"
              >
                <Key className="w-5 h-5" />
                <span>{isId ? 'PUTAR KUNCI & NYALAKAN MOBIL! [SPACE]' : 'TURN KEY & START ENGINE! [SPACE]'}</span>
              </button>
            </div>
          )}

          {/* PHASE 2: JESTY STILL CHASING THE CAR */}
          {phase === 'JESTY_CHASE' && (
            <div className="relative z-20 flex flex-col items-center text-center px-6">
              <div className="relative flex items-center justify-center mb-2 animate-bounce">
                <div className="text-7xl sm:text-8xl filter drop-shadow-[0_0_40px_rgba(239,68,68,0.95)]">
                  🤡
                </div>
                <span className="ml-2 text-4xl">🎭</span>
              </div>
              <div className="px-4 py-1 rounded-lg bg-red-950 border border-red-500 text-red-200 font-serif font-black text-base sm:text-xl uppercase tracking-wider mb-3">
                {isId ? 'JESTY MENERJANG KE DEPAN MOBIL!!' : 'JESTY SPRINTS STRAIGHT AT THE CAR!!'}
              </div>
              <button
                onClick={ramJestyNow}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 border-2 border-amber-300 text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_0_35px_rgba(239,68,68,0.9)] cursor-pointer animate-pulse"
              >
                ⚡ {isId ? 'INJAK GAS PENUH & TABRAK JESTY! [SPACE]' : 'FLOOR THE GAS & RAM JESTY! [SPACE]'}
              </button>
            </div>
          )}

          {/* PHASE 3: HIGH-SPEED IMPACT */}
          {phase === 'RAMMING_IMPACT' && (
            <div className="relative z-20 flex flex-col items-center text-center px-6 animate-bounce">
              <div className="text-5xl sm:text-7xl font-black text-white font-serif tracking-widest uppercase drop-shadow-[0_0_25px_rgba(255,255,255,0.9)]">
                💥 BRAAAKK!! 💥
              </div>
              <div className="mt-3 flex items-center gap-4 text-3xl sm:text-4xl">
                <span className="rotate-[-28deg] opacity-90">🎭</span>
                <span className="text-red-400 font-mono text-sm sm:text-base font-black uppercase">
                  {isId ? 'TOPENG HANCUR BERKEPING-KEPING!!' : 'MASKS SHATTERED ON IMPACT!!'}
                </span>
                <span className="rotate-[32deg] opacity-90">💔</span>
              </div>
            </div>
          )}

          {/* PHASE 4: JESTY COLLAPSED & LIFELESS */}
          {phase === 'JESTY_LIFELESS' && (
            <div className="relative z-20 flex flex-col items-center text-center px-6">
              {/* Red taillight glow circle */}
              <div className="w-28 h-28 rounded-full bg-red-950/80 border-2 border-red-700/70 flex flex-col items-center justify-center mb-3 shadow-[0_0_45px_rgba(185,28,28,0.7)]">
                <Skull className="w-12 h-12 text-stone-300" />
              </div>
              <div className="px-4 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 font-serif font-black text-base sm:text-xl uppercase tracking-wider">
                {isId ? 'JESTY TERKAPAR TAK BERNYAWA...' : 'JESTY LIES LIFELESS ON THE ROAD...'}
              </div>
              <p className="text-xs font-mono text-red-400 mt-2">
                {isId ? 'Tidak ada gerakan lagi di kaca spion.' : 'No movement left in the rearview mirror.'}
              </p>
            </div>
          )}

          {/* PHASE 5: ESCAPED INTO THE NIGHT -> VICTORY */}
          {phase === 'ESCAPE_FREEDOM' && (
            <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-lg">
              <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(16,185,129,0.7)]">
                <Trophy className="w-8 h-8 text-emerald-300" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-400 font-serif uppercase tracking-wider mb-2">
                {isId ? 'BERHASIL KABUR SELAMAT!' : 'ESCAPED ALIVE!'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-4">
                {isId
                  ? `Tenda Labirin yang terbakar semakin menjauh di belakang. Bersama ${survivingBotCount} rekan yang selamat, kalian akhirnya bebas dari mimpi buruk Jacky & Jesty!`
                  : `The burning Labyrinth Tent fades into the distance. Together with ${survivingBotCount} surviving companions, you have finally escaped Jacky & Jesty's nightmare!`}
              </p>
              <button
                onClick={handleFinishClick}
                className="px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_0_30px_rgba(16,185,129,0.8)] cursor-pointer flex items-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                <span>{isId ? 'SELESAIKAN PELARIAN' : 'COMPLETE ESCAPE'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          BOTTOM SUBTITLE / DIALOGUE SCRIPT BOX
          ========================================================= */}
      <div className="relative z-40 w-full max-w-2xl mx-auto px-4 pb-7">
        <div className="bg-stone-950 border-2 border-stone-700 rounded-2xl p-4 sm:p-5 shadow-2xl text-center">
          {phase === 'BOARDING' && (
            <>
              <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest mb-1">
                🔑 {isId ? 'ADEGAN 1: MASUK & NYALAKAN MOBIL' : 'SCENE 1: BOARD & IGNITE CAR'}
              </div>
              <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                {isId
                  ? 'Kamu berlari melewati Gerbang Keluar yang terbuka dan langsung naik ke dalam mobil pelarian! Tanganmu bergetar memutar kunci kontak untuk menyalakan mesin...'
                  : 'You sprint through the open Exit Gate and leap into the getaway car! Your trembling hands turn the ignition key to crank the engine...'}
              </p>
            </>
          )}

          {phase === 'JESTY_CHASE' && (
            <>
              <div className="text-[11px] font-mono font-bold text-red-400 uppercase tracking-widest mb-1">
                🎭 {isId ? 'ADEGAN 2: JESTY MASIH MENGEJAR!' : 'SCENE 2: JESTY IS STILL CHASING!'}
              </div>
              <p className="text-sm sm:text-base font-bold text-red-100 leading-relaxed">
                {isId
                  ? 'Mesin meraung! Namun dari balik kobaran api tenda, Jesty berlari kencang menghampiri mobil sambil tertawa gila: "MAU KABUR KE MANA?! PERTUNJUKAN BELUM SELESAI!!"'
                  : 'The engine roars to life! Suddenly Jesty bursts out of the roaring flames chasing the car with a maniacal laugh: "WHERE ARE YOU GOING?! THE SHOW ISN\'T OVER!!"'}
              </p>
            </>
          )}

          {phase === 'RAMMING_IMPACT' && (
            <>
              <div className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-widest mb-1">
                💥 {isId ? 'ADEGAN 3: MENABRAK JESTY!' : 'SCENE 3: FULL-SPEED COLLISION!'}
              </div>
              <p className="text-sm sm:text-base font-black text-white leading-relaxed">
                {isId
                  ? '"PEGANGAN!! INJAK GAS PENUH!!" Kamu tancap gas sekuat tenaga hingga mobil menghantam keras tubuh Jesty dan memecahkan topengnya!'
                  : '"HOLD ON!! FLOOR IT!!" You slam the accelerator all the way down, smashing straight into Jesty and shattering his mask!'}
              </p>
            </>
          )}

          {phase === 'JESTY_LIFELESS' && (
            <>
              <div className="text-[11px] font-mono font-bold text-stone-400 uppercase tracking-widest mb-1">
                💀 {isId ? 'ADEGAN 4: JESTY TAK BERNYAWA' : 'SCENE 4: JESTY LIES LIFELESS'}
              </div>
              <p className="text-sm sm:text-base font-bold text-stone-200 leading-relaxed">
                {isId
                  ? 'Di bawah sorot lampu belakang mobil yang merah, tubuh Jesty terkapar kaku di tengah aspal gelap dan tak bernyawa lagi. Mimpi buruk sang badut berakhir.'
                  : 'Under the crimson glow of the taillights, Jesty\'s body lies completely motionless and lifeless on the dark asphalt. The jester\'s reign of terror is over.'}
              </p>
            </>
          )}

          {phase === 'ESCAPE_FREEDOM' && (
            <>
              <div className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1">
                📻 {isId ? 'ADEGAN 5: MELARIKAN DIRI DARI SIRKUS' : 'SCENE 5: ESCAPE INTO THE NIGHT'}
              </div>
              <p className="text-sm sm:text-base font-bold text-emerald-100 leading-relaxed">
                {isId
                  ? survivingBotCount > 0
                    ? `"KITA BERHASIL!! Jesty sudah tewas tertabrak dan tenda sirkus itu hancur di belakang kita! Ayo pergi jauh dan jangan pernah kembali!"`
                    : `"Aku selamat... Sendirian, namun Jesty telah terkapar tak bernyawa di belakang sana. Aku benar-benar bebas!"`
                  : survivingBotCount > 0
                  ? `"WE DID IT!! Jesty is down for good and the burning carnival is behind us! Drive away and never look back!"`
                  : `"I made it out... Alone, yet Jesty lies lifeless back on that road. I am finally free!"`}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
