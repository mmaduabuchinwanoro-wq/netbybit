export interface CryptoPriceItem {
  id: 'BTC' | 'ETH' | 'BNB' | 'SOL' | 'TRX' | 'USDT_ERC20' | 'USDT_TRC20';
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdated?: string;
  isLive?: boolean;
}

export interface LiveMarketPricesPayload {
  success: boolean;
  isLive: boolean;
  provider: string;
  lastUpdated: string;
  data: CryptoPriceItem[];
}

// Initial baseline fallback state (used only before the first network tick completes)
let cachedPrices: CryptoPriceItem[] = [
  {
    id: 'BTC',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 78020.0,
    change24h: -0.85,
    high24h: 79250.0,
    low24h: 77675.0,
    volume24h: 28450120000,
  },
  {
    id: 'ETH',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2457.5,
    change24h: 0.12,
    high24h: 2490.0,
    low24h: 2437.0,
    volume24h: 14200850000,
  },
  {
    id: 'BNB',
    symbol: 'BNB',
    name: 'BNB Smart Chain',
    price: 686.8,
    change24h: -0.42,
    high24h: 695.0,
    low24h: 684.0,
    volume24h: 1250340000,
  },
  {
    id: 'SOL',
    symbol: 'SOL',
    name: 'Solana',
    price: 102.35,
    change24h: -1.45,
    high24h: 105.2,
    low24h: 101.8,
    volume24h: 3850120000,
  },
  {
    id: 'TRX',
    symbol: 'TRX',
    name: 'Tron',
    price: 0.3285,
    change24h: -2.05,
    high24h: 0.3356,
    low24h: 0.328,
    volume24h: 420800000,
  },
  {
    id: 'USDT_ERC20',
    symbol: 'USDT (ERC-20)',
    name: 'Tether USD',
    price: 1.0,
    change24h: 0.01,
    high24h: 1.001,
    low24h: 0.999,
    volume24h: 45100200000,
  },
  {
    id: 'USDT_TRC20',
    symbol: 'USDT (TRC-20)',
    name: 'Tether USD',
    price: 1.0,
    change24h: 0.01,
    high24h: 1.001,
    low24h: 0.999,
    volume24h: 58200400000,
  },
];

let lastFetchTimestamp: string = new Date().toISOString();
let isCurrentlyLive: boolean = false;
let currentProvider: string = 'Initializing...';
let consecutiveFailures: number = 0;

const subscribers: Set<(payload: LiveMarketPricesPayload) => void> = new Set();

function notifySubscribers() {
  const payload = getLiveCryptoPricesPayload();
  for (const sub of subscribers) {
    try {
      sub(payload);
    } catch (e) {
      // Ignore subscriber error
    }
  }
}

/**
 * Fetch live prices from Binance 24hr Ticker API
 */
