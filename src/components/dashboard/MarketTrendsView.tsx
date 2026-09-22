import React from 'react';
import { RefreshCw, AlertCircle, CreditCard } from 'lucide-react';
import { CryptoIcon } from '../CryptoIcon';
import { CryptoPrice } from '../../types';

interface MarketTrendsViewProps {
  prices: CryptoPrice[];
  isPricesLive: boolean;
  lastPriceUpdate: number | null;
  handleRefreshMarketData: () => Promise<void>;
  isManualRefreshing: boolean;
  selectedCurrency: string;
  formatFiat: (usdAmount: number) => { amount: number; formatted: string; symbol: string; code: string };
  onBuyCrypto: () => void;
}

export const MarketTrendsView: React.FC<MarketTrendsViewProps> = ({
  prices,
  isPricesLive,
  lastPriceUpdate,
  handleRefreshMarketData,
  isManualRefreshing,
  selectedCurrency,
  formatFiat,
  onBuyCrypto,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-[#0e1015] border border-neutral-800/80 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider flex items-center space-x-2">
              <span>Live Crypto Market Feeds</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              {isPricesLive ? 'Live Feed' : 'Connecting'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time cryptocurrency market data • Formatted in {selectedCurrency}
            {lastPriceUpdate && (
              <span className="text-[10px] text-neutral-500 ml-2 font-mono">
                Updated {new Date(lastPriceUpdate).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={handleRefreshMarketData}
          disabled={isManualRefreshing}
          className="px-3.5 py-2 bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl flex items-center space-x-2 transition-all self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isManualRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh Rates</span>
        </button>
      </div>

      {/* Dynamic Conversions Ticker Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-y border-neutral-850/80">
        <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider shrink-0 flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-1" />
          <span>Rates:</span>
        </span>
        {prices.map((p) => {
          const usdStr =
            p.price >= 1
              ? `$${p.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `$${p.price.toFixed(4)}`;
          const fiatInfo = formatFiat(p.price);
          return (
            <span
              key={`conv-${p.id}`}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-neutral-950/80 border border-neutral-800 text-[11px] font-mono text-neutral-300 shrink-0 shadow-sm"
            >
              <span className="font-bold text-neutral-200">1 {p.id.startsWith('USDT') ? 'USDT' : p.symbol}</span>
              <span className="text-neutral-500">=</span>
              <span className="font-bold text-amber-300">{usdStr}</span>
              {selectedCurrency !== 'USD' && (
                <span className="text-[10px] text-neutral-400 font-medium">({fiatInfo.formatted})</span>
              )}
            </span>
          );
        })}
      </div>

      {/* Market Offline Notice */}
      {prices.length === 0 && (
        <div className="py-12 px-4 text-center space-y-3 bg-neutral-950/60 rounded-2xl border border-neutral-800">
          <div className="inline-flex p-3 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-neutral-200">
            Live market data temporarily unavailable. Retrying…
          </p>
          <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
            Reconnecting to live crypto market feeds. Balances and custodial functions remain fully operational.
          </p>
          <button
            onClick={handleRefreshMarketData}
            disabled={isManualRefreshing}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 inline-flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isManualRefreshing ? 'animate-spin' : ''}`} />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prices.map((p) => {
          const priceFiat = formatFiat(p.price);
          const highFiat = formatFiat(p.high24h);
          const lowFiat = formatFiat(p.low24h);

          return (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-850 hover:border-amber-500/40 transition-all space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <CryptoIcon asset={p.id} size="md" />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-100">{p.name}</h4>
                    <span className="text-[10px] text-neutral-500 font-mono">{p.symbol}</span>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                    p.change24h >= 0
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {p.change24h >= 0 ? '+' : ''}
                  {p.change24h.toFixed(2)}%
                </span>
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                  Current Price ({selectedCurrency})
                </span>
                <p className="text-lg font-black font-mono text-neutral-100">
                  {priceFiat.formatted}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400 pt-2 border-t border-neutral-900">
                <div>
                  <span className="text-neutral-500 block">24h High:</span>
                  <span className="text-neutral-200 font-bold">{highFiat.formatted}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">24h Low:</span>
                  <span className="text-neutral-200 font-bold">{lowFiat.formatted}</span>
                </div>
              </div>

              <button
                onClick={onBuyCrypto}
                className="w-full py-2 text-center text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 transition-all flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Buy {p.symbol}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
