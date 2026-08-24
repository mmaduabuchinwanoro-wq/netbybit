import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';
import {
  Settings,
  Shield,
  Key,
  Bell,
  CheckCircle2,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Page Header with Back Button */}
      <PageHeader
        title="Security & System Preferences"
        subtitle="Manage cryptographic vault security policies and dispatch preferences"
        icon={Settings}
        badge="Vault Preferences"
        badgeType="gold"
      />

      <div className="space-y-6">
        {/* TWO-FACTOR AUTHENTICATION CARD */}
        <div className="p-6 bg-neutral-900/95 border border-neutral-800 rounded-3xl space-y-4 shadow-xl relative overflow-hidden backdrop-blur-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
                <span>Two-Factor Authentication (2FA) Code Requirement</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                  DISABLED / NOT REQUIRED
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                2FA verification codes are completely disabled across all user and admin workflows, allowing instant friction-free logins and access.
              </p>
            </div>
          </div>
        </div>

        {/* EMAIL NOTIFICATION CARD */}
        <div className="p-6 bg-neutral-900/95 border border-neutral-800 rounded-3xl space-y-3 shadow-xl backdrop-blur-xl">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <Bell className="w-4 h-4" />
            <span>Email Notification Dispatch</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Automatic email dispatch to registered user address (<span className="text-neutral-200 font-mono">{user.email}</span>) whenever account balances are credited, adjusted, or transaction receipts are generated.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center space-x-1.5 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Real-Time Audit Dispatch Active</span>
            </span>
          </div>
        </div>

        {/* CUSTODY AUDIT POLICY CARD */}
        <div className="p-6 bg-neutral-900/95 border border-neutral-800 rounded-3xl space-y-3 shadow-xl backdrop-blur-xl">
          <div className="flex items-center space-x-2 text-neutral-100 font-bold text-sm">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Manual Compliance & Admin Approval Requirement</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            All user transactions (withdrawals, sends, and swaps) are subjected to strict administrative manual approval and multi-sig compliance review before on-chain execution.
          </p>
          <div className="pt-1">
            <span className="inline-flex items-center space-x-1.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Compliance Guard Active</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
