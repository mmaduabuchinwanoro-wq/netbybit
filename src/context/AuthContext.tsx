import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getAuthToken, removeAuthToken, setAuthToken } from '../lib/api';
import { CryptoPrice, DepositAddresses, Notification, User } from '../types';
import { fetchLiveFiatRates, formatFiatValue, convertUsdToFiat, SUPPORTED_FIAT_CURRENCIES } from '../lib/currencies';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  depositAddresses: DepositAddresses;
  prices: CryptoPrice[];
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  pricesLoading: boolean;
  isPricesLive: boolean;
  marketDataUnavailable: boolean;
  lastPriceUpdate: string | null;
  priceProvider: string;
  activePage: string;
  setActivePage: (page: string) => void;
  goBack: (fallback?: string) => void;
  // Support & Live Chat Modal Controls
  isSupportChoiceOpen: boolean;
  openSupportChoice: () => void;
  closeSupportChoice: () => void;
  isLiveChatOpen: boolean;
  setIsLiveChatOpen: (open: boolean) => void;
  openLiveChat: () => void;
  // Currency Switcher & Value Conversion
  selectedCurrency: string;
  setSelectedCurrency: (curr: string) => Promise<void>;
  fiatRates: Record<string, number>;
  hideBalances: boolean;
  setHideBalances: React.Dispatch<React.SetStateAction<boolean>>;
  formatFiat: (usdAmount: number) => { formatted: string; amount: number; symbol: string; code: string };
  // Auth Operations
  login: (email: string, pass: string) => Promise<{ requires2FA?: boolean; tempToken?: string; user?: User }>;
  verify2FA: (tempToken: string, code: string) => Promise<User>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  register: (email: string, pass: string, name: string, username?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshDepositAddresses: () => Promise<void>;
  refreshPrices: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  calculateTotalUsdBalance: (userBalances?: Record<string, number>) => number;
}

