/**
 * Jacky's Interrogation / Betrayal Dialogue Modal
 * Triggered when Jacky catches the player and demands companion bot locations!
 */

import React, { useState, useEffect } from 'react';
import { InterrogationPrompt, Language } from '../types';
import { Skull, AlertTriangle, Shield, Eye, Clock } from 'lucide-react';

interface Props {
  prompt: InterrogationPrompt;
  language: Language;
  onChoice: (action: 'BETRAY' | 'REFUSE' | 'LIE' | 'TIMEOUT') => void;
}

export const InterrogationModal: React.FC<Props> = ({ prompt, language, onChoice }) => {
  const isId = language === 'id';
  const { targetBot } = prompt;
  const [timeLeft, setTimeLeft] = useState<number>(10.0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(timer);
          onChoice('TIMEOUT');
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onChoice]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      {/* Red Blood Horror Vignette */}
      <div className="absolute inset-0 pointer-events-none border-[12px] border-red-900/40 shadow-[inset_0_0_120px_rgba(200,0,0,0.6)]" />

      <div className="relative max-w-xl w-full bg-stone-950 border-2 border-red-700/80 rounded-xl p-6 sm:p-8 shadow-[0_0_50px_rgba(220,38,38,0.5)] text-stone-100 font-sans">
        {/* 10-Second Countdown Bar at Very Top */}
        <div className="mb-4 bg-stone-900/90 border border-stone-800 rounded-xl p-3 shadow-inner">
          <div className="flex items-center justify-between text-xs font-mono font-bold uppercase mb-1.5">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Clock className="w-4 h-4 animate-spin text-amber-400" />
              {isId ? 'Waktu Menjawab Tersisa:' : 'Time Left to Answer:'}
            </span>
            <span className={`text-base font-black font-mono ${timeLeft < 3.5 ? 'text-red-500 animate-pulse' : timeLeft < 6.0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {timeLeft.toFixed(1)}s
            </span>
          </div>

          <div className="w-full bg-stone-950 h-3 rounded-full overflow-hidden border border-stone-800">
            <div
              className={`h-full transition-all duration-100 ${
                timeLeft < 3.5
                  ? 'bg-gradient-to-r from-red-600 to-red-500 animate-pulse'
                  : timeLeft < 6.0
                  ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
              }`}
              style={{ width: `${(timeLeft / 10.0) * 100}%` }}
            />
          </div>
          <div className="text-[10px] text-stone-400 font-mono mt-1 text-center">
            {isId
              ? '⚠️ Beri jawaban dalam 10 detik atau Jacky akan langsung mencabikmu!'
              : '⚠️ Give an answer within 10s or Jacky will instantly slash you!'}
          </div>
        </div>

        {/* Header with Nyengar-Nyengir Jacky Icon */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-red-900/60">
          <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-500 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-bounce">
            🤡
          </div>
          <div>
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold tracking-widest uppercase">
              <Skull className="w-4 h-4" />
              {isId ? 'Jacky Menyergapmu & Nyengar-Nyengir' : 'Jacky Trapped You & Smirks'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-red-100 font-serif">
              JACK-IN-THE-BOX
            </h2>
          </div>
        </div>

        {/* Jacky's Sinister Speech */}
        <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-4 mb-6">
          <p className="text-lg sm:text-xl text-amber-200/90 italic font-medium leading-relaxed">
            "{isId ? prompt.dialogId : prompt.dialogEn}"
          </p>
          <div className="mt-2 text-xs text-red-400 font-mono">
            {isId
              ? `*Jacky tersenyum lebar dengan gigi bergerigi, menunggu jawabanmu...*`
              : `*Jacky bares needle teeth in a grotesque grin, waiting for your answer...*`}
          </div>
        </div>

        {/* Target Bot Badge */}
        <div className="flex items-center gap-2 mb-6 bg-stone-900/90 px-3 py-2 rounded border border-stone-800 text-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: targetBot.color }} />
          <span className="text-stone-400">{isId ? 'Target yang diincar:' : 'Target sought:'}</span>
          <span className="font-bold text-stone-100">{targetBot.name}</span>
          <span className="text-xs text-stone-500">
            ({isId ? 'Rekan Survivor Anda' : 'Your Companion Survivor'})
          </span>
        </div>

        {/* 3 Choices */}
        <div className="space-y-3">
          {/* 1. Betray / Snitch */}
          <button
            onClick={() => onChoice('BETRAY')}
            className="w-full text-left p-4 rounded-lg bg-red-950/70 hover:bg-red-900/80 border border-red-600 transition-all flex items-start gap-3 group cursor-pointer shadow-lg hover:shadow-red-900/40"
          >
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <div className="font-bold text-red-200 group-hover:text-white">
                {isId ? `[BOCORKAN] Beritahu Lokasi ${targetBot.name}!` : `[BETRAY] Reveal ${targetBot.name}'s Location!`}
              </div>
              <div className="text-xs text-red-300/80 mt-1">
                {isId
                  ? `Kamu selamat (HP 35) dan diberi waktu 15 detik untuk lari, sementara Jacky memburu ${targetBot.name}!`
                  : `You live (HP 35) with 15s grace time, while Jacky immediately hunts down ${targetBot.name}!`}
              </div>
            </div>
          </button>

          {/* 2. Bluff / Lie */}
          <button
            onClick={() => onChoice('LIE')}
            className="w-full text-left p-4 rounded-lg bg-stone-900/80 hover:bg-stone-800 border border-amber-600/70 transition-all flex items-start gap-3 group cursor-pointer"
          >
            <Eye className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <div className="font-bold text-amber-200 group-hover:text-amber-100">
                {isId ? `[BOHONGI] Berikan Lokasi Palsu!` : `[BLUFF] Give A False Location!`}
              </div>
              <div className="text-xs text-amber-300/80 mt-1">
                {isId
                  ? `Peluang 50% Jacky tertipu dan pergi. Namun jika gagal, kamu langsung tewas di tempat!`
                  : `50% chance Jacky gets tricked and leaves. If he spots your lie, instant death!`}
              </div>
            </div>
          </button>

          {/* 3. Refuse / Loyalty */}
          <button
            onClick={() => onChoice('REFUSE')}
            className="w-full text-left p-4 rounded-lg bg-stone-900/60 hover:bg-stone-800 border border-stone-700 transition-all flex items-start gap-3 group cursor-pointer"
          >
            <Shield className="w-6 h-6 text-stone-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <div className="font-bold text-stone-200 group-hover:text-white">
                {isId ? `[TOLAK] "Aku Takkan Mengkhianati Rekanku!"` : `[REFUSE] "I Won't Betray My Teammate!"`}
              </div>
              <div className="text-xs text-stone-400 mt-1">
                {isId
                  ? `Menjunjung kesetiaan, namun Jacky akan langsung menebaskan cakarnya!`
                  : `Noble loyalty, but Jacky will execute you immediately!`}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
