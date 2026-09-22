import React from 'react';

interface NetbybitLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export const NetbybitLogo: React.FC<NetbybitLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
}) => {
  let iconDimensions = 'w-9 h-9';
  let titleSize = 'text-xl';
  let subtitleSize = 'text-[9px]';

  switch (size) {
    case 'sm':
      iconDimensions = 'w-7 h-7';
      titleSize = 'text-base';
      subtitleSize = 'text-[8px]';
      break;
    case 'md':
      iconDimensions = 'w-9 h-9';
      titleSize = 'text-xl';
      subtitleSize = 'text-[9px]';
      break;
    case 'lg':
      iconDimensions = 'w-11 h-11';
      titleSize = 'text-2xl';
      subtitleSize = 'text-[10px]';
      break;
    case 'xl':
      iconDimensions = 'w-14 h-14';
      titleSize = 'text-3xl';
      subtitleSize = 'text-[11px]';
      break;
  }

  return (
    <div className={`inline-flex items-center space-x-3 select-none ${className}`}>
      {/* Netbybit Official Logo Image */}
      <div className={`relative ${iconDimensions} shrink-0`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 rounded-xl blur-sm opacity-50" />
        <div className="relative w-full h-full rounded-xl bg-neutral-950 p-[1px] border border-amber-500/40 shadow-xl overflow-hidden flex items-center justify-center">
          <img
            src="/logo.png"
            alt="NETBYBIT"
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => {
              // Fallback to SVG if image loading encounters an issue
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-black tracking-wider uppercase bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-500 bg-clip-text text-transparent ${titleSize} ${textClassName}`}
          >
            NETBYBIT
          </span>
          <span className={`tracking-widest text-amber-500/80 font-mono font-semibold uppercase ${subtitleSize}`}>
            INSTITUTIONAL CRYPTO CUSTODY
          </span>
        </div>
      )}
    </div>
  );
};
