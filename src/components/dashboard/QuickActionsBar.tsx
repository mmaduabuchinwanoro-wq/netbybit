import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  QrCode,
  Repeat,
  CreditCard,
  LifeBuoy,
} from 'lucide-react';

interface QuickActionsBarProps {
  onDeposit: () => void;
  onWithdraw: () => void;
  onSend: () => void;
  onReceive: () => void;
  onSwap: () => void;
  onBuyCrypto: () => void;
  onSupport: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onDeposit,
  onWithdraw,
  onSend,
  onReceive,
  onSwap,
  onBuyCrypto,
  onSupport,
}) => {
  const actions = [
    {
      id: 'deposit',
      label: 'Deposit',
      onClick: onDeposit,
      icon: ArrowDownLeft,
      isPrimary: true,
      badgeText: 'Instant',
    },
    {
      id: 'withdraw',
      label: 'Withdraw',
      onClick: onWithdraw,
      icon: ArrowUpRight,
      isPrimary: false,
    },
    {
      id: 'send',
      label: 'Send',
      onClick: onSend,
      icon: Send,
      isPrimary: false,
    },
    {
      id: 'receive',
      label: 'Receive',
      onClick: onReceive,
      icon: QrCode,
      isPrimary: false,
    },
    {
      id: 'swap',
      label: 'Swap',
      onClick: onSwap,
      icon: Repeat,
      isPrimary: false,
    },
    {
      id: 'buy',
      label: 'Buy Crypto',
      onClick: onBuyCrypto,
      icon: CreditCard,
      isPrimary: false,
      isFeatured: true,
    },
    {
      id: 'support',
      label: 'Support',
      onClick: onSupport,
      icon: LifeBuoy,
      isPrimary: false,
      isSupport: true,
    },
  ];

  return (
    <div className="w-full">
      {/* Mobile Grid Layout: 4 columns top row, 3 columns bottom row or uniform wrap with squircle action icons */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 sm:gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className="group flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {/* Icon Container */}
              <div
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all duration-200 transform group-hover:-translate-y-0.5 group-active:scale-95 shadow-md ${
                  action.isPrimary
                    ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 shadow-amber-500/25 group-hover:shadow-amber-500/40 group-hover:from-amber-400 group-hover:to-yellow-300'
                    : action.isFeatured
                    ? 'bg-neutral-900/90 border border-amber-500/40 text-amber-300 shadow-neutral-950 group-hover:border-amber-400 group-hover:bg-neutral-850 group-hover:text-amber-200'
                    : action.isSupport
                    ? 'bg-neutral-900/90 border border-neutral-800 text-amber-400/90 shadow-neutral-950 group-hover:border-amber-500/40 group-hover:bg-neutral-850 group-hover:text-amber-300'
                    : 'bg-neutral-900/90 border border-neutral-800/90 text-neutral-200 shadow-neutral-950 group-hover:border-neutral-700 group-hover:bg-neutral-850 group-hover:text-amber-400'
                }`}
              >
                <Icon
                  className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${
                    action.isPrimary ? 'text-neutral-950 stroke-[2.5]' : 'stroke-[2]'
                  }`}
                />
              </div>

              {/* Action Label */}
              <span
                className={`mt-2 text-[11px] sm:text-xs font-bold text-center tracking-tight transition-colors ${
                  action.isPrimary
                    ? 'text-amber-400 group-hover:text-amber-300 font-extrabold'
                    : 'text-neutral-300 group-hover:text-neutral-100'
                }`}
              >
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
