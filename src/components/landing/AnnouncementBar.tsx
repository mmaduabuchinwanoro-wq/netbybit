import React from 'react';

interface AnnouncementBarProps {
  onOpenSecurityBrief: () => void;
}

const ANNOUNCEMENTS = [
  {
    text: 'Netbybit Institutional Custody now supports multi-signature cold settlement across 35+ blockchains.',
    action: 'Read custody brief',
  },
  {
    text: 'Hardware-isolated MPC signing and automated quorum rules protect treasury reserves 24/7.',
    action: 'Explore security',
  },
  {
    text: 'Zero-slippage institutional OTC swaps and segregated validator staking directly from cold storage.',
    action: 'Learn more',
  },
];

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ onOpenSecurityBrief }) => {
  const repeated = [...ANNOUNCEMENTS, ...ANNOUNCEMENTS];

  return (
    <div
      className="w-full border-b border-purple-500/15 overflow-hidden py-2.5"
      style={{
        background: 'linear-gradient(90deg, #0b081a 0%, #171038 50%, #0b081a 100%)',
      }}
    >
      <div className="animate-marquee-fast flex items-center gap-12 whitespace-nowrap">
        {repeated.map((item, idx) => (
          <div key={idx} className="inline-flex items-center gap-2 text-xs sm:text-[13px] text-slate-200">
            <span>{item.text}</span>
            <button
              type="button"
              onClick={onOpenSecurityBrief}
              className="text-amber-300 hover:text-amber-200 underline underline-offset-4 font-semibold cursor-pointer"
            >
              {item.action}
            </button>
            <span className="text-purple-400/50 pl-6" aria-hidden="true">
              ◆
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
