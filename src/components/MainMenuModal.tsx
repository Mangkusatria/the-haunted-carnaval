/**
 * Main Menu Modal for Jacky's Carnival: Circus Horror
 * Layout requirement:
 * - Bot Player Count Selector (2 to 16 bots) ABOVE Start button
 * - Start Button in the CENTER
 * - Tips & Hints BELOW Start button
 */

import React from 'react';
import { DeviceMode, Difficulty, Language } from '../types';
import { Play, Users, HelpCircle, Monitor, Smartphone, Flame, Shield, Skull, Trophy, ShoppingBag, Coins } from 'lucide-react';

interface Props {
  botCount: number;
  setBotCount: (count: number) => void;
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  difficulty: Difficulty;
  setDifficulty: (diff: Difficulty) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  circusCoins?: number;
  monsterRadarCount?: number;
  circusPistolCount?: number;
  circusGlovesCount?: number;
  unlockedAchievementsCount?: number;
  totalAchievementsCount?: number;
  onOpenAchievements: () => void;
  onOpenShop: () => void;
  onStartGame: () => void;
}

export const MainMenuModal: React.FC<Props> = ({
  botCount,
  setBotCount,
  deviceMode,
  setDeviceMode,
  difficulty,
  setDifficulty,
  language,
  setLanguage,
  circusCoins = 0,
  monsterRadarCount = 0,
  circusPistolCount = 0,
  circusGlovesCount = 0,
  unlockedAchievementsCount = 0,
  totalAchievementsCount = 11,
  onOpenAchievements,
  onOpenShop,
  onStartGame
}) => {
  const isId = language === 'id';

  // Available bot sample roster names
  const previewBots = [
    'Budi', 'Maya', 'Rico', 'Siti', 'Dimas', 'Tari', 'Kevin', 'Rina',
    'Aris', 'Luna', 'Gilang', 'Dewi', 'Fajar', 'Citra', 'Rendy', 'Putri'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/95 overflow-y-auto p-4 select-none">
      {/* Background Ambience styling */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/40 via-stone-950/90 to-black pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative max-w-2xl w-full bg-stone-900/90 border-2 border-red-800/60 rounded-2xl p-6 sm:p-8 shadow-[0_0_80px_rgba(185,28,28,0.35)] backdrop-blur-md my-auto">
        {/* Language & Sound Toggle Bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎪</span>
            <span className="text-xs tracking-widest uppercase font-bold text-red-500 font-mono">
              HORROR 3D SURVIVAL
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(isId ? 'en' : 'id')}
              className="px-3 py-1 text-xs rounded bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold border border-stone-700 transition-colors"
            >
              {isId ? '🇮🇩 Bahasa ID' : '🇬🇧 English'}
            </button>
          </div>
        </div>

        {/* Title Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-5xl font-black text-red-600 tracking-wider font-serif drop-shadow-[0_4px_10px_rgba(220,38,38,0.5)]">
            KARNAVAL JACKY
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1 uppercase tracking-widest font-mono">
            {isId ? 'Sirkus Horor Berhantu 300 Meter' : 'Haunted 300-Meter Circus Fairground'}
          </p>
        </div>

        {/* =======================================================
            SECTION 1 (ABOVE START BUTTON): OPSI MEMILIH BOT 2 - 16
            ======================================================= */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-4 sm:p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-stone-200 font-bold text-sm sm:text-base">
              <Users className="w-5 h-5 text-red-500" />
              <span>{isId ? 'Pilih Jumlah Rekan Pemain Bot' : 'Select Companion Bot Players'}</span>
            </div>
            <span className="px-3 py-1 bg-red-950 border border-red-700 text-red-400 font-mono font-bold text-base rounded-md">
              {botCount} {isId ? 'Pemain Bot' : 'Bot Players'}
            </span>
          </div>

          {/* Bot Count Slider (2 to 16) */}
          <div className="space-y-2">
            <input
              type="range"
              min={2}
              max={16}
              step={1}
              value={botCount}
              onChange={(e) => setBotCount(parseInt(e.target.value, 10))}
              className="w-full accent-red-600 cursor-pointer h-2 bg-stone-800 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-stone-500 font-mono">
              <span>2 Bot (Minimal)</span>
              <span>8 Bot (Standar)</span>
              <span>16 Bot (Maksimal Keramaian)</span>
            </div>
          </div>

          {/* Preview of active bot companions */}
          <div className="mt-3 pt-3 border-t border-stone-800/80">
            <div className="text-[11px] text-stone-400 mb-1.5">
              {isId ? 'Rekan yang akan ikut ke dalam sirkus:' : 'Survivors entering the circus with you:'}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-1">
              {previewBots.slice(0, botCount).map((bName, i) => (
                <span
                  key={bName}
                  className="px-2 py-0.5 text-[11px] rounded bg-stone-900 border border-stone-700/60 text-stone-300 font-medium"
                >
                  #{i + 1} {bName}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* =======================================================
            SECTION 1.5 (ABOVE START BUTTON): PILIH PERANGKAT (PC / HP)
            ======================================================= */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-stone-200 font-bold text-sm">
              {isId ? 'Pilih Perangkat Bermain (Kontrol)' : 'Select Device & Controls'}
            </span>
            <span className="text-[11px] font-mono text-amber-400 font-bold uppercase">
              {deviceMode === 'PC'
                ? (isId ? 'MODE KOMPUTER' : 'PC MODE')
                : (isId ? 'MODE ANDROID / HP' : 'MOBILE MODE')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDeviceMode('PC')}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                deviceMode === 'PC'
                  ? 'bg-red-950/80 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.28)]'
                  : 'bg-stone-900/70 border-stone-800 text-stone-400 hover:border-stone-600 hover:text-stone-200'
              }`}
            >
              <div
                className={`p-2 rounded-lg border ${
                  deviceMode === 'PC'
                    ? 'bg-red-900/80 border-red-400 text-white'
                    : 'bg-stone-800 border-stone-700 text-stone-400'
                }`}
              >
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">
                  {isId ? 'Komputer / Laptop (PC)' : 'Computer / Desktop (PC)'}
                </div>
                <div className="text-[11px] font-mono opacity-80">
                  {isId ? 'Keyboard WASD + Mouse Look' : 'Keyboard WASD + Mouse Look'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDeviceMode('MOBILE')}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                deviceMode === 'MOBILE'
                  ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.28)]'
                  : 'bg-stone-900/70 border-stone-800 text-stone-400 hover:border-stone-600 hover:text-stone-200'
              }`}
            >
              <div
                className={`p-2 rounded-lg border ${
                  deviceMode === 'MOBILE'
                    ? 'bg-emerald-900/80 border-emerald-400 text-white'
                    : 'bg-stone-800 border-stone-700 text-stone-400'
                }`}
              >
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">
                  {isId ? 'Handphone / Android' : 'Mobile / Android'}
                </div>
                <div className="text-[11px] font-mono opacity-80">
                  {isId ? 'Joystick + Tombol Kecil Kiri Bawah' : 'Joystick + Compact Touch Buttons'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* =======================================================
            SECTION 1.7 (ABOVE START BUTTON): PILIH TINGKAT KESULITAN
            ======================================================= */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-stone-200 font-bold text-sm">
              {isId ? 'Pilih Tingkat Kesulitan (Difficulty)' : 'Select Difficulty'}
            </span>
            <span
              className={`text-[11px] font-mono font-black uppercase ${
                difficulty === 'NIGHTMARE'
                  ? 'text-fuchsia-400'
                  : difficulty === 'HARD'
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}
            >
              {difficulty === 'NIGHTMARE'
                ? '💀 MODE NIGHTMARE'
                : difficulty === 'HARD'
                ? '🔥 MODE HARD'
                : 'MODE NORMAL'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setDifficulty('NORMAL')}
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                difficulty === 'NORMAL'
                  ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-[0_0_18px_rgba(16,185,129,0.25)]'
                  : 'bg-stone-900/70 border-stone-800 text-stone-400 hover:border-stone-600 hover:text-stone-200'
              }`}
            >
              <div
                className={`p-2 rounded-lg border shrink-0 ${
                  difficulty === 'NORMAL'
                    ? 'bg-emerald-900/80 border-emerald-400 text-white'
                    : 'bg-stone-800 border-stone-700 text-stone-400'
                }`}
              >
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm">NORMAL</div>
                <div className="text-[11px] opacity-85 leading-snug">
                  {isId
                    ? 'Permainan standar. Jacky & Jesty kecepatan normal (+100 KS).'
                    : 'Balanced standard horror experience (+100 KS).'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDifficulty('HARD')}
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                difficulty === 'HARD'
                  ? 'bg-red-950/85 border-red-500 text-white shadow-[0_0_22px_rgba(239,68,68,0.35)]'
                  : 'bg-stone-900/70 border-stone-800 text-stone-400 hover:border-stone-600 hover:text-stone-200'
              }`}
            >
              <div
                className={`p-2 rounded-lg border shrink-0 ${
                  difficulty === 'HARD'
                    ? 'bg-red-900/85 border-red-400 text-white'
                    : 'bg-stone-800 border-stone-700 text-stone-400'
                }`}
              >
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-red-200">HARD 🔥</div>
                <div className="text-[11px] opacity-90 leading-snug">
                  {isId
                    ? 'High Jump + mental, Jacky & Jesty 2X cepat di luar Panic Mode (+300 KS).'
                    : 'Frequent High Jumps with knockback, 2X speed outside Panic Mode (+300 KS).'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDifficulty('NIGHTMARE')}
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                difficulty === 'NIGHTMARE'
                  ? 'bg-fuchsia-950/90 border-fuchsia-500 text-white shadow-[0_0_24px_rgba(217,70,239,0.42)]'
                  : 'bg-stone-900/70 border-stone-800 text-stone-400 hover:border-stone-600 hover:text-stone-200'
              }`}
            >
              <div
                className={`p-2 rounded-lg border shrink-0 ${
                  difficulty === 'NIGHTMARE'
                    ? 'bg-fuchsia-900/90 border-fuchsia-400 text-white'
                    : 'bg-stone-800 border-stone-700 text-stone-400'
                }`}
              >
                <Skull className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-fuchsia-200">NIGHTMARE 💀</div>
                <div className="text-[11px] opacity-90 leading-snug">
                  {isId
                    ? 'Karnaval gelap gulita! High Jump ekstra sering, speed Jacky naik tiap bunuh bot, & langsung lompat ke gerbang saat Panic Mode (+500 KS)!'
                    : 'Pitch-dark carnival! Nonstop High Jumps, Jacky speeds up per bot kill & leaps straight to the gate on Panic Mode (+500 KS)!'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Inventory Item & Saldo Koin Sirkus */}
        <div className="rounded-xl px-4 py-3 mb-5 border border-stone-800 bg-stone-950/85 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-100">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{isId ? 'Perlengkapan & Koin Sirkus (Sekali Pakai)' : 'Single-Use Gear & Circus Coins'}</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/70 text-amber-300 font-mono font-black text-xs shrink-0">
              🪙 {circusCoins} KS
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
            <div className={`px-2 py-1.5 rounded-lg border ${monsterRadarCount > 0 ? 'bg-rose-950/60 border-rose-500/70 text-rose-200' : 'bg-stone-900/70 border-stone-800 text-stone-500'}`}>
              <div className="font-bold truncate">📡 Radar [R]</div>
              <div className="font-black text-xs mt-0.5">x{monsterRadarCount}</div>
            </div>
            <div className={`px-2 py-1.5 rounded-lg border ${circusPistolCount > 0 ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-200' : 'bg-stone-900/70 border-stone-800 text-stone-500'}`}>
              <div className="font-bold truncate">🔫 Pistol [Q]</div>
              <div className="font-black text-xs mt-0.5">x{circusPistolCount}</div>
            </div>
            <div className={`px-2 py-1.5 rounded-lg border ${circusGlovesCount > 0 ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-200' : 'bg-stone-900/70 border-stone-800 text-stone-500'}`}>
              <div className="font-bold truncate">🧤 Sarung [T]</div>
              <div className="font-black text-xs mt-0.5">x{circusGlovesCount}</div>
            </div>
          </div>
        </div>

        {/* =======================================================
            SECTION 2 (CENTER): TOMBOL START DI TENGAH
            ======================================================= */}
        <div className="flex justify-center mb-5">
          <button
            onClick={onStartGame}
            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-red-700 via-red-600 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-extrabold text-lg sm:text-xl rounded-xl shadow-[0_0_35px_rgba(220,38,38,0.6)] hover:shadow-[0_0_50px_rgba(239,68,68,0.8)] transition-all flex items-center justify-center gap-3 active:scale-95 cursor-pointer uppercase tracking-wider"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>{isId ? 'MULAI PERMAINAN' : 'START GAME'}</span>
          </button>
        </div>

        {/* =======================================================
            SECTION 2.5: OPSI ACHIEVEMENT (AKTIF) & TOKO (COMING SOON)
            ======================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Opsi Achievement (Clickable!) */}
          <button
            type="button"
            onClick={onOpenAchievements}
            className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-950/40 hover:bg-amber-950/70 border-2 border-amber-500/70 hover:border-amber-400 text-stone-100 transition-all active:scale-95 cursor-pointer text-left shadow-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-300 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-amber-200 truncate">
                  {isId ? 'Achievement' : 'Achievements'}
                </div>
                <div className="text-[11px] text-amber-100/75 truncate">
                  {isId ? 'Lihat badge pencapaian' : 'View achievement badges'}
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-400 text-stone-950 font-mono font-black text-xs shrink-0">
              {unlockedAchievementsCount}/{totalAchievementsCount}
            </span>
          </button>

          {/* Opsi Toko Olivia the Jester Woman (Active & Clickable!) */}
          <button
            type="button"
            onClick={onOpenShop}
            className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl bg-fuchsia-950/45 hover:bg-fuchsia-950/75 border-2 border-fuchsia-500/75 hover:border-fuchsia-400 text-stone-100 transition-all active:scale-95 cursor-pointer text-left shadow-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-fuchsia-500/20 border border-fuchsia-400 text-fuchsia-300 shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-fuchsia-200 truncate">
                  {isId ? 'Toko Olivia' : "Olivia's Shop"}
                </div>
                <div className="text-[11px] text-fuchsia-100/75 truncate">
                  {isId ? 'Olivia the Jester Woman' : 'Jester Woman Item Stall'}
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-400 text-stone-950 font-mono font-black text-xs shrink-0">
              {circusCoins} KS
            </span>
          </button>
        </div>

        {/* =======================================================
            SECTION 3 (BELOW START BUTTON): TIPS AND HINT
            ======================================================= */}
        <div className="bg-stone-950/70 border border-stone-800/80 rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-3">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>{isId ? 'Tips & Petunjuk Bertahan Hidup (Hints)' : 'Survival Tips & Hints'}</span>
          </div>

          <ul className="space-y-2 text-xs sm:text-sm text-stone-300/90 leading-relaxed font-sans">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">1.</span>
              <span>
                {isId
                  ? 'Jacky akan menghitung mundur 30 detik di awal permainan sebelum berburu. Gunakan 30 detik ini untuk menyebar mencari kotak!'
                  : 'Jacky counts down 30 seconds at the start before hunting. Use these 30s to scatter and search for boxes!'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">2.</span>
              <span>
                {isId
                  ? 'Misi utama: Kumpulkan 20 Kotak Jack-in-the-Box bersama rekan bot untuk membuka Gerbang Keluar sirkus!'
                  : 'Main mission: Collect 20 Jack-in-the-Box items with your bot companions to unlock the Circus Exit Gate!'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">3.</span>
              <span>
                {isId
                  ? 'Sembunyi di Lemari [E] atau Jongkok [C]: Jacky yang nyengar-nyengir tidak bisa melihatmu di dalam lemari!'
                  : 'Hide in Lockers [E] or Crouch [C]: Jacky cannot see you while hidden inside a locker!'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">4.</span>
              <span>
                {isId
                  ? 'Jika tertangkap Jacky, ada peluang dia akan menginterogasi dan memintamu membocorkan lokasi salah satu teman botmu untuk membiarkanmu hidup!'
                  : 'If captured by Jacky, he might smirk and interrogate you, offering extra life if you betray a companion bot location!'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">5.</span>
              <span className="text-amber-300 font-medium">
                {deviceMode === 'MOBILE'
                  ? (isId
                      ? 'Kontrol HP/Android: Joystick Kiri Bawah untuk jalan | Geser layar kanan untuk lihat sekeliling | Tombol kecil di samping joystick untuk Lari, Jongkok, Senter, Siul & Aksi!'
                      : 'Android Controls: Bottom-left Joystick to move | Drag right screen to look around | Compact buttons next to joystick for Sprint, Crouch, Flashlight, Whistle & Action!')
                  : (isId
                      ? 'Kontrol PC: [W, A, S, D] Gerak | [SHIFT] Sprint/Lari | [C] Jongkok | [F] Senter | [E] Interaksi'
                      : 'PC Controls: [W, A, S, D] Move | [SHIFT] Sprint | [C] Crouch | [F] Flashlight | [E] Interact')}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">6.</span>
              <span className="text-emerald-300 font-medium">
                {isId
                  ? 'Main Ulang & Unstuck: Tekan [ESC] atau tombol "MAIN ULANG / MENU" di pojok kiri atas kapan saja jika karakter tersangkut (stuck) atau ingin kembali ke menu awal!'
                  : 'Restart & Unstuck: Press [ESC] or the "RESTART / MENU" button at the top-left anytime if you get stuck or want to return to the main menu!'}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
