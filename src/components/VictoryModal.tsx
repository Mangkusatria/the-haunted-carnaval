/**
 * Victory Escape Modal
 */

import React from 'react';
import { Language } from '../types';
import { Trophy, RotateCcw, CheckCircle } from 'lucide-react';

interface Props {
  language: Language;
  boxesCollected: number;
  survivingBots: number;
  totalBots: number;
  isMazeVictory?: boolean;
  circusPistolCount?: number;
  onRestart: () => void;
  onReturnToMenu?: () => void;
}

export const VictoryModal: React.FC<Props> = ({
  language,
  boxesCollected,
  survivingBots,
  totalBots,
  isMazeVictory,
  circusPistolCount = 1,
  onRestart,
  onReturnToMenu
}) => {
  const isId = language === 'id';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 select-none overflow-y-auto">
      <div className="relative max-w-lg w-full bg-stone-950 border-2 border-emerald-600 rounded-2xl p-6 sm:p-8 text-center shadow-[0_0_80px_rgba(16,185,129,0.5)] text-stone-100 font-sans my-auto">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(52,211,153,0.8)]">
          {isMazeVictory ? '🏆' : '🎪'}
        </div>

        <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
          <CheckCircle className="w-4 h-4" />
          {isMazeVictory
            ? (isId ? 'KEMENANGAN MUTLAK • KABUR DARI LABIRIN' : 'ULTIMATE ESCAPE • MAZE SURVIVOR')
            : (isId ? 'SELAMAT DARI KARNAVAL' : 'SURVIVED THE CARNIVAL')}
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-wider font-serif mb-2">
          {isMazeVictory
            ? (isId ? 'SELAMAT DARI LABIRIN!' : 'ESCAPED THE LABYRINTH!')
            : (isId ? 'BERHASIL KELUAR!' : 'ESCAPED ALIVE!')}
        </h1>

        <p className="text-sm text-stone-300 mb-5 leading-relaxed">
          {isMazeVictory
            ? (isId
                ? 'Luar biasa! Setelah menyalakan 20 mesin di tengah kobaran api dan sirine, kamu berhasil naik ke mobil pelarian, menyalakan mesin, dan menabrak Jesty hingga tak bernyawa sebelum melesat bebas dari sirkus terkutuk!'
                : 'Incredible! After repairing all 20 machines amidst raging flames and wailing sirens, you started the getaway car and rammed Jesty lifeless before speeding out of the cursed circus!')
            : (isId
                ? 'Kamu berhasil mengumpulkan 20 kotak Jack-in-the-Box, membuka gerbang besi berkarat, dan lolos dari cengkeraman maut Jacky!'
                : 'You collected all 20 Jack-in-the-Box items, unlocked the rusted gates, and escaped Jacky\'s deadly clutches!')}
        </p>

        {/* Reward Showcase: +1 Pistol Sirkus */}
        <div className="bg-amber-950/50 border-2 border-amber-400/80 rounded-xl p-3.5 mb-5 text-left shadow-[0_0_25px_rgba(251,191,36,0.25)]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 font-mono font-black text-amber-300 text-xs sm:text-sm uppercase">
              <span className="text-lg">🎁🔫</span>
              <span>{isId ? 'HADIAH KEMENANGAN: +1 PISTOL SIRKUS' : 'VICTORY REWARD: +1 CIRCUS PISTOL'}</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-400 text-stone-950 font-mono font-black text-xs shrink-0">
              x{circusPistolCount}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-amber-100/90 leading-snug">
            {isId
              ? 'Item sekali pakai untuk menembak & melumpuhkan (stun) Jacky atau Jesty selama 6.5 detik di ronde berikutnya! (Tekan [Q] di PC atau tombol PISTOL di HP).'
              : 'Single-use stun gun that stuns Jacky or Jesty for 6.5 seconds in your next match! (Press [Q] on PC or tap PISTOL on Mobile).'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-stone-900 border border-stone-800 rounded-xl p-4 mb-6 text-sm font-mono text-center">
          <div>
            <div className="text-xs text-stone-500 uppercase">{isId ? 'Kotak Jack-in-the-Box' : 'Boxes Collected'}</div>
            <div className="text-xl font-bold text-amber-400">{boxesCollected} / 20</div>
          </div>
          <div>
            <div className="text-xs text-stone-500 uppercase">{isId ? 'Survivor Selamat' : 'Survivors Alive'}</div>
            <div className="text-xl font-bold text-emerald-400">
              {survivingBots} / {totalBots}
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{isId ? 'MAIN LAGI / PLAY AGAIN' : 'PLAY AGAIN'}</span>
          </button>

          {onReturnToMenu && (
            <button
              onClick={onReturnToMenu}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs"
            >
              <span>{isId ? '🎪 KEMBALI KE MENU AWAL' : '🎪 RETURN TO MAIN MENU'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
