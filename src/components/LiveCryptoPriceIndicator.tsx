import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { CryptoPrice } from '../types';
import { TrendingUp, TrendingDown, Radio, Activity, RefreshCw } from 'lucide-react';

interface LiveCryptoPriceIndicatorProps {
  variant?: 'compact' | 'ticker' | 'card' | 'badge';
  className?: string;
  showAll?: boolean;
}

export const LiveCryptoPriceIndicator: React.FC<LiveCryptoPriceIndicatorProps> = ({
  variant = 'ticker',
  className = '',
  showAll = false,
}) => {
  const { prices, isPricesLive, lastPriceUpdate, priceProvider, refreshPrices } = useAuth();
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'down'>>({});
  const [isHovered, setIsHovered] = useState(false);

  // Track price ticks and trigger flash animations
  useEffect(() => {
    if (!prices || prices.length === 0) return;

    const newFlashes: Record<string, 'up' | 'down'> = {};
    const newPrev: Record<string, number> = { ...prevPrices };

    prices.forEach((p) => {
      const oldPrice = prevPrices[p.id];
      if (oldPrice !== undefined && oldPrice !== p.price) {
        newFlashes[p.id] = p.price > oldPrice ? 'up' : 'down';
      }
      newPrev[p.id] = p.price;
    });

    setPrevPrices(newPrev);

    if (Object.keys(newFlashes).length > 0) {
      setFlashMap(newFlashes);
      const timer = setTimeout(() => {
        setFlashMap({});
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [prices]);

  const displayPrices = showAll ? prices : prices.slice(0, 5);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (price >= 1) {
      return price.toFixed(2);
    } else {
      return price.toFixed(4);
    }
  };

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-300 font-mono ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isPricesLive ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isPricesLive ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
        </span>
        <span className="text-[11px] font-semibold text-neutral-200">
          {isPricesLive ? 'LIVE MARKET' : 'PRICE FEED'}
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-3 overflow-x-auto no-scrollbar py-1 ${className}`}>
        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE</span>
        </div>

        {displayPrices.map((p) => {
          const flash = flashMap[p.id];
          const isUp = (p.change24h || 0) >= 0;

          return (
            <div
              key={p.id}
              className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg transition-colors text-xs font-mono shrink-0 ${
                flash === 'up'
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                  : flash === 'down'
                  ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40'
                  : 'bg-neutral-900/60 text-neutral-300 border border-neutral-800/80'
              }`}
            >
              <span className="font-bold text-neutral-200">{p.symbol.split(' ')[0]}</span>
              <span className="font-medium">${formatPrice(p.price)}</span>
              <span
                className={`text-[10px] flex items-center ${
                  isUp ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isUp ? '+' : ''}
                {p.change24h?.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Default 'ticker' horizontal stream banner
  return (
    <div
      className={`relative flex items-center overflow-hidden w-full text-xs font-mono select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Live Badge Status */}
      <div className="flex items-center space-x-1.5 pr-3 shrink-0 border-r border-neutral-800 mr-3">
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isPricesLive ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isPricesLive ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
        </span>
        <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
          LIVE PRICES
        </span>
      </div>

      {/* Scrolling / Flex Price Ticker List */}
      <div className="flex items-center space-x-4 sm:space-x-6 overflow-x-auto no-scrollbar scroll-smooth">
        {displayPrices.map((p) => {
          const flash = flashMap[p.id];
          const isUp = (p.change24h || 0) >= 0;

          return (
            <div
              key={p.id}
              className={`flex items-center space-x-2 px-2.5 py-0.5 rounded-md transition-all duration-300 shrink-0 ${
                flash === 'up'
                  ? 'bg-emerald-500/25 text-emerald-300 shadow-sm shadow-emerald-500/30 ring-1 ring-emerald-500/50'
                  : flash === 'down'
                  ? 'bg-red-500/25 text-red-300 shadow-sm shadow-red-500/30 ring-1 ring-red-500/50'
                  : 'bg-transparent text-neutral-300 hover:text-white'
              }`}
            >
              <span className="font-bold text-neutral-200">{p.symbol.split(' ')[0]}</span>
              <span className="font-semibold text-neutral-100">${formatPrice(p.price)}</span>
              <span
                className={`text-[10px] font-bold flex items-center space-x-0.5 ${
                  isUp ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isUp ? (
                  <TrendingUp className="w-3 h-3 shrink-0" />
                ) : (
                  <TrendingDown className="w-3 h-3 shrink-0" />
                )}
                <span>
                  {isUp ? '+' : ''}
                  {p.change24h?.toFixed(2)}%
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
