import React from 'react';
import { Search, LayoutGrid, ListFilter, Repeat, X } from 'lucide-react';
import { CryptoIcon } from '../CryptoIcon';
import { AssetInfo, CryptoPrice } from '../../types';

interface AssetHoldingsViewProps {
  filteredAssets: AssetInfo[];
  userBalances: Record<string, number>;
  prices: CryptoPrice[];
  getValidAssetPrice: (assetId: string) => number;
  formatFiat: (usdAmount: number) => { amount: number; formatted: string; symbol: string; code: string };
  hideBalances: boolean;
  assetSearchQuery: string;
  setAssetSearchQuery: (q: string) => void;
  hideZeroBalances: boolean;
  setHideZeroBalances: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  onSwap: () => void;
  selectedCurrency: string;
}

export const AssetHoldingsView: React.FC<AssetHoldingsViewProps> = ({
  filteredAssets,
  userBalances,
  prices,
  getValidAssetPrice,
  formatFiat,
  hideBalances,
  assetSearchQuery,
  setAssetSearchQuery,
  hideZeroBalances,
  setHideZeroBalances,
  viewMode,
  setViewMode,
  onDeposit,
  onWithdraw,
  onSwap,
  selectedCurrency,
}) => {
  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0e1015] p-3.5 sm:p-4 rounded-2xl border border-neutral-800/80">
        {/* Search Input with Clear Button */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search crypto or network (e.g. BTC, Solana, TRC-20)..."
            value={assetSearchQuery}
            onChange={(e) => setAssetSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
          {assetSearchQuery && (
            <button
              onClick={() => setAssetSearchQuery('')}
              className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between sm:justify-end space-x-4 text-xs text-neutral-300">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideZeroBalances}
              onChange={(e) => setHideZeroBalances(e.target.checked)}
              className="rounded bg-neutral-950 border-neutral-800 text-amber-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 accent-amber-500"
            />
            <span className="text-[11px] font-medium text-neutral-300">Hide Zero Balances</span>
          </label>

          <div className="h-4 w-px bg-neutral-800" />

          {/* Grid vs Table View Switch */}
          <div className="flex items-center bg-neutral-950/90 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="List View"
              aria-label="List View"
            >
              <ListFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.length === 0 ? (
            <div className="col-span-full py-12 text-center space-y-2 bg-[#0e1015] rounded-2xl border border-neutral-800">
              <p className="text-xs text-neutral-400">No crypto assets match your criteria</p>
              <button
                onClick={() => {
                  setAssetSearchQuery('');
                  setHideZeroBalances(false);
                }}
                className="text-xs text-amber-400 font-bold hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const balance = userBalances[asset.id] || 0;
              const priceObj = prices.find((p) => p.id === asset.id);
              const priceUsd = priceObj?.price || getValidAssetPrice(asset.id);
              const change24h = priceObj?.change24h || 0;

              const balanceUsd = balance * priceUsd;
              const balanceFiat = formatFiat(balanceUsd);
              const priceFiat = formatFiat(priceUsd);

              return (
                <div
                  key={asset.id}
                  className="p-5 rounded-2xl bg-[#0e1015] border border-neutral-800/80 hover:border-amber-500/40 transition-all duration-200 space-y-4 shadow-xl group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <CryptoIcon asset={asset.id} size="lg" showNetworkBadge />
                      <div>
                        <h3 className="text-sm font-bold text-neutral-100 group-hover:text-amber-400 transition-colors flex items-center space-x-1.5">
                          <span>{asset.name}</span>
                          <span className="text-xs text-neutral-500 font-mono">({asset.symbol})</span>
                        </h3>
                        <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">
                          {asset.network}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-neutral-200 block">
                        {priceObj ? priceFiat.formatted : <span className="text-neutral-500 text-xs">Syncing...</span>}
                      </span>
                      {priceObj ? (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border inline-block mt-1 ${
                            change24h >= 0
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {change24h >= 0 ? '+' : ''}
                          {change24h.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-800 inline-block mt-1">
                          --
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Balances Container */}
                  <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-850/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400 text-[11px]">Holdings:</span>
                      <span className="font-mono font-bold text-neutral-100">
                        {hideBalances ? '••••••••' : `${balance.toFixed(4)} ${asset.symbol}`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1.5 border-t border-neutral-900">
                      <span className="text-neutral-400 text-[11px]">Est. Value:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {hideBalances
                          ? '••••••••'
                          : balance > 0
                          ? (priceObj ? balanceFiat.formatted : <span className="text-neutral-500 text-xs">Syncing...</span>)
                          : '$0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Card Quick Actions */}
                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={onDeposit}
                      className="flex-1 py-1.5 text-center text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 transition-all shadow-sm"
                    >
                      Deposit
                    </button>
                    <button
                      onClick={onWithdraw}
                      className="flex-1 py-1.5 text-center text-[11px] font-bold bg-neutral-950 hover:bg-neutral-900 text-neutral-300 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-all"
                    >
                      Withdraw
                    </button>
                    <button
                      onClick={onSwap}
                      className="px-2.5 py-1.5 text-center text-[11px] font-bold bg-neutral-950 hover:bg-neutral-900 text-amber-400 rounded-xl border border-neutral-800 hover:border-amber-500/40 transition-all"
                      title="Swap"
                    >
                      <Repeat className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-[#0e1015] rounded-2xl border border-neutral-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/80 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Asset</th>
                  <th className="py-3.5 px-4">Network</th>
                  <th className="py-3.5 px-4">Price ({selectedCurrency})</th>
                  <th className="py-3.5 px-4">24h Change</th>
                  <th className="py-3.5 px-4">Balance</th>
                  <th className="py-3.5 px-4">Fiat Value ({selectedCurrency})</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-xs text-neutral-200 font-mono">
                {filteredAssets.map((asset) => {
                  const balance = userBalances[asset.id] || 0;
                  const priceObj = prices.find((p) => p.id === asset.id);
                  const priceUsd = priceObj?.price || getValidAssetPrice(asset.id);
                  const change24h = priceObj?.change24h || 0;

                  const balanceUsd = balance * priceUsd;
                  const balanceFiat = formatFiat(balanceUsd);
                  const priceFiat = formatFiat(priceUsd);

                  return (
                    <tr key={asset.id} className="hover:bg-neutral-950/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold font-sans">
                        <div className="flex items-center space-x-2.5">
                          <CryptoIcon asset={asset.id} size="sm" />
                          <div>
                            <span className="text-neutral-100">{asset.name}</span>
                            <span className="text-[10px] text-neutral-500 ml-1.5 font-mono">
                              {asset.symbol}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-400 text-[11px] font-sans">
                        {asset.network}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-neutral-200">
                        {priceObj ? priceFiat.formatted : <span className="text-neutral-500 font-mono text-xs">Syncing...</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        {priceObj ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              change24h >= 0
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {change24h >= 0 ? '+' : ''}
                            {change24h.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold text-neutral-500 border border-neutral-800">
                            --
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-neutral-100">
                        {hideBalances ? '••••••••' : `${balance.toFixed(4)} ${asset.symbol}`}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-400">
                        {hideBalances
                          ? '••••••••'
                          : balance > 0
                          ? (priceObj ? balanceFiat.formatted : <span className="text-neutral-500 font-mono text-xs">Syncing...</span>)
                          : '$0.00'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 font-sans">
                        <button
                          onClick={onDeposit}
                          className="px-2.5 py-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
                        >
                          Deposit
                        </button>
                        <button
                          onClick={onWithdraw}
                          className="px-2.5 py-1 text-[11px] font-bold text-neutral-300 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-lg transition-colors"
                        >
                          Withdraw
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
