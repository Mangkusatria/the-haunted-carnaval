/**
 * Game Over Modal
 */

import React from 'react';
import { Language } from '../types';
import { Skull, RotateCcw } from 'lucide-react';

interface Props {
  reason: string;
  language: Language;
  boxesCollected: number;
  onRestart: () => void;
  onReturnToMenu?: () => void;
}

export const GameOverModal: React.FC<Props> = ({ reason, language, boxesCollected, onRestart, onReturnToMenu }) => {
  const isId = language === 'id';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 select-none">
      <div className="relative max-w-lg w-full bg-stone-950 border-2 border-red-800 rounded-2xl p-6 sm:p-8 text-center shadow-[0_0_80px_rgba(220,38,38,0.7)] text-stone-100 font-sans">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-950 border-2 border-red-500 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(239,68,68,0.8)]">
          🤡
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-red-600 tracking-wider font-serif mb-2">
          {isId ? 'KAMU TEWAS' : 'YOU DIED'}
        </h1>

        <p className="text-sm sm:text-base text-stone-300 italic mb-6 leading-relaxed">
          "{reason}"
        </p>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 mb-6 text-sm flex items-center justify-around font-mono">
          <div>
            <div className="text-xs text-stone-500 uppercase">{isId ? 'Kotak Ditemukan' : 'Boxes Found'}</div>
            <div className="text-xl font-bold text-amber-400">{boxesCollected} / 20</div>
          </div>
          <div>
            <div className="text-xs text-stone-500 uppercase">{isId ? 'Pembunuh' : 'Killer'}</div>
            <div className="text-xl font-bold text-red-500">Jacky (Jester)</div>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3.5 bg-red-700 hover:bg-red-600 text-white font-extrabold rounded-xl shadow-[0_0_25px_rgba(220,38,38,0.6)] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{isId ? 'COBA LAGI / RESTART' : 'TRY AGAIN / RESTART'}</span>
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
