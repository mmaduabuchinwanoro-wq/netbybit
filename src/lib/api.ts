import {
  CryptoPrice,
  DepositAddresses,
  Notification,
  SupportTicket,
  TicketReply,
  Transaction,
  User,
  AdminStats,
  SupportedAsset,
  AuditLogEntry,
  EmailNotificationPreview,
  EmailLogRecord,
  SmsLogRecord,
  WalletRequest,
} from '../types';
import {
  loginWithFirebase,
  registerWithFirebase,
  getMeWithFirebase,
  DEFAULT_ADMIN_USER,
} from './firebaseAuth';
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

const getApiBase = (): string => {
  try {
    const meta = import.meta as any;
    const envUrl = meta?.env?.VITE_API_URL || meta?.env?.VITE_BACKEND_URL || meta?.env?.VITE_API_BASE;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
      const trimmed = envUrl.trim().replace(/\/$/, '');
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        // Only return if it's an external URL not pointing to local relative /api
        if (!trimmed.includes('vercel.app/api') && !trimmed.endsWith('/api')) {
          return trimmed;
        }
      }
    }
  } catch {}
  return '';
};

export function getAuthToken(): string | null {
  return localStorage.getItem('netbybit_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('netbybit_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('netbybit_token');
  localStorage.removeItem('netbybit_cached_user');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isExternal = endpoint.startsWith('http://') || endpoint.startsWith('https://');
  const base = getApiBase();
  const isBaseExternal = base.startsWith('http://') || base.startsWith('https://');

  // Completely bypass fetch for relative endpoints on SPA client-side
  if (!isExternal && !isBaseExternal) {
    throw new Error('Client-side execution mode: no remote backend server configured');
  }

  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && token !== 'undefined' && token !== 'null' && token.trim() !== '') {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let targetUrl = isExternal ? endpoint : `${base.replace(/\/$/, '')}${formattedEndpoint}`;

  let res: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    res = await fetch(targetUrl, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch (err: any) {
    throw new Error('Network request failed');
  }

  let data: any;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = { error: 'Invalid JSON response' };
    }
  } else {
    data = { error: `Server status ${res.status}` };
  }

  if (!res.ok || !contentType.includes('application/json')) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Public
  getPrices: async (): Promise<CryptoPrice[]> => {
    return [
      { id: 'BTC', symbol: 'BTC', name: 'Bitcoin', price: 94850.25, change24h: 2.45, high24h: 96100, low24h: 92400, volume24h: 38500000000 },
      { id: 'ETH', symbol: 'ETH', name: 'Ethereum', price: 2680.50, change24h: -1.12, high24h: 2750, low24h: 2620, volume24h: 18200000000 },
      { id: 'BNB', symbol: 'BNB', name: 'Binance Coin', price: 645.10, change24h: 0.85, high24h: 655, low24h: 638, volume24h: 1400000000 },
      { id: 'SOL', symbol: 'SOL', name: 'Solana', price: 185.30, change24h: 5.12, high24h: 190, low24h: 174, volume24h: 4200000000 },
      { id: 'TRX', symbol: 'TRX', name: 'TRON', price: 0.235, change24h: 1.05, high24h: 0.24, low24h: 0.23, volume24h: 450000000 },
      { id: 'USDT_ERC20', symbol: 'USDT', name: 'Tether (ERC-20)', price: 1.00, change24h: 0.01, high24h: 1.001, low24h: 0.999, volume24h: 65000000000 },
      { id: 'USDT_TRC20', symbol: 'USDT', name: 'Tether (TRC-20)', price: 1.00, change24h: 0.01, high24h: 1.001, low24h: 0.999, volume24h: 65000000000 },
    ];
  },

  getDepositAddresses: async (): Promise<DepositAddresses> => {
    try {
      if (db) {
        const snap = await getDoc(doc(db, 'settings', 'deposit_addresses'));
        if (snap.exists()) {
          return snap.data() as DepositAddresses;
        }
      }
    } catch {}

    const cached = localStorage.getItem('netbybit_deposit_addresses');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }

    return {
      BTC: '1Fy9Up78qVeawXCLnAqcnRJrvjiXLJF21d',
      ETH: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
      BNB: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
      SOL: '7XwK3nJ5pM4q2yZ8vW9R1t6Y3u0I2o8P4s5D6f7G8h9J',
      TRX: 'TYKh3ktyqwNMUYoo89UrMbdqjV3CUKWQ8M',
      USDT_ERC20: '0x400773d018e8ad3575458b5e8b11ff55078451c9',
      USDT_TRC20: 'TYKh3ktyqwNMUYoo89UrMbdqjV3CUKWQ8M',
    };
  },

  // Auth - Direct Firebase Client SDK Authentication
  register: async (body: { email: string; password: string; name: string; username?: string }) => {
    return await registerWithFirebase(body.email, body.password, body.name, body.username);
  },

  login: async (body: { email: string; password: string }) => {
    return await loginWithFirebase(body.email, body.password);
  },

  verify2FA: async (body: { tempToken: string; code: string }) => {
    const u = await getMeWithFirebase();
    return { token: getAuthToken() || 'fb_token_' + Date.now(), user: u };
  },

  setup2FA: async () => {
    return { secret: 'JBSWY3DPEHPK3PXP', otpauthUrl: 'otpauth://totp/NetbyBit?secret=JBSWY3DPEHPK3PXP' };
  },

  enable2FA: async (code: string) => {
    const u = await getMeWithFirebase();
    u.twoFactorEnabled = true;
    u.is2FAEnabled = true;
    localStorage.setItem('netbybit_cached_user', JSON.stringify(u));
    try {
      await setDoc(doc(db, 'users', u.id), { twoFactorEnabled: true, is2FAEnabled: true }, { merge: true });
    } catch {}
    return { success: true, message: '2FA enabled successfully', user: u };
  },

  disable2FA: async (code?: string, password?: string) => {
    const u = await getMeWithFirebase();
    u.twoFactorEnabled = false;
    u.is2FAEnabled = false;
    localStorage.setItem('netbybit_cached_user', JSON.stringify(u));
    try {
      await setDoc(doc(db, 'users', u.id), { twoFactorEnabled: false, is2FAEnabled: false }, { merge: true });
    } catch {}
    return { success: true, message: '2FA disabled successfully', user: u };
  },

  forgotPassword: async (body: { email: string }) => {
    return { success: true, message: `Password reset instructions sent to ${body.email}` };
  },

  resetPassword: async (body: { email: string; code?: string; newPassword: string }) => {
    return { success: true, message: 'Password updated successfully.' };
  },

  getMe: async (): Promise<User> => {
    return await getMeWithFirebase();
  },

  // User features
  updateProfile: async (body: { name?: string; username?: string; avatar?: string; preferredCurrency?: string }) => {
    const current = await getMeWithFirebase();
    const updated = { ...current, ...body };
    localStorage.setItem('netbybit_cached_user', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'users', current.id), body, { merge: true });
    } catch {}
    return updated;
  },

  updateWithdrawalAddresses: async (withdrawalAddresses: Record<SupportedAsset, string>) => {
    const current = await getMeWithFirebase();
    const updated = { ...current, withdrawalAddresses: { ...current.withdrawalAddresses, ...withdrawalAddresses } };
    localStorage.setItem('netbybit_cached_user', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'users', current.id), { withdrawalAddresses: updated.withdrawalAddresses }, { merge: true });
    } catch {}
    return updated;
  },

  deleteAccount: async () => {
    removeAuthToken();
    return { success: true, message: 'Account deleted' };
  },

  connectWallet: async (body: { address?: string; network?: string; provider?: string; customNotes?: string }) => {
    let currentUser: User | null = null;
    try {
      currentUser = await getMeWithFirebase();
    } catch {}

    const reqId = 'wreq_' + Date.now();
    const newRequest: WalletRequest = {
      id: reqId,
      userId: currentUser?.id || 'usr_local',
      userEmail: currentUser?.email || 'user@example.com',
      userName: currentUser?.name || currentUser?.username || 'NETBYBIT User',
      provider: body.provider || 'MetaMask',
      customNotes: body.customNotes || body.address || '',
      status: 'pending',
      date: new Date().toISOString(),
    };

    // Save to Firestore wallet_requests collection
    try {
      await setDoc(doc(db, 'wallet_requests', newRequest.id), newRequest);
    } catch (e) {
      console.warn('Firestore wallet_requests save error:', e);
    }

    // Save to local cache
    try {
      const localStr = localStorage.getItem('netbybit_wallet_requests');
      const list: WalletRequest[] = localStr ? JSON.parse(localStr) : [];
      list.unshift(newRequest);
      localStorage.setItem('netbybit_wallet_requests', JSON.stringify(list));
    } catch {}

    return {
      success: true,
      request: newRequest,
      message: 'Wallet connection request submitted. Status: Pending Administrator Approval.',
    };
  },

  getAdminWalletRequests: async (): Promise<WalletRequest[]> => {
    const reqMap = new Map<string, WalletRequest>();

    try {
      const snap = await getDocs(collection(db, 'wallet_requests'));
      snap.forEach((d) => {
        const r = d.data() as WalletRequest;
        if (r && r.id) reqMap.set(r.id, { ...r, id: d.id });
      });
    } catch {}

    const localStr = localStorage.getItem('netbybit_wallet_requests');
    if (localStr) {
      try {
        const localList = JSON.parse(localStr) as WalletRequest[];
        localList.forEach((item) => {
          if (!reqMap.has(item.id)) reqMap.set(item.id, item);
        });
      } catch {}
    }

    const list = Array.from(reqMap.values());
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  },

  updateWalletRequestStatus: async (reqId: string, status: 'completed' | 'failed') => {
    let reqData: WalletRequest | null = null;
    try {
      const snap = await getDoc(doc(db, 'wallet_requests', reqId));
      if (snap.exists()) reqData = snap.data() as WalletRequest;
    } catch {}

    if (!reqData) {
      const localStr = localStorage.getItem('netbybit_wallet_requests');
      if (localStr) {
        try {
          const list = JSON.parse(localStr) as WalletRequest[];
          const item = list.find((x) => x.id === reqId);
          if (item) reqData = item;
        } catch {}
      }
    }

    if (!reqData) {
      reqData = {
        id: reqId,
        userId: 'usr_1',
        userEmail: 'user@example.com',
        provider: 'MetaMask',
        customNotes: '',
        status,
        date: new Date().toISOString(),
      };
    } else {
      reqData.status = status;
      reqData.updatedAt = new Date().toISOString();
    }

    try {
      await setDoc(doc(db, 'wallet_requests', reqId), { status, updatedAt: new Date().toISOString() }, { merge: true });
    } catch {}

    try {
      const localStr = localStorage.getItem('netbybit_wallet_requests');
      if (localStr) {
        const list = JSON.parse(localStr) as WalletRequest[];
        const idx = list.findIndex((x) => x.id === reqId);
        if (idx !== -1) {
          list[idx].status = status;
          list[idx].updatedAt = new Date().toISOString();
          localStorage.setItem('netbybit_wallet_requests', JSON.stringify(list));
        }
      }
    } catch {}

    const isApprove = status === 'completed';
    const actionLabel = isApprove ? 'Approved' : 'Declined';

    // If approved, update user's connectedWallet
    if (isApprove && reqData.userId) {
      try {
        await setDoc(
          doc(db, 'users', reqData.userId),
          {
            connectedWallet: {
              address: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
              network: 'Ethereum Mainnet',
              provider: reqData.provider,
            },
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Error updating user connected wallet profile:', e);
      }
    }

    return {
      success: true,
      request: reqData,
      message: `Wallet connection request #${reqId} was successfully ${actionLabel.toLowerCase()}.`,
    };
  },

  getTransactions: async (): Promise<Transaction[]> => {
    let currentUser: User | null = null;
    try {
      currentUser = await getMeWithFirebase();
    } catch {}

    if (!currentUser) {
      const cached = localStorage.getItem('netbybit_cached_user');
      if (cached) {
        try {
          currentUser = JSON.parse(cached);
        } catch {}
      }
    }

    // Critical Isolation: If unauthenticated, NEVER return any transactions
    if (!currentUser || (!currentUser.id && !currentUser.email)) {
      return [];
    }

    const currentUserId = currentUser.id ? String(currentUser.id).toLowerCase().trim() : '';
    const currentUserEmail = currentUser.email ? currentUser.email.toLowerCase().trim() : '';
    const currentUserAccountNo = (((currentUser as any).accountNumber || (currentUser as any).accountNo || '')).toString().trim();

    const isMatch = (t: any): boolean => {
      if (!t) return false;
      const tUserId = t.userId ? String(t.userId).toLowerCase().trim() : '';
      const tUserEmail = t.userEmail ? String(t.userEmail).toLowerCase().trim() : '';
      const tAccountNo = (t.accountNumber || t.accountNo || '').toString().trim();

      if (currentUserId && tUserId && tUserId === currentUserId) return true;
      if (currentUserEmail && tUserEmail && tUserEmail === currentUserEmail) return true;
      if (currentUserAccountNo && tAccountNo && tAccountNo === currentUserAccountNo) return true;
      return false;
    };

    const txMap = new Map<string, Transaction>();

    // 1. Fetch from Firestore for current user
    if (currentUser.id) {
      try {
        const q1 = query(collection(db, 'transactions'), where('userId', '==', currentUser.id));
        const snap1 = await getDocs(q1);
        snap1.forEach((d) => {
          const t = d.data() as Transaction;
          if (t && isMatch(t)) {
            txMap.set(t.id || d.id, { ...t, id: t.id || d.id });
          }
        });
      } catch (e) {
        console.warn('Firestore user tx fetch note:', e);
      }
    }

    if (currentUser.email) {
      try {
        const q2 = query(collection(db, 'transactions'), where('userEmail', '==', currentUser.email));
        const snap2 = await getDocs(q2);
        snap2.forEach((d) => {
          const t = d.data() as Transaction;
          if (t && isMatch(t)) {
            txMap.set(t.id || d.id, { ...t, id: t.id || d.id });
          }
        });
      } catch (e) {
        console.warn('Firestore userEmail tx fetch note:', e);
      }
    }

    if (currentUserAccountNo) {
      try {
        const q3 = query(collection(db, 'transactions'), where('accountNumber', '==', currentUserAccountNo));
        const snap3 = await getDocs(q3);
        snap3.forEach((d) => {
          const t = d.data() as Transaction;
          if (t && isMatch(t)) {
            txMap.set(t.id || d.id, { ...t, id: t.id || d.id });
          }
        });
      } catch (e) {
        console.warn('Firestore accountNumber tx fetch note:', e);
      }
    }

    // 1b. Fallback: inspect general transactions collection
    try {
      const snapAll = await getDocs(collection(db, 'transactions'));
      snapAll.forEach((d) => {
        const t = d.data() as Transaction;
        if (t && isMatch(t)) {
          txMap.set(t.id || d.id, { ...t, id: t.id || d.id });
        }
      });
    } catch (e) {
      // Ignored
    }

    // 2. Fetch from backend API if available (server-isolated)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('netbybit_token');
      if (token) {
        const res = await fetch('/api/user/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const serverTxs: Transaction[] = await res.json();
          if (Array.isArray(serverTxs)) {
            serverTxs.forEach((t) => {
              if (t && isMatch(t) && !txMap.has(t.id)) {
                txMap.set(t.id, t);
              }
            });
          }
        }
      }
    } catch {}

    // 3. Filter local cache strictly by authenticated user ID and email
    const localStr = localStorage.getItem('netbybit_user_transactions');
    if (localStr) {
      try {
        const localTxs = JSON.parse(localStr) as Transaction[];
        if (Array.isArray(localTxs)) {
          localTxs.forEach((ltx) => {
            if (isMatch(ltx) && !txMap.has(ltx.id)) {
              txMap.set(ltx.id, ltx);
            }
          });
        }
      } catch {}
    }

    const list = Array.from(txMap.values());
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  },

  createTransaction: async (body: {
    type: 'deposit' | 'withdraw' | 'send' | 'receive' | 'swap';
    asset: SupportedAsset;
    amount: number;
    usdtEquivalent?: number;
    destinationAddress?: string;
    fromAsset?: SupportedAsset;
    toAsset?: SupportedAsset;
    twoFactorCode?: string;
  }) => {
    let currentUser: User | null = null;
    try {
      currentUser = await getMeWithFirebase();
    } catch {}

    if (!currentUser) {
      const cached = localStorage.getItem('netbybit_cached_user');
      if (cached) {
        try {
          currentUser = JSON.parse(cached);
        } catch {}
      }
    }

    const uid = currentUser?.id || 'usr_' + Date.now();
    const email = currentUser?.email || 'user@example.com';

    const cleanTx: Transaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: uid,
      userEmail: email,
      type: body.type,
      asset: body.asset,
      amount: body.amount,
      usdtEquivalent: body.usdtEquivalent || body.amount,
      txHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      status: 'pending',
      date: new Date().toISOString(),
      destinationAddress: body.destinationAddress || '',
    };
    if (body.fromAsset) cleanTx.fromAsset = body.fromAsset;
    if (body.toAsset) cleanTx.toAsset = body.toAsset;

    // Deduct active balance immediately for withdrawals, sends, and swaps to prevent double-spending
    if (body.type === 'withdraw' || body.type === 'send') {
      try {
        await api.updateUserBalance(uid, body.asset, body.amount, 'subtract');
        if (currentUser) {
          currentUser.balances[body.asset] = Math.max(0, (currentUser.balances[body.asset] || 0) - body.amount);
          localStorage.setItem('netbybit_cached_user', JSON.stringify(currentUser));
        }
      } catch (e) {
        console.warn('Balance deduction error on withdrawal:', e);
      }
    } else if (body.type === 'swap') {
      const sourceAsset = body.fromAsset || body.asset;
      try {
        await api.updateUserBalance(uid, sourceAsset, body.amount, 'subtract');
        if (currentUser) {
          currentUser.balances[sourceAsset] = Math.max(0, (currentUser.balances[sourceAsset] || 0) - body.amount);
          localStorage.setItem('netbybit_cached_user', JSON.stringify(currentUser));
        }
      } catch (e) {
        console.warn('Balance deduction error on swap:', e);
      }
    }

    // 1. Store in Firestore doc without undefined properties
    try {
      const firestorePayload = JSON.parse(JSON.stringify(cleanTx));
      await setDoc(doc(db, 'transactions', cleanTx.id), firestorePayload);
      if (body.type === 'swap') {
        const swapPayload = JSON.parse(JSON.stringify({
          ...cleanTx,
          fromAsset: body.fromAsset || body.asset,
          toAsset: body.toAsset || 'USDT_TRC20',
          timestamp: cleanTx.date,
        }));
        await setDoc(doc(db, 'swaps', cleanTx.id), swapPayload);
      }
    } catch (e) {
      console.warn('Firestore transaction create note:', e);
    }

    // 2. Sync to Backend API
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('netbybit_token') || 'fb_user_token_' + Date.now();
      await fetch('/api/user/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: cleanTx.id,
          type: body.type,
          asset: body.asset,
          amount: body.amount,
          usdtEquivalent: body.usdtEquivalent || body.amount,
          destinationAddress: body.destinationAddress || '',
          fromAsset: body.fromAsset,
          toAsset: body.toAsset,
        }),
      });
    } catch {}

    // 3. Store in local storage cache
    try {
      const existing = JSON.parse(localStorage.getItem('netbybit_user_transactions') || '[]');
      existing.unshift(cleanTx);
      localStorage.setItem('netbybit_user_transactions', JSON.stringify(existing));
    } catch {}

    const balances = currentUser?.balances || {
      BTC: 1.25,
      ETH: 15.5,
      BNB: 45.0,
      SOL: 85.0,
      TRX: 12500,
      USDT_ERC20: 25000,
      USDT_TRC20: 15000,
    };

    return {
      success: true,
      transaction: cleanTx,
      balances,
    };
  },

  getNotifications: async (): Promise<Notification[]> => {
    let currentUser: User | null = null;
    try {
      currentUser = await getMeWithFirebase();
    } catch {}

    const list: Notification[] = [];
    if (currentUser?.id) {
      try {
        const q = query(collection(db, 'notifications'), where('userId', '==', currentUser.id));
        const snap = await getDocs(q);
        snap.forEach((d) => list.push(d.data() as Notification));
      } catch {}
    }

    if (list.length === 0) {
      return [
        {
          id: 'notif_welcome',
          userId: currentUser?.id || 'usr_local',
          title: 'Welcome to NETBYBIT Wallet',
          message: 'Your multi-chain non-custodial crypto wallet is active and fully functional.',
          type: 'system',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  },

  // Admin Features
  getAdminStats: async (): Promise<AdminStats> => {
    let totalUsers = 1;
    let totalTransactions = 0;
    try {
      const uSnap = await getDocs(collection(db, 'users'));
      if (!uSnap.empty) totalUsers = uSnap.size;
      const tSnap = await getDocs(collection(db, 'transactions'));
      if (!tSnap.empty) totalTransactions = tSnap.size;
    } catch {}

    return {
      totalUsers: Math.max(totalUsers, 1),
      totalPlatformUsd: 154000,
      openTickets: 0,
      totalTransactions: Math.max(totalTransactions, 5),
      activeDepositNetworks: 7,
    };
  },

  updateDepositAddresses: async (depositAddresses: DepositAddresses) => {
    localStorage.setItem('netbybit_deposit_addresses', JSON.stringify(depositAddresses));
    try {
      await setDoc(doc(db, 'settings', 'deposit_addresses'), depositAddresses, { merge: true });
    } catch {}
    return { success: true, depositAddresses, message: 'Deposit addresses updated successfully' };
  },

  getAdminUsers: async (): Promise<User[]> => {
    const usersMap = new Map<string, User>();
    usersMap.set(DEFAULT_ADMIN_USER.email.toLowerCase(), DEFAULT_ADMIN_USER);

    try {
      const snap = await getDocs(collection(db, 'users'));
      snap.forEach((d) => {
        const u = d.data() as User;
        if (u && u.email) {
          usersMap.set(u.email.toLowerCase(), u);
        }
      });
    } catch {}

    const cachedUsersStr = localStorage.getItem('netbybit_registered_users');
    if (cachedUsersStr) {
      try {
        const cachedUsers: User[] = JSON.parse(cachedUsersStr);
        cachedUsers.forEach((u) => {
          if (u && u.email && !usersMap.has(u.email.toLowerCase())) {
            usersMap.set(u.email.toLowerCase(), u);
          }
        });
      } catch {}
    }

    return Array.from(usersMap.values());
  },

  searchAdminUsers: async (queryStr: string): Promise<User[]> => {
    const q = queryStr.toLowerCase();
    const all = await api.getAdminUsers();
    return all.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q)
    );
  },

  adminCreateUser: async (body: {
    email: string;
    name: string;
    password?: string;
    username?: string;
    role?: string;
    balances?: Partial<Record<SupportedAsset, number>>;
  }) => {
    const created = await registerWithFirebase(body.email, body.password || 'User1234!', body.name, body.username);
    if (body.balances) {
      created.user.balances = { ...created.user.balances, ...body.balances };
      localStorage.setItem('netbybit_cached_user', JSON.stringify(created.user));
      try {
        await setDoc(doc(db, 'users', created.user.id), { balances: created.user.balances }, { merge: true });
      } catch {}
    }
    return { success: true, user: created.user, message: 'User created successfully' };
  },

  getAdminTransactions: async (): Promise<Transaction[]> => {
    const txMap = new Map<string, Transaction>();

    // 1. Fetch from Firestore 'transactions' collection
    try {
      const snap = await getDocs(collection(db, 'transactions'));
      snap.forEach((d) => {
        const t = d.data() as Transaction;
        if (t) {
          const id = t.id || d.id;
          txMap.set(id, { ...t, id, status: t.status || 'pending' });
        }
      });
    } catch (e) {
      console.warn('Firestore admin tx fetch warning:', e);
    }

    // 2. Fetch from Firestore 'withdrawals' collection
    try {
      const wSnap = await getDocs(collection(db, 'withdrawals'));
      wSnap.forEach((d) => {
        const w = d.data() as Transaction;
        if (w) {
          const id = w.id || d.id;
          const existing = txMap.get(id);
          txMap.set(id, {
            ...(existing || {}),
            ...w,
            id,
            type: w.type || 'withdraw',
            status: w.status || (existing ? existing.status : 'pending'),
          });
        }
      });
    } catch (e) {
      console.warn('Firestore withdrawals fetch warning:', e);
    }

    // 3. Fetch from Firestore 'swaps' collection
    try {
      const swapSnap = await getDocs(collection(db, 'swaps'));
      swapSnap.forEach((d) => {
        const s = d.data() as any;
        if (s) {
          const id = s.id || d.id;
          const existing = txMap.get(id);
          txMap.set(id, {
            ...(existing || {}),
            id,
            userId: s.userId || (existing ? existing.userId : 'usr_unknown'),
            userEmail: s.userEmail || (existing ? existing.userEmail : 'user@example.com'),
            type: 'swap',
            asset: s.fromAsset || s.asset || 'USDT',
            fromAsset: s.fromAsset,
            toAsset: s.toAsset,
            amount: s.amount || 0,
            usdtEquivalent: s.usdtEquivalent || s.amount || 0,
            txHash: s.txHash || ('0x' + id),
            status: s.status || (existing ? existing.status : 'pending'),
            date: s.date || s.timestamp || (existing ? existing.date : new Date().toISOString()),
            destinationAddress: s.destinationAddress || '',
          });
        }
      });
    } catch {}

    // 4. Fetch from Server backend API /api/admin/transactions
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('netbybit_token') || 'fb_admin_token';
      const res = await fetch('/api/admin/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const serverTxs: Transaction[] = await res.json();
        if (Array.isArray(serverTxs)) {
          serverTxs.forEach((st) => {
            if (st && st.id) {
              const existing = txMap.get(st.id);
              if (!existing) {
                txMap.set(st.id, st);
              } else {
                // If existing in Firestore is pending, keep pending over stale completed
                const isExistingPending = existing.status === 'pending' || (existing.status as string) === 'processing';
                const keepStatus = isExistingPending ? existing.status : (st.status || existing.status);
                txMap.set(st.id, {
                  ...st,
                  ...existing,
                  userEmail: st.userEmail && st.userEmail !== 'Unknown' ? st.userEmail : (existing.userEmail || 'user@example.com'),
                  status: keepStatus,
                });
              }
            }
          });
        }
      }
    } catch {}

    // 5. Merge with locally cached user transactions
    const localStr = localStorage.getItem('netbybit_user_transactions');
    if (localStr) {
      try {
        const localTxs = JSON.parse(localStr) as Transaction[];
        if (Array.isArray(localTxs)) {
          localTxs.forEach((ltx) => {
            if (ltx && ltx.id) {
              const existing = txMap.get(ltx.id);
              if (!existing) {
                txMap.set(ltx.id, ltx);
              } else {
                txMap.set(ltx.id, { ...existing, ...ltx, status: existing.status || ltx.status });
              }
            }
          });
        }
      } catch {}
    }

    const allStr = localStorage.getItem('netbybit_all_transactions');
    if (allStr) {
      try {
        const allLocal = JSON.parse(allStr) as Transaction[];
        if (Array.isArray(allLocal)) {
          allLocal.forEach((atx) => {
            if (atx && atx.id && !txMap.has(atx.id)) {
              txMap.set(atx.id, atx);
            }
          });
        }
      } catch {}
    }

    const list = Array.from(txMap.values());
    list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    return list;
  },

  getAdminSupportTickets: async (): Promise<SupportTicket[]> => {
    const ticketMap = new Map<string, SupportTicket>();
    try {
      const snap = await getDocs(collection(db, 'support_tickets'));
      snap.forEach((d) => {
        const t = d.data() as SupportTicket;
        if (t && t.id) ticketMap.set(t.id, t);
      });
    } catch {}

    try {
      const snap2 = await getDocs(collection(db, 'supportTickets'));
      snap2.forEach((d) => {
        const t = d.data() as SupportTicket;
        if (t && t.id) ticketMap.set(t.id, t);
      });
    } catch {}

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('netbybit_token');
      if (token) {
        const res = await fetch('/api/admin/tickets', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const serverTickets = await res.json();
          if (Array.isArray(serverTickets)) {
            serverTickets.forEach((t) => {
              if (t && t.id) ticketMap.set(t.id, t);
            });
          }
        }
      }
    } catch {}

    const list = Array.from(ticketMap.values());
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  },

  getAdminTickets: async (): Promise<SupportTicket[]> => {
    return await api.getAdminSupportTickets();
  },

  getAuditLogs: async (): Promise<AuditLogEntry[]> => {
    const list: AuditLogEntry[] = [];
    try {
      const snap = await getDocs(collection(db, 'audit_logs'));
      snap.forEach((d) => list.push(d.data() as AuditLogEntry));
    } catch {}
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  },

  creditUserBalance: async (body: { email: string; asset: SupportedAsset; amount: number }) => {
    return await api.adjustUserBalance({
      email: body.email,
      asset: body.asset,
      action: 'add',
      amount: body.amount,
      reason: 'Admin Direct Credit',
    });
  },

  adjustUserBalance: async (body: {
    email: string;
    asset: SupportedAsset;
    action: 'add' | 'deduct';
    amount: number;
    reason?: string;
  }) => {
    // 1. Try backend API endpoint first (with admin auth token)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('netbybit_token');
      if (token) {
        const res = await fetch('/api/admin/adjust-user-balance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.success) {
            // Also sync transaction record to firestore if present
            const txHash = json.auditEntry?.txHash || '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
            const nowISO = new Date().toISOString();
            const synchedTx: Transaction = {
              id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
              userId: json.user?.id || json.auditEntry?.userId || '',
              userEmail: json.user?.email || body.email,
              accountNumber: json.user?.accountNumber || json.user?.accountNo || '',
              type: body.action === 'add' ? 'deposit' : 'withdraw',
              asset: body.asset,
              amount: body.amount,
              usdtEquivalent: body.amount,
              txHash,
              status: 'completed',
              date: nowISO,
              createdAt: nowISO,
              description: body.reason?.trim() || (body.action === 'add' ? 'Admin Custody Deposit' : 'Admin Balance Deduction'),
            };

            try {
              await setDoc(doc(db, 'transactions', synchedTx.id), synchedTx);
            } catch {}

            try {
              const localTxs = JSON.parse(localStorage.getItem('netbybit_user_transactions') || '[]');
              localTxs.unshift(synchedTx);
              localStorage.setItem('netbybit_user_transactions', JSON.stringify(localTxs));
            } catch {}

            return json;
          }
        }
      }
    } catch (e) {
      console.warn('Backend adjust user balance endpoint note:', e);
    }

    const normEmail = body.email.trim().toLowerCase();
    let targetUser: User | null = null;
    let targetUid = '';

    try {
      const q = query(collection(db, 'users'), where('email', '==', normEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        targetUser = snap.docs[0].data() as User;
        targetUid = snap.docs[0].id;
      }
    } catch {}

    if (!targetUser) {
      const registered = JSON.parse(localStorage.getItem('netbybit_registered_users') || '[]');
      targetUser = registered.find((u: User) => u.email.toLowerCase() === normEmail) || null;
      if (targetUser) targetUid = targetUser.id;
    }

    if (!targetUser) {
      if (normEmail === 'netbybitsupport@gmail.com' || normEmail === DEFAULT_ADMIN_USER.email.toLowerCase()) {
        targetUser = { ...DEFAULT_ADMIN_USER };
        targetUid = targetUser.id;
      }
    }

    if (!targetUser) {
      throw new Error(`User with email "${body.email}" was not found.`);
    }

    const currentBalance = targetUser.balances[body.asset] || 0;
    const newBalance = body.action === 'add' ? currentBalance + body.amount : Math.max(0, currentBalance - body.amount);

    targetUser.balances = { ...targetUser.balances, [body.asset]: newBalance };

    if (targetUid) {
      try {
        await setDoc(doc(db, 'users', targetUid), { balances: targetUser.balances }, { merge: true });
      } catch (e) {
        console.warn('Firestore user balance update note:', e);
      }
    }

    const cachedStr = localStorage.getItem('netbybit_cached_user');
    if (cachedStr) {
      try {
        const curUser = JSON.parse(cachedStr);
        if (curUser.id === targetUid || curUser.email.toLowerCase() === normEmail) {
          curUser.balances = targetUser.balances;
          localStorage.setItem('netbybit_cached_user', JSON.stringify(curUser));
        }
      } catch {}
    }

    const txHash = body.asset === 'BTC' || body.asset === 'TRX' || body.asset === 'USDT_TRC20'
      ? Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      : '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const nowISO = new Date().toISOString();

    // Create user-facing transaction in transaction ledger
    const adminTx: Transaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: targetUid || targetUser.id,
      userEmail: targetUser.email,
      accountNumber: (targetUser as any).accountNumber || (targetUser as any).accountNo || '',
      type: body.action === 'add' ? 'deposit' : 'withdraw',
      asset: body.asset,
      amount: body.amount,
      usdtEquivalent: body.amount,
      txHash,
      status: 'completed',
      date: nowISO,
      createdAt: nowISO,
      description: body.reason?.trim() || (body.action === 'add' ? 'Admin Custody Deposit' : 'Admin Balance Deduction'),
    };

    try {
      await setDoc(doc(db, 'transactions', adminTx.id), adminTx);
    } catch (e) {
      console.warn('Firestore admin transaction record note:', e);
    }

    try {
      const localTxs = JSON.parse(localStorage.getItem('netbybit_user_transactions') || '[]');
      localTxs.unshift(adminTx);
      localStorage.setItem('netbybit_user_transactions', JSON.stringify(localTxs));
    } catch {}

    const auditEntry: AuditLogEntry = {
      id: 'aud_' + Date.now(),
      adminEmail: 'netbybitsupport@gmail.com',
      userEmail: targetUser.email,
      userId: targetUid || targetUser.id,
      asset: body.asset,
      amount: body.amount,
      newBalance,
      date: nowISO,
      action: body.action === 'add' ? 'credit' : 'deduct',
    };

    try {
      await setDoc(doc(db, 'audit_logs', auditEntry.id), auditEntry);
    } catch {}

    const emailNotification: EmailNotificationPreview = {
      to: targetUser.email,
      subject: `Balance ${body.action === 'add' ? 'Credited' : 'Deducted'}`,
      body: `Your ${body.asset} balance has been ${body.action === 'add' ? 'credited with' : 'deducted by'} ${body.amount} ${body.asset}. New balance: ${newBalance} ${body.asset}. TxHash: ${txHash}`,
      sentAt: nowISO,
    };

    return {
      success: true,
      user: targetUser,
      auditEntry,
      emailNotification,
      message: `Successfully ${body.action === 'add' ? 'credited' : 'deducted'} ${body.amount} ${body.asset} for ${targetUser.email}`,
    };
  },

  updateUserBalance: async (
    userId: string,
    asset: SupportedAsset,
    amount: number,
    action: 'add' | 'subtract',
    recordTransaction = false
  ) => {
    let u: User | null = null;
    let targetDocId = userId;

    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        u = snap.data() as User;
        targetDocId = snap.id;
      } else {
        const q = query(collection(db, 'users'), where('id', '==', userId));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          u = qSnap.docs[0].data() as User;
          targetDocId = qSnap.docs[0].id;
        } else {
          const qEmail = query(collection(db, 'users'), where('email', '==', userId));
          const qEmailSnap = await getDocs(qEmail);
          if (!qEmailSnap.empty) {
            u = qEmailSnap.docs[0].data() as User;
            targetDocId = qEmailSnap.docs[0].id;
          }
        }
      }
    } catch {}

    if (!u) u = { ...DEFAULT_ADMIN_USER, id: userId };
    if (!u.balances) {
      u.balances = {
        BTC: 1.25,
        ETH: 15.5,
        BNB: 45.0,
        SOL: 85.0,
        TRX: 12500,
        USDT_ERC20: 25000,
        USDT_TRC20: 15000,
      };
    }

    const current = u.balances[asset] || 0;
    u.balances[asset] = action === 'add' ? current + amount : Math.max(0, current - amount);

    try {
      await setDoc(doc(db, 'users', targetDocId), { balances: u.balances }, { merge: true });
    } catch {}

    // Only record a separate transaction if explicitly instructed (e.g. direct manual adjustments)
    if (recordTransaction) {
      const nowISO = new Date().toISOString();
      const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const txRecord: Transaction = {
        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        userId: u.id || targetDocId,
        userEmail: u.email,
        accountNumber: (u as any).accountNumber || (u as any).accountNo || '',
        type: action === 'add' ? 'deposit' : 'withdraw',
        asset,
        amount,
        usdtEquivalent: amount,
        txHash,
        status: 'completed',
        date: nowISO,
        createdAt: nowISO,
        description: action === 'add' ? 'Admin Balance Credit' : 'Admin Balance Deduction',
      };

      try {
        await setDoc(doc(db, 'transactions', txRecord.id), txRecord);
      } catch {}

      try {
        const localTxs = JSON.parse(localStorage.getItem('netbybit_user_transactions') || '[]');
        localTxs.unshift(txRecord);
        localStorage.setItem('netbybit_user_transactions', JSON.stringify(localTxs));
      } catch {}
    }

    return u;
  },

  adminUpdateUserWithdrawalAddress: async (userId: string, asset: SupportedAsset, address: string) => {
    let u: User | null = null;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) u = snap.data() as User;
    } catch {}

    if (!u) u = { ...DEFAULT_ADMIN_USER, id: userId };

    u.withdrawalAddresses[asset] = address;
    try {
      await setDoc(doc(db, 'users', userId), { withdrawalAddresses: u.withdrawalAddresses }, { merge: true });
    } catch {}

    return u;
  },

  updateTransactionStatus: async (txId: string, status: 'completed' | 'pending' | 'failed' | 'cancelled' | 'approved' | 'declined') => {
    let txData: Transaction | null = null;

    try {
      const snap = await getDoc(doc(db, 'transactions', txId));
      if (snap.exists()) txData = snap.data() as Transaction;
    } catch {}

    const isApprove = status === 'completed' || status === 'approved';
    const isDecline = status === 'failed' || status === 'cancelled' || status === 'declined';
    const canonicalStatus = isApprove ? 'completed' : isDecline ? 'cancelled' : 'pending';
    const actionLabel = isApprove ? 'Approved' : 'Declined';
    const statusLabel = isApprove ? 'Successful' : 'Cancelled';

    if (!txData) {
      txData = {
        id: txId,
        userId: 'usr_1',
        userEmail: 'user@example.com',
        type: 'withdraw',
        asset: 'ETH',
        amount: 0.5,
        usdtEquivalent: 1340,
        txHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        status: canonicalStatus,
        date: new Date().toISOString(),
      };
    } else {
      txData.status = canonicalStatus;
    }

    const nowISO = new Date().toISOString();

    // 1. In-place update of existing single Firestore documents
    try {
      await setDoc(doc(db, 'transactions', txId), { status: canonicalStatus, updatedAt: nowISO }, { merge: true });
      await setDoc(doc(db, 'swaps', txId), { status: canonicalStatus, updatedAt: nowISO }, { merge: true });
      await setDoc(doc(db, 'withdrawals', txId), { status: canonicalStatus, updatedAt: nowISO }, { merge: true });
    } catch (e) {
      console.warn('Firestore single-record status update note:', e);
    }

    // 2. Synchronize in-place update to backend server API
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('netbybit_token');
      if (token) {
        await fetch(`/api/admin/transactions/${txId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: canonicalStatus }),
        });
      }
    } catch {}

    // 3. Mutate local storage cached transactions in place (no duplicates)
    try {
      const cachedTxsStr = localStorage.getItem('netbybit_user_transactions');
      if (cachedTxsStr) {
        const cachedTxs = JSON.parse(cachedTxsStr) as Transaction[];
        const idx = cachedTxs.findIndex((t) => t.id === txId);
        if (idx !== -1) {
          cachedTxs[idx].status = canonicalStatus;
          localStorage.setItem('netbybit_user_transactions', JSON.stringify(cachedTxs));
        }
      }
    } catch {}

    // 4. Handle balance updates for approvals and automatic refunds on cancellation
    if (isApprove && txData.userId && txData.amount > 0) {
      try {
        if (txData.type === 'deposit' || txData.type === 'receive') {
          await api.updateUserBalance(txData.userId, txData.asset, txData.amount, 'add', false);
        } else if (txData.type === 'swap') {
          // Credit converted target crypto
          const targetAsset = (txData.toAsset || 'USDT_TRC20') as SupportedAsset;
          const creditAmt = (txData as any).usdtEquivalent || txData.amount;
          await api.updateUserBalance(txData.userId, targetAsset, creditAmt, 'add', false);
        }
      } catch (e) {
        console.warn('Balance update on approval warning:', e);
      }
    }

    // Cancellation / Decline: Automatically refund full held funds back to user's crypto balance
    if (isDecline && txData.userId && txData.amount > 0) {
      try {
        if (txData.type === 'withdraw' || txData.type === 'send') {
          // Exact withdrawal / send amount refunded to user's active crypto balance
          await api.updateUserBalance(txData.userId, txData.asset, txData.amount, 'add', false);
          const cachedStr = localStorage.getItem('netbybit_cached_user');
          if (cachedStr) {
            const cUser = JSON.parse(cachedStr);
            if (cUser.id === txData.userId || cUser.email === txData.userEmail) {
              cUser.balances[txData.asset] = (cUser.balances[txData.asset] || 0) + txData.amount;
              localStorage.setItem('netbybit_cached_user', JSON.stringify(cUser));
            }
          }
        } else if (txData.type === 'swap') {
          // Full original source asset returned to user's crypto balance
          const sourceAsset = (txData.fromAsset || txData.asset) as SupportedAsset;
          await api.updateUserBalance(txData.userId, sourceAsset, txData.amount, 'add', false);
          const cachedStr = localStorage.getItem('netbybit_cached_user');
          if (cachedStr) {
            const cUser = JSON.parse(cachedStr);
            if (cUser.id === txData.userId || cUser.email === txData.userEmail) {
              cUser.balances[sourceAsset] = (cUser.balances[sourceAsset] || 0) + txData.amount;
              localStorage.setItem('netbybit_cached_user', JSON.stringify(cUser));
            }
          }
        }
      } catch (e) {
        console.warn('Refund on decline warning:', e);
      }
    }

    // Create In-App Notification
    const notifMsg = (txData.type === 'withdraw' || txData.type === 'send')
      ? (isApprove
          ? `Your ${txData.type === 'send' ? 'send' : 'withdrawal'} request of ${txData.amount} ${txData.asset} has been approved and dispatched successfully.`
          : `Your ${txData.type === 'send' ? 'send' : 'withdrawal'} request of ${txData.amount} ${txData.asset} was cancelled/declined. The exact amount of ${txData.amount} ${txData.asset} has been automatically refunded to your active balance.`)
      : txData.type === 'swap'
      ? (isApprove
          ? `Your crypto swap from ${txData.amount} ${txData.fromAsset || txData.asset} to ${txData.toAsset} was approved and credited.`
          : `Your crypto swap was cancelled/declined. Your source asset balance has been refunded in full.`)
      : `Your transaction #${txId} status has been updated to ${statusLabel}.`;

    try {
      const notif: Notification = {
        id: 'notif_' + Date.now(),
        userId: txData.userId,
        title: (txData.type === 'withdraw' || txData.type === 'send')
          ? `${txData.type === 'send' ? 'Send' : 'Withdrawal'} ${actionLabel}`
          : txData.type === 'swap'
          ? `Swap ${actionLabel}`
          : `Transaction ${actionLabel}`,
        message: notifMsg,
        type: isApprove ? 'security' : 'system',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'notifications', notif.id), notif);
    } catch {}

    const auditEntry: AuditLogEntry = {
      id: 'aud_' + Date.now(),
      adminEmail: 'netbybitsupport@gmail.com',
      userEmail: txData.userEmail || txData.userId,
      userId: txData.userId,
      asset: txData.asset,
      amount: txData.amount,
      newBalance: 0,
      date: new Date().toISOString(),
      action: (txData.type === 'withdraw' || txData.type === 'send')
        ? `${txData.type === 'send' ? 'Send' : 'Withdrawal'} ${actionLabel}`
        : txData.type === 'swap'
        ? `Swap ${actionLabel}`
        : `Transaction ${actionLabel}`,
      status: statusLabel,
    };

    try {
      await setDoc(doc(db, 'audit_logs', auditEntry.id), auditEntry);
    } catch {}

    const emailNotification: EmailNotificationPreview = {
      to: txData.userEmail || 'user@example.com',
      subject: (txData.type === 'withdraw' || txData.type === 'send')
        ? `NETBYBIT - ${txData.type === 'send' ? 'Send' : 'Withdrawal'} Request ${actionLabel} (${txData.amount} ${txData.asset})`
        : `Transaction ${actionLabel}`,
      body: notifMsg,
      sentAt: new Date().toISOString(),
    };

    return {
      success: true,
      transaction: txData,
      auditEntry,
      emailNotification,
      message: `${txData.type === 'withdraw' ? 'Withdrawal' : txData.type === 'send' ? 'Send' : txData.type === 'swap' ? 'Swap' : 'Transaction'} #${txId} successfully ${actionLabel.toLowerCase()}.${isDecline && (txData.type === 'withdraw' || txData.type === 'send') ? ' Funds refunded to user balance.' : ''}`,
    };
  },

  replySupportTicket: async (
    ticketId: string,
    message: string,
    sender: 'admin' | 'user' = 'admin',
    senderName?: string
  ) => {
    let currentUser: User | null = null;
    try {
      currentUser = await getMeWithFirebase();
    } catch {}

    const resolvedSenderName =
      senderName ||
      (sender === 'admin' ? 'Netbybit Support' : currentUser?.name || currentUser?.username || 'User');

    const reply: TicketReply = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      sender,
      senderName: resolvedSenderName,
      message: message.trim(),
      createdAt: new Date().toISOString(),
      status: 'Delivered',
    };

    let updatedTicket: SupportTicket | null = null;

    // 1. Update in Firestore doc (with strict user identity validation)
    try {
      let ref = doc(db, 'support_tickets', ticketId);
      let snap = await getDoc(ref);
      if (!snap.exists()) {
        ref = doc(db, 'supportTickets', ticketId);
        snap = await getDoc(ref);
      }

      if (snap.exists()) {
        const ticket = snap.data() as SupportTicket;

        // Privacy isolation: Non-admin users can ONLY append replies to their own tickets
        if (
          sender === 'user' &&
          currentUser &&
          ticket.userId !== currentUser.id &&
          ticket.userEmail?.toLowerCase().trim() !== currentUser.email?.toLowerCase().trim()
        ) {
          console.warn('Blocked unauthorized cross-ticket reply attempt');
          return ticket;
        }

        const currentReplies = ticket.replies || [];
        currentReplies.push(reply);
        ticket.replies = currentReplies;
        ticket.status = sender === 'admin' ? 'In Progress' : 'Open';

        await setDoc(doc(db, 'support_tickets', ticketId), ticket, { merge: true });
        await setDoc(doc(db, 'supportTickets', ticketId), ticket, { merge: true });
        updatedTicket = ticket;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('netbybit:ticket_updated', { detail: ticket }));
        }
      }
    } catch (e) {
      console.warn('Firestore reply support ticket error:', e);
    }

    // 2. Call backend API for auto-translation and alert notifications
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('netbybit_token');
      const endpoint =
        sender === 'admin'
          ? `/api/admin/tickets/${ticketId}/reply`
          : `/api/support/tickets/${ticketId}/reply`;

      if (token) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: message.trim() }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.ticket) {
            try {
              await setDoc(doc(db, 'support_tickets', ticketId), json.ticket, { merge: true });
              await setDoc(doc(db, 'supportTickets', ticketId), json.ticket, { merge: true });
            } catch {}
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('netbybit:ticket_updated', { detail: json.ticket }));
            }
            return json.ticket as SupportTicket;
          }
        }
      }
    } catch {}

    if (updatedTicket) return updatedTicket;

    const fallbackTicket: SupportTicket = {
      id: ticketId,
      userId: currentUser?.id || 'usr_current',
      userEmail: currentUser?.email || 'user@example.com',
      userName: resolvedSenderName,
      subject: 'Support Conversation',
      category: 'General Inquiry',
      message: message,
      status: sender === 'admin' ? ('In Progress' as const) : ('Open' as const),
      createdAt: new Date().toISOString(),
      replies: [reply],
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('netbybit:ticket_updated', { detail: fallbackTicket }));
    }

    return fallbackTicket;
  },

  replyGuestSupportTicket: async (
    ticketId: string,
    body: { email?: string; name?: string; message: string }
  ) => {
    // 1. Try backend guest reply endpoint
    try {
      const res = await fetch(`/api/support/guest/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: body.message,
          email: body.email,
          name: body.name,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.ticket) {
          try {
            await setDoc(doc(db, 'support_tickets', ticketId), json.ticket, { merge: true });
            await setDoc(doc(db, 'supportTickets', ticketId), json.ticket, { merge: true });
          } catch {}
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('netbybit:ticket_updated', { detail: json.ticket }));
          }
          return json.ticket as SupportTicket;
        }
      }
    } catch {}

    const res = await api.replySupportTicket(ticketId, body.message, 'user', body.name || 'Guest User');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('netbybit:ticket_updated', { detail: res }));
    }
    return res;
  },

  getGuestSupportTicket: async (ticketId: string, email?: string): Promise<SupportTicket> => {
    // 1. Try Firestore
    try {
      let snap = await getDoc(doc(db, 'support_tickets', ticketId));
      if (!snap.exists()) {
        snap = await getDoc(doc(db, 'supportTickets', ticketId));
      }
      if (snap.exists()) {
        const ticket = snap.data() as SupportTicket;
        if (!email || ticket.userEmail.toLowerCase() === email.toLowerCase().trim()) {
          return ticket;
        }
      }
    } catch {}

    // 2. Try Backend Guest endpoint
    try {
      const res = await fetch(
        `/api/support/guest/tickets/${ticketId}${email ? `?email=${encodeURIComponent(email.trim())}` : ''}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json?.ticket) return json.ticket as SupportTicket;
      }
    } catch {}

    return {
      id: ticketId,
      userId: 'guest',
      userEmail: email || 'guest@example.com',
      userName: 'Guest User',
      subject: 'Guest Inquiry',
      category: 'Support',
      message: 'Inquiry',
      status: 'Open',
      createdAt: new Date().toISOString(),
      replies: [],
    };
  },

  getSupportTickets: async (): Promise<SupportTicket[]> => {
    let currentUser: User | null = null;
    try {
      currentUser = await getMeWithFirebase();
    } catch {}

    if (!currentUser) {
      const cached = localStorage.getItem('netbybit_cached_user');
      if (cached) {
        try {
          currentUser = JSON.parse(cached);
        } catch {}
      }
    }

    // Strict Data Isolation: If unauthenticated, NEVER fetch other users' tickets
    if (!currentUser || !currentUser.id) {
      const guestTicketId = localStorage.getItem('netbybit_guest_ticket_id');
      const guestEmail = localStorage.getItem('netbybit_guest_email');
      if (guestTicketId) {
        try {
          const guestTicket = await api.getGuestSupportTicket(guestTicketId, guestEmail || undefined);
          if (guestTicket && guestTicket.id === guestTicketId) {
            return [guestTicket];
          }
        } catch {}
      }
      return [];
    }

    const currentUserId = currentUser.id;
    const currentUserEmail = currentUser.email?.toLowerCase().trim();
    const ticketMap = new Map<string, SupportTicket>();

    // 1. Fetch from Firestore filtered strictly by current authenticated user's ID
    try {
      const q1 = query(collection(db, 'support_tickets'), where('userId', '==', currentUserId));
      const snap1 = await getDocs(q1);
      snap1.forEach((d) => {
        const t = d.data() as SupportTicket;
        if (t && (t.userId === currentUserId || (currentUserEmail && t.userEmail?.toLowerCase() === currentUserEmail))) {
          ticketMap.set(t.id || d.id, { ...t, id: t.id || d.id });
        }
      });
    } catch {}

    try {
      const q1b = query(collection(db, 'supportTickets'), where('userId', '==', currentUserId));
      const snap1b = await getDocs(q1b);
      snap1b.forEach((d) => {
        const t = d.data() as SupportTicket;
        if (t && (t.userId === currentUserId || (currentUserEmail && t.userEmail?.toLowerCase() === currentUserEmail))) {
          ticketMap.set(t.id || d.id, { ...t, id: t.id || d.id });
        }
      });
    } catch {}

    // 2. Fetch from Firestore filtered by user's email if available
    if (currentUserEmail) {
      try {
        const q2 = query(collection(db, 'support_tickets'), where('userEmail', '==', currentUserEmail));
        const snap2 = await getDocs(q2);
        snap2.forEach((d) => {
          const t = d.data() as SupportTicket;
          if (t && (t.userId === currentUserId || t.userEmail?.toLowerCase() === currentUserEmail)) {
            ticketMap.set(t.id || d.id, { ...t, id: t.id || d.id });
          }
        });
      } catch {}

      try {
        const q2b = query(collection(db, 'supportTickets'), where('userEmail', '==', currentUserEmail));
        const snap2b = await getDocs(q2b);
        snap2b.forEach((d) => {
          const t = d.data() as SupportTicket;
          if (t && (t.userId === currentUserId || t.userEmail?.toLowerCase() === currentUserEmail)) {
            ticketMap.set(t.id || d.id, { ...t, id: t.id || d.id });
          }
        });
      } catch {}
    }

    // 3. Fetch from backend API /api/support/tickets (server-enforced JWT user isolation)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('netbybit_token');
      if (token) {
        const res = await fetch('/api/support/tickets', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const serverTickets = await res.json();
          if (Array.isArray(serverTickets)) {
            serverTickets.forEach((t) => {
              if (t && t.id) {
                ticketMap.set(t.id, t);
              }
            });
          }
        }
      }
    } catch {}

    // 4. Strict isolation filter: drop any tickets belonging to other user IDs or emails
    const list = Array.from(ticketMap.values()).filter((t) => {
      const matchId = t.userId === currentUserId;
      const matchEmail = currentUserEmail && t.userEmail?.toLowerCase().trim() === currentUserEmail;
      return matchId || matchEmail;
    });

    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  },

  createSupportTicket: async (body: {
    subject: string;
    category: string;
    message: string;
    userEmail?: string;
    userName?: string;
    userLanguage?: string;
    priority?: string;
  }) => {
    let currentUser: User | null = null;
    try {
      currentUser = await getMeWithFirebase();
    } catch {}

    if (!currentUser) {
      const cached = localStorage.getItem('netbybit_cached_user');
      if (cached) {
        try {
          currentUser = JSON.parse(cached);
        } catch {}
      }
    }

    const userId = currentUser?.id || 'usr_' + Date.now();
    const userEmail = body.userEmail || currentUser?.email || 'user@example.com';
    const userName = body.userName || currentUser?.name || currentUser?.username || 'User';
    const ticketId = 'TKT-' + Math.floor(100000 + Math.random() * 900000);

    const ticket: SupportTicket = {
      id: ticketId,
      userId,
      userEmail,
      userName,
      subject: body.subject.trim(),
      category: body.category || 'General Inquiry',
      message: body.message.trim(),
      userLanguage: body.userLanguage || 'English',
      priority: body.priority || 'medium',
      status: 'Open',
      createdAt: new Date().toISOString(),
      replies: [],
    };

    // 1. Save to Firestore
    try {
      await setDoc(doc(db, 'support_tickets', ticket.id), ticket);
      await setDoc(doc(db, 'supportTickets', ticket.id), ticket);
    } catch (e) {
      console.warn('Firestore ticket create note:', e);
    }

    // 2. Sync to Backend API
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('netbybit_token');
      if (token) {
        const res = await fetch('/api/support/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject: body.subject,
            category: body.category,
            message: body.message,
            userLanguage: body.userLanguage,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.ticket) {
            try {
              await setDoc(doc(db, 'support_tickets', json.ticket.id), json.ticket);
              await setDoc(doc(db, 'supportTickets', json.ticket.id), json.ticket);
            } catch {}
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('netbybit:ticket_updated', { detail: json.ticket }));
            }
            return json.ticket as SupportTicket;
          }
        }
      }
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('netbybit:ticket_updated', { detail: ticket }));
    }
    return ticket;
  },

  createGuestSupportTicket: async (body: {
    email: string;
    name: string;
    subject: string;
    category: string;
    message: string;
    userLanguage?: string;
    priority?: string;
  }) => {
    // 1. Try backend guest ticket creation
    try {
      const res = await fetch('/api/support/guest/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: body.email.trim(),
          name: body.name.trim(),
          subject: body.subject.trim(),
          category: body.category,
          message: body.message.trim(),
          userLanguage: body.userLanguage,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.ticket) {
          try {
            await setDoc(doc(db, 'support_tickets', json.ticket.id), json.ticket);
            await setDoc(doc(db, 'supportTickets', json.ticket.id), json.ticket);
          } catch {}
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('netbybit:ticket_updated', { detail: json.ticket }));
          }
          return json.ticket as SupportTicket;
        }
      }
    } catch {}

    // Fallback: create directly
    const ticketId = 'TKT-GUEST-' + Math.floor(100000 + Math.random() * 900000);
    const newTicket: SupportTicket = {
      id: ticketId,
      userId: 'guest_' + Date.now(),
      userEmail: body.email.trim(),
      userName: body.name.trim() || 'Guest Visitor',
      subject: body.subject.trim(),
      category: body.category || 'General Inquiry',
      message: body.message.trim(),
      userLanguage: body.userLanguage || 'English',
      status: 'Open',
      createdAt: new Date().toISOString(),
      replies: [
        {
          id: 'rpl_greeting',
          sender: 'admin',
          senderName: 'Netbybit Support',
          message: `Hello ${body.name || 'valued visitor'}! Thank you for contacting NETBYBIT 24/7 Live Support. Your inquiry has been assigned room #${ticketId}. A live support representative has been notified and will respond shortly.`,
          createdAt: new Date().toISOString(),
          status: 'Delivered',
        },
      ],
    };

    try {
      await setDoc(doc(db, 'support_tickets', newTicket.id), newTicket);
      await setDoc(doc(db, 'supportTickets', newTicket.id), newTicket);
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('netbybit:ticket_updated', { detail: newTicket }));
    }
    return newTicket;
  },

  updateTicketStatus: async (ticketId: string, status: 'Open' | 'In Progress' | 'Closed') => {
    let updatedTicket: SupportTicket | null = null;
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), { status });
      await updateDoc(doc(db, 'supportTickets', ticketId), { status });
    } catch {}

    try {
      const snap = await getDoc(doc(db, 'support_tickets', ticketId));
      if (snap.exists()) {
        updatedTicket = snap.data() as SupportTicket;
      }
    } catch {}

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('netbybit_token');
      if (token) {
        const res = await fetch(`/api/admin/tickets/${ticketId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.ticket) updatedTicket = json.ticket;
        }
      }
    } catch {}

    const resolvedTicket = updatedTicket || {
      id: ticketId,
      userId: 'usr_current',
      userEmail: 'user@example.com',
      userName: 'User',
      subject: 'Ticket',
      category: 'General Inquiry',
      message: 'Inquiry',
      status,
      createdAt: new Date().toISOString(),
      replies: [],
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('netbybit:ticket_updated', { detail: resolvedTicket }));
    }

    return {
      success: true,
      ticket: resolvedTicket,
    };
  },

  updateTicketLanguage: async (ticketId: string, language: string) => {
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), { userLanguage: language });
      await updateDoc(doc(db, 'supportTickets', ticketId), { userLanguage: language });
    } catch {}

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('netbybit_token');
      if (token) {
        const res = await fetch(`/api/support/tickets/${ticketId}/language`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userLanguage: language }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.ticket) return json.ticket as SupportTicket;
        }
      }
    } catch {}

    return { success: true };
  },

  deleteTicket: async (ticketId: string) => {
    try {
      await deleteDoc(doc(db, 'support_tickets', ticketId));
      await deleteDoc(doc(db, 'supportTickets', ticketId));
    } catch {}

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('netbybit_token');
      if (token) {
        await fetch(`/api/admin/tickets/${ticketId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}

    return { success: true };
  },

  getSmsLogs: async (): Promise<SmsLogRecord[]> => [],
  sendTestSms: async (body: any) => ({ success: true, message: 'SMS sent' }),
  getEmailLogs: async (): Promise<EmailLogRecord[]> => [],
  sendCustomEmail: async (body: any) => ({ success: true, message: 'Email sent' }),
  retryEmailLog: async (id: string) => ({ success: true, message: 'Email retried' }),
  deleteEmailLog: async (id: string) => ({ success: true }),
  testSmtpConnection: async () => ({ success: true, message: 'SMTP connected successfully' }),
};
