import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA, SupportedAsset } from '../types';
import { PageHeader } from '../components/PageHeader';
import { api } from '../lib/api';
import { User, Shield, KeyRound, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [withdrawalAddresses, setWithdrawalAddresses] = useState<Record<SupportedAsset, string>>(
    user?.withdrawalAddresses || {
      BTC: '',
      ETH: '',
      BNB: '',
      TRX: '',
      USDT_ERC20: '',
      USDT_TRC20: '',
    }
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.updateProfile({ name, username });
      await api.updateWithdrawalAddresses(withdrawalAddresses);
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile details and withdrawal addresses updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Profile update failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Page Header with Back Button */}
      <PageHeader
        title="User Account Profile"
        subtitle="Manage personal credentials, account identity, and registered custody withdrawal addresses"
        icon={User}
        badge={user.role === 'admin' ? 'Administrator' : 'Verified Custody Account'}
        badgeType={user.role === 'admin' ? 'gold' : 'emerald'}
      />

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {message && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center space-x-3 shadow-lg ${
              message.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                : 'bg-red-500/15 text-red-300 border border-red-500/40'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Identity Information Card */}
        <div className="p-6 bg-neutral-900/95 border border-neutral-800 rounded-3xl space-y-5 shadow-xl backdrop-blur-xl">
          <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Account Identification</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Email Address</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full bg-neutral-950/80 border border-neutral-800/80 rounded-2xl px-4 py-3 text-xs text-neutral-400 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Username / Alias</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Optional username"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Account Role</label>
              <div className="w-full bg-neutral-950/80 border border-neutral-800/80 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-amber-400 uppercase">
                {user.role}
              </div>
            </div>
          </div>
        </div>

        {/* Registered Withdrawal Addresses Card */}
        <div className="p-6 bg-neutral-900/95 border border-neutral-800 rounded-3xl space-y-5 shadow-xl backdrop-blur-xl">
          <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Saved Withdrawal Whitelist Addresses</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Configure default outbound destination addresses for fast withdrawal routing.
          </p>

          <div className="space-y-4 pt-2">
            {Object.values(ASSET_METADATA).map((asset) => (
              <div key={asset.id}>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {asset.name} ({asset.symbol} - {asset.network})
                </label>
                <input
                  type="text"
                  value={withdrawalAddresses[asset.id] || ''}
                  onChange={(e) =>
                    setWithdrawalAddresses({
                      ...withdrawalAddresses,
                      [asset.id]: e.target.value,
                    })
                  }
                  placeholder={`Enter destination ${asset.network} address`}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99]"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Saving Changes...' : 'Save Profile & Whitelist Addresses'}</span>
        </button>
      </form>
    </div>
  );
};
