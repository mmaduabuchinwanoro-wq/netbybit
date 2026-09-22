import React from 'react';
import {
  Eye,
  EyeOff,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { CurrencySwitcher } from '../CurrencySwitcher';

interface PortfolioCardProps {
  totalUsd: number;
  formattedTotalFiat: { amount: number; formatted: string; symbol: string; code: string };
  btcValuation: string;
  formattedPnlFiat: { amount: number; formatted: string; symbol: string; code: string };
  hideBalances: boolean;
  setHideBalances: React.Dispatch<React.SetStateAction<boolean>>;
  handleRefreshMarketData: () => Promise<void>;
  isManualRefreshing: boolean;
  pricesLoading: boolean;
  isMarketOffline: boolean;
  selectedCurrency: string;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  totalUsd,
  formattedTotalFiat,
  btcValuation,
  formattedPnlFiat,
  hideBalances,
  setHideBalances,
  handleRefreshMarketData,
  isManualRefreshing,
  pricesLoading,
  isMarketOffline,
  selectedCurrency,
}) => {
  const isRefreshing = pricesLoading || isManualRefreshing;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12141a] via-[#0e1015] to-[#0a0b0e] border border-neutral-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-6 sm:p-8 backdrop-blur-xl group hover:border-amber-500/30 transition-all duration-300">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Top Header Row of Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/60 pb-4">
          {/* Left: Custody Status Badge */}
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-tight shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>NetByBit Custody Vault</span>
            </span>

            {isMarketOffline && (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Market feeds offline (Retrying…)</span>
                <span className="sm:hidden">Offline</span>
              </span>
            )}
          </div>

          {/* Right: Balance Visibility & Rate Refresh Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setHideBalances((prev) => !prev)}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-amber-400 transition-all text-xs font-mono font-medium flex items-center space-x-1.5 shadow-sm"
              title={hideBalances ? 'Show Balances' : 'Hide Balances'}
              aria-label="Toggle Balance Visibility"
            >
              {hideBalances ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="hidden xs:inline text-[11px]">Hidden</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xs:inline text-[11px]">Visible</span>
                </>
              )}
            </button>

            <button
              onClick={handleRefreshMarketData}
              disabled={isManualRefreshing}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/30 text-neutral-300 hover:text-amber-300 transition-all text-xs font-mono font-medium flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
              title="Refresh Live Exchange Rates"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-neutral-400'}`}
              />
              <span className="hidden sm:inline text-[11px]">Refresh</span>
            </button>
          </div>
        </div>

        {/* Main Balance Display Area */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-mono text-neutral-400 uppercase tracking-wider">
            <Lock className="w-3 h-3 text-amber-400/80" />
            <span>Total Estimated Portfolio Value</span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 pt-1">
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black font-mono text-neutral-50 tracking-tight flex items-center">
              <span>{hideBalances ? '••••••••' : formattedTotalFiat.formatted}</span>
            </h1>

            {/* Currency Switcher Dropdown directly adjacent */}
            <div className="relative">
              <CurrencySwitcher variant="hero" />
            </div>

            {/* Live syncing indicator */}
            {isRefreshing && (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[11px] animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                <span>Updating rates...</span>
              </span>
            )}
          </div>
        </div>

        {/* Secondary Metrics Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* BTC Valuation */}
          <div className="flex items-center space-x-2 bg-neutral-900/80 border border-neutral-800/80 px-3 py-1.5 rounded-xl text-xs font-mono">
            <span className="text-neutral-400 text-[11px]">BTC Est:</span>
            <span className="text-amber-300 font-bold">
              {hideBalances ? '••••' : `≈ ${btcValuation} BTC`}
            </span>
          </div>

          {/* 24h PnL Indicator */}
          <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-bold">
              {hideBalances ? '••••' : `+${formattedPnlFiat.formatted} (+2.40%)`}
            </span>
            <span className="text-emerald-500/80 text-[10px] hidden xs:inline">24h</span>
          </div>

          {/* Security Assurance Badge */}
          <div className="hidden md:flex items-center space-x-1.5 bg-neutral-900/60 border border-neutral-850 px-3 py-1.5 rounded-xl text-xs font-mono text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">100% Cold Multi-Sig Reserve</span>
          </div>
        </div>
      </div>
    </div>
  );
};
