/**
 * Achievements Modal & Custom SVG Badge Artwork
 * 4 Achievements:
 * 1. Piala Pertama — Tamatkan Sirkus Karnaval di mode Normal
 * 2. Piala Kedua — Tamatkan Sirkus Karnaval di mode Hard
 * 3. ADUH sakit sekali! — Terkena benturan Jacky di mode Hard
 * 4. Ayo keluar! — Bebaskan temanmu yang dipenjara di Bab 2
 */

import React from 'react';
import { AchievementDef, AchievementId, Language } from '../types';
import { Trophy, X, CheckCircle2, Lock } from 'lucide-react';

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_trophy',
    titleId: '1. Piala Pertama',
    titleEn: '1. First Trophy',
    descId: 'Tamatkan Sirkus Karnaval di mode Normal',
    descEn: "Complete Jacky's Circus Carnival on Normal mode"
  },
  {
    id: 'second_trophy',
    titleId: '2. Piala Kedua',
    titleEn: '2. Second Trophy',
    descId: 'Tamatkan Sirkus Karnaval di mode Hard',
    descEn: "Complete Jacky's Circus Carnival on Hard mode"
  },
  {
    id: 'ouch_so_painful',
    titleId: '3. ADUH sakit sekali!',
    titleEn: '3. OUCH That Hurts!',
    descId: 'Terkena benturan Jacky di mode Hard',
    descEn: "Get hit by Jacky's High Jump shockwave on Hard mode"
  },
  {
    id: 'lets_get_out',
    titleId: '4. Ayo keluar!',
    titleEn: "4. Let's Get Out!",
    descId: 'Bebaskan temanmu yang dipenjara di Bab 2',
    descEn: 'Free your imprisoned companion from the cage in Chapter 2'
  },
  {
    id: 'first_blood',
    titleId: '5. First Blood',
    titleEn: '5. First Blood',
    descId: 'Tembakan pertama ke monster menggunakan Pistol Sirkus',
    descEn: 'Land your first Circus Pistol shot on a monster'
  },
  {
    id: 'evil_friend',
    titleId: '6. Teman yang JAHAT',
    titleEn: '6. EVIL Friend',
    descId: 'Kasih tau Jacky keberadaan teman kita saat diinterogasi',
    descEn: "Betray a companion's location to Jacky during interrogation"
  },
  {
    id: 'thank_you_friend',
    titleId: '7. Terimakasih kawan!',
    titleEn: '7. Thank You, Friend!',
    descId: 'Saat Anda di penjara Bab 2, tunggu sampai teman Anda membebaskan Anda',
    descEn: 'While imprisoned in Chapter 2, wait until a companion frees you'
  },
  {
    id: 'dont_leave_me',
    titleId: '8. JANGAN TINGGALKAN AKU',
    titleEn: "8. DON'T LEAVE ME",
    descId: 'Tinggalkan bot yang masih terkurung di penjara saat kabur di Chapter 2',
    descEn: 'Escape Chapter 2 while leaving an imprisoned bot behind in the cage'
  },
  {
    id: 'bad_job',
    titleId: '9. Tidak kerja bagus!',
    titleEn: '9. Bad Job!',
    descId: 'Gagal 3 kali saat sedang benerin mesin',
    descEn: 'Fail 3 calibration checks while repairing machines'
  },
  {
    id: 'useless',
    titleId: '10. Tidak berguna!',
    titleEn: '10. Useless!',
    descId: 'Tamatkan Sirkus Karnaval tanpa membantu mengumpulkan kotak, memperbaiki mesin, maupun membebaskan bot di penjara',
    descEn: 'Complete the Circus Carnival without collecting boxes, repairing machines, or freeing imprisoned bots'
  },
  {
    id: 'become_developer',
    titleId: '11. Jadilah developer!',
    titleEn: '11. Become a Developer!',
    descId: 'Buka komputer cheat dengan kode akses developer!',
    descEn: 'Unlock the secret cheat console with the developer code!'
  }
];

