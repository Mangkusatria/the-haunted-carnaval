/**
 * Toko Olivia the Jester Woman (3D Interactive Circus Shop)
 * Sells 3 single-use items at 100 KS promo price (final prices TBD):
 * 1. Monster Radar (100 KS) — Highlight nearest monster for 10s
 * 2. Pistol Sirkus (100 KS) — Stun Jacky/Jesty for 6.5s
 * 3. Sarung Tangan Sirkus (100 KS) — Carry/gendong nearest bot safely for 10s
 */

import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../types';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  Crosshair,
  HandHeart,
  Radio,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  X
} from 'lucide-react';
import { createOliviaShopScene, OliviaShopSceneController } from '../game/oliviaShopScene';

export const SHOP_ITEM_PRICE_KS = 100;

export type ShopItemId = 'monster_radar' | 'circus_pistol' | 'circus_gloves';

interface Props {
  language: Language;
  circusCoins: number;
  monsterRadarCount: number;
  circusPistolCount: number;
  circusGlovesCount: number;
  onBuyItem: (item: ShopItemId) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<Props> = ({
  language,
  circusCoins,
  monsterRadarCount,
  circusPistolCount,
  circusGlovesCount,
  onBuyItem,
  onClose
}) => {
  const isId = language === 'id';
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneCtrlRef = useRef<OliviaShopSceneController | null>(null);

  const [selectedId, setSelectedId] = useState<ShopItemId>('circus_pistol');
  const [hoveredId, setHoveredId] = useState<ShopItemId | null>(null);
  const [boughtFlash, setBoughtFlash] = useState<ShopItemId | null>(null);
  const [dockExpanded, setDockExpanded] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const ctrl = createOliviaShopScene(container, 'circus_pistol', {
      onSelectItem: (id) => {
        setSelectedId(id);
        setDockExpanded(true);
      },
      onHoverItem: (id) => {
        setHoveredId(id);
      }
    });
    sceneCtrlRef.current = ctrl;

    return () => {
      ctrl.dispose();
      sceneCtrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const items: {
    id: ShopItemId;
    nameId: string;
    nameEn: string;
    descId: string;
    descEn: string;
    oliviaLineId: string;
    oliviaLineEn: string;
    hotkeyId: string;
    hotkeyEn: string;
    owned: number;
    accent: 'rose' | 'cyan' | 'emerald';
    icon: React.ReactNode;
  }[] = [
    {
      id: 'monster_radar',
      nameId: 'Monster Radar',
      nameEn: 'Monster Radar',
      descId: 'Menyorot (highlight) monster terdekat (Jacky / Jesty) menembus dinding selama 10 detik + jarak live.',
      descEn: 'Highlights the nearest monster (Jacky / Jesty) through walls for 10s with live distance.',
      oliviaLineId: '"Radar ini bisa mendeteksi detak jantung Jacky & Jesty menembus tembok tenda!"',
      oliviaLineEn: '"This radar spots Jacky & Jesty straight through the circus tent walls!"',
      hotkeyId: 'Sekali Pakai • [R] di PC / Tombol HP',
      hotkeyEn: 'Single-Use • [R] on PC / Mobile Button',
      owned: monsterRadarCount,
      accent: 'rose',
      icon: <Radio className="w-4 h-4 text-rose-300" />
    },
    {
      id: 'circus_pistol',
      nameId: 'Pistol Sirkus',
      nameEn: 'Circus Pistol',
      descId: 'Menembak dan melumpuhkan (stun) Jacky atau Jesty selama 6.5 detik agar kamu & rekan bisa kabur.',
      descEn: 'Fires a neon shock round that stuns Jacky or Jesty for 6.5 seconds.',
      oliviaLineId: '"Dor! Satu peluru kejut neon cukup bikin Jacky atau Jesty mematung 6.5 detik!"',
      oliviaLineEn: '"Bang! One neon shock round freezes Jacky or Jesty for 6.5 seconds!"',
      hotkeyId: 'Sekali Pakai • [Q] di PC / Tombol HP',
      hotkeyEn: 'Single-Use • [Q] on PC / Mobile Button',
      owned: circusPistolCount,
      accent: 'cyan',
      icon: <Crosshair className="w-4 h-4 text-cyan-300" />
    },
    {
      id: 'circus_gloves',
      nameId: 'Sarung Tangan Sirkus',
      nameEn: 'Circus Gloves',
      descId: 'Mengangkat & menggendong (carry) teman bot terdekat selama 10 detik agar aman dari serangan monster!',
      descEn: 'Grab & carry the nearest companion bot safely for 10 seconds out of monster reach!',
      oliviaLineId: '"Angkat dan gendong teman bot-mu 10 detik penuh—aman dari kejaran!"',
      oliviaLineEn: '"Scoop up your bot friend and carry them safely for 10 whole seconds!"',
      hotkeyId: 'Sekali Pakai • [T] di PC / Tombol HP',
      hotkeyEn: 'Single-Use • [T] on PC / Mobile Button',
      owned: circusGlovesCount,
      accent: 'emerald',
      icon: <HandHeart className="w-4 h-4 text-emerald-300" />
    }
  ];

  const activeItem = items.find((i) => i.id === selectedId) ?? items[1];
  const inspectedItem = hoveredId ? items.find((i) => i.id === hoveredId) ?? activeItem : activeItem;
  const canAfford = circusCoins >= SHOP_ITEM_PRICE_KS;
  const justBought = boughtFlash === activeItem.id;

  const handleSelectItem = (id: ShopItemId) => {
    setSelectedId(id);
    sceneCtrlRef.current?.selectItem(id);
  };

  const handlePurchase = () => {
    if (!canAfford) return;
    const id = activeItem.id;
    onBuyItem(id);
    sceneCtrlRef.current?.triggerPurchaseFx(id);
    setBoughtFlash(id);
    window.setTimeout(() => {
      setBoughtFlash((cur) => (cur === id ? null : cur));
    }, 1150);
  };

  const accentMap = {
    rose: {
      tabActive: 'bg-rose-950/95 border-rose-400 text-rose-100',
      tabIdle: 'bg-stone-900/90 border-stone-700/80 text-stone-300 hover:border-rose-500/60',
      badge: 'bg-rose-900/80 border-rose-500/60 text-rose-200',
      title: 'text-rose-200'
    },
    cyan: {
      tabActive: 'bg-cyan-950/95 border-cyan-400 text-cyan-100',
      tabIdle: 'bg-stone-900/90 border-stone-700/80 text-stone-300 hover:border-cyan-500/60',
      badge: 'bg-cyan-900/80 border-cyan-500/60 text-cyan-200',
      title: 'text-cyan-200'
    },
    emerald: {
      tabActive: 'bg-emerald-950/95 border-emerald-400 text-emerald-100',
      tabIdle: 'bg-stone-900/90 border-stone-700/80 text-stone-300 hover:border-emerald-500/60',
      badge: 'bg-emerald-900/80 border-emerald-500/60 text-emerald-200',
      title: 'text-emerald-200'
    }
  };

  const oliviaSpeech = boughtFlash
    ? isId
      ? '"Hihi~ Terima kasih! Gunakan item ini baik-baik di dalam sirkus!"'
      : '"Hehe~ Pleasure doing business! Use it wisely inside the circus!"'
    : isId
    ? inspectedItem.oliviaLineId
    : inspectedItem.oliviaLineEn;

  return (
    <div className="fixed inset-0 z-50 bg-[#1a0b2c] select-none overflow-hidden font-sans text-stone-100">
      {/* Isolated Full-Viewport 3D Three.js Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* Top Overlay Header (No backdrop-blur over WebGL, keeps 3D center open) */}
      <div className="relative z-10 pointer-events-none flex flex-col gap-2 p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          {/* Title & Olivia Dialogue */}
          <div className="pointer-events-auto max-w-md bg-stone-950/88 border border-fuchsia-500/70 rounded-xl px-3.5 py-2.5 shadow-lg">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-widest text-fuchsia-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isId ? 'TOKO SIRKUS 3D RESMI' : 'OFFICIAL 3D CIRCUS SHOP'}</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-amber-300 font-serif leading-tight">
              {isId ? 'Toko Olivia the Jester Woman' : "Olivia the Jester Woman's Shop"}
            </h2>
            <p className="text-[11px] sm:text-xs text-fuchsia-100/90 italic mt-1 leading-snug">
              {oliviaSpeech}
            </p>
          </div>

          {/* Right Controls: Coin Balance + Reset Camera + Close */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="flex items-center gap-2 bg-amber-950/92 border border-amber-500/75 rounded-xl px-3 py-2 shadow-lg">
              <Coins className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs sm:text-sm font-mono font-black text-amber-300 leading-none">
                  {circusCoins} KS
                </div>
                <div className="text-[9px] font-mono text-amber-200/75 mt-0.5">
                  {isId ? 'Normal +100 • Hard +300' : 'Normal +100 • Hard +300'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => sceneCtrlRef.current?.resetCamera()}
              title={isId ? 'Reset Kamera 3D' : 'Reset 3D Camera'}
              className="p-2.5 rounded-xl bg-stone-950/90 hover:bg-stone-900 border border-stone-700 text-stone-300 hover:text-amber-300 cursor-pointer transition-colors"
              aria-label={isId ? 'Reset Kamera 3D' : 'Reset 3D Camera'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-950/90 hover:bg-red-950 border border-stone-700 hover:border-red-500/70 text-stone-200 hover:text-white text-xs font-mono font-bold cursor-pointer transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">{isId ? 'Tutup' : 'Close'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Unified Bottom Shop Dock */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex flex-col items-center">
        <div className="pointer-events-auto w-full max-w-3xl flex flex-col items-center">
          {/* Collapse / Expand Pill Handle */}
          <button
            type="button"
            onClick={() => setDockExpanded((v) => !v)}
            className="mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-t-lg rounded-b-md bg-stone-950/92 border border-fuchsia-500/60 text-[11px] font-mono font-bold text-fuchsia-200 hover:text-amber-300 cursor-pointer transition-colors"
          >
            {dockExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            <span>
              {dockExpanded
                ? isId
                  ? 'Sembunyikan Panel (Lihat Toko 3D)'
                  : 'Hide Panel (Inspect 3D Booth)'
                : isId
                ? `Buka Panel Belanja • ${activeItem.nameId} (${SHOP_ITEM_PRICE_KS} KS)`
                : `Open Shop Dock • ${activeItem.nameEn} (${SHOP_ITEM_PRICE_KS} KS)`}
            </span>
          </button>

          {dockExpanded && (
            <div className="w-full bg-stone-950/94 border-2 border-fuchsia-500/75 rounded-2xl p-3 sm:p-4 shadow-2xl">
              {/* 3 Item Tabs */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {items.map((item) => {
                  const isActive = item.id === activeItem.id;
                  const st = accentMap[item.accent];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectItem(item.id)}
                      className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border-2 text-left cursor-pointer transition-all ${
                        isActive ? st.tabActive : st.tabIdle
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0">{item.icon}</span>
                        <div className="min-w-0">
                          <div className="text-[11px] sm:text-xs font-extrabold truncate">
                            {isId ? item.nameId : item.nameEn}
                          </div>
                          <div className="text-[9px] font-mono text-amber-300/90">
                            {SHOP_ITEM_PRICE_KS} KS
                          </div>
                        </div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-black shrink-0 ${st.badge}`}>
                        x{item.owned}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Item Detail & Purchase Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-stone-800">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm sm:text-base font-black ${accentMap[activeItem.accent].title}`}>
                      {isId ? activeItem.nameId : activeItem.nameEn}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      {isId ? activeItem.hotkeyId : activeItem.hotkeyEn}
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 mt-0.5 leading-snug">
                    {isId ? activeItem.descId : activeItem.descEn}
                  </p>
                  <div className="text-[10px] font-mono text-fuchsia-300/85 mt-1">
                    {isId
                      ? 'Tip: Klik item langsung di meja 3D atau geser layar untuk memutar kamera • Harga promo 100 KS (harga asli belum ditentukan)'
                      : 'Tip: Click items directly on the 3D counter or drag to orbit • Promo 100 KS (final price TBD)'}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={handlePurchase}
                    className={`px-4 py-2.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                      justBought
                        ? 'bg-emerald-500 text-stone-950 border-2 border-emerald-200 cursor-pointer'
                        : canAfford
                        ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 border-2 border-amber-300 active:scale-95 cursor-pointer'
                        : 'bg-stone-900 border border-stone-700 text-stone-500 cursor-not-allowed opacity-75'
                    }`}
                  >
                    {justBought ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{isId ? 'TERBELI +1!' : 'BOUGHT +1!'}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>
                          {isId ? `Beli • ${SHOP_ITEM_PRICE_KS} KS` : `Buy • ${SHOP_ITEM_PRICE_KS} KS`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
