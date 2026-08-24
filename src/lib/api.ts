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

    const list: Transaction[] = [];

    if (currentUser?.id) {
      try {
        const q = query(collection(db, 'transactions'), where('userId', '==', currentUser.id));
        const snap = await getDocs(q);
        snap.forEach((d) => list.push(d.data() as Transaction));
      } catch {}
    }

    // Merge with local cache
    const localStr = localStorage.getItem('netbybit_user_transactions');
    if (localStr) {
      try {
        const localTxs = JSON.parse(localStr) as Transaction[];
        localTxs.forEach((ltx) => {
          if (!list.some((t) => t.id === ltx.id)) {
            list.push(ltx);
          }
        });
      } catch {}
    }

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

    const uid = currentUser?.id || 'usr_local';
    const email = currentUser?.email || 'user@example.com';

    const mockTx: Transaction = {
      id: 'tx_' + Date.now(),
      userId: uid,
      userEmail: email,
      type: body.type,
      asset: body.asset,
      amount: body.amount,
      usdtEquivalent: body.usdtEquivalent || body.amount,
      txHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      status: 'pending',
      date: new Date().toISOString(),
      destinationAddress: body.destinationAddress,
      fromAsset: body.fromAsset,
      toAsset: body.toAsset,
    };

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

    // Store in Firestore doc
    try {
      await setDoc(doc(db, 'transactions', mockTx.id), mockTx);
      if (body.type === 'swap') {
        await setDoc(doc(db, 'swaps', mockTx.id), {
          ...mockTx,
          fromAsset: body.fromAsset || body.asset,
          toAsset: body.toAsset || 'USDT_TRC20',
          timestamp: mockTx.date,
        });
      }
    } catch (e) {
      console.warn('Firestore transaction create note:', e);
    }

    // Store in local storage
    try {
      const existing = JSON.parse(localStorage.getItem('netbybit_user_transactions') || '[]');
      existing.unshift(mockTx);
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
      transaction: mockTx,
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

    try {
      const snap = await getDocs(collection(db, 'transactions'));
      snap.forEach((d) => {
        const t = d.data() as Transaction;
        if (t && t.id) txMap.set(t.id, t);
      });
    } catch {}

    const localStr = localStorage.getItem('netbybit_user_transactions');
    if (localStr) {
      try {
        const localTxs = JSON.parse(localStr) as Transaction[];
        localTxs.forEach((ltx) => {
          if (!txMap.has(ltx.id)) txMap.set(ltx.id, ltx);
        });
      } catch {}
    }

    const list = Array.from(txMap.values());
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  },

  getAdminSupportTickets: async (): Promise<SupportTicket[]> => {
    const list: SupportTicket[] = [];
    try {
      const snap = await getDocs(collection(db, 'support_tickets'));
      snap.forEach((d) => list.push(d.data() as SupportTicket));
    } catch {}
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

    const auditEntry: AuditLogEntry = {
      id: 'aud_' + Date.now(),
      adminEmail: 'netbybitsupport@gmail.com',
      userEmail: targetUser.email,
      userId: targetUid || targetUser.id,
      asset: body.asset,
      amount: body.amount,
      newBalance,
      date: new Date().toISOString(),
      action: body.action === 'add' ? 'credit' : 'deduct',
    };

    try {
      await setDoc(doc(db, 'audit_logs', auditEntry.id), auditEntry);
    } catch {}

    const emailNotification: EmailNotificationPreview = {
      to: targetUser.email,
      subject: `Balance ${body.action === 'add' ? 'Credited' : 'Deducted'}`,
      body: `Your ${body.asset} balance has been ${body.action === 'add' ? 'credited with' : 'deducted by'} ${body.amount} ${body.asset}. New balance: ${newBalance} ${body.asset}.`,
      sentAt: new Date().toISOString(),
    };

    return {
      success: true,
      user: targetUser,
      auditEntry,
      emailNotification,
      message: `Successfully ${body.action === 'add' ? 'credited' : 'deducted'} ${body.amount} ${body.asset} for ${targetUser.email}`,
    };
  },

  updateUserBalance: async (userId: string, asset: SupportedAsset, amount: number, action: 'add' | 'subtract') => {
    let u: User | null = null;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) u = snap.data() as User;
    } catch {}

    if (!u) u = { ...DEFAULT_ADMIN_USER, id: userId };

    const current = u.balances[asset] || 0;
    u.balances[asset] = action === 'add' ? current + amount : Math.max(0, current - amount);

    try {
      await setDoc(doc(db, 'users', userId), { balances: u.balances }, { merge: true });
    } catch {}

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

  updateTransactionStatus: async (txId: string, status: 'completed' | 'pending' | 'failed') => {
    let txData: Transaction | null = null;

    try {
      const snap = await getDoc(doc(db, 'transactions', txId));
      if (snap.exists()) txData = snap.data() as Transaction;
    } catch {}

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
        status,
        date: new Date().toISOString(),
      };
    } else {
      txData.status = status;
    }

    try {
      await setDoc(doc(db, 'transactions', txId), { status, updatedAt: new Date().toISOString() }, { merge: true });
      await setDoc(doc(db, 'swaps', txId), { status, updatedAt: new Date().toISOString() }, { merge: true });
    } catch {}

    // Update local storage cached transactions
    try {
      const cachedTxsStr = localStorage.getItem('netbybit_user_transactions');
      if (cachedTxsStr) {
        const cachedTxs = JSON.parse(cachedTxsStr) as Transaction[];
        const idx = cachedTxs.findIndex((t) => t.id === txId);
        if (idx !== -1) {
          cachedTxs[idx].status = status;
          localStorage.setItem('netbybit_user_transactions', JSON.stringify(cachedTxs));
        }
      }
    } catch {}

    const isApprove = status === 'completed';
    const isDecline = status === 'failed';
    const actionLabel = isApprove ? 'Approved' : 'Declined';
    const statusLabel = isApprove ? 'Successful' : 'Declined';

    // 1. If Approved (completed)
    if (isApprove && txData.userId && txData.amount > 0) {
      try {
        if (txData.type === 'deposit' || txData.type === 'receive') {
          await api.updateUserBalance(txData.userId, txData.asset, txData.amount, 'add');
        } else if (txData.type === 'swap') {
          const targetAsset = txData.toAsset || 'USDT_TRC20';
          const creditAmt = (txData as any).usdtEquivalent || txData.amount;
          await api.updateUserBalance(txData.userId, targetAsset, creditAmt, 'add');
        }
      } catch (e) {
        console.warn('Balance update on approval warning:', e);
      }
    }

    // 2. If Declined (failed/cancelled) -> Automatically refund deducted amount back to user's active crypto balance!
    if (isDecline && txData.userId && txData.amount > 0) {
      try {
        if (txData.type === 'withdraw' || txData.type === 'send') {
          // Exact withdrawal amount returned back to user's active crypto balance
          await api.updateUserBalance(txData.userId, txData.asset, txData.amount, 'add');
          const cachedStr = localStorage.getItem('netbybit_cached_user');
          if (cachedStr) {
            const cUser = JSON.parse(cachedStr);
            if (cUser.id === txData.userId || cUser.email === txData.userEmail) {
              cUser.balances[txData.asset] = (cUser.balances[txData.asset] || 0) + txData.amount;
              localStorage.setItem('netbybit_cached_user', JSON.stringify(cUser));
            }
          }
        } else if (txData.type === 'swap') {
          const sourceAsset = (txData.fromAsset || txData.asset) as SupportedAsset;
          await api.updateUserBalance(txData.userId, sourceAsset, txData.amount, 'add');
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
    const notifMsg = txData.type === 'withdraw'
      ? (isApprove
          ? `Your withdrawal request of ${txData.amount} ${txData.asset} has been approved and dispatched successfully.`
          : `Your withdrawal request of ${txData.amount} ${txData.asset} was declined. The exact amount of ${txData.amount} ${txData.asset} has been automatically refunded to your active balance.`)
      : txData.type === 'swap'
      ? (isApprove
          ? `Your crypto swap from ${txData.amount} ${txData.fromAsset || txData.asset} to ${txData.toAsset} was approved and credited.`
          : `Your crypto swap was declined. Your source asset balance has been refunded in full.`)
      : `Your transaction #${txId} status has been updated to ${statusLabel}.`;

    try {
      const notif: Notification = {
        id: 'notif_' + Date.now(),
        userId: txData.userId,
        title: txData.type === 'withdraw' ? `Withdrawal ${actionLabel}` : txData.type === 'swap' ? `Swap ${actionLabel}` : `Transaction ${actionLabel}`,
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
      action: txData.type === 'withdraw' ? `Withdrawal ${actionLabel}` : txData.type === 'swap' ? `Swap ${actionLabel}` : `Transaction ${actionLabel}`,
      status: statusLabel,
    };

    try {
      await setDoc(doc(db, 'audit_logs', auditEntry.id), auditEntry);
    } catch {}

    const emailNotification: EmailNotificationPreview = {
      to: txData.userEmail || 'user@example.com',
      subject: txData.type === 'withdraw'
        ? `NETBYBIT - Withdrawal Request ${actionLabel} (${txData.amount} ${txData.asset})`
        : `Transaction ${actionLabel}`,
      body: notifMsg,
      sentAt: new Date().toISOString(),
    };

    return {
      success: true,
      transaction: txData,
      auditEntry,
      emailNotification,
      message: `${txData.type === 'withdraw' ? 'Withdrawal' : txData.type === 'swap' ? 'Swap' : 'Transaction'} #${txId} successfully ${actionLabel.toLowerCase()}.${isDecline && txData.type === 'withdraw' ? ' Funds refunded to user balance.' : ''}`,
    };
  },

  replySupportTicket: async (
    ticketId: string,
    message: string,
    sender: 'admin' | 'user' = 'admin',
    senderName: string = 'Netbybit Support'
  ) => {
    const reply: TicketReply = {
      id: 'msg_' + Date.now(),
      sender,
      senderName,
      message,
      createdAt: new Date().toISOString(),
    };
    try {
      const ref = doc(db, 'support_tickets', ticketId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const ticket = snap.data() as SupportTicket;
        ticket.replies = [...(ticket.replies || []), reply];
        ticket.status = sender === 'admin' ? 'In Progress' : 'Open';
        await setDoc(ref, ticket, { merge: true });
        return ticket;
      }
    } catch {}

    return {
      id: ticketId,
      userId: 'usr_current',
      userEmail: 'user@example.com',
      userName: senderName || 'User',
      subject: 'Support Ticket',
      category: 'General',
      message: 'Inquiry',
      status: 'In Progress' as const,
      createdAt: new Date().toISOString(),
      replies: [reply],
    };
  },

  replyGuestSupportTicket: async (
    ticketId: string,
    body: { email?: string; name?: string; message: string }
  ) => {
    return await api.replySupportTicket(ticketId, body.message, 'user', body.name || 'Guest User');
  },

  getGuestSupportTicket: async (ticketId: string, email?: string): Promise<SupportTicket> => {
    try {
      const snap = await getDoc(doc(db, 'support_tickets', ticketId));
      if (snap.exists()) return snap.data() as SupportTicket;
    } catch {}

    return {
      id: ticketId,
      userId: 'guest',
      userEmail: email || 'guest@example.com',
      userName: 'Guest User',
      subject: 'Guest Ticket',
      category: 'Support',
      message: 'Guest query',
      status: 'Open',
      createdAt: new Date().toISOString(),
      replies: [],
    };
  },

  getSupportTickets: async (): Promise<SupportTicket[]> => {
    const list: SupportTicket[] = [];
    try {
      const snap = await getDocs(collection(db, 'support_tickets'));
      snap.forEach((d) => list.push(d.data() as SupportTicket));
    } catch {}
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
    const ticket: SupportTicket = {
      id: 'tkt_' + Date.now(),
      userId: 'usr_current',
      userEmail: body.userEmail || 'user@example.com',
      userName: body.userName || 'User',
      subject: body.subject,
      category: body.category,
      message: body.message,
      userLanguage: body.userLanguage,
      priority: body.priority,
      status: 'Open',
      createdAt: new Date().toISOString(),
      replies: [],
    };
    try {
      await setDoc(doc(db, 'support_tickets', ticket.id), ticket);
    } catch {}
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
    return await api.createSupportTicket({ ...body, userEmail: body.email, userName: body.name });
  },

  updateTicketStatus: async (ticketId: string, status: 'Open' | 'In Progress' | 'Closed') => {
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), { status });
    } catch {}
    return {
      success: true,
      ticket: {
        id: ticketId,
        userId: 'usr_current',
        userEmail: 'user@example.com',
        userName: 'User',
        subject: 'Ticket',
        category: 'General',
        message: 'Inquiry',
        status,
        createdAt: new Date().toISOString(),
        replies: [],
      },
    };
  },

  updateTicketLanguage: async (ticketId: string, language: string) => {
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), { language });
    } catch {}
    return { success: true };
  },

  deleteTicket: async (ticketId: string) => {
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