async function fetchFromBinance(): Promise<boolean> {
  const symbols = JSON.stringify(['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'TRXUSDT']);
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbols)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);

  if (!res.ok) {
    throw new Error(`Binance HTTP error: ${res.status}`);
  }

  const raw = await res.json();
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('Binance returned empty array');
  }

  const tickerMap: Record<string, any> = {};
  for (const item of raw) {
    tickerMap[item.symbol] = item;
  }

  const btcTicker = tickerMap['BTCUSDT'];
  const ethTicker = tickerMap['ETHUSDT'];
  const bnbTicker = tickerMap['BNBUSDT'];
  const solTicker = tickerMap['SOLUSDT'];
  const trxTicker = tickerMap['TRXUSDT'];

  const updated: CryptoPriceItem[] = [
    {
      id: 'BTC',
      symbol: 'BTC',
      name: 'Bitcoin',
      price: btcTicker ? parseFloat(btcTicker.lastPrice) : cachedPrices[0].price,
      change24h: btcTicker ? parseFloat(parseFloat(btcTicker.priceChangePercent).toFixed(2)) : cachedPrices[0].change24h,
      high24h: btcTicker ? parseFloat(btcTicker.highPrice) : cachedPrices[0].high24h,
      low24h: btcTicker ? parseFloat(btcTicker.lowPrice) : cachedPrices[0].low24h,
      volume24h: btcTicker ? parseFloat(btcTicker.quoteVolume) : cachedPrices[0].volume24h,
    },
    {
      id: 'ETH',
      symbol: 'ETH',
      name: 'Ethereum',
      price: ethTicker ? parseFloat(ethTicker.lastPrice) : cachedPrices[1].price,
      change24h: ethTicker ? parseFloat(parseFloat(ethTicker.priceChangePercent).toFixed(2)) : cachedPrices[1].change24h,
      high24h: ethTicker ? parseFloat(ethTicker.highPrice) : cachedPrices[1].high24h,
      low24h: ethTicker ? parseFloat(ethTicker.lowPrice) : cachedPrices[1].low24h,
      volume24h: ethTicker ? parseFloat(ethTicker.quoteVolume) : cachedPrices[1].volume24h,
    },
    {
      id: 'BNB',
      symbol: 'BNB',
      name: 'BNB Smart Chain',
      price: bnbTicker ? parseFloat(bnbTicker.lastPrice) : cachedPrices[2].price,
      change24h: bnbTicker ? parseFloat(parseFloat(bnbTicker.priceChangePercent).toFixed(2)) : cachedPrices[2].change24h,
      high24h: bnbTicker ? parseFloat(bnbTicker.highPrice) : cachedPrices[2].high24h,
      low24h: bnbTicker ? parseFloat(bnbTicker.lowPrice) : cachedPrices[2].low24h,
      volume24h: bnbTicker ? parseFloat(bnbTicker.quoteVolume) : cachedPrices[2].volume24h,
    },
    {
      id: 'SOL',
      symbol: 'SOL',
      name: 'Solana',
      price: solTicker ? parseFloat(solTicker.lastPrice) : cachedPrices[3].price,
      change24h: solTicker ? parseFloat(parseFloat(solTicker.priceChangePercent).toFixed(2)) : cachedPrices[3].change24h,
      high24h: solTicker ? parseFloat(solTicker.highPrice) : cachedPrices[3].high24h,
      low24h: solTicker ? parseFloat(solTicker.lowPrice) : cachedPrices[3].low24h,
      volume24h: solTicker ? parseFloat(solTicker.quoteVolume) : cachedPrices[3].volume24h,
    },
    {
      id: 'TRX',
      symbol: 'TRX',
      name: 'Tron',
      price: trxTicker ? parseFloat(trxTicker.lastPrice) : cachedPrices[4].price,
      change24h: trxTicker ? parseFloat(parseFloat(trxTicker.priceChangePercent).toFixed(2)) : cachedPrices[4].change24h,
      high24h: trxTicker ? parseFloat(trxTicker.highPrice) : cachedPrices[4].high24h,
      low24h: trxTicker ? parseFloat(trxTicker.lowPrice) : cachedPrices[4].low24h,
      volume24h: trxTicker ? parseFloat(trxTicker.quoteVolume) : cachedPrices[4].volume24h,
    },
    {
      id: 'USDT_ERC20',
      symbol: 'USDT (ERC-20)',
      name: 'Tether USD',
      price: 1.0,
      change24h: 0.01,
      high24h: 1.001,
      low24h: 0.999,
      volume24h: (btcTicker ? parseFloat(btcTicker.quoteVolume) : 28000000000) * 0.8,
    },
    {
      id: 'USDT_TRC20',
      symbol: 'USDT (TRC-20)',
      name: 'Tether USD',
      price: 1.0,
      change24h: 0.01,
      high24h: 1.001,
      low24h: 0.999,
      volume24h: (btcTicker ? parseFloat(btcTicker.quoteVolume) : 28000000000) * 0.95,
    },
  ];

  cachedPrices = updated;
  lastFetchTimestamp = new Date().toISOString();
  isCurrentlyLive = true;
  currentProvider = 'Binance Live Market Data';
  consecutiveFailures = 0;
  return true;
}

/**
 * Fallback: CoinGecko Simple Price API
 */
