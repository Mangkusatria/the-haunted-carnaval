/**
 * Car Crash Cutscene & Chapter 2 Awakening
 * Triggered after escaping the Fairground North Gate:
 * Surviving players escape in a car -> Jacky leaps onto the hood -> Violent crash ->
 * Awakening inside the Endless Circus Maze with surviving companion bots!
 */

import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { horrorAudio } from '../audio/HorrorAudio';
import { AlertTriangle, Compass, Play, SkipForward } from 'lucide-react';

interface Props {
  language: Language;
  survivingBotCount?: number;
  onEnterMaze: () => void;
  onSkip?: () => void;
}

export const CarCrashCutscene: React.FC<Props> = ({
  language,
  survivingBotCount = 4,
  onEnterMaze,
  onSkip
}) => {
  const isId = language === 'id';
  const [phase, setPhase] = useState<'DRIVING' | 'AMBUSH' | 'CRASH' | 'AWAKENING'>('DRIVING');
  const [time, setTime] = useState<number>(0);

  useEffect(() => {
    // Start car engine audio
    horrorAudio.startCarDriving();

    const interval = setInterval(() => {
      setTime((prev) => {
        const next = prev + 0.1;
        if (next >= 3.6 && next < 6.8 && phase === 'DRIVING') {
          setPhase('AMBUSH');
          horrorAudio.playSpringLaunch();
          setTimeout(() => {
            horrorAudio.playJackyChuckle();
          }, 300);
        } else if (next >= 6.8 && next < 9.5 && (phase === 'DRIVING' || phase === 'AMBUSH')) {
          setPhase('CRASH');
          horrorAudio.playCarCrash();
        } else if (next >= 9.5 && phase !== 'AWAKENING') {
          setPhase('AWAKENING');
        }
        return next;
      });
    }, 100);

    return () => {
      clearInterval(interval);
      horrorAudio.stopCarDriving();
    };
  }, [phase]);

  const handleSkip = () => {
    horrorAudio.stopCarDriving();
    onEnterMaze();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none overflow-hidden font-sans">
      {/* Skip Button (Top-Right) */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-50 px-4 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition-colors"
      >
        <span>{isId ? 'Lewati Cutscene' : 'Skip Cutscene'}</span>
        <SkipForward className="w-3.5 h-3.5" />
      </button>

      {/* =========================================================
          PHASE 1: DRIVING ON THE DARK RAINY HIGHWAY (0 - 3.5s)
          ========================================================= */}
      {phase === 'DRIVING' && (
        <div className="relative w-full h-full flex flex-col justify-between p-8 bg-gradient-to-b from-stone-950 via-zinc-950 to-stone-900">
          {/* Headlights cutting through highway fog */}
          <div className="absolute inset-0 pointer-events-none flex justify-center items-center">
            <div className="w-[600px] h-[400px] bg-gradient-to-t from-amber-100/15 via-amber-200/5 to-transparent rounded-full blur-3xl transform rotate-12 animate-pulse" />
          </div>

          {/* Rushing Road Lines */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-64 flex flex-col justify-between items-center opacity-40 overflow-hidden">
            <div className="w-4 h-16 bg-amber-400 rounded-sm animate-bounce" />
            <div className="w-4 h-16 bg-amber-400 rounded-sm animate-bounce" />
          </div>

          {/* Rain streaks on windshield */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Dashboard Gauges Header */}
          <div className="relative z-10 flex items-center justify-between text-stone-400 font-mono text-xs max-w-2xl mx-auto w-full pt-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isId ? 'MOBIL SIRKUS PELARIAN' : 'GETAWAY CAR'}</span>
            </div>
            <div className="text-amber-400 font-bold tracking-widest text-sm">
              95 KM/H • 03:42 AM
            </div>
          </div>

          {/* Radio Companion Dialogue Subtitles */}
          <div className="relative z-10 max-w-xl mx-auto w-full bg-stone-950/90 border border-stone-800 rounded-2xl p-4 shadow-2xl text-center">
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
              <span>📻 RADIO MOBIL PELARIAN</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-white leading-relaxed">
              {isId
                ? '"HOREEE!! KITA BERHASIL KELUAR DARI SIRKUS SIALAN ITU!! Injak gas lebih dalam, tinggalkan monster itu!!"'
                : '"WE MADE IT!! WE ESCAPED THAT CURSED CARNIVAL!! Step on the gas, leave that monster behind!!"'}
            </p>
          </div>
        </div>
      )}

      {/* =========================================================
          PHASE 2: JACKY'S MEGA LEAP AMBUSH ON THE HOOD (3.6 - 6.8s)
          ========================================================= */}
      {phase === 'AMBUSH' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-red-950/80 animate-pulse">
          {/* Shattered Windshield Spiderweb overlay */}
          <div className="absolute inset-0 pointer-events-none border-[16px] border-red-700/80 shadow-[inset_0_0_120px_rgba(239,68,68,0.9)]" />

          {/* Jacky Grinning Face Landing on Hood */}
          <div className="relative z-20 flex flex-col items-center animate-bounce">
            <div className="text-8xl sm:text-9xl filter drop-shadow-[0_0_50px_rgba(239,68,68,1)] transform scale-110">
              🤡
            </div>
            <div className="mt-4 px-6 py-2 rounded-2xl bg-red-950 border-2 border-red-500 text-white font-serif font-black text-xl sm:text-3xl text-center shadow-[0_0_50px_rgba(239,68,68,0.9)] uppercase tracking-wider">
              {isId ? 'JACKY MENDARAT DI ATAS KAP MOBIL!!' : 'JACKY SLAMMED ONTO THE HOOD!!'}
            </div>
          </div>

          {/* Jacky Psycho Dialog Banner */}
          <div className="absolute bottom-12 max-w-xl w-full mx-auto px-4 z-20">
            <div className="bg-black/95 border-2 border-red-600 rounded-2xl p-4 text-center shadow-2xl">
              <div className="text-xs font-mono font-black text-red-400 uppercase tracking-widest mb-1">
                🤡 JACKY (MONSTER SIRKUS)
              </div>
              <p className="text-base sm:text-lg font-black text-red-100 italic">
                {isId
                  ? '"HEHEHEHE... NYENGAR-NYENGIR! MAU KABUR KE MANA, TEMAN-TEMANKU?! PERTUNJUKAN KITA BARU SAJA DIMULAI!!"'
                  : '"HEHEHEHE... SMIRKING! WHERE DO YOU THINK YOU\'RE GOING, FRIENDS?! OUR SHOW HAS ONLY JUST BEGUN!!"'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          PHASE 3: VIOLENT CRASH & ROLLOVER (6.8 - 9.5s)
          ========================================================= */}
      {phase === 'CRASH' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-red-950 animate-ping">
          <div className="text-6xl sm:text-8xl font-black text-white font-serif tracking-widest uppercase">
            💥 CRASH!! 💥
          </div>
          <div className="text-lg text-red-300 font-mono mt-4">
            {isId ? 'MOBIL TERGULING JATUH KE DALAM JURANG SIRKUS...' : 'THE CAR ROLLS INTO THE DEEP CHASM...'}
          </div>
        </div>
      )}

      {/* =========================================================
          PHASE 4: AWAKENING IN THE CIRCUS MAZE (CHAPTER 2)
          ========================================================= */}
      {phase === 'AWAKENING' && (
        <div className="relative max-w-2xl w-full mx-4 bg-stone-950 border-2 border-red-700/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(220,38,38,0.7)] text-stone-100 text-center animate-in fade-in duration-700">
          {/* Chapter Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/80 border border-red-500 text-red-300 text-xs font-mono font-black uppercase tracking-widest mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{isId ? 'BABAK 2: SIRKUS LABIRIN' : 'CHAPTER 2: THE CIRCUS MAZE'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white font-serif tracking-wider mb-4 uppercase">
            {isId ? 'TERBANGUN DI DALAM LABIRIN' : 'AWAKENED IN THE LABYRINTH'}
          </h2>

          <div className="space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed font-sans mb-6 text-left bg-stone-900/70 border border-stone-800/80 rounded-2xl p-4 sm:p-5">
            <p className="flex items-start gap-2">
              <span className="text-red-500 font-bold">1.</span>
              <span>
                {isId
                  ? 'Mobil pelarianmu hancur lebur menabrak jurang sirkus setelah disergap Jacky dari udara.'
                  : 'Your getaway car was destroyed plunging into the carnival ravine after Jacky ambushed you from the sky.'}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-red-500 font-bold">2.</span>
              <span>
                {isId
                  ? `Kamu dan ${survivingBotCount} rekan survivor yang selamat tersadar di samping rongsokan mobil di dalam LABIRIN SIRKUS yang super duper luas!`
                  : `You and ${survivingBotCount} surviving companions wake up beside the wreckage inside an immense, winding CIRCUS MAZE!`}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-red-500 font-bold">3.</span>
              <span className="text-amber-300 font-semibold">
                {isId
                  ? 'Jacky masih berkeliaran di lorong-lorong labirin dan siap melompat menerkam! Ada lemari sirkus untuk bersembunyi.'
                  : 'Jacky still roams the labyrinth corridors, ready to leap! Look for carnival lockers to hide.'}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">4.</span>
              <span className="text-emerald-300 font-bold">
                {isId
                  ? 'MISI BARU: Telusuri lorong-lorong labirin bersama rekan botmu dan temukan PINTU EXIT LABIRIN (Pintu Gerbang Emas Berlampu Hijau) untuk benar-benar selamat!'
                  : 'NEW MISSION: Navigate the maze corridors with your companions and find the GOLDEN EXIT DOOR (Green Neon Sign) to truly escape!'}
              </span>
            </p>
          </div>

          {/* Action Button: Enter the Maze */}
          <button
            onClick={onEnterMaze}
            className="w-full py-4 bg-gradient-to-r from-red-700 via-red-600 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-extrabold text-base sm:text-lg rounded-xl shadow-[0_0_35px_rgba(220,38,38,0.7)] transition-all flex items-center justify-center gap-3 cursor-pointer uppercase tracking-wider group"
          >
            <Compass className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            <span>{isId ? '🎪 MASUKI LABIRIN & TEMUKAN PINTU EXIT' : '🎪 ENTER MAZE & FIND EXIT DOOR'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
