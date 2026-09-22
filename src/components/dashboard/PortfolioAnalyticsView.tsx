import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { SkeletonAreaChart, SkeletonDonutChart } from '../SkeletonLoaders';

interface PortfolioAnalyticsViewProps {
  isInitialLoading: boolean;
  isMarketOffline: boolean;
  handleRefreshMarketData: () => Promise<void>;
  isManualRefreshing: boolean;
  selectedCurrency: string;
  historicalData: Array<{ time: string; value: number }>;
  allocationData: Array<{ name: string; value: number; color: string; usdValue: number }>;
  totalUsd: number;
  formatFiat: (usdAmount: number) => { amount: number; formatted: string; symbol: string; code: string };
}

export const PortfolioAnalyticsView: React.FC<PortfolioAnalyticsViewProps> = ({
  isInitialLoading,
  isMarketOffline,
  handleRefreshMarketData,
  isManualRefreshing,
  selectedCurrency,
  historicalData,
  allocationData,
  totalUsd,
  formatFiat,
}) => {
  if (isInitialLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <SkeletonAreaChart title={`Portfolio Valuation Curve (${selectedCurrency})`} />
        </div>
        <div className="lg:col-span-4">
          <SkeletonDonutChart />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {isMarketOffline && (
        <div className="lg:col-span-12 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs text-amber-300 font-medium">
              Live market data temporarily unavailable. Retrying…
            </span>
          </div>
          <button
            onClick={handleRefreshMarketData}
            disabled={isManualRefreshing}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${isManualRefreshing ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Performance Curve Chart */}
      <div className="lg:col-span-8 p-6 rounded-3xl bg-[#0e1015] border border-neutral-800/80 space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-neutral-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Portfolio Valuation Curve ({selectedCurrency})</span>
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Converted in real-time to {selectedCurrency}
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>24h Trend</span>
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalData}>
              <defs>
                <linearGradient id="analyticsColorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#525252" tick={{ fill: '#a3a3a3', fontSize: 11 }} />
              <YAxis stroke="#525252" tick={{ fill: '#a3a3a3', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  borderColor: '#f59e0b33',
                  borderRadius: '0.75rem',
                  color: '#f59e0b',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#analyticsColorVal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Asset Allocation Donut */}
      <div className="lg:col-span-4 p-6 rounded-3xl bg-[#0e1015] border border-neutral-800/80 space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-neutral-800/80 pb-3">
          <h3 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
            <PieIcon className="w-4 h-4 text-amber-400" />
            <span>Asset Distribution</span>
          </h3>
        </div>

        <div className="h-48 w-full flex items-center justify-center">
          {totalUsd === 0 ? (
            <p className="text-xs text-neutral-500 text-center">No active crypto holdings</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    borderColor: '#404040',
                    borderRadius: '0.5rem',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="space-y-2 pt-2 border-t border-neutral-900 custom-scrollbar max-h-40 overflow-y-auto pr-1">
          {allocationData.map((item) => (
            <div key={item.name} className="flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-neutral-300 font-bold">{item.name}</span>
              </div>
              <span className="font-mono text-neutral-300">
                {formatFiat(item.usdValue).formatted}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