async function fetchFromCoinGecko(): Promise<boolean> {
  const url =
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,tron,tether&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);

  if (!res.ok) {
    throw new Error(`CoinGecko HTTP error: ${res.status}`);
  }

  const raw = await res.json();
  if (!raw.bitcoin || !raw.ethereum) {
    throw new Error('CoinGecko missing essential coin data');
  }

  const parseOrKeep = (coin: any, index: number, name: string, symbol: string, id: CryptoPriceItem['id']): CryptoPriceItem => {
    if (!coin) return cachedPrices[index];
    const price = typeof coin.usd === 'number' ? coin.usd : cachedPrices[index].price;
    const change24h = typeof coin.usd_24h_change === 'number' ? parseFloat(coin.usd_24h_change.toFixed(2)) : cachedPrices[index].change24h;
    const volume24h = typeof coin.usd_24h_vol === 'number' ? coin.usd_24h_vol : cachedPrices[index].volume24h;
    return {
      id,
      symbol,
      name,
      price,
      change24h,
      high24h: price * 1.02,
      low24h: price * 0.98,
      volume24h,
    };
  };

  cachedPrices = [
    parseOrKeep(raw.bitcoin, 0, 'Bitcoin', 'BTC', 'BTC'),
    parseOrKeep(raw.ethereum, 1, 'Ethereum', 'ETH', 'ETH'),
    parseOrKeep(raw.binancecoin, 2, 'BNB Smart Chain', 'BNB', 'BNB'),
    parseOrKeep(raw.solana, 3, 'Solana', 'SOL', 'SOL'),
    parseOrKeep(raw.tron, 4, 'Tron', 'TRX', 'TRX'),
    {
      id: 'USDT_ERC20',
      symbol: 'USDT (ERC-20)',
      name: 'Tether USD',
      price: 1.0,
      change24h: 0.01,
      high24h: 1.001,
      low24h: 0.999,
      volume24h: raw.tether?.usd_24h_vol || 45100200000,
    },
    {
      id: 'USDT_TRC20',
      symbol: 'USDT (TRC-20)',
      name: 'Tether USD',
      price: 1.0,
      change24h: 0.01,
      high24h: 1.001,
      low24h: 0.999,
      volume24h: (raw.tether?.usd_24h_vol || 45100200000) * 1.1,
    },
  ];

  lastFetchTimestamp = new Date().toISOString();
  isCurrentlyLive = true;
  currentProvider = 'CoinGecko Live Market Data';
  consecutiveFailures = 0;
  return true;
}

/**
 * Perform a single sync cycle with automatic failover
 */
export async function syncLiveMarketPrices(): Promise<void> {
  try {
    const success = await fetchFromBinance();
    if (success) {
      notifySubscribers();
      return;
    }
  } catch (err: any) {
    // Primary provider failed, try fallback
  }

  try {
    const success = await fetchFromCoinGecko();
    if (success) {
      notifySubscribers();
      return;
    }
  } catch (err: any) {
    // Fallback failed
  }

  consecutiveFailures += 1;
  if (consecutiveFailures > 5) {
    isCurrentlyLive = false;
    currentProvider = 'Reconnecting live market data...';
  }
}

let isEngineStarted = false;

/**
 * Start the continuous background market price updating engine
 */
export function startPriceFeedService(): void {
  if (isEngineStarted) return;
  isEngineStarted = true;

  // Initial immediate fetch
  syncLiveMarketPrices().catch(() => {});

  // Continuous background refresh every 3 seconds
  setInterval(() => {
    syncLiveMarketPrices().catch(() => {});
  }, 3000);
}

/**
 * Return raw cached prices array
 */
export function getLiveCryptoPrices(): CryptoPriceItem[] {
  return cachedPrices;
}

/**
 * Return full payload with metadata
 */
export function getLiveCryptoPricesPayload(): LiveMarketPricesPayload {
  return {
    success: true,
    isLive: isCurrentlyLive,
    provider: currentProvider,
    lastUpdated: lastFetchTimestamp,
    data: cachedPrices,
  };
}

/**
 * Subscribe to price ticks (used for SSE / WebSockets)
 */
export function subscribePriceUpdates(listener: (payload: LiveMarketPricesPayload) => void): () => void {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}