export const AchievementBadgeSvg: React.FC<{ id: AchievementId; unlocked: boolean; size?: number }> = ({
  id,
  unlocked,
  size = 64
}) => {
  const filterStyle = unlocked ? undefined : { filter: 'grayscale(1) brightness(0.45)' };

  switch (id) {
    case 'first_trophy':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" style={filterStyle} aria-hidden="true">
          <defs>
            <linearGradient id="goldRim1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="29" fill="#1c1917" stroke="url(#goldRim1)" strokeWidth="3.5" />
          <path d="M16 14 L48 14 L44 26 Q32 34 20 26 Z" fill="#dc2626" opacity="0.35" />
          {/* Golden Trophy Cup */}
          <path
            d="M22 18 H42 V28 C42 35 37 39 32 39 C27 39 22 35 22 28 Z"
            fill="url(#goldRim1)"
            stroke="#fef08a"
            strokeWidth="1.5"
          />
          <path d="M22 21 H17 C16 26 18 30 22 30" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M42 21 H47 C48 26 46 30 42 30" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="29" y="39" width="6" height="7" fill="#eab308" />
          <rect x="23" y="46" width="18" height="4.5" rx="2" fill="#f59e0b" />
          {/* Star on cup */}
          <polygon
            points="32,22 33.8,26 38,26.4 34.8,29.2 35.8,33.3 32,31 28.2,33.3 29.2,29.2 26,26.4 30.2,26"
            fill="#fef9c3"
          />
        </svg>
      );

    case 'second_trophy':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" style={filterStyle} aria-hidden="true">
          <defs>
            <linearGradient id="crimsonGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="29" fill="#1f0709" stroke="url(#crimsonGold)" strokeWidth="3.5" />
          {/* Flame aura */}
          <path
            d="M32 9 C38 16 46 21 44 33 C42 40 37 44 32 44 C27 44 22 40 20 33 C18 21 26 16 32 9 Z"
            fill="#ef4444"
            opacity="0.3"
          />
          {/* Winged Hard Mode Trophy */}
          <path d="M18 22 L11 17 L14 27 L20 28 Z" fill="#facc15" />
          <path d="M46 22 L53 17 L50 27 L44 28 Z" fill="#facc15" />
          <path
            d="M21 19 H43 L41 30 C40 36 36 40 32 40 C28 40 24 36 23 30 Z"
            fill="url(#crimsonGold)"
            stroke="#fde047"
            strokeWidth="1.6"
          />
          {/* Crown spikes */}
          <polygon points="22,19 25,13 29,19 32,12 35,19 39,13 42,19" fill="#fde047" />
          <rect x="29" y="40" width="6" height="6.5" fill="#f59e0b" />
          <rect x="22" y="46.5" width="20" height="5" rx="2" fill="#dc2626" stroke="#fde047" strokeWidth="1" />
          <text x="32" y="33" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fef08a" fontFamily="monospace">
            II
          </text>
        </svg>
      );

    case 'ouch_so_painful':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" style={filterStyle} aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#1c0d12" stroke="#f43f5e" strokeWidth="3.5" />
          {/* Shockwave Ring */}
          <ellipse cx="32" cy="45" rx="19" ry="6" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 2" />
          {/* Comic Impact Burst */}
          <polygon
            points="32,12 36,21 46,16 42,26 52,30 42,35 45,43 35,39 32,48 28,39 19,43 22,35 12,30 22,26 18,16 28,21"
            fill="#f97316"
            stroke="#fef08a"
            strokeWidth="1.8"
          />
          {/* Exclamation / Impact mark */}
          <rect x="30" y="21" width="4" height="11" rx="2" fill="#1c0d12" />
          <circle cx="32" cy="36" r="2.3" fill="#1c0d12" />
          {/* Dizzy Spark Stars */}
          <circle cx="17" cy="17" r="2.5" fill="#fde047" />
          <circle cx="48" cy="16" r="2.2" fill="#fde047" />
        </svg>
      );

    case 'lets_get_out':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" style={filterStyle} aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#071a16" stroke="#10b981" strokeWidth="3.5" />
          {/* Iron Prison Bars (middle bar broken open!) */}
          <rect x="17" y="13" width="4" height="38" rx="1.5" fill="#71717a" />
          <rect x="26" y="13" width="4" height="13" rx="1.5" fill="#71717a" />
          <rect x="26" y="38" width="4" height="13" rx="1.5" fill="#71717a" />
          <rect x="35" y="13" width="4" height="11" rx="1.5" fill="#71717a" />
          <rect x="35" y="40" width="4" height="11" rx="1.5" fill="#71717a" />
          <rect x="44" y="13" width="4" height="38" rx="1.5" fill="#71717a" />
          {/* Golden Rescue Key */}
          <circle cx="24" cy="32" r="6" fill="none" stroke="#fde047" strokeWidth="3" />
          <line x1="30" y1="32" x2="46" y2="32" stroke="#fde047" strokeWidth="3" strokeLinecap="round" />
          <line x1="40" y1="32" x2="40" y2="37" stroke="#fde047" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="44" y1="32" x2="44" y2="37" stroke="#fde047" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'first_blood':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" style={filterStyle} aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#180a0d" stroke="#38bdf8" strokeWidth="3.5" />
          {/* Target Crosshair */}
          <circle cx="32" cy="32" r="18" fill="none" stroke="#ef4444" strokeWidth="2.2" />
          <circle cx="32" cy="32" r="9" fill="#dc2626" opacity="0.35" stroke="#ef4444" strokeWidth="1.5" />
          <line x1="32" y1="9" x2="32" y2="21" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="32" y1="43" x2="32" y2="55" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="9" y1="32" x2="21" y2="32" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="43" y1="32" x2="55" y2="32" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          {/* Neon Bullet Impact Star */}
          <polygon
            points="32,23 34.5,29 41,29.5 36,33.5 37.5,40 32,36.5 26.5,40 28,33.5 23,29.5 29.5,29"
            fill="#38bdf8"
            stroke="#e0f2fe"
            strokeWidth="1.2"
          />
        </svg>
      );

    case 'evil_friend':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" style={filterStyle} aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#1b071e" stroke="#d946ef" strokeWidth="3.5" />
          {/* Devil Horns */}
          <path d="M21 22 C17 13 21 10 26 17" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.4" />
          <path d="M43 22 C47 13 43 10 38 17" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.4" />
          {/* Sinister Smirking Face */}
          <circle cx="32" cy="33" r="14" fill="#3b0764" stroke="#f0abfc" strokeWidth="2" />
          <polygon points="24,28 29,30 25,32" fill="#facc15" />
          <polygon points="40,28 35,30 39,32" fill="#facc15" />
          {/* Wicked grin */}
          <path d="M24 38 Q32 45 40 37" fill="none" stroke="#f43f5e" strokeWidth="2.8" strokeLinecap="round" />
          {/* Dagger / Snitch Whisper */}
          <polygon points="46,42 52,36 49,47" fill="#e4e4e7" />
        </svg>
      );

    case 'thank_you_friend':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" style={filterStyle} aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#0c1914" stroke="#34d399" strokeWidth="3.5" />
          {/* Open Cage Arch */}
          <path d="M16 47 V24 A16 16 0 0 1 48 24 V47" fill="none" stroke="#52525b" strokeWidth="3" strokeDasharray="5 3" />
          {/* Heart of Gratitude */}
          <path
            d="M32 46 C22 39 17 33 17 26.5 C17 22 20.5 18.5 25 18.5 C28 18.5 30.5 20.2 32 22.5 C33.5 20.2 36 18.5 39 18.5 C43.5 18.5 47 22 47 26.5 C47 33 42 39 32 46 Z"
            fill="#10b981"
            stroke="#a7f3d0"
            strokeWidth="2"
          />
          {/* Sparkle */}
          <polygon points="32,26 33.5,30 37.5,31.5 33.5,33 32,37 30.5,33 26.5,31.5 30.5,30" fill="#fef08a" />
        </svg>
      );

    case 'dont_leave_me':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" style={filterStyle} aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#17171c" stroke="#f97316" strokeWidth="3.5" />
          {/* Closed Iron Prison Bars */}
          <rect x="17" y="14" width="4" height="36" rx="1.5" fill="#71717a" />
          <rect x="26" y="14" width="4" height="36" rx="1.5" fill="#71717a" />
          <rect x="34" y="14" width="4" height="36" rx="1.5" fill="#71717a" />
          <rect x="43" y="14" width="4" height="36" rx="1.5" fill="#71717a" />
          {/* Crying eyes & reaching hand behind bars */}
          <circle cx="28" cy="28" r="2.2" fill="#e4e4e7" />
          <circle cx="36" cy="28" r="2.2" fill="#e4e4e7" />
          <path d="M28 31 V37" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          <path d="M36 31 V37" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          {/* Sad frown & arrow leaving */}
          <path d="M28 42 Q32 39 36 42" fill="none" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M46 18 L54 18 M51 15 L54 18 L51 21" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'bad_job':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" style={filterStyle} aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#1f1209" stroke="#ef4444" strokeWidth="3.5" />
          {/* Broken Gear */}
          <circle cx="32" cy="32" r="13" fill="none" stroke="#a1a1aa" strokeWidth="5" strokeDasharray="6 4" />
          <circle cx="32" cy="32" r="6" fill="#27272a" />
          {/* Electric Short-Circuit Lightning Bolts */}
          <polygon points="36,12 27,31 34,31 28,51 41,28 34,28" fill="#facc15" stroke="#ef4444" strokeWidth="1.5" />
          {/* Big Red X */}
          <line x1="16" y1="16" x2="24" y2="24" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          <line x1="24" y1="16" x2="16" y2="24" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'useless':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" style={filterStyle} aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#18181b" stroke="#a8a29e" strokeWidth="3.5" />
          {/* Slacker / Lazy Clown Trophy with Zzz */}
          <ellipse cx="32" cy="40" rx="14" ry="8" fill="#44403c" stroke="#78716c" strokeWidth="2" />
          <circle cx="32" cy="30" r="9" fill="#57534e" stroke="#a8a29e" strokeWidth="2" />
          {/* Closed sleepy eyes & flat mouth */}
          <line x1="27" y1="29" x2="30" y2="29" stroke="#d6d3d1" strokeWidth="2" strokeLinecap="round" />
          <line x1="34" y1="29" x2="37" y2="29" stroke="#d6d3d1" strokeWidth="2" strokeLinecap="round" />
          <line x1="29" y1="34" x2="35" y2="34" stroke="#d6d3d1" strokeWidth="2" strokeLinecap="round" />
          {/* Zzz text */}
          <text x="41" y="21" fontSize="10" fontWeight="900" fill="#fde047" fontFamily="monospace">
            Zzz
          </text>
          <text x="47" y="14" fontSize="8" fontWeight="900" fill="#facc15" fontFamily="monospace">
            z
          </text>
        </svg>
      );

    case 'become_developer':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" style={filterStyle} aria-hidden="true">
          <defs>
            <linearGradient id="devFuchsia" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e879f9" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="29" fill="#170624" stroke="url(#devFuchsia)" strokeWidth="3.5" />
          {/* Glowing Developer Terminal Screen */}
          <rect x="13" y="16" width="38" height="27" rx="4" fill="#09090b" stroke="#e879f9" strokeWidth="2" />
          <rect x="13" y="16" width="38" height="6" rx="3" fill="#701a75" />
          <circle cx="18" cy="19" r="1.3" fill="#f43f5e" />
          <circle cx="22.5" cy="19" r="1.3" fill="#facc15" />
          <circle cx="27" cy="19" r="1.3" fill="#34d399" />
          {/* Code Brackets </> */}
          <text x="32" y="36" textAnchor="middle" fontSize="13" fontWeight="900" fill="#f0abfc" fontFamily="monospace">
            &lt;/&gt;
          </text>
          {/* Terminal Stand */}
          <rect x="28" y="43" width="8" height="4" fill="#a855f7" />
          <rect x="21" y="47" width="22" height="3.5" rx="1.5" fill="#e879f9" />
          {/* Key Sparkle */}
          <circle cx="49" cy="15" r="3" fill="#fde047" />
        </svg>
      );
  }
};