const DEFAULT_DEPOSIT: DepositAddresses = {
  BTC: '1Fy9Up78qVeawXCLnAqcnRJrvjiXLJF21d',
  ETH: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
  BNB: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
  SOL: '7XwK3nJ5pM4q2yZ8vW9R1t6Y3u0I2o8P4s5D6f7G8h9J',
  TRX: 'TYKh3ktyqwNMUYoo89UrMbdqjV3CUKWQ8M',
  USDT_ERC20: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
  USDT_TRC20: 'TYKh3ktyqwNMUYoo89UrMbdqjV3CUKWQ8M',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [depositAddresses, setDepositAddresses] = useState<DepositAddresses>(DEFAULT_DEPOSIT);
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [isPricesLive, setIsPricesLive] = useState<boolean>(true);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | null>(null);
  const [priceProvider, setPriceProvider] = useState<string>('Live Market Feed');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [marketDataUnavailable, setMarketDataUnavailable] = useState(false);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [activePage, setActivePageState] = useState<string>(() => {
    return localStorage.getItem('netbybit_active_page') || 'home';
  });

  const setActivePage = (page: string) => {
    setActivePageState((prev) => {
      if (prev && prev !== page) {
        setPageHistory((history) => [...history.slice(-15), prev]);
      }
      return page;
    });
    localStorage.setItem('netbybit_active_page', page);
  };

  const goBack = (fallback?: string) => {
    setPageHistory((prev) => {
      const copy = [...prev];
      const previous = copy.pop();
      const target = previous || fallback || (user ? (user.role === 'admin' ? 'admin' : 'dashboard') : 'home');
      setActivePageState(target);
      localStorage.setItem('netbybit_active_page', target);
      return copy;
    });
  };

  // Support Choice & Live Chat State
  const [isSupportChoiceOpen, setIsSupportChoiceOpen] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);

  const openSupportChoice = () => {
    setIsSupportChoiceOpen(true);
  };

  const closeSupportChoice = () => {
    setIsSupportChoiceOpen(false);
  };

  const openLiveChat = () => {
    setIsSupportChoiceOpen(false);
    setIsLiveChatOpen(true);
  };

  // Fiat & Privacy State
  const [selectedCurrency, setSelectedCurrencyState] = useState<string>(() => {
    return localStorage.getItem('netbybit_preferred_currency') || 'USD';
  });
  const [fiatRates, setFiatRates] = useState<Record<string, number>>({});
  const [hideBalances, setHideBalances] = useState<boolean>(() => {
    return localStorage.getItem('netbybit_hide_balances') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('netbybit_hide_balances', String(hideBalances));
  }, [hideBalances]);

  // Load Fiat Exchange Rates
  const refreshFiatRates = async () => {
    const rates = await fetchLiveFiatRates();
    setFiatRates(rates);
  };

  const refreshPrices = async (isBackground = false) => {
    if (!isBackground) {
      setPricesLoading(true);
    }
    try {
      const res = await api.forceRefreshPrices();
      if (res.data && res.data.length > 0) {
        setPrices(res.data);
        setIsPricesLive(res.isLive);
        setLastPriceUpdate(res.lastUpdated);
        setPriceProvider(res.provider);
        setMarketDataUnavailable(false);
      } else {
        setMarketDataUnavailable(true);
      }
    } catch (err) {
      console.warn('Crypto prices refresh notice:', err);
      setMarketDataUnavailable(true);
    } finally {
      if (!isBackground) {
        setPricesLoading(false);
      }
    }
  };

  const refreshDepositAddresses = async () => {
    try {
      const data = await api.getDepositAddresses();
      if (data && Object.keys(data).length > 0) {
        setDepositAddresses(data);
      }
    } catch (err) {
      console.error('Failed to load deposit addresses', err);
    }
  };

  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await api.getMe();
      setUser(u);
      if (u.preferredCurrency) {
        setSelectedCurrencyState(u.preferredCurrency);
        localStorage.setItem('netbybit_preferred_currency', u.preferredCurrency);
      }
      const savedPage = localStorage.getItem('netbybit_active_page');
      if (!savedPage || savedPage === 'login' || savedPage === 'register') {
        const targetPage = u.role === 'admin' ? 'admin' : 'dashboard';
        setActivePage(targetPage);
      }
    } catch (err: any) {
      console.error('Session check or refresh error:', err);
      const msg = String(err?.message || '');
      if (
        msg.includes('401') ||
        msg.includes('403') ||
        msg.includes('User not found') ||
        msg.includes('Unauthorized') ||
        msg.includes('Invalid token')
      ) {
        removeAuthToken();
        setUser(null);
        setActivePage('home');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Failsafe timeout: Market data MUST NEVER block the application. Force loading to false after at most 1500ms
    const safetyTimer = setTimeout(() => {
      setPricesLoading(false);
    }, 1500);

    refreshPrices(true);
    refreshFiatRates();
    refreshDepositAddresses();
    refreshUser();

    // Real-time market price subscription with automatic non-blocking poller fallback
    const unsubscribeLivePrices = api.subscribeToLivePrices((newPrices, meta) => {
      // Unblock loading state immediately on first response
      setPricesLoading(false);

      if (newPrices && newPrices.length > 0) {
        setPrices(newPrices);
        setIsPricesLive(meta?.isLive ?? true);
        if (meta?.lastUpdated) setLastPriceUpdate(meta.lastUpdated);
        if (meta?.provider) setPriceProvider(meta.provider);
        setMarketDataUnavailable(false);
      } else {
        // Explicit unavailable or empty tick
        if (meta?.isLive === false) {
          setIsPricesLive(false);
        }
        setMarketDataUnavailable((prev) => prev || (prices.length === 0));
      }
    });

    // Refresh fiat rates every 5 mins
    const fiatInterval = setInterval(refreshFiatRates, 300000);
    return () => {
      clearTimeout(safetyTimer);
      unsubscribeLivePrices();
      clearInterval(fiatInterval);
    };
  }, []);

  useEffect(() => {
    if (user) {
      refreshNotifications();
      if (user.preferredCurrency && user.preferredCurrency !== selectedCurrency) {
        setSelectedCurrencyState(user.preferredCurrency);
        localStorage.setItem('netbybit_preferred_currency', user.preferredCurrency);
      }
    }
  }, [user]);

  // Real-time Firestore account balance & profile listener
  useEffect(() => {
    if (!user?.id && !user?.email) return;

    let unsubDoc: (() => void) | null = null;
    let unsubEmail: (() => void) | null = null;

    try {
      if (db && user.id) {
        const userRef = doc(db, 'users', user.id);
        unsubDoc = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const freshData = docSnap.data() as User;
              // Ensure this data matches the current user ID
              if (freshData && (!freshData.id || freshData.id === user.id)) {
                setUser((prev) => {
                  if (!prev) return freshData;
                  const updated = {
                    ...prev,
                    ...freshData,
                    balances: freshData.balances || prev.balances,
                    withdrawalAddresses: freshData.withdrawalAddresses || prev.withdrawalAddresses,
                  };
                  localStorage.setItem('netbybit_cached_user', JSON.stringify(updated));
                  return updated;
                });
              }
            }
          },
          (err) => {
            console.warn('Real-time user listener note:', err);
          }
        );
      }
    } catch (e) {
      console.warn('Failed to bind real-time user listener:', e);
    }

    // Instant local custom event listener
    const handleBalanceEvent = (e: any) => {
      const detail = e.detail;
      if (detail && detail.balances) {
        if (!detail.userId || detail.userId === user.id) {
          setUser((prev) => {
            if (!prev) return prev;
            const updated = {
              ...prev,
              balances: {
                ...prev.balances,
                ...detail.balances,
              },
            };
            localStorage.setItem('netbybit_cached_user', JSON.stringify(updated));
            return updated;
          });
        }
      }
    };

    window.addEventListener('netbybit_balance_updated', handleBalanceEvent);

    return () => {
      if (unsubDoc) unsubDoc();
      window.removeEventListener('netbybit_balance_updated', handleBalanceEvent);
    };
  }, [user?.id]);

  const setSelectedCurrency = async (curr: string) => {
    const cleanCurr = curr.toUpperCase();
    setSelectedCurrencyState(cleanCurr);
    localStorage.setItem('netbybit_preferred_currency', cleanCurr);

    if (user) {
      try {
        const updatedUser = await api.updateProfile({ preferredCurrency: cleanCurr });
        setUser(updatedUser);
      } catch (e) {
        console.error('Failed to persist currency to backend', e);
      }
    }
  };

  const formatFiat = (usdAmount: number) => {
    return formatFiatValue(usdAmount, selectedCurrency, fiatRates);
  };

  const login = async (email: string, pass: string) => {
    // Clear any previous guest ticket or foreign session remnants before setting user
    localStorage.removeItem('netbybit_guest_ticket_id');
    localStorage.removeItem('netbybit_guest_email');
    localStorage.removeItem('netbybit_guest_name');
    localStorage.removeItem('netbybit_user_transactions');
    localStorage.removeItem('netbybit_wallet_requests');

    const res = await api.login({ email, password: pass });
    if (res.token && res.user) {
      setAuthToken(res.token);
      setUser(res.user);
      if (res.user.preferredCurrency) {
        setSelectedCurrencyState(res.user.preferredCurrency);
        localStorage.setItem('netbybit_preferred_currency', res.user.preferredCurrency);
      }
      if (res.user.role === 'admin') {
        setActivePage('admin');
      } else {
        setActivePage('dashboard');
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('netbybit:login', { detail: res.user }));
      }
      return { user: res.user };
    }
    throw new Error('Invalid login response');
  };

  const verify2FA = async (tempToken: string, code: string) => {
    localStorage.removeItem('netbybit_guest_ticket_id');
    localStorage.removeItem('netbybit_guest_email');
    localStorage.removeItem('netbybit_guest_name');
    localStorage.removeItem('netbybit_user_transactions');
    localStorage.removeItem('netbybit_wallet_requests');

    const res = await api.verify2FA({ tempToken, code });
    setAuthToken(res.token);
    setUser(res.user);
    if (res.user.preferredCurrency) {
      setSelectedCurrencyState(res.user.preferredCurrency);
      localStorage.setItem('netbybit_preferred_currency', res.user.preferredCurrency);
    }
    if (res.user.role === 'admin') {
      setActivePage('admin');
    } else {
      setActivePage('dashboard');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('netbybit:login', { detail: res.user }));
    }
    return res.user;
  };

  const forgotPassword = async (email: string) => {
    await api.forgotPassword({ email });
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    await api.resetPassword({ email, code, newPassword });
  };

  const register = async (email: string, pass: string, name: string, username?: string) => {
    localStorage.removeItem('netbybit_guest_ticket_id');
    localStorage.removeItem('netbybit_guest_email');
    localStorage.removeItem('netbybit_guest_name');
    localStorage.removeItem('netbybit_user_transactions');
    localStorage.removeItem('netbybit_wallet_requests');

    const res = await api.register({ email, password: pass, name, username });
    setAuthToken(res.token);
    setUser(res.user);
    setActivePage('dashboard');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('netbybit:login', { detail: res.user }));
    }
  };

  const logout = () => {
    removeAuthToken();
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('netbybit_token');
      localStorage.removeItem('netbybit_cached_user');
      localStorage.removeItem('netbybit_guest_ticket_id');
      localStorage.removeItem('netbybit_guest_email');
      localStorage.removeItem('netbybit_guest_name');
      localStorage.removeItem('netbybit_user_transactions');
      localStorage.removeItem('netbybit_wallet_requests');
    } catch {}
    setUser(null);
    setNotifications([]);
    setIsLiveChatOpen(false);
    setActivePage('home');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('netbybit:logout'));
    }
  };

  const calculateTotalUsdBalance = (userBalances?: Record<string, number>): number => {
    const b = userBalances || user?.balances;
    if (!b) return 0;

    let total = 0;
    prices.forEach((p) => {
      const amount = b[p.id] || 0;
      total += amount * p.price;
    });

    return Number(total.toFixed(2));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        depositAddresses,
        prices,
        notifications,
        unreadCount,
        loading,
        pricesLoading,
        isPricesLive,
        marketDataUnavailable,
        lastPriceUpdate,
        priceProvider,
        activePage,
        setActivePage,
        goBack,
        isSupportChoiceOpen,
        openSupportChoice,
        closeSupportChoice,
        isLiveChatOpen,
        setIsLiveChatOpen,
        openLiveChat,
        selectedCurrency,
        setSelectedCurrency,
        fiatRates,
        hideBalances,
        setHideBalances,
        formatFiat,
        login,
        verify2FA,
        forgotPassword,
        resetPassword,
        register,
        logout,
        refreshUser,
        refreshDepositAddresses,
        refreshPrices,
        refreshNotifications,
        calculateTotalUsdBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
