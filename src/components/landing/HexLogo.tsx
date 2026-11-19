import React, { useState } from 'react';

interface HexLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const HexLogo: React.FC<HexLogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const iconBoxClass =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const wordmarkClass =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg sm:text-xl';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none shrink-0 ${className}`}>
      {/* Gold Hexagonal "N" Logo */}
      <div className={`relative ${iconBoxClass} shrink-0 flex items-center justify-center`}>
        <div
          className="absolute inset-0 rounded-xl blur-md opacity-45 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(245,180,45,0.65) 0%, rgba(109,74,255,0.2) 70%, transparent 100%)',
          }}
        />
        {!imgFailed ? (
          <img
            src="/logo.png"
            alt="Netbybit Gold Hexagonal Logo"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="relative w-full h-full object-contain rounded-lg"
          />
        ) : (
          <svg
            viewBox="0 0 64 64"
            className="relative w-full h-full"
            aria-label="Netbybit Gold Hexagonal Logo"
          >
            <defs>
              <linearGradient id="nbHexGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            <polygon
              points="32,4 56,18 56,46 32,60 8,46 8,18"
              fill="#0a0814"
              stroke="url(#nbHexGold)"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path
              d="M21 44V20h5.5l11 14.8V20H43v24h-5.2L26.5 28.8V44H21z"
              fill="url(#nbHexGold)"
            />
          </svg>
        )}
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span
          className={`font-display font-extrabold tracking-[0.12em] uppercase text-gold-gradient whitespace-nowrap ${wordmarkClass}`}
        >
          NETBYBIT
        </span>
        {showTagline && (
          <span className="mt-1 text-[10px] font-medium tracking-[0.18em] uppercase text-amber-300/80 whitespace-nowrap">
            Institutional Crypto Custody
          </span>
        )}
      </div>
    </div>
  );
};
