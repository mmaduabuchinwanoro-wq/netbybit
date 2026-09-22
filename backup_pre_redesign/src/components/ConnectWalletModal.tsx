import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import {
  X,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { ConnectedWallet, WalletRequest } from '../types';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();

  // Form input state
  const [provider, setProvider] = useState('MetaMask');
  const [customNotes, setCustomNotes] = useState('');

  // Status state
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Connection & Request state
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(user?.connectedWallet || null);
  const [latestRequest, setLatestRequest] = useState<WalletRequest | null>(null);

  // Interaction modes
  const [forceFormView, setForceFormView] = useState(false); // Used when clicking "Try Again"
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; title?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync connectedWallet from user context if updated
  useEffect(() => {
    if (user?.connectedWallet) {
      setConnectedWallet(user.connectedWallet);
    } else if (user && user.connectedWallet === null) {
      setConnectedWallet(null);
    }
  }, [user?.connectedWallet]);

  // Load status from backend / database when modal opens
  const fetchStatus = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    try {
      const data = await api.getUserWalletStatus();
      if (!isMountedRef.current) return;

      if (data.connectedWallet !== undefined) {
        setConnectedWallet(data.connectedWallet);
      }
      setLatestRequest(data.latestRequest);
    } catch (err) {
      console.warn('Error fetching wallet status:', err);
    } finally {
      if (isMountedRef.current) {
        setInitialLoading(false);
        if (showRefreshSpinner) setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      // Reset temporary states on close
      setShowUnlinkConfirm(false);
      setStatusMessage(null);
      setForceFormView(false);
      return;
    }

    setInitialLoading(true);
    fetchStatus();

    // Setup real-time Firestore listeners while modal is open
    let unsubUser: (() => void) | undefined;
    let unsubRequests: (() => void) | undefined;

    if (user?.id) {
      try {
        // Listen to user document for instantaneous connectedWallet changes
        unsubUser = onSnapshot(doc(db, 'users', user.id), (snapshot) => {
          if (!isMountedRef.current) return;
          if (snapshot.exists()) {
            const uData = snapshot.data();
            setConnectedWallet(uData.connectedWallet || null);
          }
        });

        // Listen to user's wallet_requests for instantaneous approval/rejection updates
        const qReqs = query(collection(db, 'wallet_requests'), where('userId', '==', user.id));
        unsubRequests = onSnapshot(qReqs, (snapshot) => {
          if (!isMountedRef.current) return;
          const reqs: WalletRequest[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as WalletRequest;
            if (data) reqs.push({ ...data, id: d.id });
          });
          if (reqs.length > 0) {
            reqs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setLatestRequest(reqs[0]);
          }
        });
      } catch (err) {
        console.warn('Firestore snapshot setup notice:', err);
      }
    }

    // Polling interval fallback every 3.5 seconds while open
    const interval = setInterval(() => {
      if (isMountedRef.current && isOpen) {
        fetchStatus(false);
      }
    }, 3500);

    return () => {
      if (unsubUser) unsubUser();
      if (unsubRequests) unsubRequests();
      clearInterval(interval);
    };
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  // Determine current display state:
  // 1. CONNECTED: if user has a verified connectedWallet
  // 2. PENDING: if latestRequest has status === 'pending' (and not in forced form view)
  // 3. REJECTED: if latestRequest has status === 'failed' (and not in forced form view)
  // 4. FORM: otherwise (new connection or "Try Again" flow)

  const isConnected = !!connectedWallet;
  const isPending = !isConnected && !forceFormView && latestRequest?.status === 'pending';
  const isRejected = !isConnected && !forceFormView && latestRequest?.status === 'failed';

  // Handle Form Submission (Submit new request)
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNotes.trim()) {
      setStatusMessage({
        type: 'error',
        title: 'Input Required',
        text: 'Please enter details or your wallet address in the input field.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await api.connectWallet({
        provider,
        customNotes: customNotes.trim(),
      });

      if (!isMountedRef.current) return;

      setLatestRequest(res.request);
      setForceFormView(false);
      setCustomNotes('');
      await refreshUser();

      setStatusMessage({
        type: 'success',
        title: 'Request Submitted',
        text: 'Your wallet connection request has been securely submitted. Please wait while your connection is being processed.',
      });
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setStatusMessage({
        type: 'error',
        title: 'Submission Failed',
        text: err.message || 'Unable to submit wallet connection request. Please try again.',
      });
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  // Handle Unlink Wallet
  const handleUnlink = async () => {
    setIsUnlinking(true);
    setStatusMessage(null);

    try {
      await api.unlinkWallet();
      if (!isMountedRef.current) return;

      setConnectedWallet(null);
      setLatestRequest(null);
      setShowUnlinkConfirm(false);
      setForceFormView(true);
      await refreshUser();

      setStatusMessage({
        type: 'success',
        title: 'WALLET UNLINKED',
        text: 'Your wallet has been successfully unlinked.',
      });
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setStatusMessage({
        type: 'error',
        title: 'Unlink Failed',
        text: err.message || 'Failed to unlink wallet. Please try again.',
      });
    } finally {
      if (isMountedRef.current) {
        setIsUnlinking(false);
      }
    }
  };

  // Handle "Try Again"
  const handleTryAgain = () => {
    setForceFormView(true);
    setStatusMessage(null);
  };

  // Truncate wallet address safely
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    if (addr.length <= 14) return addr;
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
  };

  const handleCopyAddress = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => {
      if (isMountedRef.current) setCopied(false);
    }, 2000);
  };

  return (
    <div
      id="connect-wallet-modal-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting && !isUnlinking) {
          onClose();
        }
      }}
    >
      <div
        id="connect-wallet-modal-content"
        className="bg-neutral-900 border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-neutral-100 animate-fadeIn my-auto max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-neutral-800 bg-neutral-950/60 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : isPending
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : isRejected
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              {isConnected ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isPending ? (
                <Clock className="w-5 h-5 animate-pulse" />
              ) : isRejected ? (
                <XCircle className="w-5 h-5" />
              ) : (
                <Wallet className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-400 leading-tight">
                {isConnected
                  ? 'WALLET CONNECTED'
                  : isPending
                  ? 'Connection Under Review'
                  : isRejected
                  ? 'WALLET NOT CONNECTED'
                  : 'Connect Wallet'}
              </h3>
              <p className="text-xs text-neutral-400">
                {isConnected
                  ? 'Active Web3 Synchronization'
                  : isPending
                  ? 'Verification in progress'
                  : isRejected
                  ? 'Review completed'
                  : 'Synchronize connection details & custom input'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              id="wallet-modal-refresh-btn"
              type="button"
              onClick={() => fetchStatus(true)}
              disabled={isRefreshing}
              className="p-2 text-neutral-400 hover:text-amber-400 rounded-xl hover:bg-neutral-800 transition-colors"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              id="wallet-modal-close-btn"
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-neutral-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Message Notification Banner */}
          {statusMessage && (
            <div
              id="wallet-status-alert"
              className={`p-3.5 rounded-xl text-xs flex items-start space-x-2.5 border transition-all ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-red-500/10 text-red-300 border-red-500/30'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                {statusMessage.title && <div className="font-bold mb-0.5">{statusMessage.title}</div>}
                <div>{statusMessage.text}</div>
              </div>
            </div>
          )}

          {/* Initial Loading State */}
          {initialLoading && (
            <div className="py-10 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs text-neutral-400">Verifying wallet status...</p>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* STATE 2 — APPROVED / CONNECTED                       */}
          {/* ---------------------------------------------------- */}
          {!initialLoading && isConnected && (
            <div id="state-wallet-connected" className="space-y-4 animate-fadeIn">
              {/* Clean Success Interface */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">WALLET CONNECTED</span>
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed font-medium">
                  Your wallet is connected and working successfully.
                </p>
              </div>

              {/* Connected Wallet Info Card */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-neutral-800/80">
                  <span className="text-neutral-400 font-medium">Provider</span>
                  <span className="font-bold text-neutral-200 flex items-center space-x-1.5">
                    <Wallet className="w-3.5 h-3.5 text-amber-400" />
                    <span>{connectedWallet?.provider || 'Web3 Wallet'}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pb-2 border-b border-neutral-800/80">
                  <span className="text-neutral-400 font-medium">Network</span>
                  <span className="font-semibold text-neutral-300">{connectedWallet?.network || 'Ethereum Mainnet'}</span>
                </div>

                {connectedWallet?.address && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400 font-medium">Public Address</span>
                      <button
                        type="button"
                        onClick={() => handleCopyAddress(connectedWallet.address)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center space-x-1 transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 font-mono text-[11px] text-neutral-300 break-all select-all">
                      {connectedWallet.address}
                    </div>
                  </div>
                )}

                {connectedWallet?.connectedAt && (
                  <div className="flex justify-between items-center text-[11px] pt-1 text-neutral-400">
                    <span>Connected On</span>
                    <span>{new Date(connectedWallet.connectedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Unlink Confirmation Dialog */}
              {showUnlinkConfirm ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3 animate-fadeIn">
                  <div className="flex items-center space-x-2 text-red-400 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Confirm Unlinking Wallet</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Are you sure you want to unlink your wallet? This will disconnect your Web3 wallet from your NETBYBIT account.
                    Your account balance, transactions, and security settings will remain unaffected.
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      id="cancel-unlink-btn"
                      type="button"
                      onClick={() => setShowUnlinkConfirm(false)}
                      disabled={isUnlinking}
                      className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-colors"
                    >
                      Keep Connected
                    </button>
                    <button
                      id="confirm-unlink-btn"
                      type="button"
                      onClick={handleUnlink}
                      disabled={isUnlinking}
                      className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-lg shadow-red-600/20"
                    >
                      {isUnlinking ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Unlinking...</span>
                        </>
                      ) : (
                        <span>Confirm Unlink</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    id="wallet-connected-done-btn"
                    type="button"
                    onClick={onClose}
                    className="w-full sm:flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs transition-colors"
                  >
                    Done
                  </button>
                  <button
                    id="unlink-wallet-btn"
                    type="button"
                    onClick={() => setShowUnlinkConfirm(true)}
                    className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 rounded-xl border border-neutral-700 hover:border-red-500/50 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 font-semibold text-xs transition-colors whitespace-nowrap"
                  >
                    Unlink Wallet
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* STATE 1 — PENDING                                    */}
          {/* ---------------------------------------------------- */}
          {!initialLoading && isPending && (
            <div id="state-wallet-pending" className="space-y-4 animate-fadeIn">
              {/* Notice Banner */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Connection Request Submitted
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
                  Your wallet connection request has been securely submitted. Please wait while your connection is being processed.
                </p>
              </div>

              {/* Request Details Card */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800/80">
                  <span className="text-neutral-400">Selected Provider</span>
                  <span className="font-bold text-neutral-200 flex items-center space-x-1.5">
                    <Wallet className="w-3.5 h-3.5 text-amber-400" />
                    <span>{latestRequest?.provider || 'MetaMask'}</span>
                  </span>
                </div>

                {latestRequest?.customNotes && (
                  <div className="space-y-1 pb-2 border-b border-neutral-800/80">
                    <span className="text-neutral-400">Submitted Details</span>
                    <div className="p-2.5 bg-neutral-900 rounded-lg font-mono text-[11px] text-neutral-300 break-all whitespace-pre-wrap">
                      {latestRequest.customNotes}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pb-2 border-b border-neutral-800/80">
                  <span className="text-neutral-400">Connection Status</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping mr-0.5" />
                    <span>Under Review</span>
                  </span>
                </div>

                {latestRequest?.date && (
                  <div className="flex justify-between items-center text-[11px] text-neutral-400">
                    <span>Submitted Date</span>
                    <span>{new Date(latestRequest.date).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Security & Processing note */}
              <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl text-[11px] text-neutral-400 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Once processed, your wallet will be connected automatically without requiring page refresh.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex space-x-2">
                <button
                  id="pending-refresh-btn"
                  type="button"
                  onClick={() => fetchStatus(true)}
                  disabled={isRefreshing}
                  className="w-1/2 min-h-[44px] py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Checking...' : 'Check Status'}</span>
                </button>
                <button
                  id="pending-close-btn"
                  type="button"
                  onClick={onClose}
                  className="w-1/2 min-h-[44px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-bold text-xs shadow-md hover:from-amber-400 hover:to-yellow-300 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* STATE 3 — CANCELLED / REJECTED                       */}
          {/* ---------------------------------------------------- */}
          {!initialLoading && isRejected && (
            <div id="state-wallet-rejected" className="space-y-4 animate-fadeIn">
              {/* Rejection Banner */}
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400">WALLET NOT CONNECTED</span>
                </div>
                <p className="text-xs text-red-200/90 leading-relaxed font-medium">
                  Your previous wallet connection request was not approved. You can try again.
                </p>
              </div>

              {/* Previous Attempt Summary */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800/80">
                  <span className="text-neutral-400">Previous Provider</span>
                  <span className="font-semibold text-neutral-200">{latestRequest?.provider || 'MetaMask'}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800/80">
                  <span className="text-neutral-400">Status</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                    Not Approved
                  </span>
                </div>
                {latestRequest?.date && (
                  <div className="flex justify-between items-center text-[11px] text-neutral-400">
                    <span>Reviewed Date</span>
                    <span>{new Date(latestRequest.updatedAt || latestRequest.date).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Try Again Action */}
              <div className="pt-2 flex space-x-2">
                <button
                  id="rejected-close-btn"
                  type="button"
                  onClick={onClose}
                  className="w-1/3 min-h-[44px] py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-colors"
                >
                  Close
                </button>
                <button
                  id="wallet-try-again-btn"
                  type="button"
                  onClick={handleTryAgain}
                  className="w-2/3 min-h-[44px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* STATE 0 — NOT CONNECTED / FORM SUBMISSION            */}
          {/* ---------------------------------------------------- */}
          {!initialLoading && !isConnected && !isPending && !isRejected && (
            <form onSubmit={handleConnect} className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">Select Wallet Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  {['MetaMask', 'Trust Wallet', 'WalletConnect', 'Coinbase Wallet'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProvider(p)}
                      className={`min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-semibold border text-left transition-all ${
                        provider === p
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Custom Notes / User Input
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Enter details..."
                  className="w-full min-h-[44px] bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  id="wallet-form-cancel-btn"
                  type="button"
                  onClick={onClose}
                  className="w-1/3 min-h-[44px] py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="wallet-connect-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 min-h-[44px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Connect Wallet Now</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
