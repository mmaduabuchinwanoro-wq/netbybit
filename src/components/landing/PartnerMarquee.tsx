import React from 'react';

const ECOSYSTEM_PARTNERS = [
  { name: 'BITCOIN', mark: '₿' },
  { name: 'ETHEREUM', mark: 'Ξ' },
  { name: 'AVALANCHE', mark: '▲' },
  { name: 'INJECTIVE', mark: '◈' },
  { name: 'BNB CHAIN', mark: '◆' },
  { name: 'UNISWAP', mark: '✦' },
  { name: 'ARBITRUM', mark: '⬢' },
  { name: 'CHAINLINK', mark: '⬡' },
  { name: 'SOLANA', mark: '≡' },
  { name: 'POLYGON', mark: '◇' },
  { name: 'TRON', mark: '▽' },
  { name: '1INCH', mark: '◉' },
];

export const PartnerMarquee: React.FC = () => {
  const track = [...ECOSYSTEM_PARTNERS, ...ECOSYSTEM_PARTNERS];

  return (
    <div className="pt-14 pb-4 space-y-6">
      <p className="text-center text-xs sm:text-sm font-semibold tracking-[0.22em] uppercase text-amber-300/85">
        Supported Networks & Ecosystem Integrations
      </p>

      <div className="relative overflow-hidden py-4">
        {/* Left & Right edge fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 z-10 bg-gradient-to-r from-[#0c091d] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 z-10 bg-gradient-to-l from-[#0c091d] to-transparent" />

        <div className="animate-marquee-slow flex items-center gap-12 sm:gap-16">
          {track.map((partner, idx) => (
            <div
              key={`${partner.name}-${idx}`}
              className="inline-flex items-center gap-2.5 text-slate-300/80 hover:text-amber-300 transition-colors shrink-0 select-none"
            >
              <span className="text-lg sm:text-xl text-indigo-300 font-bold" aria-hidden="true">
                {partner.mark}
              </span>
              <span className="font-display font-bold tracking-[0.12em] text-sm sm:text-base whitespace-nowrap">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
