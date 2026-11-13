/**
 * Restart & Unstuck Modal
 * Used when players get stuck or encounter a bug:
 * - Option to return to Main Menu (Main Ulang)
 * - Option to Unstuck character to safe open ground without losing progress
 * - Option to Resume play
 */

import React from 'react';
import { Language } from '../types';
import { Home, Compass, Play, AlertCircle, Wrench } from 'lucide-react';

interface Props {
  language: Language;
  onResume: () => void;
  onReturnToMenu: () => void;
  onUnstuck: () => void;
}

export const RestartModal: React.FC<Props> = ({
  language,
  onResume,
  onReturnToMenu,
  onUnstuck
}) => {
  const isId = language === 'id';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-in fade-in">
      <div className="relative max-w-md w-full bg-stone-950 border-2 border-stone-800 hover:border-red-600/60 rounded-2xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.9)] text-stone-100 font-sans transition-colors">
        {/* Header Icon */}
        <div className="flex items-center justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.3)]">
            <Wrench className="w-7 h-7" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-center text-white tracking-wider font-serif mb-1 uppercase">
          {isId ? 'MENU & MAIN ULANG' : 'MENU & RESTART'}
        </h2>
        <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-mono mb-4">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{isId ? 'Gunakan jika karakter stuck atau terjadi bug' : 'Use if character is stuck or bugged'}</span>
        </div>

        <p className="text-xs sm:text-sm text-stone-400 text-center mb-6 leading-relaxed">
          {isId
            ? 'Pilih untuk kembali ke menu awal guna memilih ulang jumlah bot dan mulai baru, atau teleportasikan karakter ke area terbuka jika hanya tersangkut.'
            : 'Return to the start menu to adjust companion bots and restart, or unstuck teleport your character to safe open ground.'}
        </p>

        {/* Action Options */}
        <div className="space-y-3">
          {/* 1. Main Ulang ke Menu Awal */}
          <button
            onClick={onReturnToMenu}
            className="w-full p-3.5 rounded-xl bg-red-900/40 hover:bg-red-800/80 border-2 border-red-600/80 hover:border-red-400 text-left transition-all flex items-center gap-3.5 group cursor-pointer shadow-lg hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]"
          >
            <div className="w-10 h-10 rounded-lg bg-red-950 border border-red-500/60 flex items-center justify-center text-red-300 group-hover:scale-105 transition-transform shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white group-hover:text-red-200">
                {isId ? '🎪 Main Ulang & Kembali ke Menu Awal' : '🎪 Restart & Return to Main Menu'}
              </div>
              <div className="text-[11px] text-stone-400">
                {isId
                  ? 'Kembali ke menu awal untuk ganti bot (2-16) & mulai baru'
                  : 'Return to main menu to change bots (2-16) & start fresh'}
              </div>
            </div>
          </button>

          {/* 2. Unstuck Teleport */}
          <button
            onClick={onUnstuck}
            className="w-full p-3.5 rounded-xl bg-stone-900/70 hover:bg-amber-950/40 border border-stone-700/80 hover:border-amber-500/80 text-left transition-all flex items-center gap-3.5 group cursor-pointer shadow-md hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-950/60 border border-amber-600/50 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-stone-200 group-hover:text-amber-200">
                {isId ? '🚀 Lepaskan Karakter (Unstuck Teleport)' : '🚀 Unstuck Character (Safe Teleport)'}
              </div>
              <div className="text-[11px] text-stone-400">
                {isId
                  ? 'Teleport ke jalan terbuka tanpa kehilangan progres kotak'
                  : 'Teleport to open path without losing collected boxes'}
              </div>
            </div>
          </button>

          {/* 3. Lanjutkan Permainan */}
          <button
            onClick={onResume}
            className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>{isId ? 'Lanjutkan Permainan (Batal)' : 'Resume Game (Cancel)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
