import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA, SupportedAsset, User, SupportTicket, TicketReply, DepositAddresses, AuditLogEntry, EmailNotificationPreview, Transaction, EmailLogRecord, SmsLogRecord, WalletRequest } from '../types';
import { CryptoIcon } from '../components/CryptoIcon';
import { SupportAvatar, isStaffSender, getInitials } from '../components/LiveSupportChatWidget';
import { api } from '../lib/api';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  ArrowLeft,
  Shield,
  Search,
  PlusCircle,
  MinusCircle,
  Mail,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  User as UserIcon,
  UserPlus,
  Wallet,
  MessageSquare,
  History,
  Send,
  Edit,
  Trash2,
  Lock,
  ArrowRight,
  Eye,
  RefreshCw,
  ArrowUpRight,
  Check,
  X,
  Clock,
  Copy,
  Globe,
  ExternalLink,
  Smartphone,
  Repeat,
  Link as LinkIcon,
} from 'lucide-react';

export const AdminPanelPage: React.FC = () => {
  const { user: currentUser, depositAddresses, refreshDepositAddresses, setActivePage, goBack } = useAuth();
  const [activeTab, setActiveTab] = useState<'asset_mgmt' | 'withdrawals' | 'swaps' | 'wallet_requests' | 'users' | 'deposit_addresses' | 'tickets' | 'audit_logs' | 'email_logs' | 'sms_logs'>('asset_mgmt');

  // --- Asset Management State ---
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Add / Adjust Asset Modal/Form State
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset | null>(null);
  const [adjustmentAction, setAdjustmentAction] = useState<'add' | 'deduct'>('add');
  const [addAmount, setAddAmount] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [crediting, setCrediting] = useState(false);
  const [creditResult, setCreditResult] = useState<{
    message: string;
    auditEntry: AuditLogEntry;
    emailNotification: EmailNotificationPreview;
  } | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);

  // --- Withdrawal Approvals State ---
  const [allTxs, setAllTxs] = useState<Transaction[]>([]);
  const [txsLoading, setTxsLoading] = useState(false);
  const [withdrawalFilter, setWithdrawalFilter] = useState<'pending' | 'completed' | 'failed' | 'all'>('pending');
  const [withdrawalModal, setWithdrawalModal] = useState<{
    message: string;
    auditEntry?: AuditLogEntry;
    emailNotification?: EmailNotificationPreview;
  } | null>(null);

  // --- Strict Action Confirmation Modal ---
  const [confirmActionModal, setConfirmActionModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'cancel';
    txType: 'withdrawal' | 'swap';
    tx: any;
    loading: boolean;
  } | null>(null);

  // --- Swap Approvals State ---
  const [firestoreSwaps, setFirestoreSwaps] = useState<any[]>([]);
  const [swapFilter, setSwapFilter] = useState<'pending' | 'completed' | 'failed' | 'all'>('pending');
  const [swapModal, setSwapModal] = useState<{
    message: string;
    auditEntry?: AuditLogEntry;
    emailNotification?: EmailNotificationPreview;
  } | null>(null);

  // --- Wallet Requests Approvals State ---
  const [walletRequests, setWalletRequests] = useState<WalletRequest[]>([]);
  const [walletFilter, setWalletFilter] = useState<'pending' | 'completed' | 'failed' | 'all'>('pending');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletModal, setWalletModal] = useState<{ message: string } | null>(null);

  // --- Users List State ---
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userDirectorySearchQuery, setUserDirectorySearchQuery] = useState('');
  const [viewingUserProfile, setViewingUserProfile] = useState<User | null>(null);

  // --- Admin Create User State ---
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    name: '',
    username: '',
    password: '',
    btcBalance: '0',
    ethBalance: '0',
    usdtBalance: '0',
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserSuccess, setCreateUserSuccess] = useState<string | null>(null);

  // --- Deposit Addresses State ---
  const [addressesForm, setAddressesForm] = useState<DepositAddresses>({
    BTC: '',
    ETH: '',
    BNB: '',
    TRX: '',
    USDT_ERC20: '',
    USDT_TRC20: '',
  });
  const [addressSaveSuccess, setAddressSaveSuccess] = useState<string | null>(null);

  // --- Support Tickets State ---
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketReplyText, setTicketReplyText] = useState<Record<string, string>>({});
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');

  // --- Audit Logs State ---
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // --- Dispatched Email Logs & Center State ---
  const [emailLogs, setEmailLogs] = useState<EmailLogRecord[]>([]);
  const [emailLogsLoading, setEmailLogsLoading] = useState(false);
  const [selectedEmailLog, setSelectedEmailLog] = useState<EmailLogRecord | null>(null);

  // Email Center Tab & Compose State
  const [emailSubTab, setEmailSubTab] = useState<'logs' | 'compose'>('logs');
  const [composeRecipientType, setComposeRecipientType] = useState<'single' | 'all'>('single');
  const [composeRecipientEmail, setComposeRecipientEmail] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeCategory, setComposeCategory] = useState('System Announcement');
  const [composeBody, setComposeBody] = useState('');
  const [composeActionText, setComposeActionText] = useState('');
  const [composeActionUrl, setComposeActionUrl] = useState('');
  const [composeHighlightBox, setComposeHighlightBox] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [composeResult, setComposeResult] = useState<string | null>(null);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composePreviewMode, setComposePreviewMode] = useState(false);

  // Email Filters & Diagnostics
  const [emailLogSearch, setEmailLogSearch] = useState('');
  const [emailLogFilterStatus, setEmailLogFilterStatus] = useState<'all' | 'Delivered' | 'Sent' | 'Failed' | 'Admin Alerts'>('all');
  const [retryingEmailId, setRetryingEmailId] = useState<string | null>(null);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<string | null>(null);
  const [emailModalTab, setEmailModalTab] = useState<'html' | 'text' | 'meta'>('html');

  // --- Dispatched SMS Gateway State ---
  const [smsLogs, setSmsLogs] = useState<SmsLogRecord[]>([]);
  const [smsLogsLoading, setSmsLogsLoading] = useState(false);
  const [testSmsRecipient, setTestSmsRecipient] = useState('');
  const [testSmsMessage, setTestSmsMessage] = useState('');
  const [testSmsCategory, setTestSmsCategory] = useState('SMS Gateway Test');
  const [testSmsSending, setTestSmsSending] = useState(false);
  const [testSmsResult, setTestSmsResult] = useState<string | null>(null);
  const [testSmsError, setTestSmsError] = useState<string | null>(null);

  // --- Admin Link Share State ---
  const [copiedLink, setCopiedLink] = useState(false);
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-lfnzq2n7xsdhptwa5uwjsr-188900242033.europe-west2.run.app';

  const handleCopyWebsiteLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(siteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadAllUsers();
      loadTickets();
      loadAuditLogs();
      loadEmailLogs();
      loadSmsLogs();
      loadAdminTransactions();
      setAddressesForm(depositAddresses);

      // Real-Time Firestore Listener for Swaps Collection
      const pathForSwaps = 'swaps';
      const unsubscribeSwaps = onSnapshot(
        collection(db, pathForSwaps),
        (snapshot) => {
          const docs: any[] = [];
          snapshot.forEach((docSnap) => {
            docs.push({ id: docSnap.id, ...docSnap.data() });
          });
          docs.sort((a, b) => new Date(b.timestamp || b.date || 0).getTime() - new Date(a.timestamp || a.date || 0).getTime());
          setFirestoreSwaps(docs);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, pathForSwaps);
        }
      );

      // Real-Time Firestore Listener for Transactions & Withdrawals Collection
      const pathForTxs = 'transactions';
      const unsubscribeTxs = onSnapshot(
        collection(db, pathForTxs),
        (snapshot) => {
          const docsMap = new Map<string, Transaction>();
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Transaction;
            if (data) {
              const txId = docSnap.id || data.id;
              docsMap.set(txId, { ...data, id: txId });
            }
          });

          // Also merge with any cached local transactions
          const localStr = localStorage.getItem('netbybit_user_transactions');
          if (localStr) {
            try {
              const localTxs = JSON.parse(localStr) as Transaction[];
              localTxs.forEach((ltx) => {
                if (ltx && ltx.id && !docsMap.has(ltx.id)) docsMap.set(ltx.id, ltx);
              });
            } catch {}
          }
          const sortedList = Array.from(docsMap.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setAllTxs(sortedList);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, pathForTxs);
        }
      );

      // Real-Time Firestore Listener for Withdrawals Collection
      const pathForWithdrawals = 'withdrawals';
      const unsubscribeWithdrawals = onSnapshot(
        collection(db, pathForWithdrawals),
        (snapshot) => {
          setAllTxs((prev) => {
            const docsMap = new Map<string, Transaction>();
            prev.forEach((t) => docsMap.set(t.id, t));
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Transaction;
              if (data) {
                const txId = docSnap.id || data.id;
                const existing = docsMap.get(txId);
                docsMap.set(txId, {
                  ...(existing || {}),
                  ...data,
                  id: txId,
                  type: data.type || 'withdraw',
                });
              }
            });
            return Array.from(docsMap.values()).sort(
              (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
            );
          });
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, pathForWithdrawals);
        }
      );

      // Real-Time Firestore Listener for Wallet Requests Collection
      const pathForWallets = 'wallet_requests';
      const unsubscribeWallets = onSnapshot(
        collection(db, pathForWallets),
        (snapshot) => {
          const docsMap = new Map<string, WalletRequest>();
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as WalletRequest;
            if (data && data.id) {
              docsMap.set(data.id, { ...data, id: docSnap.id });
            }
          });
          const localStr = localStorage.getItem('netbybit_wallet_requests');
          if (localStr) {
            try {
              const localList = JSON.parse(localStr) as WalletRequest[];
              localList.forEach((item) => {
                if (!docsMap.has(item.id)) docsMap.set(item.id, item);
              });
            } catch {}
          }
          const sortedList = Array.from(docsMap.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setWalletRequests(sortedList);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, pathForWallets);
        }
      );

      // Real-Time Firestore Listener for Support Tickets Collection
      const pathForTickets = 'support_tickets';
      const unsubscribeTickets = onSnapshot(
        collection(db, pathForTickets),
        (snapshot) => {
          const docsMap = new Map<string, SupportTicket>();
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as SupportTicket;
            if (data) {
              const tId = docSnap.id || data.id;
              docsMap.set(tId, { ...data, id: tId });
            }
          });
          const sortedList = Array.from(docsMap.values()).sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setTickets(sortedList);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, pathForTickets);
        }
      );

      const interval = setInterval(() => {
        loadAdminTransactions();
        loadWalletRequests();
        loadTickets();
      }, 5000);

      return () => {
        unsubscribeSwaps();
        unsubscribeTxs();
        unsubscribeWithdrawals();
        unsubscribeWallets();
        unsubscribeTickets();
        clearInterval(interval);
      };
    }
  }, [currentUser, depositAddresses]);

  const loadSmsLogs = async () => {
    setSmsLogsLoading(true);
    try {
      const logs = await api.getSmsLogs();
      setSmsLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setSmsLogsLoading(false);
    }
  };

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestSmsResult(null);
    setTestSmsError(null);

    if (!testSmsMessage.trim()) {
      setTestSmsError('Please enter an SMS message body.');
      return;
    }

    setTestSmsSending(true);
    try {
      const res = await api.sendTestSms({
        recipient: testSmsRecipient.trim() || undefined,
        message: testSmsMessage.trim(),
        category: testSmsCategory,
      });
      setTestSmsResult(`SMS Dispatched Successfully! Status: ${(res as any)?.message || 'Sent'}`);
      setTestSmsMessage('');
      await loadSmsLogs();
    } catch (err: any) {
      setTestSmsError(err.message || 'Failed to dispatch test SMS message.');
    } finally {
      setTestSmsSending(false);
    }
  };

  const loadEmailLogs = async () => {
    setEmailLogsLoading(true);
    try {
      const logs = await api.getEmailLogs();
      setEmailLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setEmailLogsLoading(false);
    }
  };

  // Dispatch custom or broadcast email
  const handleSendCustomEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposeResult(null);
    setComposeError(null);

    if (composeRecipientType === 'single' && !composeRecipientEmail.trim()) {
      setComposeError('Please select or type a recipient email address.');
      return;
    }
    if (!composeSubject.trim()) {
      setComposeError('Please enter an email subject line.');
      return;
    }
    if (!composeBody.trim()) {
      setComposeError('Please enter the email message body.');
      return;
    }

    setComposeSending(true);
    try {
      const res = await api.sendCustomEmail({
        recipients: composeRecipientType === 'all' ? 'all' : [composeRecipientEmail.trim()],
        subject: composeSubject.trim(),
        category: composeCategory,
        body: composeBody.trim(),
        actionText: composeActionText.trim() || undefined,
        actionUrl: composeActionUrl.trim() || undefined,
        highlightBox: composeHighlightBox.trim() || undefined,
      });

      setComposeResult(res.message);
      await loadEmailLogs();
      setTimeout(() => {
        setEmailSubTab('logs');
      }, 1500);
    } catch (err: any) {
      setComposeError(err.message || 'Failed to dispatch email.');
    } finally {
      setComposeSending(false);
    }
  };

  // Re-attempt delivery for a log entry
  const handleRetryEmailLog = async (emailId: string) => {
    setRetryingEmailId(emailId);
    try {
      const res = await api.retryEmailLog(emailId);
      alert(res.message);
      await loadEmailLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to re-send email.');
    } finally {
      setRetryingEmailId(null);
    }
  };

  // Delete log entry
  const handleDeleteEmailLog = async (emailId: string) => {
    if (!confirm('Are you sure you want to delete this email log entry?')) return;
    try {
      await api.deleteEmailLog(emailId);
      await loadEmailLogs();
      if (selectedEmailLog?.id === emailId) {
        setSelectedEmailLog(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete email log.');
    }
  };

  // Run SMTP Diagnostic test
  const handleTestSmtp = async () => {
    setSmtpTesting(true);
    setSmtpTestResult(null);
    try {
      const res = await api.testSmtpConnection();
      setSmtpTestResult(res.message);
      await loadEmailLogs();
    } catch (err: any) {
      setSmtpTestResult(`Error: ${err.message || 'SMTP connection test failed'}`);
    } finally {
      setSmtpTesting(false);
    }
  };

  // Apply quick email template preset
  const applyPresetTemplate = (presetKey: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://netbybit.com';
    if (presetKey === 'welcome') {
      setComposeSubject('Welcome to NETBYBIT - Account Verification Code');
      setComposeCategory('Registration & Verification');
      setComposeBody(`Welcome to NETBYBIT Digital Asset Management Platform!\n\nYour account registration is complete. Please verify your email address to unlock full deposit, trading, and withdrawal privileges on our platform.\n\nThank you for choosing NETBYBIT as your institutional crypto partner.`);
      setComposeHighlightBox(Math.floor(100000 + Math.random() * 900000).toString());
      setComposeActionText('Verify Account Now');
      setComposeActionUrl(`${origin}/login`);
    } else if (presetKey === 'deposit') {
      setComposeSubject('NETBYBIT - Deposit Received and Confirmed');
      setComposeCategory('Deposit Update');
      setComposeBody(`We are pleased to inform you that your cryptocurrency deposit has been successfully confirmed on the network and credited to your wallet balance.\n\nAsset: USDT (TRC-20)\nAmount: 5,000.00 USDT\nStatus: Confirmed\n\nYour funds are available for immediate trading, staking, or withdrawal.`);
      setComposeHighlightBox('DEP-TX-' + Math.floor(100000 + Math.random() * 900000));
      setComposeActionText('View Wallet Balances');
      setComposeActionUrl(`${origin}/wallet`);
    } else if (presetKey === 'withdrawal') {
      setComposeSubject('NETBYBIT - Withdrawal Request Status Update');
      setComposeCategory('Withdrawal Approval');
      setComposeBody(`Your withdrawal request has been approved and processed on the mainnet.\n\nAsset: BTC\nAmount: 0.50 BTC\nStatus: Completed\nDestination: 1Fy9Up78qVeawXCLnAqcnRJrvjiXLJF21d\n\nTransaction ID / Hash has been assigned.`);
      setComposeHighlightBox('0x' + Math.random().toString(16).substring(2, 14));
      setComposeActionText('View Transaction Log');
      setComposeActionUrl(`${origin}/transactions`);
    } else if (presetKey === 'security') {
      setComposeSubject('NETBYBIT Security Alert - Password Changed Successfully');
      setComposeCategory('Security Alert');
      setComposeBody(`Your NETBYBIT account password was updated successfully.\n\nDate: ${new Date().toLocaleString()}\nSender: help.netbybit@hotmail.com\n\nIf you did not make this change, please contact customer support immediately at help.netbybit@hotmail.com.`);
      setComposeActionText('Security Settings');
      setComposeActionUrl(`${origin}/settings`);
    } else if (presetKey === 'announcement') {
      setComposeSubject('NETBYBIT Platform Infrastructure Upgrade Notice');
      setComposeCategory('System Announcement');
      setComposeBody(`Dear NETBYBIT User,\n\nWe have successfully upgraded our underlying institutional matching engine to deliver higher liquidity execution speed and zero-latency balance settlement.\n\nAll deposit, withdrawal, and exchange channels are operating normally.`);
      setComposeActionText('Explore Dashboard');
      setComposeActionUrl(`${origin}`);
    }
  };

  const loadAdminTransactions = async () => {
    setTxsLoading(true);
    try {
      const data = await api.getAdminTransactions();
      setAllTxs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTxsLoading(false);
    }
  };

  const openConfirmModal = (tx: any, type: 'approve' | 'cancel', txType: 'withdrawal' | 'swap') => {
    setConfirmActionModal({
      isOpen: true,
      type,
      txType,
      tx,
      loading: false,
    });
  };

  const executeConfirmedStatusChange = async () => {
    if (!confirmActionModal || !confirmActionModal.tx) return;
    const { tx, type, txType } = confirmActionModal;
    const canonicalStatus = type === 'approve' ? 'completed' : 'cancelled';

    setConfirmActionModal((prev) => (prev ? { ...prev, loading: true } : null));

    try {
      if (txType === 'withdrawal') {
        await handleWithdrawalStatus(tx.id, canonicalStatus);
      } else {
        await handleSwapStatus(tx.id, canonicalStatus);
      }
      setConfirmActionModal(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update transaction status');
      setConfirmActionModal((prev) => (prev ? { ...prev, loading: false } : null));
    }
  };

  const handleWithdrawalStatus = async (txId: string, status: 'completed' | 'failed' | 'cancelled') => {
    try {
      const canonicalStatus = status === 'completed' ? 'completed' : 'cancelled';

      // 1. Instantly update Firestore documents
      try {
        await updateDoc(doc(db, 'transactions', txId), {
          status: canonicalStatus,
          isRefunded: canonicalStatus === 'cancelled',
          updatedAt: new Date().toISOString(),
        });
      } catch {
        await setDoc(doc(db, 'transactions', txId), {
          status: canonicalStatus,
          isRefunded: canonicalStatus === 'cancelled',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      try {
        await updateDoc(doc(db, 'withdrawals', txId), {
          status: canonicalStatus,
          isRefunded: canonicalStatus === 'cancelled',
          updatedAt: new Date().toISOString(),
        });
      } catch {
        await setDoc(doc(db, 'withdrawals', txId), {
          status: canonicalStatus,
          isRefunded: canonicalStatus === 'cancelled',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      // 2. Optimistic UI update in place
      setAllTxs((prev) =>
        prev.map((t) =>
          t.id === txId
            ? { ...t, status: canonicalStatus, isRefunded: canonicalStatus === 'cancelled' }
            : t
        )
      );

      const res = await api.updateTransactionStatus(txId, canonicalStatus);
      setWithdrawalModal({
        message: res.message || `Withdrawal request successfully ${canonicalStatus === 'completed' ? 'approved' : 'cancelled & refunded'}`,
        auditEntry: (res as any).auditEntry,
        emailNotification: (res as any).emailNotification,
      });
      await loadAdminTransactions();
      await loadAuditLogs();
      await loadAllUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update withdrawal status');
      throw err;
    }
  };

  // Merge API transactions with real-time Firestore swap collection documents
  const combinedSwaps = useMemo(() => {
    const map = new Map<string, any>();

    // First populate from server transaction API records
    allTxs.filter((t) => t.type === 'swap').forEach((tx) => {
      map.set(tx.id, {
        id: tx.id,
        userId: tx.userId,
        userEmail: tx.userEmail || tx.userId,
        fromAsset: tx.fromAsset || tx.asset,
        toAsset: tx.toAsset || 'USDT_TRC20',
        amount: tx.amount,
        usdtEquivalent: tx.usdtEquivalent || tx.amount,
        status: tx.status,
        date: tx.date,
        type: 'swap',
        isRefunded: tx.isRefunded,
      });
    });

    // Merge or override with real-time Firestore swap docs
    firestoreSwaps.forEach((fsSwap) => {
      if (fsSwap.id) {
        const existing = map.get(fsSwap.id) || {};
        map.set(fsSwap.id, {
          ...existing,
          ...fsSwap,
          id: fsSwap.id,
          userEmail: fsSwap.userEmail || existing.userEmail || fsSwap.userId || 'User',
          fromAsset: fsSwap.fromAsset || existing.fromAsset || 'BTC',
          toAsset: fsSwap.toAsset || existing.toAsset || 'USDT',
          amount: fsSwap.amount ?? existing.amount ?? 0,
          usdtEquivalent: fsSwap.usdtEquivalent ?? existing.usdtEquivalent ?? 0,
          status: fsSwap.status || existing.status || 'pending',
          date: fsSwap.timestamp || fsSwap.date || existing.date || new Date().toISOString(),
          isRefunded: fsSwap.isRefunded ?? existing.isRefunded,
        });
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => new Date(b.date || b.timestamp || 0).getTime() - new Date(a.date || a.timestamp || 0).getTime());
    return list;
  }, [allTxs, firestoreSwaps]);

  const handleSwapStatus = async (txId: string, status: 'completed' | 'failed' | 'cancelled') => {
    try {
      const canonicalStatus = status === 'completed' ? 'completed' : 'cancelled';

      // Instantly update Firestore document status in Firebase
      try {
        await updateDoc(doc(db, 'swaps', txId), {
          status: canonicalStatus,
          isRefunded: canonicalStatus === 'cancelled',
          updatedAt: new Date().toISOString(),
        });
      } catch (fsErr) {
        await setDoc(doc(db, 'swaps', txId), {
          status: canonicalStatus,
          isRefunded: canonicalStatus === 'cancelled',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      // Optimistic in place update
      setAllTxs((prev) =>
        prev.map((t) =>
          t.id === txId
            ? { ...t, status: canonicalStatus, isRefunded: canonicalStatus === 'cancelled' }
            : t
        )
      );

      const res = await api.updateTransactionStatus(txId, canonicalStatus);
      setSwapModal({
        message: res.message || `Swap request successfully ${canonicalStatus === 'completed' ? 'approved' : 'cancelled & refunded'}`,
        auditEntry: (res as any).auditEntry,
        emailNotification: (res as any).emailNotification,
      });
      await loadAdminTransactions();
      await loadAuditLogs();
      await loadAllUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update swap status');
      throw err;
    }
  };

  const loadWalletRequests = async () => {
    setWalletLoading(true);
    try {
      const data = await api.getAdminWalletRequests();
      setWalletRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleWalletStatus = async (reqId: string, status: 'completed' | 'failed') => {
    try {
      const res = await api.updateWalletRequestStatus(reqId, status);
      setWalletModal({ message: res.message });
      await loadWalletRequests();
      await loadAllUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update wallet request');
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center border border-red-500/30">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-neutral-100">Access Restricted</h2>
        <p className="text-xs text-neutral-400">
          Only authorized platform administrators have access to this management console.
        </p>
        <div className="flex justify-center space-x-3 pt-2">
          <button
            type="button"
            onClick={() => setActivePage('admin-login')}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            Admin Sign In
          </button>
          <button
            type="button"
            onClick={() => setActivePage('home')}
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl border border-neutral-700 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const loadAllUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await api.getAdminUsers();
      setAllUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      const data = await api.getAdminTickets();
      setTickets(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  // 1. Search User by Email
  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFoundUser(null);
    setSearchError(null);
    setSelectedAsset(null);
    setCreditResult(null);
    setCreditError(null);

    const query = searchEmail.trim().toLowerCase();

    if (!query) {
      setSearchError('Please enter a user email address');
      return;
    }

    try {
      // First get fresh complete users list and server search results
      const [users, searchResults] = await Promise.all([
        api.getAdminUsers().catch(() => []),
        api.searchAdminUsers(query).catch(() => []),
      ]);

      const mergedList = [...searchResults];
      users.forEach((u) => {
        if (!mergedList.some((m) => m.id === u.id || m.email.toLowerCase() === u.email.toLowerCase())) {
          mergedList.push(u);
        }
      });
      setAllUsers(mergedList);

      let match = mergedList.find(
        (u) => u.email.toLowerCase() === query || (u.id && u.id.toLowerCase() === query)
      );

      if (!match) {
        match = mergedList.find(
          (u) =>
            u.email.toLowerCase().includes(query) ||
            (u.id && u.id.toLowerCase().includes(query)) ||
            (u.name && u.name.toLowerCase().includes(query)) ||
            (u.username && u.username.toLowerCase().includes(query))
        );
      }

      if (match) {
        setFoundUser(match);
      } else {
        setSearchError(`No registered user account found matching "${searchEmail.trim()}"`);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error searching user account');
    }
  };

  // Submit Admin Create User Account
  const handleAdminCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError(null);
    setCreateUserSuccess(null);

    if (!newUserForm.email.trim() || !newUserForm.name.trim()) {
      setCreateUserError('User Email Address and Full Name are required.');
      return;
    }

    setCreateUserLoading(true);

    try {
      const btc = parseFloat(newUserForm.btcBalance) || 0;
      const eth = parseFloat(newUserForm.ethBalance) || 0;
      const usdt = parseFloat(newUserForm.usdtBalance) || 0;

      const res = await api.adminCreateUser({
        email: newUserForm.email.trim(),
        name: newUserForm.name.trim(),
        username: newUserForm.username.trim(),
        password: newUserForm.password.trim() || 'Netbybit2026!',
        role: 'user',
        balances: {
          BTC: btc,
          ETH: eth,
          USDT_ERC20: usdt,
          USDT_TRC20: usdt,
        },
      });

      setCreateUserSuccess(`User account "${res.user.email}" created and permanently saved.`);
      await loadAllUsers();

      // Automatically load newly created user
      setSearchEmail(res.user.email);
      setFoundUser(res.user);
      setSearchError(null);

      // Reset form
      setNewUserForm({
        email: '',
        name: '',
        username: '',
        password: '',
        btcBalance: '0',
        ethBalance: '0',
        usdtBalance: '0',
      });

      setTimeout(() => {
        setShowCreateUserModal(false);
        setCreateUserSuccess(null);
      }, 1200);
    } catch (err: any) {
      setCreateUserError(err.message || 'Failed to create user account');
    } finally {
      setCreateUserLoading(false);
    }
  };

  // Select asset to adjust balance (add or deduct)
  const handleOpenAddAssetForm = (assetId: SupportedAsset, action: 'add' | 'deduct' = 'add') => {
    setSelectedAsset(assetId);
    setAdjustmentAction(action);
    setAddAmount('');
    setAdjustmentReason('');
    setCreditResult(null);
    setCreditError(null);
  };

  // Submit Balance Adjustment form (Add or Deduct)
  const handleCreditAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundUser || !selectedAsset) return;

    const parsed = parseFloat(addAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setCreditError('Please enter a valid positive amount (e.g., 10, 0.5, 100)');
      return;
    }

    if (adjustmentAction === 'deduct') {
      const currentBal = foundUser.balances[selectedAsset] || 0;
      if (currentBal < parsed) {
        setCreditError(`Cannot deduct ${parsed} ${selectedAsset}. User currently has only ${currentBal} ${selectedAsset}.`);
        return;
      }
    }

    setCrediting(true);
    setCreditError(null);

    try {
      const res = await api.adjustUserBalance({
        email: foundUser.email,
        asset: selectedAsset,
        action: adjustmentAction,
        amount: parsed,
        reason: adjustmentReason,
      });

      // Update foundUser state with updated user balance
      setFoundUser(res.user);
      setCreditResult({
        message: res.message,
        auditEntry: res.auditEntry,
        emailNotification: res.emailNotification,
      });

      // Reload all users, email logs & audit logs
      loadAllUsers();
      loadAuditLogs();
      loadEmailLogs();
    } catch (err: any) {
      setCreditError(err.message || 'Failed to adjust user balance');
    } finally {
      setCrediting(false);
    }
  };

  // Update Deposit Addresses
  const handleSaveAddresses = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateDepositAddresses(addressesForm);
      await refreshDepositAddresses();
      setAddressSaveSuccess('Deposit addresses updated successfully across all networks!');
      setTimeout(() => setAddressSaveSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update deposit addresses');
    }
  };

  // Admin reply support ticket
  const handleReplyTicket = async (ticketId: string) => {
    const text = ticketReplyText[ticketId];
    if (!text || !text.trim()) return;

    const trimmed = text.trim();
    setTicketReplyText((prev) => ({ ...prev, [ticketId]: '' }));

    // Instant optimistic reply update
    const optimisticReply: TicketReply = {
      id: 'rpl_admin_' + Date.now(),
      sender: 'admin',
      senderName: 'Netbybit Support',
      message: trimmed,
      createdAt: new Date().toISOString(),
      status: 'Delivered',
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'In Progress',
              replies: [...(t.replies || []), optimisticReply],
            }
          : t
      )
    );

    try {
      const updated = await api.replySupportTicket(ticketId, trimmed, 'admin', 'Netbybit Support');
      if (updated) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
      await loadTickets();
    }
  };

  // Admin toggle ticket status
  const handleTicketStatus = async (ticketId: string, status: 'Open' | 'In Progress' | 'Closed') => {
    try {
      await api.updateTicketStatus(ticketId, status);
      await loadTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Admin delete ticket
  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await api.deleteTicket(ticketId);
      await loadTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to delete ticket');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => goBack('dashboard')}
          className="group inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 text-xs font-semibold transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 text-amber-400" />
          <span>Back to Dashboard</span>
        </button>

        <div className="text-[11px] font-mono text-neutral-500">
          NETBYBIT <span className="text-amber-400 font-bold">/ MASTER ADMIN PORTAL</span>
        </div>
      </div>

      {/* Admin Title Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-extrabold text-neutral-100">Administrator Console</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Manage user balances, credit assets, inspect audit logs, edit deposit addresses, and resolve tickets.
          </p>
        </div>

        {/* Public Website Share Link Widget - Visible ONLY in Admin Panel */}
        <div className="bg-neutral-950 border border-amber-500/40 rounded-xl p-3 shadow-xl flex flex-col space-y-2 shrink-0 lg:max-w-md w-full sm:w-auto">
          <div className="flex items-center justify-between space-x-2">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Public Website Share Link</span>
            </span>
            <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
              ADMIN PANEL EXCLUSIVE
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1.5">
            <span className="text-xs font-mono text-neutral-200 truncate flex-1 px-1">
              {siteUrl}
            </span>
            <button
              onClick={handleCopyWebsiteLink}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center space-x-1 shrink-0 ${
                copiedLink
                  ? 'bg-emerald-500 text-neutral-950 shadow'
                  : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-neutral-400 hover:text-amber-400 transition-colors"
              title="Open website in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="text-[10px] text-neutral-400 italic">
            Note: This public web address is visible exclusively to administrators inside the Admin Panel.
          </p>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex space-x-2 border-b border-neutral-800 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('asset_mgmt')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'asset_mgmt'
              ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500/30'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Asset Management (Add / Deduct Balance)</span>
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'withdrawals'
              ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500/30'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Withdrawal Approvals</span>
          {allTxs.filter((t) => (t.type === 'withdraw' || t.type === 'send') && t.status === 'pending').length > 0 && (
            <span className="bg-amber-400 text-neutral-950 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold animate-pulse">
              {allTxs.filter((t) => (t.type === 'withdraw' || t.type === 'send') && t.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('swaps')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'swaps'
              ? 'bg-purple-500 text-neutral-950 shadow-lg shadow-purple-500/20'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-purple-500/30'
          }`}
        >
          <Repeat className="w-4 h-4 text-purple-400" />
          <span>Swap Approvals</span>
          {combinedSwaps.filter((t) => t.status === 'pending').length > 0 && (
            <span className="bg-purple-400 text-neutral-950 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold animate-pulse">
              {combinedSwaps.filter((t) => t.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('wallet_requests')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'wallet_requests'
              ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500/30'
          }`}
        >
          <LinkIcon className="w-4 h-4 text-amber-400" />
          <span>Wallet Requests</span>
          {walletRequests.filter((w) => w.status === 'pending').length > 0 && (
            <span className="bg-amber-400 text-neutral-950 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold animate-pulse">
              {walletRequests.filter((w) => w.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'users'
              ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500/30'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('deposit_addresses')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'deposit_addresses'
              ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500/30'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Deposit Wallet Addresses</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'tickets'
              ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500/30'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Support Tickets ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'audit_logs'
              ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500/30'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('email_logs')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'email_logs'
              ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500/30'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email Logs ({emailLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sms_logs')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'sms_logs'
              ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500/30'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>SMS Gateway ({smsLogs.length})</span>
        </button>
      </div>

      {/* --- TAB 1: ADMIN ASSET MANAGEMENT (ADD / DEDUCT BALANCE) --- */}
      {activeTab === 'asset_mgmt' && (
        <div className="space-y-6">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-start space-x-3">
            <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-amber-200">Administrator Balance Management Rules</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-neutral-300 text-[11px]">
                <li>Administrators can both <strong>ADD (+)</strong> and <strong>DEDUCT (-)</strong> cryptocurrency balances for any user.</li>
                <li>All supported assets are accessible: BTC, ETH, USDT (ERC-20), USDT (TRC-20), BNB, and TRX.</li>
                <li>Every adjustment requires or accepts an optional reason/note and updates the user's dashboard immediately.</li>
                <li>An automated email notification is dispatched to the user showing the affected asset, amount added/deducted, updated balance, date, and time.</li>
                <li>Every adjustment is logged permanently in the immutable audit trail.</li>
              </ul>
            </div>
          </div>

          {/* Step 1: Search User Form */}
          <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
                <Search className="w-4 h-4 text-amber-400" />
                <span>1. Search User Account by Registered Email</span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  setNewUserForm({ email: searchEmail.trim(), name: '', username: '', password: '', btcBalance: '0', ethBalance: '0', usdtBalance: '0' });
                  setShowCreateUserModal(true);
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold rounded-lg text-xs flex items-center space-x-1.5 transition-colors shadow-md shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Create New User</span>
              </button>
            </div>

            <form onSubmit={handleSearchUser} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Enter user registered email address (e.g. user@netbybit.web.app)"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all shrink-0 flex items-center justify-center space-x-1.5"
              >
                <Search className="w-4 h-4" />
                <span>Search Account</span>
              </button>
            </form>

            {searchError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs space-y-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span className="font-semibold">{searchError}</span>
                </div>
                <div className="pt-2 border-t border-red-500/20 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-neutral-400">
                    Account not found? You can create this user account directly in the permanent database now:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewUserForm((prev) => ({ ...prev, email: searchEmail.trim() }));
                      setShowCreateUserModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold rounded-lg text-[11px] flex items-center space-x-1.5 transition-colors shadow-md"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create &amp; Save Account for &quot;{searchEmail.trim() || 'User'}&quot;</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Display User Profile & Asset Options */}
          {foundUser && (
            <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    <h2 className="text-lg font-bold text-neutral-100">User Account Found</h2>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Name: <strong className="text-neutral-200">{foundUser.name}</strong> • Email:{' '}
                    <strong className="text-amber-400 font-mono">{foundUser.email}</strong> • ID:{' '}
                    <span className="font-mono text-neutral-400">{foundUser.id}</span>
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 uppercase">
                  Account Status: {foundUser.status}
                </span>
              </div>

              {/* Asset Options Grid */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  2. Select Asset & Action (Add or Deduct):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.values(ASSET_METADATA).map((asset) => {
                    const currentBal = foundUser.balances[asset.id] || 0;
                    const isSelected = selectedAsset === asset.id;
                    return (
                      <div
                        key={asset.id}
                        className={`p-4 rounded-xl border transition-all space-y-3 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/50 shadow-xl'
                            : 'bg-neutral-950 border-neutral-800 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <CryptoIcon asset={asset.id} size="sm" />
                            <div>
                              <span className="font-bold text-sm text-neutral-100 block">{asset.name}</span>
                              <span className="text-[10px] text-neutral-500 font-mono">{asset.network}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {asset.symbol}
                          </span>
                        </div>
                        <div className="text-xs bg-neutral-900 p-2.5 rounded-lg border border-neutral-800/80">
                          <span className="text-neutral-500 block text-[10px]">Current User Balance:</span>
                          <span className="font-bold font-mono text-amber-300 text-sm">
                            {currentBal.toFixed(4)} {asset.symbol}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAddAssetForm(asset.id, 'add')}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all ${
                              isSelected && adjustmentAction === 'add'
                                ? 'bg-emerald-500 text-neutral-950 shadow-md'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                            }`}
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>+ Add</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAddAssetForm(asset.id, 'deduct')}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all ${
                              isSelected && adjustmentAction === 'deduct'
                                ? 'bg-red-500 text-white shadow-md'
                                : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300'
                            }`}
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                            <span>- Deduct</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3 & 4: Balance Adjustment Form Box */}
              {selectedAsset && (
                <div className="p-6 bg-neutral-950 border-2 border-amber-500/50 rounded-2xl space-y-5 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-neutral-800 pb-3 gap-2">
                    <div className="flex items-center space-x-2">
                      {adjustmentAction === 'add' ? (
                        <PlusCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <MinusCircle className="w-5 h-5 text-red-400" />
                      )}
                      <h3 className="text-sm font-bold text-neutral-100">
                        {adjustmentAction === 'add' ? 'Add Balance to' : 'Deduct Balance from'}{' '}
                        <span className="text-amber-400">{ASSET_METADATA[selectedAsset].name}</span> ({selectedAsset})
                      </h3>
                    </div>
                    <span className="text-xs text-neutral-400 font-mono">
                      Target User: <strong className="text-amber-300">{foundUser.email}</strong>
                    </span>
                  </div>

                  {/* Mode Selector Toggle Tabs */}
                  <div className="flex space-x-3 bg-neutral-900 p-1.5 rounded-xl border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setAdjustmentAction('add')}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                        adjustmentAction === 'add'
                          ? 'bg-emerald-500 text-neutral-950 shadow-md'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add (+) Balance</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustmentAction('deduct')}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                        adjustmentAction === 'deduct'
                          ? 'bg-red-500 text-white shadow-md'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <MinusCircle className="w-4 h-4" />
                      <span>Deduct (-) Balance</span>
                    </button>
                  </div>

                  {creditError && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{creditError}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreditAssetSubmit} className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-medium text-neutral-300">
                          {adjustmentAction === 'add' ? 'Amount to Add (+)' : 'Amount to Deduct (-)'}
                        </label>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          Available User Balance: {(foundUser.balances[selectedAsset] || 0).toFixed(4)}{' '}
                          {ASSET_METADATA[selectedAsset].symbol}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          required
                          value={addAmount}
                          onChange={(e) => setAddAmount(e.target.value)}
                          placeholder={adjustmentAction === 'add' ? 'e.g. 50' : 'e.g. 10'}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-amber-400 font-bold font-mono">
                          {ASSET_METADATA[selectedAsset].symbol}
                        </span>
                      </div>
                    </div>

                    {/* Quick Amount Presets */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-neutral-400">Quick Presets:</span>
                      {adjustmentAction === 'add' ? (
                        [10, 20, 50, 100, 500, 1000].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setAddAmount(val.toString())}
                            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-xs font-mono text-emerald-400"
                          >
                            +{val}
                          </button>
                        ))
                      ) : (
                        <>
                          {[10, 20, 50, 100, 500].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setAddAmount(val.toString())}
                              className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-xs font-mono text-red-400"
                            >
                              -{val}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setAddAmount((foundUser.balances[selectedAsset] || 0).toString())}
                            className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-xs font-mono text-red-300 font-bold"
                          >
                            Deduct Entire Balance ({(foundUser.balances[selectedAsset] || 0).toFixed(4)})
                          </button>
                        </>
                      )}
                    </div>

                    {/* Reason / Note Field */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Adjustment Reason or Note (Optional - Included in Email & Audit Trail)
                      </label>
                      <input
                        type="text"
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        placeholder="e.g. Deposit verification, Fee adjustment, Promotional bonus, Manual correction"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={crediting}
                      className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 ${
                        adjustmentAction === 'add'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/20'
                          : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-400 hover:to-rose-500 shadow-red-500/20'
                      }`}
                    >
                      <span>
                        {crediting
                          ? 'Saving Balance Adjustment & Sending Email...'
                          : adjustmentAction === 'add'
                          ? 'Save & Credit Balance (+)'
                          : 'Save & Deduct Balance (-)'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Successful Adjustment & Dispatched Email Preview Box */}
                  {creditResult && (
                    <div className="pt-4 border-t border-neutral-800 space-y-4 animate-fadeIn">
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <div>
                          <p className="font-bold">{creditResult.message}</p>
                          <p className="text-[11px] text-emerald-300/80 mt-0.5">
                            User dashboard balance updated immediately. Immutable audit log recorded and notification email sent.
                          </p>
                        </div>
                      </div>

                      {/* Dispatched Email Notification Preview */}
                      <div className="p-4 bg-neutral-900 border border-amber-500/30 rounded-xl space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-amber-400 flex items-center space-x-1.5">
                            <Mail className="w-4 h-4" />
                            <span>Dispatched Notification Email Preview</span>
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Recipient: {creditResult.emailNotification.to}
                          </span>
                        </div>

                        <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-xs text-neutral-300 space-y-2 font-mono">
                          <p className="text-amber-300 font-bold">
                            Subject: {creditResult.emailNotification.subject}
                          </p>
                          <pre className="whitespace-pre-wrap font-sans text-neutral-200 text-xs leading-relaxed">
                            {creditResult.emailNotification.body}
                          </pre>
                        </div>
                      </div>

                      {/* Audit Log Recorded Entry Preview */}
                      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1 text-xs font-mono text-neutral-400">
                        <div className="flex justify-between text-neutral-300">
                          <span className="font-bold text-amber-400">Audit Log Recorded</span>
                          <span>ID: {creditResult.auditEntry.id}</span>
                        </div>
                        <p>Admin: {creditResult.auditEntry.adminEmail}</p>
                        <p>User: {creditResult.auditEntry.userEmail}</p>
                        <p>
                          Asset: {creditResult.auditEntry.asset} | Action: {(creditResult.auditEntry.action || 'add').toUpperCase()} | Amount: {creditResult.auditEntry.amount} | New Balance:{' '}
                          {creditResult.auditEntry.newBalance}
                        </p>
                        {creditResult.auditEntry.reason && <p>Reason: {creditResult.auditEntry.reason}</p>}
                        <p>Timestamp: {new Date(creditResult.auditEntry.date).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TAB: WITHDRAWAL APPROVALS --- */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-start space-x-3">
            <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-amber-200">Withdrawal Approval Security Protocol</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-neutral-300 text-[11px]">
                <li>All cryptocurrency withdrawal requests require administrator approval before payout execution.</li>
                <li>Supported Assets: USDT (ERC-20), USDT (TRC-20), Ethereum (ETH), BNB, TRON (TRX), Bitcoin (BTC).</li>
                <li><strong>Approving:</strong> Marks the request as successful and releases payout to destination address.</li>
                <li><strong>Declining:</strong> Refunds the requested withdrawal asset amount back to the user's account balance.</li>
                <li>Every review action is recorded in the audit trail and dispatches an automated email notification to the user.</li>
              </ul>
            </div>
          </div>

          {/* Modal / Card for Review Result */}
          {withdrawalModal && (
            <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{withdrawalModal.message}</span>
                </div>
                <button
                  onClick={() => setWithdrawalModal(null)}
                  className="text-xs text-neutral-400 hover:text-neutral-200 px-3 py-1 bg-neutral-800 rounded-lg font-semibold"
                >
                  Dismiss
                </button>
              </div>

              {withdrawalModal.emailNotification && (
                <div className="bg-neutral-950 border border-amber-500/30 rounded-xl p-4 space-y-2 font-mono text-xs">
                  <div className="flex items-center space-x-2 text-amber-400 font-sans font-bold text-xs border-b border-neutral-900 pb-2">
                    <Mail className="w-4 h-4" />
                    <span>Dispatched Email Notification Preview</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-sans">To:</span>{' '}
                    <span className="text-neutral-200 font-bold">{withdrawalModal.emailNotification.to}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-sans">Subject:</span>{' '}
                    <span className="text-amber-300 font-bold">{withdrawalModal.emailNotification.subject}</span>
                  </div>
                  <div className="bg-neutral-900 p-3 rounded-lg text-neutral-200 whitespace-pre-wrap font-sans text-xs leading-relaxed border border-neutral-800">
                    {withdrawalModal.emailNotification.body}
                  </div>
                </div>
              )}

              {withdrawalModal.auditEntry && (
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-400 space-y-1">
                  <span className="font-bold text-amber-400 font-sans block">Audit Log Record Entry</span>
                  <p>Action: {withdrawalModal.auditEntry.action} | Status: {withdrawalModal.auditEntry.status}</p>
                  <p>User Email: {withdrawalModal.auditEntry.userEmail} | Admin: {withdrawalModal.auditEntry.adminEmail}</p>
                  <p>Asset: {withdrawalModal.auditEntry.asset} | Amount: {withdrawalModal.auditEntry.amount} | Date: {new Date(withdrawalModal.auditEntry.date).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}

          {/* Action Confirmation Modal */}
          {confirmActionModal && confirmActionModal.isOpen && (
            <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-fadeIn">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      confirmActionModal.type === 'approve'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {confirmActionModal.type === 'approve' ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <X className="w-5 h-5 stroke-[2.5]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-100">
                      {confirmActionModal.type === 'approve'
                        ? `Confirm ${confirmActionModal.txType === 'withdrawal' ? 'Withdrawal' : 'Swap'} Approval`
                        : `Confirm ${confirmActionModal.txType === 'withdrawal' ? 'Withdrawal' : 'Swap'} Cancellation`}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono">
                      Transaction #{confirmActionModal.tx.id}
                    </p>
                  </div>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">User:</span>
                    <span className="text-neutral-200 font-semibold">{confirmActionModal.tx.userEmail || confirmActionModal.tx.userId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Amount & Asset:</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {confirmActionModal.tx.amount} {confirmActionModal.tx.fromAsset || confirmActionModal.tx.asset}
                    </span>
                  </div>
                  {confirmActionModal.tx.destinationAddress && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Destination:</span>
                      <span className="text-neutral-300 font-mono truncate max-w-[180px]" title={confirmActionModal.tx.destinationAddress}>
                        {confirmActionModal.tx.destinationAddress}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    confirmActionModal.type === 'approve'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  {confirmActionModal.type === 'approve' ? (
                    <p>
                      <strong>Financial Effect:</strong> This will mark the transaction as <strong>Successful</strong> and finalize dispatch.
                      {confirmActionModal.tx.feeAmount > 0 && (
                        <span> The network fee of <strong>{confirmActionModal.tx.feeAmount} {confirmActionModal.tx.feeAsset}</strong> is permanently finalized.</span>
                      )}
                      {' '}The reserved funds will not be refunded.
                    </p>
                  ) : (
                    <p>
                      <strong>Financial Effect:</strong> The exact reserved amount of{' '}
                      <strong>
                        {confirmActionModal.tx.amount} {confirmActionModal.tx.fromAsset || confirmActionModal.tx.asset}
                      </strong>{' '}
                      {confirmActionModal.tx.feeAmount > 0 && (
                        <span>and the reserved network fee of <strong>{confirmActionModal.tx.feeAmount} {confirmActionModal.tx.feeAsset}</strong> </span>
                      )}
                      will be <strong>automatically released and returned</strong> to the user's available balance immediately.
                    </p>
                  )}
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    disabled={confirmActionModal.loading}
                    onClick={() => setConfirmActionModal(null)}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    Keep Pending
                  </button>
                  <button
                    disabled={confirmActionModal.loading}
                    onClick={executeConfirmedStatusChange}
                    className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-lg ${
                      confirmActionModal.type === 'approve'
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/20'
                        : 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'
                    } disabled:opacity-50`}
                  >
                    {confirmActionModal.loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : confirmActionModal.type === 'approve' ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Approve Payout</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 stroke-[3]" />
                        <span>Cancel & Refund</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2 justify-between items-center bg-neutral-900 p-4 border border-neutral-800 rounded-2xl">
            <div className="flex space-x-2 overflow-x-auto">
              {(['pending', 'completed', 'failed', 'all'] as const).map((st) => {
                const count = allTxs.filter((t) => {
                  const isWithdraw = t.type === 'withdraw' || t.type === 'send';
                  if (!isWithdraw) return false;
                  if (st === 'all') return true;
                  if (st === 'pending') return t.status === 'pending' || (t.status as string) === 'processing';
                  if (st === 'completed') return t.status === 'completed' || (t.status as string) === 'approved' || (t.status as string) === 'success';
                  if (st === 'failed') return t.status === 'failed' || (t.status as string) === 'declined' || (t.status as string) === 'cancelled' || (t.status as string) === 'rejected';
                  return t.status === st;
                }).length;
                return (
                  <button
                    key={st}
                    onClick={() => setWithdrawalFilter(st)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                      withdrawalFilter === st
                        ? 'bg-amber-500 text-neutral-950 shadow-md'
                        : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
                    }`}
                  >
                    {st === 'pending' ? 'Pending Approval' : st === 'completed' ? 'Successful' : st === 'failed' ? 'Declined' : 'All'} ({count})
                  </button>
                );
              })}
            </div>

            <button
              onClick={loadAdminTransactions}
              className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-amber-400 rounded-xl text-xs font-semibold flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Requests</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
            {txsLoading ? (
              <p className="text-xs text-neutral-400 text-center py-8">Loading withdrawal requests...</p>
            ) : allTxs.filter((t) => {
                const isWithdraw = t.type === 'withdraw' || t.type === 'send';
                if (!isWithdraw) return false;
                if (withdrawalFilter === 'all') return true;
                if (withdrawalFilter === 'pending') return t.status === 'pending' || (t.status as string) === 'processing';
                if (withdrawalFilter === 'completed') return t.status === 'completed' || (t.status as string) === 'approved' || (t.status as string) === 'success';
                if (withdrawalFilter === 'failed') return t.status === 'failed' || (t.status as string) === 'declined' || (t.status as string) === 'cancelled' || (t.status as string) === 'rejected';
                return t.status === withdrawalFilter;
              }).length === 0 ? (
              <div className="text-center py-12 space-y-1">
                <p className="text-xs text-neutral-400 font-bold">No withdrawal requests found</p>
                <p className="text-[11px] text-neutral-500">There are no {withdrawalFilter === 'all' ? '' : withdrawalFilter} withdrawal requests recorded.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/60 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      <th className="py-3 px-4">User Email</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Asset Details</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Destination Address</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-950 text-neutral-200 font-mono">
                    {allTxs
                      .filter((t) => {
                        const isWithdraw = t.type === 'withdraw' || t.type === 'send';
                        if (!isWithdraw) return false;
                        if (withdrawalFilter === 'all') return true;
                        if (withdrawalFilter === 'pending') return t.status === 'pending' || (t.status as string) === 'processing';
                        if (withdrawalFilter === 'completed') return t.status === 'completed' || (t.status as string) === 'approved' || (t.status as string) === 'success';
                        if (withdrawalFilter === 'failed') return t.status === 'failed' || (t.status as string) === 'declined' || (t.status as string) === 'cancelled' || (t.status as string) === 'rejected';
                        return t.status === withdrawalFilter;
                      })
                      .map((tx) => {
                        const isPendingTx = tx.status === 'pending' || (tx.status as string) === 'processing';
                        const isCompletedTx = tx.status === 'completed' || (tx.status as string) === 'approved' || (tx.status as string) === 'success';

                        return (
                        <tr key={tx.id} className="hover:bg-neutral-950/40 transition-colors">
                          <td className="py-3.5 px-4 font-sans text-neutral-100 font-semibold">{tx.userEmail || tx.userId}</td>
                          <td className="py-3.5 px-4 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                                tx.type === 'withdraw'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                              }`}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-amber-300">
                            <div className="flex items-center space-x-2">
                              <CryptoIcon asset={tx.asset} size="xs" />
                              <span>{tx.asset}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-neutral-100 font-sans">
                            <span>{tx.amount} {tx.asset}</span>
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-neutral-400 max-w-[160px] truncate" title={tx.destinationAddress || 'N/A'}>
                            {tx.destinationAddress || 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-400 text-[11px] font-sans">
                            {new Date(tx.date).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-sans">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center space-x-1 border ${
                                isPendingTx
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                                  : isCompletedTx
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-400 border-red-500/30'
                              }`}
                            >
                              {isPendingTx && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1" />}
                              <span>
                                {isPendingTx
                                  ? 'Pending Approval'
                                  : isCompletedTx
                                  ? 'Successful'
                                  : 'Cancelled & Refunded'}
                              </span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-sans">
                            {isPendingTx ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => openConfirmModal(tx, 'approve', 'withdrawal')}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => openConfirmModal(tx, 'cancel', 'withdrawal')}
                                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold text-xs transition-all flex items-center space-x-1"
                                >
                                  <X className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Cancel / Decline</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-neutral-500 font-mono">
                                {isCompletedTx ? 'Processed & Sent' : 'Refunded to Balance'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB: SWAP APPROVALS --- */}
      {activeTab === 'swaps' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-xs text-purple-300 flex items-start space-x-3">
            <Repeat className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-purple-200">Crypto Swap Approval Security Protocol</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-neutral-300 text-[11px]">
                <li>All cryptocurrency swap requests require administrator approval prior to final execution and settlement.</li>
                <li>Supported Swap Assets: USDT (ERC-20/TRC-20), Bitcoin (BTC), Ethereum (ETH), TRON (TRX), BNB.</li>
                <li><strong>Approve:</strong> Credits the converted target asset balance to the user and sets status to <strong>Successful</strong>.</li>
                <li><strong>Cancel / Decline:</strong> Refunds the full original source asset amount back to the user balance and sets status to <strong>Cancelled</strong>.</li>
                <li>Real-time synchronization with Firestore logs and dispatches automated email notifications.</li>
              </ul>
            </div>
          </div>

          {/* Modal / Card for Swap Review Result */}
          {swapModal && (
            <div className="bg-neutral-900 border border-purple-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{swapModal.message}</span>
                </div>
                <button
                  onClick={() => setSwapModal(null)}
                  className="text-xs text-neutral-400 hover:text-neutral-200 px-3 py-1 bg-neutral-800 rounded-lg font-semibold"
                >
                  Dismiss
                </button>
              </div>

              {swapModal.emailNotification && (
                <div className="bg-neutral-950 border border-purple-500/30 rounded-xl p-4 space-y-2 font-mono text-xs">
                  <div className="flex items-center space-x-2 text-purple-400 font-sans font-bold text-xs border-b border-neutral-900 pb-2">
                    <Mail className="w-4 h-4" />
                    <span>Dispatched Email Notification Preview</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-sans">To:</span>{' '}
                    <span className="text-neutral-200 font-bold">{swapModal.emailNotification.to}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-sans">Subject:</span>{' '}
                    <span className="text-purple-300 font-bold">{swapModal.emailNotification.subject}</span>
                  </div>
                  <div className="bg-neutral-900 p-3 rounded-lg text-neutral-200 whitespace-pre-wrap font-sans text-xs leading-relaxed border border-neutral-800">
                    {swapModal.emailNotification.body}
                  </div>
                </div>
              )}

              {swapModal.auditEntry && (
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-400 space-y-1">
                  <span className="font-bold text-purple-400 font-sans block">Audit Log Record Entry</span>
                  <p>Action: {swapModal.auditEntry.action} | Status: {swapModal.auditEntry.status}</p>
                  <p>User Email: {swapModal.auditEntry.userEmail} | Admin: {swapModal.auditEntry.adminEmail}</p>
                  <p>Asset: {swapModal.auditEntry.asset} | Amount: {swapModal.auditEntry.amount} | Date: {new Date(swapModal.auditEntry.date).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2 justify-between items-center bg-neutral-900 p-4 border border-neutral-800 rounded-2xl">
            <div className="flex space-x-2 overflow-x-auto">
              {(['pending', 'completed', 'failed', 'all'] as const).map((st) => {
                const count = combinedSwaps.filter((t) => st === 'all' || t.status === st).length;
                return (
                  <button
                    key={st}
                    onClick={() => setSwapFilter(st)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                      swapFilter === st
                        ? 'bg-purple-500 text-neutral-950 shadow-md shadow-purple-500/20'
                        : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
                    }`}
                  >
                    {st === 'pending' ? 'Pending Approval' : st === 'completed' ? 'Successful' : st === 'failed' ? 'Cancelled / Declined' : 'All Swaps'} ({count})
                  </button>
                );
              })}
            </div>

            <button
              onClick={loadAdminTransactions}
              className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-purple-400 rounded-xl text-xs font-semibold flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
            {txsLoading && combinedSwaps.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-8">Loading swap queue...</p>
            ) : combinedSwaps.filter((t) => swapFilter === 'all' || t.status === swapFilter).length === 0 ? (
              <div className="text-center py-12 space-y-1">
                <p className="text-xs text-neutral-400 font-bold">No swap requests found</p>
                <p className="text-[11px] text-neutral-500">There are no {swapFilter === 'all' ? '' : swapFilter} crypto swap requests recorded.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/60 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      <th className="py-3 px-4">User Email</th>
                      <th className="py-3 px-4">Swap Pair (From ➔ To)</th>
                      <th className="py-3 px-4">Source Amount</th>
                      <th className="py-3 px-4">Target Conversion</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-950 text-neutral-200 font-mono">
                    {combinedSwaps
                      .filter((t) => swapFilter === 'all' || t.status === swapFilter)
                      .map((tx) => (
                        <tr key={tx.id} className="hover:bg-neutral-950/40 transition-colors">
                          <td className="py-3.5 px-4 font-sans text-neutral-100 font-semibold">{tx.userEmail || tx.userId}</td>
                          <td className="py-3.5 px-4 font-bold text-amber-300">
                            <div className="flex items-center space-x-1.5 text-xs">
                              <CryptoIcon asset={tx.fromAsset || tx.asset} size="xs" />
                              <span>{tx.fromAsset || tx.asset}</span>
                              <span className="text-neutral-500 font-bold">➔</span>
                              <CryptoIcon asset={tx.toAsset || 'USDT_TRC20'} size="xs" />
                              <span className="text-emerald-400">{tx.toAsset}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-amber-300 font-sans">
                            {tx.amount} {tx.fromAsset || tx.asset}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-400 font-sans">
                            {tx.usdtEquivalent} {tx.toAsset}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-400 text-[11px] font-sans">
                            {new Date(tx.date).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-sans">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center space-x-1 border ${
                                tx.status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                                  : tx.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-400 border-red-500/30'
                              }`}
                            >
                              {tx.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1" />}
                              <span>
                                {tx.status === 'pending'
                                  ? 'Pending Approval'
                                  : tx.status === 'completed'
                                  ? 'Successful'
                                  : 'Cancelled & Refunded'}
                              </span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-sans">
                            {tx.status === 'pending' ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => openConfirmModal(tx, 'approve', 'swap')}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => openConfirmModal(tx, 'cancel', 'swap')}
                                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold text-xs transition-all flex items-center space-x-1"
                                >
                                  <X className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Cancel / Refund</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-neutral-500 font-mono">
                                {tx.status === 'completed' ? 'Swapped & Credited' : 'Refunded to Balance'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB: WALLET CONNECTION REQUESTS --- */}
      {activeTab === 'wallet_requests' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-start space-x-3">
            <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-amber-200">Wallet Connection Requests & Custom Input Review</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-neutral-300 text-[11px]">
                <li>All user-submitted wallet requests arrive with a <strong>Pending</strong> status awaiting manual review.</li>
                <li><strong>Custom Notes / User Input:</strong> View the submitted text details and chosen wallet provider.</li>
                <li><strong>Approving:</strong> Marks the request as <strong>Approved</strong> and links the wallet provider to the user's account.</li>
                <li><strong>Declining:</strong> Marks the request as <strong>Declined</strong>.</li>
              </ul>
            </div>
          </div>

          {/* Modal for Action Result */}
          {walletModal && (
            <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl p-4 shadow-2xl flex items-center justify-between animate-fadeIn">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{walletModal.message}</span>
              </div>
              <button
                onClick={() => setWalletModal(null)}
                className="text-xs text-neutral-400 hover:text-white px-2 py-1 bg-neutral-800 rounded-lg"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Wallet Requests Table Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <LinkIcon className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-neutral-100">Submitted Wallet Requests ({walletRequests.length})</h3>
              </div>

              {/* Status Filters */}
              <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setWalletFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                    walletFilter === 'pending'
                      ? 'bg-amber-500 text-neutral-950 shadow-md'
                      : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-neutral-900/60 text-[10px]">
                    {walletRequests.filter((w) => w.status === 'pending').length}
                  </span>
                </button>

                <button
                  onClick={() => setWalletFilter('completed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                    walletFilter === 'completed'
                      ? 'bg-emerald-500 text-neutral-950 shadow-md'
                      : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approved</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-neutral-900/60 text-[10px]">
                    {walletRequests.filter((w) => w.status === 'completed').length}
                  </span>
                </button>

                <button
                  onClick={() => setWalletFilter('failed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                    walletFilter === 'failed'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Declined</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-neutral-900/60 text-[10px]">
                    {walletRequests.filter((w) => w.status === 'failed').length}
                  </span>
                </button>

                <button
                  onClick={() => setWalletFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    walletFilter === 'all'
                      ? 'bg-neutral-700 text-white shadow-md'
                      : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  All Requests
                </button>

                <button
                  onClick={loadWalletRequests}
                  className="p-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-amber-400 transition-colors shrink-0"
                  title="Refresh Wallet Requests"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${walletLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* List Table */}
            {walletRequests.filter((w) => walletFilter === 'all' || w.status === walletFilter).length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Clock className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-neutral-400 text-xs">No {walletFilter !== 'all' ? walletFilter : ''} wallet requests found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-[10px] tracking-wider bg-neutral-950/40">
                      <th className="py-3 px-4">User Email / Account</th>
                      <th className="py-3 px-4">Wallet Provider</th>
                      <th className="py-3 px-4">Custom Notes / User Input</th>
                      <th className="py-3 px-4">Submitted Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                    {walletRequests
                      .filter((w) => walletFilter === 'all' || w.status === walletFilter)
                      .map((req) => (
                        <tr key={req.id} className="hover:bg-neutral-950/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-neutral-100">{req.userEmail}</div>
                            {req.userName && <div className="text-[11px] text-neutral-400">{req.userName}</div>}
                            <div className="text-[10px] text-neutral-500 font-mono">ID: {req.id}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-950 border border-amber-500/30 text-amber-300">
                              <Wallet className="w-3.5 h-3.5 mr-1 text-amber-400" />
                              {req.provider || 'MetaMask'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-800 text-xs text-neutral-200 font-mono break-all whitespace-pre-wrap">
                              {req.customNotes || <span className="text-neutral-500 italic">No notes provided</span>}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-400 text-[11px]">
                            {new Date(req.date).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${
                                req.status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                                  : req.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-400 border-red-500/30'
                              }`}
                            >
                              {req.status === 'pending'
                                ? 'Pending'
                                : req.status === 'completed'
                                ? 'Approved'
                                : 'Declined'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {req.status === 'pending' ? (
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleWalletStatus(req.id, 'completed')}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all flex items-center space-x-1"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleWalletStatus(req.id, 'failed')}
                                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold text-xs transition-all flex items-center space-x-1"
                                >
                                  <X className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Decline</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-neutral-500 font-mono">Reviewed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: USER DIRECTORY & SEARCH --- */}
      {activeTab === 'users' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Administrator User Search & Directory</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Search registered users by email address, view account profiles, and manage balances securely.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setNewUserForm({ email: '', name: '', username: '', password: '', btcBalance: '0', ethBalance: '0', usdtBalance: '0' });
                  setShowCreateUserModal(true);
                }}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold rounded-lg text-xs flex items-center space-x-1.5 transition-colors shadow-md"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Create User Account</span>
              </button>
              <button
                onClick={loadAllUsers}
                className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-amber-400 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Users List</span>
              </button>
            </div>
          </div>

          {/* User Search Input Bar */}
          <div className="bg-neutral-950/80 border border-amber-500/20 rounded-xl p-4 space-y-3">
            <label htmlFor="admin-user-search-input" className="block text-xs font-semibold text-neutral-300">
              Search Users by Registered Email Address or Name
            </label>
            <div className="relative">
              <input
                id="admin-user-search-input"
                type="text"
                value={userDirectorySearchQuery}
                onChange={(e) => setUserDirectorySearchQuery(e.target.value)}
                placeholder="Type registered email address (e.g., user@example.com)..."
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 pl-10 pr-10 font-mono"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              {userDirectorySearchQuery && (
                <button
                  type="button"
                  onClick={() => setUserDirectorySearchQuery('')}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-200 text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex justify-between items-center text-[11px] text-neutral-400">
              <span>
                Showing{' '}
                <strong className="text-amber-400">
                  {
                    allUsers.filter((u) => {
                      if (!userDirectorySearchQuery.trim()) return true;
                      const q = userDirectorySearchQuery.trim().toLowerCase();
                      return (
                        u.email.toLowerCase().includes(q) ||
                        (u.id && u.id.toLowerCase().includes(q)) ||
                        (u.name && u.name.toLowerCase().includes(q)) ||
                        (u.username && u.username.toLowerCase().includes(q))
                      );
                    }).length
                  }
                </strong>{' '}
                of {allUsers.length} total registered accounts
              </span>
              {userDirectorySearchQuery && (
                <span className="text-amber-400/90 font-mono">
                  Search filter active: &quot;{userDirectorySearchQuery.trim()}&quot;
                </span>
              )}
            </div>
          </div>

          {/* User Accounts Table */}
          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-950 border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Name & Email</th>
                  <th className="py-3 px-4">Username & Role</th>
                  <th className="py-3 px-4">Balances (BTC / ETH / USDT)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-200 bg-neutral-900/50">
                {allUsers
                  .filter((u) => {
                    if (!userDirectorySearchQuery.trim()) return true;
                    const q = userDirectorySearchQuery.trim().toLowerCase();
                    return (
                      u.email.toLowerCase().includes(q) ||
                      (u.id && u.id.toLowerCase().includes(q)) ||
                      (u.name && u.name.toLowerCase().includes(q)) ||
                      (u.username && u.username.toLowerCase().includes(q))
                    );
                  })
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-950/60 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-neutral-100">{u.name}</p>
                        <p className="text-[11px] font-mono text-amber-400">{u.email}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-400">
                        <p className="text-neutral-300">@{u.username || 'user'}</p>
                        <span className={`text-[10px] font-bold uppercase ${u.role === 'admin' ? 'text-amber-400' : 'text-neutral-500'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        BTC: {(u.balances?.BTC || 0).toFixed(4)} | ETH: {(u.balances?.ETH || 0).toFixed(2)} | USDT:{' '}
                        {((u.balances?.USDT_ERC20 || 0) + (u.balances?.USDT_TRC20 || 0)).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            u.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setViewingUserProfile(u)}
                          className="px-2.5 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-200 font-semibold text-[11px] hover:bg-neutral-700 transition-colors"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => {
                            setSearchEmail(u.email);
                            setActiveTab('asset_mgmt');
                            setFoundUser(u);
                          }}
                          className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-[11px] hover:bg-amber-500/20 transition-colors"
                        >
                          Manage Asset
                        </button>
                      </td>
                    </tr>
                  ))}

                {allUsers.filter((u) => {
                  if (!userDirectorySearchQuery.trim()) return true;
                  const q = userDirectorySearchQuery.trim().toLowerCase();
                  return (
                    u.email.toLowerCase().includes(q) ||
                    (u.id && u.id.toLowerCase().includes(q)) ||
                    (u.name && u.name.toLowerCase().includes(q)) ||
                    (u.username && u.username.toLowerCase().includes(q))
                  );
                }).length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-400 text-xs">
                      No registered user account found matching &quot;{userDirectorySearchQuery}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* User Profile View Modal */}
          {viewingUserProfile && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <h3 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-amber-400" />
                    <span>User Profile: {viewingUserProfile.name}</span>
                  </h3>
                  <button
                    onClick={() => setViewingUserProfile(null)}
                    className="text-neutral-400 hover:text-neutral-100 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1 font-mono">
                    <p className="text-neutral-400"><span className="text-neutral-500">Account ID:</span> {viewingUserProfile.id}</p>
                    <p className="text-neutral-200"><span className="text-neutral-500">Email:</span> <strong className="text-amber-400">{viewingUserProfile.email}</strong></p>
                    <p className="text-neutral-300"><span className="text-neutral-500">Username:</span> @{viewingUserProfile.username || 'N/A'}</p>
                    <p className="text-neutral-300"><span className="text-neutral-500">Role:</span> {viewingUserProfile.role}</p>
                    <p className="text-neutral-300"><span className="text-neutral-500">Status:</span> {viewingUserProfile.status}</p>
                    <p className="text-neutral-400"><span className="text-neutral-500">Registered On:</span> {new Date(viewingUserProfile.createdAt).toLocaleString()}</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-neutral-200 mb-1.5">Crypto Balances Breakdown:</h4>
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      {Object.entries(viewingUserProfile.balances || {}).map(([asset, amount]) => (
                        <div key={asset} className="bg-neutral-950 p-2 rounded-lg border border-neutral-800 flex justify-between">
                          <span className="text-neutral-400">{asset}:</span>
                          <span className="text-amber-300 font-bold">{(amount as number).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-neutral-200 mb-1.5">Saved Withdrawal Addresses:</h4>
                    <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 font-mono space-y-1 text-[11px]">
                      {Object.entries(viewingUserProfile.withdrawalAddresses || {}).map(([asset, addr]) => (
                        <div key={asset} className="truncate">
                          <span className="text-neutral-500">{asset}:</span>{' '}
                          <span className="text-neutral-300">{addr ? String(addr) : 'Not set'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-neutral-800">
                  <button
                    onClick={() => {
                      const targetEmail = viewingUserProfile.email;
                      setViewingUserProfile(null);
                      setSearchEmail(targetEmail);
                      setActiveTab('asset_mgmt');
                      setFoundUser(viewingUserProfile);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-extrabold rounded-xl text-xs transition-colors"
                  >
                    Credit / Adjust Balance
                  </button>
                  <button
                    onClick={() => setViewingUserProfile(null)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl text-xs transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: DEPOSIT WALLET ADDRESSES --- */}
      {activeTab === 'deposit_addresses' && (
        <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="border-b border-neutral-800 pb-3">
            <h2 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>Configure Admin Custody Deposit Addresses</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              These addresses are displayed globally to users when depositing cryptocurrency across all networks.
            </p>
          </div>

          {addressSaveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{addressSaveSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveAddresses} className="space-y-4">
            {Object.values(ASSET_METADATA).map((asset) => (
              <div key={asset.id} className="space-y-1">
                <label className="block text-xs font-mono text-amber-400 font-bold flex items-center space-x-2">
                  <CryptoIcon asset={asset.id} size="xs" />
                  <span>{asset.name} ({asset.symbol}) - {asset.network}</span>
                </label>
                <input
                  type="text"
                  required
                  value={addressesForm[asset.id] || ''}
                  onChange={(e) =>
                    setAddressesForm({
                      ...addressesForm,
                      [asset.id]: e.target.value,
                    })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
                />
              </div>
            ))}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all"
            >
              Save & Update Deposit Addresses
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 4: SUPPORT TICKETS --- */}
      {activeTab === 'tickets' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-800 pb-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-neutral-100">
                Support Ticket Desk ({tickets.length})
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              {/* Filter search by User Email */}
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by User Email or ID..."
                  value={ticketSearchQuery || ''}
                  onChange={(e) => setTicketSearchQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <button
                onClick={loadTickets}
                className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-amber-400 rounded-xl text-xs font-semibold flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {tickets.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center py-8">No user support tickets recorded</p>
          ) : (
            <div className="space-y-4">
              {tickets
                .filter(
                  (t) =>
                    !ticketSearchQuery ||
                    t.userEmail.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
                    t.userName.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
                    t.subject.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
                    t.id.toLowerCase().includes(ticketSearchQuery.toLowerCase())
                )
                .map((t) => (
                  <div key={t.id} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-neutral-100">{t.subject}</span>
                          <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                            #{t.id}
                          </span>
                        </div>
                        <span className="text-[11px] text-amber-300 font-mono block mt-0.5">
                          User Email: <strong className="text-amber-400">{t.userEmail}</strong> ({t.userName}) • Category: {t.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold ${
                            t.status === 'Open'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : t.status === 'In Progress'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {t.status}
                        </span>
                        {t.status !== 'Closed' ? (
                          <button
                            onClick={() => handleTicketStatus(t.id, 'Closed')}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Resolve</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTicketStatus(t.id, 'Open')}
                            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold flex items-center space-x-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Reopen</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTicket(t.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-neutral-300 bg-neutral-900 p-3 rounded-lg border border-neutral-800 space-y-1">
                      <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                        <span>{t.userName} ({t.userEmail})</span>
                        <span>{new Date(t.createdAt).toLocaleString()}</span>
                      </div>
                      <p>{t.message}</p>
                    </div>

                    {/* Previous Replies */}
                    {t.replies && t.replies.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider">
                          Conversation Thread ({t.replies.length} replies):
                        </span>
                        <div className="space-y-2.5">
                          {t.replies.map((r) => {
                            const isAdmin = isStaffSender(r);
                            const userSenderName = isAdmin
                              ? 'Netbybit Support'
                              : r.senderName || t.userName || 'User';

                            return (
                              <div
                                key={r.id}
                                className={`flex items-start gap-2.5 ${
                                  isAdmin ? 'flex-row-reverse justify-start' : 'flex-row justify-start'
                                }`}
                              >
                                {isAdmin ? (
                                  <SupportAvatar size="sm" />
                                ) : (
                                  <div
                                    className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-neutral-950 font-black text-[10px] flex items-center justify-center shrink-0 shadow-md ring-1 ring-amber-400/40"
                                    title={userSenderName}
                                  >
                                    {getInitials(userSenderName)}
                                  </div>
                                )}

                                <div
                                  className={`p-3 rounded-2xl text-xs space-y-1 max-w-[80%] ${
                                    isAdmin
                                      ? 'bg-amber-500/10 border border-amber-500/30 rounded-tr-xs'
                                      : 'bg-neutral-900 border border-neutral-800 rounded-tl-xs'
                                  }`}
                                >
                                  <div className="flex justify-between items-center text-[10px] gap-3">
                                    <div className="flex items-center space-x-1.5">
                                      <span className={`font-bold ${isAdmin ? 'text-amber-400' : 'text-amber-300'}`}>
                                        {userSenderName}
                                      </span>
                                      {isAdmin && (
                                        <span className="bg-amber-500/20 text-amber-300 px-1 py-0.2 text-[8px] rounded font-mono font-bold border border-amber-500/30">
                                          OFFICIAL
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-neutral-500 font-mono">
                                      {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-neutral-200 whitespace-pre-wrap">{r.message}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Admin Reply Form */}
                    <div className="flex space-x-2 pt-2">
                      <input
                        type="text"
                        placeholder={`Type admin reply to ${t.userEmail}...`}
                        value={ticketReplyText[t.id] || ''}
                        onChange={(e) =>
                          setTicketReplyText({
                            ...ticketReplyText,
                            [t.id]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleReplyTicket(t.id);
                          }
                        }}
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/50"
                      />
                      <button
                        onClick={() => handleReplyTicket(t.id)}
                        className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center space-x-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Reply</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 5: AUDIT LOGS --- */}
      {activeTab === 'audit_logs' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
            <h2 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Admin Balance Adjustment Audit Logs ({auditLogs.length})</span>
            </h2>
            <button
              onClick={loadAuditLogs}
              className="px-3 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-amber-400 rounded-lg text-xs font-semibold flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Logs</span>
            </button>
          </div>

          {auditLoading ? (
            <p className="text-xs text-neutral-400 text-center py-6">Loading audit entries...</p>
          ) : auditLogs.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center py-8">No admin balance adjustments recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Admin Email</th>
                    <th className="py-2.5 px-3">User Email</th>
                    <th className="py-2.5 px-3">Asset</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status / New Bal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-950 text-neutral-200 font-mono">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-950/40">
                      <td className="py-3 px-3 font-sans text-neutral-400 text-[11px]">
                        {new Date(log.date).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {log.action || 'Balance Adjustment'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-amber-400 font-sans">{log.adminEmail}</td>
                      <td className="py-3 px-3 text-neutral-100 font-sans">{log.userEmail}</td>
                      <td className="py-3 px-3 font-bold text-amber-300">{log.asset}</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">
                        {log.action?.includes('Withdrawal') ? log.amount : `+${log.amount}`}
                      </td>
                      <td className="py-3 px-3 font-sans text-[11px]">
                        {log.status ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                              log.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : log.status === 'failed'
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {log.status === 'completed' ? 'Successful' : log.status === 'failed' ? 'Declined' : log.status}
                          </span>
                        ) : (
                          <span className="font-mono text-neutral-300">New Bal: {log.newBalance}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 6: ADMIN EMAIL CENTER & DELIVERY DASHBOARD --- */}
      {activeTab === 'email_logs' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-extrabold text-neutral-100">Admin Email Control Center</h2>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                  SMTP ACTIVE
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Dispatches automated notifications & custom emails. Sender: <span className="text-amber-300 font-mono">help.netbybit@hotmail.com</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleTestSmtp}
                disabled={smtpTesting}
                className="px-3 py-2 bg-neutral-950 hover:bg-neutral-800 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${smtpTesting ? 'animate-spin' : ''}`} />
                <span>{smtpTesting ? 'Testing Connection...' : 'Test SMTP Diagnostic'}</span>
              </button>

              <button
                onClick={loadEmailLogs}
                className="px-3 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
                <span>Refresh History</span>
              </button>
            </div>
          </div>

          {smtpTestResult && (
            <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 text-xs font-semibold text-amber-300 flex items-center justify-between">
              <span>{smtpTestResult}</span>
              <button onClick={() => setSmtpTestResult(null)} className="text-amber-400 hover:text-amber-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Email Center Sub-Nav */}
          <div className="flex space-x-2 border-b border-neutral-800 pb-2">
            <button
              onClick={() => setEmailSubTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                emailSubTab === 'logs'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500/30'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Dispatched History Logs ({emailLogs.length})</span>
            </button>

            <button
              onClick={() => setEmailSubTab('compose')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                emailSubTab === 'compose'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500/30'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Compose Custom & Broadcast Email</span>
            </button>
          </div>

          {/* SUBTAB 1: COMPOSE & BROADCAST EMAIL */}
          {emailSubTab === 'compose' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
                <div>
                  <h3 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
                    <Send className="w-4 h-4 text-amber-400" />
                    <span>Send Custom Email or Broadcast Notification</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Send single or bulk HTML notifications to users with custom CTAs & reference codes.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mr-1">
                    Presets:
                  </span>
                  <button
                    onClick={() => applyPresetTemplate('welcome')}
                    className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 rounded-lg text-[10px] font-bold transition-all"
                  >
                    Welcome
                  </button>
                  <button
                    onClick={() => applyPresetTemplate('deposit')}
                    className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 rounded-lg text-[10px] font-bold transition-all"
                  >
                    Deposit Notice
                  </button>
                  <button
                    onClick={() => applyPresetTemplate('withdrawal')}
                    className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 rounded-lg text-[10px] font-bold transition-all"
                  >
                    Withdrawal Status
                  </button>
                  <button
                    onClick={() => applyPresetTemplate('security')}
                    className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 rounded-lg text-[10px] font-bold transition-all"
                  >
                    Security Alert
                  </button>
                  <button
                    onClick={() => applyPresetTemplate('announcement')}
                    className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 rounded-lg text-[10px] font-bold transition-all"
                  >
                    Announcement
                  </button>
                </div>
              </div>

              {composeResult && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-xs font-semibold text-emerald-400 flex items-center justify-between">
                  <span>{composeResult}</span>
                  <button onClick={() => setComposeResult(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {composeError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-xs font-semibold text-red-400 flex items-center justify-between">
                  <span>{composeError}</span>
                  <button onClick={() => setComposeError(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendCustomEmail} className="space-y-5">
                {/* Recipient Mode Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-2">
                      Target Recipient Scope
                    </label>
                    <div className="flex space-x-3">
                      <label className="flex items-center space-x-2 text-xs text-neutral-300 cursor-pointer">
                        <input
                          type="radio"
                          name="recipientType"
                          checked={composeRecipientType === 'single'}
                          onChange={() => setComposeRecipientType('single')}
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span>Single User</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs text-amber-400 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="recipientType"
                          checked={composeRecipientType === 'all'}
                          onChange={() => setComposeRecipientType('all')}
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span>Broadcast to ALL Registered Users ({allUsers.length})</span>
                      </label>
                    </div>
                  </div>

                  {composeRecipientType === 'single' && (
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1">
                        Select User or Enter Email
                      </label>
                      <div className="flex space-x-2">
                        <select
                          value={composeRecipientEmail}
                          onChange={(e) => setComposeRecipientEmail(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="">Select a user from directory...</option>
                          {allUsers.map((u) => (
                            <option key={u.id} value={u.email}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                        </select>
                        <input
                          type="email"
                          placeholder="Or type recipient email..."
                          value={composeRecipientEmail}
                          onChange={(e) => setComposeRecipientEmail(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Subject and Category */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-300 mb-1">
                      Email Subject Line *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Important Security Alert - Action Required"
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">
                      Category Tag
                    </label>
                    <select
                      value={composeCategory}
                      onChange={(e) => setComposeCategory(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="System Announcement">System Announcement</option>
                      <option value="Registration & Verification">Registration & Verification</option>
                      <option value="Security Alert">Security Alert</option>
                      <option value="Deposit Update">Deposit Update</option>
                      <option value="Withdrawal Approval">Withdrawal Approval</option>
                      <option value="Account Update">Account Update</option>
                      <option value="Support Inquiry">Support Inquiry</option>
                      <option value="Promotional">Promotional</option>
                    </select>
                  </div>
                </div>

                {/* Highlight Box & CTA Button Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">
                      Highlight / Code Box (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Verification OTP 849201"
                      value={composeHighlightBox}
                      onChange={(e) => setComposeHighlightBox(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-neutral-500 block mt-1">Renders prominent code box</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">
                      Action Button Text (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Verify Account Now"
                      value={composeActionText}
                      onChange={(e) => setComposeActionText(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">
                      Action Button Link URL (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. https://your-app.com/wallet"
                      value={composeActionUrl}
                      onChange={(e) => setComposeActionUrl(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Message Body Content */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-neutral-300">
                      Email Body Content *
                    </label>
                    <button
                      type="button"
                      onClick={() => setComposePreviewMode(!composePreviewMode)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{composePreviewMode ? 'Edit Content' : 'Preview HTML Layout'}</span>
                    </button>
                  </div>

                  {composePreviewMode ? (
                    <div className="bg-neutral-950 border border-amber-500/30 rounded-xl p-4 space-y-3">
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block border-b border-neutral-800 pb-2">
                        LIVE RECIPIENT HTML EMAIL PREVIEW:
                      </span>
                      <div className="bg-[#09090b] text-neutral-100 p-6 rounded-xl border border-neutral-800 space-y-4 max-w-xl mx-auto shadow-xl">
                        <div className="text-center border-b border-neutral-800 pb-4">
                          <span className="text-xl font-black tracking-tight text-white">NET<span className="text-amber-400">BYBIT</span></span>
                          <span className="block text-[10px] text-neutral-500 uppercase tracking-widest">Institutional Digital Asset Infrastructure</span>
                        </div>
                        <div className="text-xs uppercase font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded inline-block">
                          {composeCategory}
                        </div>
                        <h4 className="text-base font-bold text-white">{composeSubject || 'Email Subject Title'}</h4>
                        <div className="text-xs text-neutral-300 space-y-2 whitespace-pre-wrap leading-relaxed">
                          {composeBody || 'Email message content will appear here...'}
                        </div>
                        {composeHighlightBox && (
                          <div className="bg-neutral-900 border border-amber-500/50 rounded-xl p-4 text-center">
                            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">REFERENCE CODE</span>
                            <span className="font-mono text-xl font-bold text-amber-400 tracking-widest">{composeHighlightBox}</span>
                          </div>
                        )}
                        {composeActionText && (
                          <div className="text-center py-2">
                            <button type="button" className="bg-amber-500 text-neutral-950 font-bold px-6 py-2.5 rounded-lg text-xs shadow-lg shadow-amber-500/20">
                              {composeActionText}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <textarea
                      rows={6}
                      placeholder="Type email body content here. Paragraph breaks are formatted into responsive HTML emails automatically..."
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-100 focus:outline-none focus:border-amber-500 font-sans leading-relaxed"
                      required
                    />
                  )}
                </div>

                {/* Submit Action */}
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={composeSending}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {composeSending
                        ? 'Dispatching Email...'
                        : composeRecipientType === 'all'
                        ? `Broadcast Email to ALL (${allUsers.length} Users)`
                        : 'Dispatch Email Now'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SUBTAB 2: DISPATCHED EMAIL LOGS HISTORY */}
          {emailSubTab === 'logs' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">Total Dispatched</span>
                  <span className="text-lg font-bold text-neutral-100 font-mono">{emailLogs.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">Delivered</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {emailLogs.filter((e) => e.status === 'Delivered' || e.status === 'Sent').length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">Delivery Failures</span>
                  <span className="text-lg font-bold text-red-400 font-mono">
                    {emailLogs.filter((e) => e.status === 'Failed').length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">Admin Alerts</span>
                  <span className="text-lg font-bold text-amber-300 font-mono">
                    {emailLogs.filter((e) => e.isAdminAlert).length}
                  </span>
                </div>
              </div>

              {/* Filters & Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search recipient, subject, category..."
                      value={emailLogSearch}
                      onChange={(e) => setEmailLogSearch(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-1 overflow-x-auto pb-1">
                  {(['all', 'Delivered', 'Failed', 'Admin Alerts'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setEmailLogFilterStatus(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        emailLogFilterStatus === filter
                          ? 'bg-amber-500 text-neutral-950'
                          : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                      }`}
                    >
                      {filter === 'all' ? 'All Logs' : filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Logs Table */}
              {emailLogsLoading ? (
                <p className="text-xs text-neutral-400 text-center py-6">Loading dispatched email records...</p>
              ) : emailLogs.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-8">No email dispatches recorded yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Sent Date & Time</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">From</th>
                        <th className="py-2.5 px-3">Recipient (To)</th>
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-950 text-neutral-200">
                      {emailLogs
                        .filter((log) => {
                          if (emailLogFilterStatus === 'Delivered' && log.status === 'Failed') return false;
                          if (emailLogFilterStatus === 'Failed' && log.status !== 'Failed') return false;
                          if (emailLogFilterStatus === 'Admin Alerts' && !log.isAdminAlert) return false;
                          if (emailLogSearch.trim()) {
                            const query = emailLogSearch.toLowerCase();
                            return (
                              log.to.toLowerCase().includes(query) ||
                              log.subject.toLowerCase().includes(query) ||
                              log.category.toLowerCase().includes(query)
                            );
                          }
                          return true;
                        })
                        .map((log) => (
                          <tr
                            key={log.id}
                            onClick={() => setSelectedEmailLog(log)}
                            className="hover:bg-amber-500/5 cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-3 font-mono text-neutral-400 text-[11px] whitespace-nowrap">
                              {new Date(log.sentAt).toLocaleString()}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                  log.isAdminAlert
                                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                }`}
                              >
                                {log.category}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-neutral-400">{log.from}</td>
                            <td className="py-3 px-3 font-mono text-[11px] text-amber-400 font-semibold">{log.to}</td>
                            <td className="py-3 px-3 font-medium text-neutral-100 max-w-xs truncate">{log.subject}</td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                  log.status === 'Failed'
                                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                {log.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => setSelectedEmailLog(log)}
                                  className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded hover:bg-amber-500/20 text-[10px] font-semibold flex items-center space-x-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View HTML</span>
                                </button>
                                <button
                                  onClick={() => handleRetryEmailLog(log.id)}
                                  disabled={retryingEmailId === log.id}
                                  className="px-2 py-1 bg-neutral-800 text-neutral-300 hover:text-amber-300 rounded text-[10px] font-semibold flex items-center space-x-1"
                                  title="Resend email notification"
                                >
                                  <RefreshCw className={`w-3 h-3 ${retryingEmailId === log.id ? 'animate-spin' : ''}`} />
                                  <span>Retry</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteEmailLog(log.id)}
                                  className="p-1 text-neutral-500 hover:text-red-400 rounded transition-colors"
                                  title="Delete email record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Email Content Detail Modal */}
          {selectedEmailLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-neutral-100 max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-5 border-b border-neutral-800 bg-neutral-950 shrink-0">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-amber-400 text-sm">Dispatched Email Record & HTML Inspector</h3>
                  </div>
                  <button
                    onClick={() => setSelectedEmailLog(null)}
                    className="text-neutral-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Sub-Tabs */}
                <div className="flex space-x-2 bg-neutral-950 px-6 py-2 border-b border-neutral-800 shrink-0">
                  <button
                    onClick={() => setEmailModalTab('html')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      emailModalTab === 'html' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Formatted Email View
                  </button>
                  <button
                    onClick={() => setEmailModalTab('text')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      emailModalTab === 'text' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Plain Text Body
                  </button>
                  <button
                    onClick={() => setEmailModalTab('meta')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      emailModalTab === 'meta' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Transmission Metadata
                  </button>
                </div>

                {/* Modal Body Scroll Area */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                  {/* Metadata Header Summary */}
                  <div className="grid grid-cols-2 gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800 font-mono text-xs">
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans">SENDER (FROM):</span>
                      <span className="text-neutral-300 font-bold">{selectedEmailLog.from}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans">RECIPIENT (TO):</span>
                      <span className="text-amber-400 font-bold">{selectedEmailLog.to}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-neutral-500 text-[10px] block font-sans">SUBJECT:</span>
                      <span className="text-neutral-100 font-sans font-semibold">{selectedEmailLog.subject}</span>
                    </div>
                  </div>

                  {emailModalTab === 'html' && (
                    <div className="bg-[#09090b] border border-neutral-800 rounded-xl p-4 overflow-x-auto">
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block mb-3 border-b border-neutral-800 pb-2">
                        RENDERED HTML EMAIL CONTAINER:
                      </span>
                      {selectedEmailLog.html ? (
                        <iframe
                          title="Email HTML Preview"
                          srcDoc={selectedEmailLog.html}
                          className="w-full h-96 border-0 rounded-lg bg-neutral-950"
                        />
                      ) : (
                        <div className="p-4 text-xs text-neutral-300 whitespace-pre-wrap font-sans leading-relaxed">
                          {selectedEmailLog.body}
                        </div>
                      )}
                    </div>
                  )}

                  {emailModalTab === 'text' && (
                    <div>
                      <span className="text-neutral-400 font-medium block mb-1 text-xs">Plain Text Message Content:</span>
                      <pre className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-neutral-200 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                        {selectedEmailLog.body}
                      </pre>
                    </div>
                  )}

                  {emailModalTab === 'meta' && (
                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2 font-mono text-xs text-neutral-300">
                      <div><span className="text-neutral-500">Log ID:</span> {selectedEmailLog.id}</div>
                      <div><span className="text-neutral-500">Category:</span> {selectedEmailLog.category}</div>
                      <div><span className="text-neutral-500">Sent Timestamp:</span> {selectedEmailLog.sentAt}</div>
                      <div><span className="text-neutral-500">Delivery Status:</span> {selectedEmailLog.status}</div>
                      <div><span className="text-neutral-500">Admin Alert Tag:</span> {selectedEmailLog.isAdminAlert ? 'True' : 'False'}</div>
                      <div><span className="text-neutral-500">Retry Count:</span> {selectedEmailLog.retryCount || 0}</div>
                      {selectedEmailLog.errorMessage && (
                        <div className="text-red-400"><span className="text-neutral-500">Error Details:</span> {selectedEmailLog.errorMessage}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-between items-center shrink-0">
                  <button
                    onClick={() => handleRetryEmailLog(selectedEmailLog.id)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-Send Email Notification</span>
                  </button>

                  <button
                    onClick={() => setSelectedEmailLog(null)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-semibold text-xs"
                  >
                    Close Mail Inspector
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 8: SMS GATEWAY & DISPATCH LOGS --- */}
      {activeTab === 'sms_logs' && (
        <div className="space-y-6">
          {/* SMS Status Banner */}
          <div className="p-5 bg-neutral-900 border border-amber-500/30 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-amber-300 text-sm">NETBYBIT Outbound Cellular SMS Gateway</h3>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>OPERATIONAL</span>
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-1">
                  Automated SMS notifications are dispatched on registration, security verification, and withdrawal approvals. Live REST API integration uses Twilio when configured, or routes through NETBYBIT's simulated cellular gateway.
                </p>
              </div>
            </div>

            <button
              onClick={loadSmsLogs}
              disabled={smsLogsLoading}
              className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${smsLogsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh SMS Logs</span>
            </button>
          </div>

          {/* Outbound SMS Dispatch Form */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm text-neutral-100">Send Direct / Test SMS Notification</h4>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">INSTANT DISPATCH</span>
            </div>

            {testSmsResult && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{testSmsResult}</span>
              </div>
            )}

            {testSmsError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{testSmsError}</span>
              </div>
            )}

            <form onSubmit={handleSendTestSms} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Recipient Phone Number / Email (Optional, defaults to Admin)
                  </label>
                  <input
                    type="text"
                    value={testSmsRecipient}
                    onChange={(e) => setTestSmsRecipient(e.target.value)}
                    placeholder="+1234567890 or user@example.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">SMS Category</label>
                  <select
                    value={testSmsCategory}
                    onChange={(e) => setTestSmsCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Registration & Verification">Registration & Verification</option>
                    <option value="Security Alert">Security Alert</option>
                    <option value="Asset Withdrawal">Asset Withdrawal</option>
                    <option value="Deposit Confirmation">Deposit Confirmation</option>
                    <option value="SMS Gateway Test">SMS Gateway Test</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Message Content</label>
                <textarea
                  value={testSmsMessage}
                  onChange={(e) => setTestSmsMessage(e.target.value)}
                  placeholder="[NETBYBIT Alert] Enter your SMS notification message..."
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTestSmsCategory('Registration & Verification');
                      setTestSmsMessage('[NETBYBIT Alert] Welcome! Your Security Verification Code is 849201. Do not share with anyone.');
                    }}
                    className="text-[10px] font-mono bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 px-2.5 py-1 rounded-lg"
                  >
                    + Verification Code Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTestSmsCategory('Asset Withdrawal');
                      setTestSmsMessage('[NETBYBIT Alert] Withdrawal request for 1.5 BTC received. Status: Pending Approval. TxID: tx_98321');
                    }}
                    className="text-[10px] font-mono bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 px-2.5 py-1 rounded-lg"
                  >
                    + Withdrawal Alert Preset
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={testSmsSending}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 rounded-xl font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testSmsSending ? 'Dispatching SMS...' : 'Dispatch SMS Message'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Dispatched SMS Logs Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm text-neutral-100">Dispatched SMS Transmission History ({smsLogs.length})</h4>
              </div>
              <span className="text-xs text-neutral-400">Total Recorded: {smsLogs.length}</span>
            </div>

            {smsLogs.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 text-xs">
                No SMS transmission logs recorded yet. Outbound SMS messages dispatched during user registration or withdrawals will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 font-mono text-[11px] uppercase">
                      <th className="py-3 px-3">Recipient</th>
                      <th className="py-3 px-3">Message Body</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Gateway Provider</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Sent Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-sans">
                    {smsLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-950/50 transition-colors">
                        <td className="py-3 px-3 font-mono text-amber-300 font-bold">{log.to}</td>
                        <td className="py-3 px-3 text-neutral-200 max-w-xs truncate font-mono text-[11px]" title={log.message}>
                          {log.message}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300 font-mono">
                            {log.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-neutral-400 text-[11px] font-mono">{log.provider}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono inline-flex items-center space-x-1 ${
                              log.status === 'Delivered'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : log.status === 'Sent'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{log.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-neutral-400 text-[11px] font-mono">
                          {new Date(log.sentAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ADMIN CREATE USER ACCOUNT MODAL --- */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>Create New User Account (Permanent Database)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="text-neutral-400 hover:text-neutral-100 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminCreateUserSubmit} className="space-y-4 text-xs">
              {createUserError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createUserError}</span>
                </div>
              )}

              {createUserSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{createUserSuccess}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label htmlFor="modal-create-user-email" className="block text-neutral-300 font-semibold mb-1">
                    Registered Email Address <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id="modal-create-user-email"
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="e.g., monalisabilosun@gmail.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label htmlFor="modal-create-user-name" className="block text-neutral-300 font-semibold mb-1">
                    Full Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id="modal-create-user-name"
                    type="text"
                    required
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    placeholder="e.g., Monalisa Bilosun"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-neutral-100 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-create-user-username" className="block text-neutral-300 font-semibold mb-1">
                      Username (Optional)
                    </label>
                    <input
                      id="modal-create-user-username"
                      type="text"
                      value={newUserForm.username}
                      onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                      placeholder="e.g., monalisa"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-create-user-password" className="block text-neutral-300 font-semibold mb-1">
                      Password (Default: Netbybit2026!)
                    </label>
                    <input
                      id="modal-create-user-password"
                      type="text"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      placeholder="Netbybit2026!"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Initial Asset Balances (Optional)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor="modal-create-user-btc" className="text-[10px] text-neutral-400 font-mono block">BTC Amount</label>
                      <input
                        id="modal-create-user-btc"
                        type="number"
                        step="any"
                        value={newUserForm.btcBalance}
                        onChange={(e) => setNewUserForm({ ...newUserForm, btcBalance: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-amber-300 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label htmlFor="modal-create-user-eth" className="text-[10px] text-neutral-400 font-mono block">ETH Amount</label>
                      <input
                        id="modal-create-user-eth"
                        type="number"
                        step="any"
                        value={newUserForm.ethBalance}
                        onChange={(e) => setNewUserForm({ ...newUserForm, ethBalance: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-amber-300 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label htmlFor="modal-create-user-usdt" className="text-[10px] text-neutral-400 font-mono block">USDT Amount</label>
                      <input
                        id="modal-create-user-usdt"
                        type="number"
                        step="any"
                        value={newUserForm.usdtBalance}
                        onChange={(e) => setNewUserForm({ ...newUserForm, usdtBalance: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-amber-300 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-extrabold rounded-xl transition-colors flex items-center space-x-1.5"
                >
                  {createUserLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  <span>{createUserLoading ? 'Creating User...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

