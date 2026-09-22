import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA, Transaction } from '../types';
import { api } from '../lib/api';
import {
  Wallet,
  TrendingUp,
  History,
  BarChart3,
} from 'lucide-react';
import { BuyCryptoModal } from '../components/BuyCryptoModal';
import { CurrencySwitcher } from '../components/CurrencySwitcher';
import { PortfolioCard } from '../components/dashboard/PortfolioCard';
import { QuickActionsBar } from '../components/dashboard/QuickActionsBar';
import { AssetHoldingsView } from '../components/dashboard/AssetHoldingsView';
import { PortfolioAnalyticsView } from '../components/dashboard/PortfolioAnalyticsView';
import { MarketTrendsView } from '../components/dashboard/MarketTrendsView';
import { RecentActivityView } from '../components/dashboard/RecentActivityView';

export const DashboardPage: React.FC = () => {
  const {
    user,
    prices,
    pricesLoading,
    isPricesLive,
    marketDataUnavailable,
    lastPriceUpdate,
    priceProvider,
    refreshPrices,
    calculateTotalUsdBalance,
    getValidAssetPrice,
    setActivePage,
    selectedCurrency,
    formatFiat,
    hideBalances,
    setHideBalances,
    openSupportChoice,
  } = useAuth();

  const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'assets' | 'analytics' | 'market' | 'history'>('assets');
  const [assetSearchQuery, setAssetSearchQuery] = useState<string>('');
  const [hideZeroBalances, setHideZeroBalances] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    if (user) {
      api
        .getTransactions()
        .then((txs) => setRecentTxs(txs))
        .catch((err) => console.error(err));
    }
  }, [user]);

  if (!user) return null;

  const handleRefreshMarketData = async () => {
    setIsManualRefreshing(true);
    await refreshPrices();
    setTimeout(() => {
      setIsManualRefreshing(false);
    }, 800);
  };

  const isInitialLoading = pricesLoading && prices.length === 0;
  const isMarketOffline = marketDataUnavailable || (!isPricesLive && prices.length === 0);

  const totalUsd = calculateTotalUsdBalance();
  const formattedTotalFiat = formatFiat(totalUsd);

  // Estimate BTC valuation using resilient price resolution
  const btcPrice = getValidAssetPrice('BTC');
  const btcValuation = btcPrice > 0 ? (totalUsd / btcPrice).toFixed(4) : '0.0000';

  // 24h PnL estimate (e.g., +2.4%)
  const pnlUsd = totalUsd * 0.024;
  const formattedPnlFiat = formatFiat(pnlUsd);

  // Historical performance curve in selected fiat currency
  const historicalData = [
    { time: '00:00', value: formatFiat(totalUsd * 0.94).amount },
    { time: '04:00', value: formatFiat(totalUsd * 0.96).amount },
    { time: '08:00', value: formatFiat(totalUsd * 0.92).amount },
    { time: '12:00', value: formatFiat(totalUsd * 0.98).amount },
    { time: '16:00', value: formatFiat(totalUsd * 0.97).amount },
    { time: '20:00', value: formatFiat(totalUsd * 1.01).amount },
    { time: 'Now', value: formattedTotalFiat.amount },
  ];

  // Allocation donut data using getValidAssetPrice to avoid 0 valuation drops
  const allocationData = Object.values(ASSET_METADATA)
    .map((asset) => {
      const amount = user.balances[asset.id] || 0;
      const price = getValidAssetPrice(asset.id);
      const usdVal = amount * price;
      const fiatVal = formatFiat(usdVal).amount;
      return {
        name: asset.symbol,
        value: Number(fiatVal.toFixed(2)),
        color: asset.accentColor,
        usdValue: usdVal,
      };
    })
    .filter((item) => item.value >= 0);

  // Asset list filtering
  const allAssets = Object.values(ASSET_METADATA);
  const filteredAssets = allAssets.filter((asset) => {
    const balance = user.balances[asset.id] || 0;
    if (hideZeroBalances && balance <= 0) return false;
    if (!assetSearchQuery.trim()) return true;
    const query = assetSearchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.symbol.toLowerCase().includes(query) ||
      asset.network.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* 1. Portfolio Overview Hero Card */}
      <PortfolioCard
        totalUsd={totalUsd}
        formattedTotalFiat={formattedTotalFiat}
        btcValuation={btcValuation}
        formattedPnlFiat={formattedPnlFiat}
        hideBalances={hideBalances}
        setHideBalances={setHideBalances}
        handleRefreshMarketData={handleRefreshMarketData}
        isManualRefreshing={isManualRefreshing}
        pricesLoading={pricesLoading}
        isMarketOffline={isMarketOffline}
        selectedCurrency={selectedCurrency}
      />

      {/* 2. Sleek, Balanced Quick Action Bar */}
      <div className="bg-[#0e1015]/90 border border-neutral-800/80 rounded-3xl p-3 sm:p-4 shadow-lg backdrop-blur-xl">
        <QuickActionsBar
          onDeposit={() => setActivePage('deposit')}
          onWithdraw={() => setActivePage('withdraw')}
          onSend={() => setActivePage('send')}
          onReceive={() => setActivePage('receive')}
          onSwap={() => setActivePage('swap')}
          onBuyCrypto={() => setIsBuyModalOpen(true)}
          onSupport={openSupportChoice}
        />
      </div>

      {/* 3. Main Dashboard Segmented Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800/80 pb-3 gap-3">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('assets')}
            className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'assets'
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Asset Holdings ({allAssets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Portfolio Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('market')}
            className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'market'
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Market Trends</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Recent Activity ({recentTxs.length})</span>
          </button>
        </div>

        {/* Currency Switcher Indicator */}
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          <span className="text-[11px] text-neutral-400">Display Currency:</span>
          <CurrencySwitcher variant="compact" />
        </div>
      </div>

      {/* 4. Tab 1: Crypto Asset Holdings */}
      {activeTab === 'assets' && (
        <AssetHoldingsView
          filteredAssets={filteredAssets}
          userBalances={user.balances}
          prices={prices}
          getValidAssetPrice={getValidAssetPrice}
          formatFiat={formatFiat}
          hideBalances={hideBalances}
          assetSearchQuery={assetSearchQuery}
          setAssetSearchQuery={setAssetSearchQuery}
          hideZeroBalances={hideZeroBalances}
          setHideZeroBalances={setHideZeroBalances}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onDeposit={() => setActivePage('deposit')}
          onWithdraw={() => setActivePage('withdraw')}
          onSwap={() => setActivePage('swap')}
          selectedCurrency={selectedCurrency}
        />
      )}

      {/* 5. Tab 2: Portfolio Analytics */}
      {activeTab === 'analytics' && (
        <PortfolioAnalyticsView
          isInitialLoading={isInitialLoading}
          isMarketOffline={isMarketOffline}
          handleRefreshMarketData={handleRefreshMarketData}
          isManualRefreshing={isManualRefreshing}
          selectedCurrency={selectedCurrency}
          historicalData={historicalData}
          allocationData={allocationData}
          totalUsd={totalUsd}
          formatFiat={formatFiat}
        />
      )}

      {/* 6. Tab 3: Live Market Trends */}
      {activeTab === 'market' && (
        <MarketTrendsView
          prices={prices}
          isPricesLive={isPricesLive}
          lastPriceUpdate={lastPriceUpdate}
          handleRefreshMarketData={handleRefreshMarketData}
          isManualRefreshing={isManualRefreshing}
          selectedCurrency={selectedCurrency}
          formatFiat={formatFiat}
          onBuyCrypto={() => setIsBuyModalOpen(true)}
        />
      )}

      {/* 7. Tab 4: Recent Activity */}
      {activeTab === 'history' && (
        <RecentActivityView
          recentTxs={recentTxs}
          prices={prices}
          getValidAssetPrice={getValidAssetPrice}
          formatFiat={formatFiat}
          selectedCurrency={selectedCurrency}
          onOpenHistory={() => setActivePage('history')}
          onMakeDeposit={() => setActivePage('deposit')}
        />
      )}

      {/* Buy Crypto Modal (Preserved with existing flow) */}
      <BuyCryptoModal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} />
    </div>
  );
};
