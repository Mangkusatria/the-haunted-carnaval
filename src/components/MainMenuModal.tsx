/**
 * Main Menu Modal for Jacky's Carnival: Circus Horror
 * Layout requirement:
 * - Bot Player Count Selector (2 to 16 bots) ABOVE Start button
 * - Start Button in the CENTER
 * - Tips & Hints BELOW Start button
 */

import React from 'react';
import { DeviceMode, Language } from '../types';
import { Play, Users, HelpCircle, Monitor, Smartphone } from 'lucide-react';

interface Props {
  botCount: number;
  setBotCount: (count: number) => void;
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  circusPistolCount?: number;
  onStartGame: () => void;
}

export const MainMenuModal: React.FC<Props> = ({
  botCount,
  setBotCount,
  deviceMode,
  setDeviceMode,
  language,
  setLanguage,
  circusPistolCount = 0,
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

        {/* Inventory Hadiah Kemenangan: Pistol Sirkus */}
        <div
          className={`rounded-xl px-4 py-3 mb-5 border flex items-center justify-between gap-3 ${
            circusPistolCount > 0
              ? 'bg-cyan-950/60 border-cyan-400/70 text-cyan-100 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
              : 'bg-stone-950/70 border-stone-800 text-stone-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔫</span>
            <div>
              <div className="text-xs sm:text-sm font-bold text-stone-100">
                {isId ? 'Item Hadiah: Pistol Sirkus (Sekali Pakai)' : 'Reward Item: Circus Pistol (Single-Use)'}
              </div>
              <div className="text-[11px] opacity-85">
                {circusPistolCount > 0
                  ? (isId
                      ? 'Siap dipakai di game! Tembak untuk stun Jacky atau Jesty selama 6.5 detik ([Q] / Tombol HP).'
                      : 'Ready to use in-game! Stuns Jacky or Jesty for 6.5s ([Q] / Mobile Button).')
                  : (isId
                      ? 'Menangkan permainan untuk mendapatkan +1 Pistol Sirkus setiap kemenangan!'
                      : 'Win a game to earn +1 Circus Pistol every victory!')}
              </div>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-lg font-mono font-black text-sm shrink-0 border ${
              circusPistolCount > 0
                ? 'bg-cyan-500 text-stone-950 border-cyan-300'
                : 'bg-stone-900 text-stone-500 border-stone-800'
            }`}
          >
            x{circusPistolCount}
          </span>
        </div>

        {/* =======================================================
            SECTION 2 (CENTER): TOMBOL START DI TENGAH
            ======================================================= */}
        <div className="flex justify-center mb-6">
          <button
            onClick={onStartGame}
            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-red-700 via-red-600 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-extrabold text-lg sm:text-xl rounded-xl shadow-[0_0_35px_rgba(220,38,38,0.6)] hover:shadow-[0_0_50px_rgba(239,68,68,0.8)] transition-all flex items-center justify-center gap-3 active:scale-95 cursor-pointer uppercase tracking-wider"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>{isId ? 'MULAI PERMAINAN' : 'START GAME'}</span>
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
