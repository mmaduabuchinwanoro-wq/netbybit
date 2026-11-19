import React from 'react';
import { motion } from 'motion/react';

/* Four-point holographic star sparkle seen across sections in the reference video */
export const SparkleAccent: React.FC<{
  size?: number;
  className?: string;
  delay?: number;
  gold?: boolean;
}> = ({ size = 28, className = '', delay = 0, gold = false }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    aria-hidden="true"
    className={`pointer-events-none select-none ${className}`}
    animate={{
      opacity: [0.45, 1, 0.45],
      scale: [0.92, 1.08, 0.92],
    }}
    transition={{
      duration: 3.8,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
  >
    <path
      d="M18 2C18 11.2 24.8 18 34 18C24.8 18 18 24.8 18 34C18 24.8 11.2 18 2 18C11.2 18 18 11.2 18 2Z"
      fill={gold ? 'url(#sparkGold)' : 'url(#sparkViolet)'}
    />
    <defs>
      <linearGradient id="sparkGold" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="sparkViolet" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E0E7FF" />
        <stop offset="1" stopColor="#818CF8" />
      </linearGradient>
    </defs>
  </motion.svg>
);

/* 1. Hero Isometric 3D Composition: Hardware Signer + Cold Card + Custody Screen + Floating Protocol Tiles */
export const HeroIsometricScene: React.FC<{ onOpenVault: () => void }> = ({ onOpenVault }) => {
  return (
    <div className="relative w-full max-w-[900px] mx-auto pt-4 pb-2 select-none">
      {/* Radial Under-Glow */}
      <div
        className="absolute inset-x-10 top-10 bottom-4 rounded-full blur-[90px] opacity-60 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(99, 102, 241, 0.45), rgba(139, 61, 255, 0.28) 45%, rgba(245, 158, 11, 0.14) 75%, transparent 100%)',
        }}
      />

      <div className="relative flex items-end justify-center min-h-[300px] sm:min-h-[390px] md:min-h-[430px]">
        {/* Left: Isometric Hardware Signer Module */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10 -mr-10 sm:-mr-12 mb-4 sm:mb-8 w-[125px] sm:w-[175px] md:w-[205px] shrink-0"
        >
          <svg viewBox="0 0 220 260" className="w-full h-auto drop-shadow-[0_24px_38px_rgba(0,0,0,0.85)]">
            <defs>
              <linearGradient id="hwBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e1b33" />
                <stop offset="100%" stopColor="#090812" />
              </linearGradient>
              <linearGradient id="hwEdge" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.45" />
              </linearGradient>
            </defs>
            {/* Tilted Hardware Signer Body */}
            <g transform="rotate(-12 110 130)">
              <rect x="28" y="18" width="152" height="218" rx="22" fill="#06050d" stroke="url(#hwEdge)" strokeWidth="2.5" />
              <rect x="34" y="24" width="140" height="206" rx="18" fill="url(#hwBody)" />
              {/* Screen */}
              <rect x="48" y="40" width="112" height="72" rx="10" fill="#070612" stroke="#312e81" strokeWidth="1.5" />
              {/* Hex N inside OLED */}
              <polygon points="72,56 84,63 84,77 72,84 60,77 60,63" fill="none" stroke="#f59e0b" strokeWidth="2" />
              <text x="92" y="70" fill="#fbbf24" fontSize="11" fontWeight="700" fontFamily="Outfit, sans-serif">
                NETBYBIT
              </text>
              <text x="92" y="84" fill="#a5b4fc" fontSize="8" fontFamily="JetBrains Mono, monospace">
                HSM SIGNER
              </text>
              <rect x="58" y="96" width="92" height="4" rx="2" fill="#312e81" />
              <rect x="58" y="96" width="64" height="4" rx="2" fill="#f59e0b" />
              {/* Tactile D-Pad & Buttons */}
              <circle cx="104" cy="166" r="32" fill="#0d0b1a" stroke="#3b346b" strokeWidth="1.5" />
              <circle cx="104" cy="166" r="14" fill="#181433" stroke="#f59e0b" strokeOpacity="0.5" strokeWidth="1.5" />
              <circle cx="104" cy="143" r="3" fill="#818cf8" />
              <circle cx="104" cy="189" r="3" fill="#818cf8" />
              <circle cx="81" cy="166" r="3" fill="#818cf8" />
              <circle cx="127" cy="166" r="3" fill="#818cf8" />
            </g>
            {/* Floating Verified Emblem */}
            <circle cx="152" cy="184" r="24" fill="#110e24" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="152" cy="184" r="17" fill="#10b981" fillOpacity="0.18" />
            <path d="M144 184l5.5 5.5 11-11" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </motion.div>

        {/* Front-Left: Isometric Cold Key Card */}
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          className="hidden sm:block relative z-20 -mr-14 mb-2 w-[135px] md:w-[155px] shrink-0"
        >
          <svg viewBox="0 0 180 125" className="w-full h-auto drop-shadow-[0_18px_30px_rgba(0,0,0,0.85)]">
            <defs>
              <linearGradient id="keyCardBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1b1638" />
                <stop offset="100%" stopColor="#090814" />
              </linearGradient>
            </defs>
            <g transform="skewY(-14) rotate(6 90 62)">
              <rect x="14" y="22" width="150" height="86" rx="14" fill="url(#keyCardBg)" stroke="#a78bfa" strokeOpacity="0.4" strokeWidth="1.8" />
              <rect x="28" y="38" width="24" height="18" rx="4" fill="#f59e0b" fillOpacity="0.25" stroke="#fbbf24" strokeWidth="1.2" />
              <circle cx="136" cy="48" r="10" fill="none" stroke="#818cf8" strokeWidth="1.5" />
              <text x="28" y="88" fill="#e2e8f0" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
                MPC COLD KEY
              </text>
            </g>
          </svg>
        </motion.div>

        {/* Center Focal Point: Isometric Netbybit Custody Interface */}
        <motion.button
          type="button"
          onClick={onOpenVault}
          aria-label="Open interactive Netbybit Custody Vault simulator"
          whileHover={{ y: -6, scale: 1.015 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-30 w-[235px] sm:w-[300px] md:w-[340px] shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-3xl"
        >
          <div
            className="relative rounded-[26px] p-[2px] shadow-[0_32px_70px_-12px_rgba(15,10,45,0.95)]"
            style={{
              background: 'linear-gradient(145deg, rgba(251,191,36,0.75) 0%, rgba(99,102,241,0.8) 50%, rgba(139,61,255,0.7) 100%)',
              transform: 'perspective(1100px) rotateY(-12deg) rotateX(6deg)',
            }}
          >
            <div className="rounded-[24px] bg-[#0a0816] p-4 sm:p-5 text-left overflow-hidden relative">
              {/* Subtle top holographic glow */}
              <div className="absolute -top-12 -right-10 w-36 h-36 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

              {/* Header bar inside isometric phone */}
              <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-amber-500/15 border border-amber-400/50 flex items-center justify-center text-[10px] font-bold text-amber-300">
                    N
                  </span>
                  <span className="text-[11px] font-display font-bold tracking-wider text-amber-300">
                    NETBYBIT VAULT
                  </span>
                </div>
                <span className="text-[10px] font-mono text-indigo-300">MPC · 3/5</span>
              </div>

              {/* Balance display */}
              <div className="pt-4 pb-3">
                <div className="text-[10px] uppercase tracking-widest text-slate-400">
                  Segregated Custody
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-[28px] font-display font-extrabold tracking-tight text-white tabular-nums">
                    $15,842,910
                  </span>
                  <span className="text-xs font-mono font-semibold text-emerald-400 tabular-nums">
                    +4.18%
                  </span>
                </div>

                {/* Action row */}
                <div className="mt-3.5 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-[#14102b] border border-indigo-500/25 py-1.5 text-center text-[10px] font-semibold text-indigo-200">
                    Deposit
                  </div>
                  <div className="rounded-xl bg-gradient-to-r from-blue-500/30 to-purple-600/30 border border-amber-400/40 py-1.5 text-center text-[10px] font-semibold text-amber-200">
                    Swap
                  </div>
                  <div className="rounded-xl bg-[#14102b] border border-indigo-500/25 py-1.5 text-center text-[10px] font-semibold text-indigo-200">
                    Settle
                  </div>
                </div>
              </div>

              {/* Asset rows */}
              <div className="space-y-2 pt-2 border-t border-indigo-500/15">
                {[
                  { sym: 'BTC', name: 'Bitcoin Vault', bal: '112.40 BTC', usd: '$9,814,200', color: '#f59e0b' },
                  { sym: 'ETH', name: 'Ethereum MPC', bal: '1,240.0 ETH', usd: '$3,968,000', color: '#818cf8' },
                  { sym: 'USDT', name: 'Tether Treasury', bal: '2,060,710 USDT', usd: '$2,060,710', color: '#34d399' },
                ].map((row) => (
                  <div
                    key={row.sym}
                    className="flex items-center justify-between rounded-xl bg-[#0f0c20] border border-white/5 px-3 py-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-slate-950"
                        style={{ backgroundColor: row.color }}
                      >
                        {row.sym[0]}
                      </span>
                      <div>
                        <div className="text-[11px] font-semibold text-white leading-tight">{row.sym}</div>
                        <div className="text-[9px] text-slate-400">{row.name}</div>
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="text-[11px] font-semibold text-white">{row.usd}</div>
                      <div className="text-[9px] font-mono text-slate-400">{row.bal}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.button>

        {/* Right: Floating Isometric Custody Crest + Holographic Protocol Tile */}
        <div className="relative z-40 -ml-8 sm:-ml-10 mb-6 sm:mb-10 flex flex-col gap-4 shrink-0">
          <motion.div
            animate={{ y: [-6, 6, -6], rotate: [0, 2, 0] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[96px] sm:w-[132px] md:w-[148px]"
          >
            <svg viewBox="0 0 160 160" className="w-full h-auto drop-shadow-[0_20px_32px_rgba(0,0,0,0.85)]">
              <defs>
                <linearGradient id="tileGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fde68a" />
                  <stop offset="55%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
                <linearGradient id="tileGlass" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e1745" />
                  <stop offset="100%" stopColor="#0a0818" />
                </linearGradient>
              </defs>
              <g transform="rotate(8 80 80)">
                <rect x="20" y="20" width="120" height="120" rx="26" fill="url(#tileGlass)" stroke="url(#tileGold)" strokeWidth="2.5" />
                <polygon points="80,40 112,58 112,96 80,114 48,96 48,58" fill="#0d0a1f" stroke="url(#tileGold)" strokeWidth="2.8" />
                <path d="M67 93V61h6l14 19V61h6v32h-5.8L73 73.5V93h-6z" fill="url(#tileGold)" />
              </g>
              {/* Verified Purple Check */}
              <circle cx="42" cy="116" r="18" fill="#4f46e5" stroke="#0a0816" strokeWidth="3" />
              <path d="M35 116l4.5 4.5 9-9" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </motion.div>

          <motion.div
            animate={{ y: [5, -7, 5] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            className="w-[90px] sm:w-[118px] md:w-[132px] -ml-4"
          >
            <svg viewBox="0 0 150 150" className="w-full h-auto drop-shadow-[0_18px_28px_rgba(0,0,0,0.85)]">
              <g transform="rotate(-8 75 75)">
                <rect x="22" y="22" width="106" height="106" rx="22" fill="#120e29" stroke="#818cf8" strokeOpacity="0.6" strokeWidth="2" />
                {/* Isometric Prism / Liquidity Diamond */}
                <polygon points="75,38 104,74 75,92 46,74" fill="#6366f1" fillOpacity="0.35" stroke="#a5b4fc" strokeWidth="2" />
                <polygon points="75,92 104,74 75,114 46,74" fill="#a855f7" fillOpacity="0.35" stroke="#c084fc" strokeWidth="2" />
              </g>
            </svg>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

/* 2. Isometric Coin Stacks Illustration (Section: Earn / Yield) */
export const CoinStacksIsometric: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6 }}
    className="w-full max-w-[360px] mx-auto"
  >
    <svg viewBox="0 0 380 280" className="w-full h-auto drop-shadow-[0_24px_45px_rgba(0,0,0,0.8)]">
      <defs>
        <linearGradient id="pillarDark" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1d183d" />
          <stop offset="50%" stopColor="#2e275e" />
          <stop offset="100%" stopColor="#120e28" />
        </linearGradient>
        <linearGradient id="coinGoldTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Ambient glow */}
      <ellipse cx="190" cy="232" rx="145" ry="26" fill="#4f46e5" fillOpacity="0.18" />

      {/* Back Tall Stack (BTC Gold Accent) */}
      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M126 70 v115 a36 16 0 0 0 72 0 v-115 z" fill="url(#pillarDark)" stroke="#6366f1" strokeOpacity="0.45" strokeWidth="1.5" />
        <ellipse cx="162" cy="70" rx="36" ry="16" fill="#0d0b1a" stroke="#f59e0b" strokeWidth="2.2" />
        <text x="162" y="75" textAnchor="middle" fill="#fbbf24" fontSize="16" fontWeight="800" fontFamily="Outfit, sans-serif">
          ₿
        </text>
        {/* Stack rings */}
        {[92, 114, 136, 158].map((y) => (
          <path key={y} d={`M126 ${y} a36 16 0 0 0 72 0`} fill="none" stroke="#818cf8" strokeOpacity="0.3" strokeWidth="1.2" />
        ))}
      </motion.g>

      {/* Middle Right Tall Stack (ETH Violet Accent) */}
      <motion.g animate={{ y: [0, 6, 0] }} transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}>
        <path d="M196 104 v96 a34 15 0 0 0 68 0 v-96 z" fill="url(#pillarDark)" stroke="#8b5cf6" strokeOpacity="0.5" strokeWidth="1.5" />
        <ellipse cx="230" cy="104" rx="34" ry="15" fill="#120f26" stroke="#a78bfa" strokeWidth="2" />
        <polygon points="230,94 238,104 230,114 222,104" fill="#c4b5fd" />
        {[126, 148, 170].map((y) => (
          <path key={y} d={`M196 ${y} a34 15 0 0 0 68 0`} fill="none" stroke="#a78bfa" strokeOpacity="0.28" strokeWidth="1.2" />
        ))}
      </motion.g>

      {/* Front Left Medium Stack (USDT Emerald/Gold) */}
      <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 4.1, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
        <path d="M78 138 v64 a32 14 0 0 0 64 0 v-64 z" fill="url(#pillarDark)" stroke="#34d399" strokeOpacity="0.45" strokeWidth="1.5" />
        <ellipse cx="110" cy="138" rx="32" ry="14" fill="#0d0b1a" stroke="#34d399" strokeWidth="2" />
        <text x="110" y="143" textAnchor="middle" fill="#6ee7b7" fontSize="14" fontWeight="700" fontFamily="Outfit, sans-serif">
          ₮
        </text>
      </motion.g>

      {/* Floating Tilted Coins */}
      <g transform="translate(86, 206) rotate(-8)">
        <ellipse cx="32" cy="18" rx="28" ry="13" fill="#14102b" stroke="#f59e0b" strokeWidth="2" />
        <text x="32" y="22" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="700">
          N
        </text>
      </g>
      <g transform="translate(238, 198) rotate(12)">
        <ellipse cx="32" cy="18" rx="28" ry="13" fill="#14102b" stroke="#818cf8" strokeWidth="2" />
        <text x="32" y="22" textAnchor="middle" fill="#c7d2fe" fontSize="11" fontWeight="700">
          SOL
        </text>
      </g>
    </svg>
  </motion.div>
);

/* 3. Isometric Tilted Swap Phone + Floating ETH & BTC Coins (Section: Effortless Execution) */
export const SwapPhoneIsometric: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6 }}
    className="relative w-full max-w-[420px] mx-auto py-4"
  >
    {/* Floating Left ETH Medallion */}
    <motion.div
      animate={{ y: [-7, 7, -7] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute left-2 sm:left-4 top-6 z-20 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#120f29] border-2 border-indigo-400/70 shadow-[0_14px_30px_rgba(79,70,229,0.45)] flex items-center justify-center"
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7">
        <polygon points="16,3 24,16 16,21 8,16" fill="#a5b4fc" />
        <polygon points="16,23 24,18 16,29 8,18" fill="#818cf8" />
      </svg>
    </motion.div>

    {/* Floating Right BTC Medallion */}
    <motion.div
      animate={{ y: [7, -7, 7] }}
      transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute right-2 sm:right-4 bottom-8 z-20 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#141024] border-2 border-amber-400/80 shadow-[0_14px_30px_rgba(245,158,11,0.35)] flex items-center justify-center"
    >
      <span className="font-display font-extrabold text-xl text-amber-300">₿</span>
    </motion.div>

    {/* Tilted Isometric Execution Card */}
    <div
      className="mx-auto w-[280px] sm:w-[320px] rounded-[28px] p-[2px]"
      style={{
        background: 'linear-gradient(135deg, rgba(79,134,247,0.75), rgba(139,61,255,0.75), rgba(245,180,45,0.65))',
        transform: 'perspective(900px) rotateX(22deg) rotateZ(-14deg)',
        boxShadow: '0 32px 60px -16px rgba(10, 6, 30, 0.95)',
      }}
    >
      <div className="rounded-[26px] bg-[#090814] p-5 space-y-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-indigo-300">
          <span>NETBYBIT OTC SWAP</span>
          <span className="text-amber-300">ZERO SLIPPAGE</span>
        </div>
        <div className="rounded-2xl bg-[#131029] border border-indigo-500/25 p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400">From Custody</div>
            <div className="text-base font-display font-bold text-white tabular-nums">12.5000 ETH</div>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-300">ETH</span>
        </div>
        <div className="rounded-2xl bg-[#131029] border border-amber-400/35 p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400">To Settlement</div>
            <div className="text-base font-display font-bold text-amber-300 tabular-nums">40,000.00 USDT</div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-300">ERC-20</span>
        </div>
        <div className="rounded-xl btn-netbybit py-2 text-center text-xs font-semibold text-white">
          Execute Atomic Settlement
        </div>
      </div>
    </div>
  </motion.div>
);

/* 4. Isometric Holographic Web3 Gateway Portal */
export const Web3PortalIsometric: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true, amount: 0.25 }}
    transition={{ duration: 0.6 }}
    className="w-full max-w-[380px] mx-auto"
  >
    <svg viewBox="0 0 380 300" className="w-full h-auto drop-shadow-[0_24px_44px_rgba(0,0,0,0.85)]">
      <defs>
        <linearGradient id="portalWallA" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#110d29" />
        </linearGradient>
        <linearGradient id="portalFloor" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Soft Holographic Clouds */}
      <motion.g animate={{ x: [-4, 4, -4] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M46 196h64a16 16 0 0 0 0-32 22 22 0 0 0-42-8 18 18 0 0 0-22 40z" fill="#1e1845" stroke="#818cf8" strokeOpacity="0.45" strokeWidth="1.5" />
        <path d="M276 238h58a14 14 0 0 0 0-28 20 20 0 0 0-38-6 16 16 0 0 0-20 34z" fill="#1e1845" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="1.5" />
      </motion.g>

      {/* Isometric Gateway Frame */}
      <polygon points="190,46 296,106 190,166 84,106" fill="url(#portalWallA)" stroke="#a78bfa" strokeWidth="2" />
      <polygon points="84,106 190,166 190,262 84,202" fill="#0d0a1f" stroke="#6366f1" strokeOpacity="0.7" strokeWidth="2" />
      <polygon points="296,106 190,166 190,262 296,202" fill="url(#portalFloor)" stroke="#f59e0b" strokeOpacity="0.75" strokeWidth="2" />

      {/* Center Core Hex */}
      <polygon points="190,126 226,147 226,189 190,210 154,189 154,147" fill="#080614" stroke="#fbbf24" strokeWidth="2.5" />
      <text x="190" y="176" textAnchor="middle" fill="#fbbf24" fontSize="22" fontWeight="800" fontFamily="Outfit, sans-serif">
        N
      </text>

      {/* Floating Nodes */}
      <motion.g animate={{ y: [-5, 5, -5] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}>
        <circle cx="88" cy="144" r="20" fill="#120e28" stroke="#34d399" strokeWidth="2" />
        <text x="88" y="149" textAnchor="middle" fill="#6ee7b7" fontSize="13" fontWeight="700">Ξ</text>
      </motion.g>
      <motion.g animate={{ y: [5, -5, 5] }} transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}>
        <circle cx="292" cy="140" r="20" fill="#120e28" stroke="#fbbf24" strokeWidth="2" />
        <text x="292" y="146" textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="700">₿</text>
      </motion.g>
    </svg>
  </motion.div>
);

/* 5. Feature Carousel Isometric 3D Icons */
export const CarouselTileIsometric: React.FC<{
  kind: 'heart' | 'candles' | 'gear' | 'shield' | 'devices';
}> = ({ kind }) => {
  return (
    <motion.div
      animate={{ y: [-4, 4, -4] }}
      transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
      className="w-24 h-24 mx-auto flex items-center justify-center"
    >
      <svg viewBox="0 0 110 110" className="w-full h-full drop-shadow-[0_14px_26px_rgba(0,0,0,0.75)]">
        <defs>
          <linearGradient id="isoFace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="isoGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {kind === 'heart' && (
          <g>
            <rect x="20" y="16" width="68" height="62" rx="14" fill="#1a143b" stroke="url(#isoGold)" strokeWidth="2.5" />
            <path d="M54 88 L46 78 H62 Z" fill="#1a143b" stroke="url(#isoGold)" strokeWidth="2" />
            <path
              d="M54 63 C54 63 36 52 36 40 C36 33 42 29 48 31 C51 32 53 34 54 37 C55 34 57 32 60 31 C66 29 72 33 72 40 C72 52 54 63 54 63 Z"
              fill="url(#isoGold)"
            />
          </g>
        )}

        {kind === 'candles' && (
          <g>
            <ellipse cx="55" cy="84" rx="34" ry="12" fill="#14102b" stroke="#6366f1" strokeWidth="2" />
            <rect x="29" y="42" width="14" height="36" rx="4" fill="#312e81" stroke="#a5b4fc" strokeWidth="2" />
            <rect x="49" y="20" width="14" height="58" rx="4" fill="url(#isoFace)" stroke="url(#isoGold)" strokeWidth="2" />
            <rect x="69" y="34" width="14" height="44" rx="4" fill="#1e1b4b" stroke="#34d399" strokeWidth="2" />
          </g>
        )}

        {kind === 'gear' && (
          <g>
            <circle cx="55" cy="55" r="34" fill="#1a143b" stroke="url(#isoGold)" strokeWidth="3" strokeDasharray="10 6" />
            <circle cx="55" cy="55" r="22" fill="#0d0a1f" stroke="#818cf8" strokeWidth="2.5" />
            <circle cx="48" cy="52" r="2.5" fill="#fbbf24" />
            <circle cx="62" cy="52" r="2.5" fill="#fbbf24" />
            <path d="M47 61 Q55 67 63 61" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        )}

        {kind === 'shield' && (
          <g>
            <path
              d="M55 14 L88 28 V54 C88 76 55 94 55 94 C55 94 22 76 22 54 V28 Z"
              fill="#171236"
              stroke="url(#isoGold)"
              strokeWidth="2.5"
            />
            <path d="M43 54 L52 63 L69 44" stroke="#34d399" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        )}

        {kind === 'devices' && (
          <g>
            <rect x="18" y="26" width="52" height="62" rx="9" fill="#14102b" stroke="#818cf8" strokeWidth="2.2" />
            <rect x="48" y="18" width="44" height="72" rx="9" fill="#1e1745" stroke="url(#isoGold)" strokeWidth="2.2" />
            <polygon points="70,40 82,47 82,61 70,68 58,61 58,47" fill="none" stroke="#fbbf24" strokeWidth="2" />
          </g>
        )}
      </svg>
    </motion.div>
  );
};

/* 6. Isometric Armored Safe with Gold Bitcoin Coin (Section: Security & Verification) */
export const VaultSafeIsometric: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6 }}
    className="w-full max-w-[300px] mx-auto"
  >
    <svg viewBox="0 0 280 250" className="w-full h-auto drop-shadow-[0_26px_45px_rgba(0,0,0,0.85)]">
      <defs>
        <linearGradient id="safeFront" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e193d" />
          <stop offset="100%" stopColor="#0c0a1a" />
        </linearGradient>
        <linearGradient id="safeSide" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#312763" />
          <stop offset="100%" stopColor="#161133" />
        </linearGradient>
        <linearGradient id="safeCoin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      {/* Safe Isometric Box */}
      <polygon points="140,62 234,112 140,162 46,112" fill="#231c4c" stroke="#818cf8" strokeWidth="2" />
      <polygon points="46,112 140,162 140,236 46,186" fill="url(#safeFront)" stroke="#6366f1" strokeWidth="2" />
      <polygon points="234,112 140,162 140,236 234,186" fill="url(#safeSide)" stroke="#f59e0b" strokeOpacity="0.65" strokeWidth="2" />

      {/* Coin Slot on Top */}
      <path d="M116 106 L164 130" stroke="#06050d" strokeWidth="7" strokeLinecap="round" />

      {/* Vault Door Dial */}
      <ellipse cx="92" cy="172" rx="18" ry="22" fill="#0d0a1f" stroke="#f59e0b" strokeWidth="2.2" />
      <path d="M84 172h16M92 162v20" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />

      {/* Slotting Gold Bitcoin Coin */}
      <motion.g animate={{ y: [-6, 4, -6] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}>
        <circle cx="140" cy="68" r="34" fill="url(#safeCoin)" stroke="#fef9c3" strokeWidth="2" />
        <circle cx="140" cy="68" r="27" fill="none" stroke="#92400e" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="140" y="79" textAnchor="middle" fill="#1c1104" fontSize="30" fontWeight="900" fontFamily="Outfit, sans-serif">
          ₿
        </text>
      </motion.g>
    </svg>
  </motion.div>
);

/* 7. Final CTA Floating 3D Hexagonal Netbybit Crest */
export const NetbybitCrestIsometric: React.FC = () => (
  <motion.div
    animate={{ y: [-6, 6, -6] }}
    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    className="w-32 h-32 sm:w-36 sm:h-36 mx-auto"
  >
    <svg viewBox="0 0 180 180" className="w-full h-full drop-shadow-[0_24px_45px_rgba(109,74,255,0.45)]">
      <defs>
        <linearGradient id="crestBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id="crestCore" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1747" />
          <stop offset="100%" stopColor="#090714" />
        </linearGradient>
      </defs>
      <g transform="skewY(-6) rotate(4 90 90)">
        <rect x="26" y="24" width="128" height="128" rx="30" fill="url(#crestCore)" stroke="url(#crestBorder)" strokeWidth="3.5" />
        <polygon points="90,46 126,67 126,109 90,130 54,109 54,67" fill="#0d0a1f" stroke="#fbbf24" strokeWidth="3" />
        <path d="M74 107V69h7.5L98 91V69h7.5v38H98L81.5 85V107H74z" fill="#fbbf24" />
      </g>
    </svg>
  </motion.div>
);
