import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  Settings,
  Shield,
  Key,
  Bell,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Smartphone,
  Lock,
  RefreshCw,
  X,
  ShieldCheck,
  QrCode,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, calculateTotalUsdBalance } = useAuth();

  // 2FA state
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);
  const [loading2FA, setLoading2FA] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Disable 2FA state
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState<string | null>(null);

  if (!user) return null;

  const totalUsdBalance = calculateTotalUsdBalance();
  const is2FAEnabled = !!user.twoFactorEnabled;

  // Step 1: Start 2FA Setup (Fetch QR Code URI & Secret)
  const handleStart2FASetup = async () => {
    setLoading2FA(true);
    setSetupError(null);
    setSetupSuccess(null);
    try {
      const data = await api.setup2FA();
      setSetupData(data);
      setIsSettingUp2FA(true);
    } catch (err: any) {
      setSetupError(err.message || 'Failed to initialize 2FA setup');
    } finally {
      setLoading2FA(false);
    }
  };

  // Step 2: Confirm 2FA Setup with 6-digit code
  const handleConfirm2FAEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);
    setSetupSuccess(null);

    const cleanCode = verificationCode.trim().replace(/\s+/g, '');
    if (!cleanCode || cleanCode.length !== 6) {
      setSetupError('Please enter a valid 6-digit code from your authenticator app.');
      return;
    }

    setLoading2FA(true);
    try {
      const res = await api.enable2FA(cleanCode);
      setSetupSuccess(res.message || 'Two-Factor Authentication enabled successfully!');
      await refreshUser();
      setTimeout(() => {
        setIsSettingUp2FA(false);
        setSetupData(null);
        setVerificationCode('');
      }, 1500);
    } catch (err: any) {
      setSetupError(err.message || 'Invalid 2FA code. Please try again.');
    } finally {
      setLoading2FA(false);
    }
  };

  // Disable 2FA
  const handleConfirm2FADisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableError(null);

    const cleanCode = disableCode.trim().replace(/\s+/g, '');
    if (!cleanCode) {
      setDisableError('Please enter your current 6-digit 2FA code.');
      return;
    }

    setLoading2FA(true);
    try {
      await api.disable2FA(cleanCode);
      await refreshUser();
      setShowDisableModal(false);
      setDisableCode('');
      setIsSettingUp2FA(false);
    } catch (err: any) {
      setDisableError(err.message || 'Failed to disable 2FA');
    } finally {
      setLoading2FA(false);
    }
  };

  // Copy secret key
  const handleCopySecretKey = () => {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex items-center space-x-3 border-b border-neutral-800 pb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
          <Settings className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-100">Security & Preferences</h1>
          <p className="text-xs text-neutral-400">NETBYBIT Custody Platform Security & Settings</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* TWO-FACTOR AUTHENTICATION CARD */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
                <span>Two-Factor Authentication (2FA) Code Requirement</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  DISABLED / NOT REQUIRED
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                2FA verification codes are completely disabled across all user and admin workflows, allowing instant friction-free logins and withdrawals.
              </p>
            </div>
          </div>
        </div>

        {/* DISABLE 2FA MODAL */}
        {showDisableModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Disable Two-Factor Authentication</span>
                </div>
                <button
                  onClick={() => setShowDisableModal(false)}
                  className="text-neutral-500 hover:text-neutral-300 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Enter the current 6-digit TOTP code from your authenticator app to confirm turning off 2FA protection.
              </p>

              {disableError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{disableError}</span>
                </div>
              )}

              <form onSubmit={handleConfirm2FADisable} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">6-Digit 2FA Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-center font-mono text-amber-400 text-lg tracking-[0.4em] focus:outline-none focus:border-red-500/50"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading2FA || disableCode.length !== 6}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    {loading2FA ? 'Disabling...' : 'Confirm Disable 2FA'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisableModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-semibold text-xs hover:bg-neutral-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EMAIL NOTIFICATION CARD */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <Bell className="w-4 h-4" />
            <span>Email Notification Dispatch</span>
          </div>
          <p className="text-xs text-neutral-400">
            Automatic email dispatch to registered user address ({user.email}) whenever account balances are credited or transaction receipts are generated.
          </p>
          <span className="inline-block text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded font-bold">
            Status: Email Dispatch Enabled
          </span>
        </div>

        {/* PLATFORM METADATA */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <Key className="w-4 h-4" />
            <span>Platform Metadata</span>
          </div>
          <div className="text-xs text-neutral-400 space-y-1 font-mono">
            <p>Custody Domain: https://netbybit.web.app</p>
            <p>Account Type: {user.role.toUpperCase()} TRADER</p>
            <p>System Encryption: AES-256 + TOTP RFC 6238 + JWT Bearer Validation</p>
          </div>
        </div>

        {/* Account & Login Preservation */}
        <div className="p-6 bg-neutral-900/90 border border-emerald-500/30 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <Shield className="w-4 h-4" />
            <span>Account & Login Permanent Preservation</span>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            All user accounts, login histories, and transaction records are permanently saved and protected on the NETBYBIT platform. Account deletion is strictly disabled to maintain complete security and audit trail integrity for all registered users.
          </p>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1">
            <div className="flex items-center space-x-2 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Permanent Account Protection Active</span>
            </div>
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              Your login credentials, account balances, and security activity are permanently saved. No user account can be deleted or removed from system databases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
