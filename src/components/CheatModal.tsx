/**
 * Secret Developer-Only Cheat Menu Modal
 * Found at the far corner near the Midway game booths in Chapter 1.
 * Protected by Developer Access Code so regular players cannot use cheats.
 * Provides 3 cheat options once unlocked:
 * 1. Grant +1 Pistol Sirkus
 * 2. Skip Chapter 1 -> Jump straight to Chapter 2 (Circus Maze)
 * 3. Activate Panic Mode immediately
 */

import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { Crosshair, FastForward, Flame, X, Sparkles, Lock, KeyRound, Zap, Wind } from 'lucide-react';

interface Props {
  language: Language;
  circusPistolCount: number;
  infiniteStaminaActive: boolean;
  fastRunActive: boolean;
  onGivePistol: () => void;
  onSkipChapter1: () => void;
  onActivatePanicMode: () => void;
  onActivateInfiniteStamina: () => void;
  onToggleFastRun: () => void;
  onDeveloperUnlocked?: () => void;
  onClose: () => void;
}

const DEVELOPER_CODE = 'akurianda45';
const DEV_SESSION_KEY = 'jacky_dev_cheat_unlocked';

export const CheatModal: React.FC<Props> = ({
  language,
  circusPistolCount,
  infiniteStaminaActive,
  fastRunActive,
  onGivePistol,
  onSkipChapter1,
  onActivatePanicMode,
  onActivateInfiniteStamina,
  onToggleFastRun,
  onDeveloperUnlocked,
  onClose
}) => {
  const isId = language === 'id';
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(DEV_SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [codeInput, setCodeInput] = useState<string>('');
  const [codeError, setCodeError] = useState<boolean>(false);
  const [pistolFlash, setPistolFlash] = useState<boolean>(false);

  useEffect(() => {
    setCodeError(false);
  }, [codeInput]);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeInput.trim().toLowerCase() === DEVELOPER_CODE) {
      setIsUnlocked(true);
      setCodeError(false);
      onDeveloperUnlocked?.();
      try {
        sessionStorage.setItem(DEV_SESSION_KEY, '1');
      } catch {}
    } else {
      setCodeError(true);
    }
  };

  const handleGetPistol = () => {
    onGivePistol();
    setPistolFlash(true);
    window.setTimeout(() => setPistolFlash(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none overflow-y-auto">
      <div className="relative max-w-md w-full bg-stone-950 border-2 border-fuchsia-500 rounded-2xl p-6 shadow-[0_0_70px_rgba(217,70,239,0.45)] text-stone-100 font-sans my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-white cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {!isUnlocked ? (
          /* DEVELOPER-ONLY LOCK SCREEN */
          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-stone-900 border-2 border-fuchsia-500 flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(217,70,239,0.45)]">
                <Lock className="w-7 h-7 text-fuchsia-400" />
              </div>
              <div className="text-[11px] font-mono font-black uppercase tracking-widest text-fuchsia-400 mb-1">
                {isId ? 'AREA TERBATAS • KHUSUS DEVELOPER' : 'RESTRICTED • DEVELOPER ONLY'}
              </div>
              <h2 className="text-xl font-black text-white tracking-wider font-serif">
                {isId ? 'VERIFIKASI DEVELOPER' : 'DEVELOPER VERIFICATION'}
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                {isId
                  ? 'Menu cheat ini hanya dapat dibuka oleh developer game. Masukkan kode akses developer untuk melanjutkan.'
                  : 'This cheat console is restricted to the game developer. Enter the developer access code to unlock.'}
              </p>
            </div>

            <div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-fuchsia-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  autoFocus
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder={isId ? 'Masukkan kode developer...' : 'Enter developer code...'}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-900 border border-stone-700 focus:border-fuchsia-400 focus:outline-none text-sm font-mono text-white placeholder-stone-500"
                />
              </div>
              {codeError && (
                <div className="mt-1.5 text-xs font-mono font-bold text-red-400">
                  {isId ? '❌ Kode salah! Akses khusus developer ditolak.' : '❌ Wrong code! Developer-only access denied.'}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-mono font-black text-xs uppercase tracking-wider cursor-pointer transition-colors"
              >
                {isId ? 'Buka Akses Cheat' : 'Unlock Cheats'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-mono font-bold text-xs uppercase cursor-pointer transition-colors"
              >
                {isId ? 'Tutup' : 'Close'}
              </button>
            </div>
          </form>
        ) : (
          /* UNLOCKED DEVELOPER CHEAT OPTIONS */
          <>
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-fuchsia-950/90 border-2 border-fuchsia-400 flex items-center justify-center text-3xl mb-3 shadow-[0_0_25px_rgba(232,121,249,0.6)]">
                😏
              </div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-black uppercase tracking-widest text-fuchsia-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isId ? 'DEVELOPER MODE AKTIF' : 'DEVELOPER MODE UNLOCKED'}</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-wider font-serif">
                {isId ? 'MENU CHEAT' : 'CHEAT MENU'}
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                {isId
                  ? 'Akses developer terverifikasi! Pilih salah satu dari 5 opsi cheat:'
                  : 'Developer access verified! Choose any of the 5 cheat options:'}
              </p>
            </div>

            <div className="space-y-3 mb-5">
              {/* Option 1: Get 1 Pistol Sirkus */}
              <button
                type="button"
                onClick={handleGetPistol}
                className="w-full p-3.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border-2 border-cyan-500/80 text-left flex items-center justify-between gap-3 transition-all active:scale-95 cursor-pointer shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300">
                    <Crosshair className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-cyan-200">
                      {isId ? '1. Dapatkan 1 Pistol Sirkus' : '1. Get 1 Circus Pistol'}
                    </div>
                    <div className="text-[11px] text-cyan-100/75">
                      {pistolFlash
                        ? (isId ? '✅ +1 Pistol Sirkus ditambahkan!' : '✅ +1 Circus Pistol added!')
                        : (isId ? 'Tambah item stun monster sekali pakai (+1)' : 'Add single-use monster stun gun (+1)')}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-cyan-400 text-stone-950 font-mono font-black text-xs shrink-0">
                  x{circusPistolCount}
                </span>
              </button>

              {/* Option 2: Skip Chapter 1 */}
              <button
                type="button"
                onClick={onSkipChapter1}
                className="w-full p-3.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/80 border-2 border-amber-500/80 text-left flex items-center justify-between gap-3 transition-all active:scale-95 cursor-pointer shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-300">
                    <FastForward className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-amber-200">
                      {isId ? '2. Lewati Chapter 1' : '2. Skip Chapter 1'}
                    </div>
                    <div className="text-[11px] text-amber-100/75">
                      {isId ? 'Langsung masuk ke Chapter 2: Labirin Jesty!' : 'Jump straight to Chapter 2: Jesty Labyrinth!'}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-md bg-amber-500/20 border border-amber-400 text-amber-300 font-mono font-bold text-[10px] shrink-0">
                  CH.2
                </span>
              </button>

              {/* Option 3: Instant Panic Mode */}
              <button
                type="button"
                onClick={onActivatePanicMode}
                className="w-full p-3.5 rounded-xl bg-red-950/80 hover:bg-red-900/90 border-2 border-red-500/90 text-left flex items-center justify-between gap-3 transition-all active:scale-95 cursor-pointer shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-red-500/20 border border-red-400 text-red-300">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-red-200">
                      {isId ? '3. Langsung Panic Mode' : '3. Instant Panic Mode'}
                    </div>
                    <div className="text-[11px] text-red-100/75">
                      {isId
                        ? '20/20 Kotak selesai, Gerbang terbuka, Langit Merah & Stamina ∞!'
                        : '20/20 Boxes done, Gate unlocked, Blood Sky & ∞ Stamina!'}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-md bg-red-500/20 border border-red-400 text-red-300 font-mono font-bold text-[10px] shrink-0">
                  PANIC
                </span>
              </button>

              {/* Option 4: Infinite Stamina Until Victory */}
              <button
                type="button"
                onClick={onActivateInfiniteStamina}
                className={`w-full p-3.5 rounded-xl border-2 text-left flex items-center justify-between gap-3 transition-all active:scale-95 cursor-pointer shadow-lg ${
                  infiniteStaminaActive
                    ? 'bg-emerald-950/90 border-emerald-400'
                    : 'bg-emerald-950/65 hover:bg-emerald-900/80 border-emerald-500/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-300">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-emerald-200">
                      {isId ? '4. Infinite Stamina Sampai Tamat' : '4. Infinite Stamina Until Victory'}
                    </div>
                    <div className="text-[11px] text-emerald-100/75">
                      {infiniteStaminaActive
                        ? (isId ? '✅ Sudah aktif! Stamina ∞ di Chapter 1 & Chapter 2.' : '✅ Active! ∞ Stamina in Chapter 1 & Chapter 2.')
                        : (isId ? 'Stamina tidak akan berkurang sampai menang tamat!' : 'Stamina stays infinite all the way until victory!')}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-md font-mono font-black text-[10px] shrink-0 border ${
                    infiniteStaminaActive
                      ? 'bg-emerald-400 text-stone-950 border-emerald-200'
                      : 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  }`}
                >
                  {infiniteStaminaActive ? 'AKTIF ✓' : '∞ STM'}
                </span>
              </button>

              {/* Option 5: Lari Cepat (Fast Run 2X Speed) */}
              <button
                type="button"
                onClick={onToggleFastRun}
                className={`w-full p-3.5 rounded-xl border-2 text-left flex items-center justify-between gap-3 transition-all active:scale-95 cursor-pointer shadow-lg ${
                  fastRunActive
                    ? 'bg-orange-950/90 border-orange-400'
                    : 'bg-orange-950/65 hover:bg-orange-900/80 border-orange-500/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-orange-500/20 border border-orange-400 text-orange-300">
                    <Wind className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-orange-200">
                      {isId ? '5. Lari Cepat (Super Speed)' : '5. Fast Run (Super Speed)'}
                    </div>
                    <div className="text-[11px] text-orange-100/75">
                      {fastRunActive
                        ? (isId ? '✅ Aktif! Kecepatan gerak 2X lebih cepat (klik untuk matikan).' : '✅ Active! 2X faster movement speed (click to toggle off).')
                        : (isId ? 'Percepat kecepatan jalan & lari pemain hingga 2X lipat!' : 'Boost player walking & sprint speed by over 2X!')}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-md font-mono font-black text-[10px] shrink-0 border ${
                    fastRunActive
                      ? 'bg-orange-400 text-stone-950 border-orange-200'
                      : 'bg-orange-500/20 border-orange-400 text-orange-300'
                  }`}
                >
                  {fastRunActive ? 'AKTIF ✓' : '2X SPD'}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
            >
              {isId ? 'Tutup & Lanjut Bermain' : 'Close & Resume'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
