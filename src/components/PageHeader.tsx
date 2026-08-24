import React from 'react';
import { ArrowLeft, Shield, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  backLabel?: string;
  fallbackPage?: string;
  onBack?: () => void;
  badge?: string;
  badgeType?: 'gold' | 'emerald' | 'blue' | 'neutral';
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  backLabel = 'Back to Dashboard',
  fallbackPage = 'dashboard',
  onBack,
  badge,
  badgeType = 'gold',
  actions,
}) => {
  const { goBack, activePage } = useAuth();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      goBack(fallbackPage);
    }
  };

  const badgeStyles = {
    gold: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    neutral: 'bg-neutral-800/80 border-neutral-700 text-neutral-300',
  };

  return (
    <div className="space-y-3 border-b border-neutral-800/90 pb-5">
      {/* Navigation Top Row: Back Button & Institutional Breadcrumb */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={handleBack}
          className="group inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 text-xs font-semibold transition-all shadow-sm"
          title="Return to previous screen"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 text-amber-400" />
          <span>{backLabel}</span>
        </button>

        <div className="flex items-center space-x-2 text-[11px] font-mono text-neutral-500">
          <span className="hidden sm:inline">NETBYBIT VAULT</span>
          <span className="hidden sm:inline">/</span>
          <span className="text-amber-400 font-semibold uppercase">{title}</span>
        </div>
      </div>

      {/* Title & Action Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            {Icon && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/5 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-sm">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight">
              {title}
            </h1>
            {badge && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${badgeStyles[badgeType]}`}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