interface Props {
  language: Language;
  unlockedIds: AchievementId[];
  onClose: () => void;
}

export const AchievementsModal: React.FC<Props> = ({ language, unlockedIds, onClose }) => {
  const isId = language === 'id';
  const unlockedCount = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none overflow-y-auto">
      <div className="relative max-w-xl w-full bg-stone-950 border-2 border-amber-500/80 rounded-2xl p-6 shadow-[0_0_70px_rgba(245,158,11,0.35)] text-stone-100 font-sans my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-white cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-amber-950/90 border-2 border-amber-400 flex items-center justify-center mb-2.5 shadow-[0_0_25px_rgba(245,158,11,0.45)]">
            <Trophy className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-amber-400 tracking-wider font-serif">
            {isId ? 'PENCAPAIAN (ACHIEVEMENT)' : 'ACHIEVEMENTS'}
          </h2>
          <p className="text-xs font-mono text-stone-400 mt-1">
            {isId
              ? `Terbuka: ${unlockedCount} / ${ACHIEVEMENTS.length} Badge`
              : `Unlocked: ${unlockedCount} / ${ACHIEVEMENTS.length} Badges`}
          </p>
        </div>

        {/* Achievement List */}
        <div className="space-y-3 mb-5 max-h-[58vh] overflow-y-auto pr-1">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = unlockedIds.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`rounded-xl p-3.5 border-2 flex items-center gap-3.5 transition-all ${
                  isUnlocked
                    ? 'bg-amber-950/35 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.18)]'
                    : 'bg-stone-900/65 border-stone-800 opacity-80'
                }`}
              >
                <div className="shrink-0">
                  <AchievementBadgeSvg id={ach.id} unlocked={isUnlocked} size={60} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className={`font-extrabold text-sm sm:text-base ${isUnlocked ? 'text-amber-300' : 'text-stone-300'}`}>
                      {isId ? ach.titleId : ach.titleEn}
                    </div>
                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono font-bold text-[10px] shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isId ? 'TERBUKA' : 'UNLOCKED'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-400 font-mono font-bold text-[10px] shrink-0">
                        <Lock className="w-3 h-3" />
                        <span>{isId ? 'TERKUNCI' : 'LOCKED'}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-stone-400 leading-snug">
                    {isId ? ach.descId : ach.descEn}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-mono font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
        >
          {isId ? 'Kembali ke Menu Utama' : 'Back to Main Menu'}
        </button>
      </div>
    </div>
  );
};
