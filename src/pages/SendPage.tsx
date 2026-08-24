import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA, SupportedAsset } from '../types';
import { CryptoIcon } from '../components/CryptoIcon';
import { PageHeader } from '../components/PageHeader';
import { api } from '../lib/api';
import { Send, CheckCircle2, AlertCircle, Shield, Clock, Lock } from 'lucide-react';

export const SendPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset>('USDT_ERC20');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const assetInfo = ASSET_METADATA[selectedAsset];
  const currentBalance = user.balances[selectedAsset] || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    if (parsedAmount > currentBalance) {
      setMessage({ type: 'error', text: `Insufficient balance (${currentBalance} ${selectedAsset})` });
      return;
    }

    if (!recipient.trim()) {
      setMessage({ type: 'error', text: 'Please enter recipient email or wallet address' });
      return;
    }

    // Network Fee Validation
    if (selectedAsset === 'USDT_ERC20' && (user.balances['ETH'] || 0) < 1) {
      setMessage({
        type: 'error',
        text: 'Network Fee Required: Insufficient Ethereum (ETH) balance. Kindly deposit Ethereum to cover the network fees.',
      });
      return;
    }

    if (selectedAsset === 'USDT_TRC20' && (user.balances['TRX'] || 0) < 10000) {
      setMessage({
        type: 'error',
        text: 'Network Fee Required: Insufficient Tron (TRX) balance. Kindly deposit Tron to cover the network fees.',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await api.createTransaction({
        type: 'send',
        asset: selectedAsset,
        amount: parsedAmount,
        destinationAddress: recipient.trim(),
      });

      await refreshUser();
      setMessage({
        type: 'success',
        text: `Send request of ${parsedAmount} ${selectedAsset} to ${recipient} submitted successfully.`,
      });
      setAmount('');
      setRecipient('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Send transaction failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-12">
      {/* Page Header with Back Button */}
      <PageHeader
        title="Send Crypto"
        subtitle="Transfer assets securely to external addresses or NETBYBIT verified users"
        icon={Send}
      />

      <div className="bg-neutral-900/95 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

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

        {/* Asset Selection */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-2.5 uppercase tracking-wider">
            Select Asset
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.values(ASSET_METADATA).map((a) => {
              const isSelected = selectedAsset === a.id;
              const bal = user.balances[a.id] || 0;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedAsset(a.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  <CryptoIcon asset={a.id} size="sm" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-xs truncate">{a.symbol}</p>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate">
                      Bal: <span className="text-amber-400 font-semibold">{bal.toFixed(4)}</span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-neutral-950/90 border border-neutral-800 rounded-2xl flex justify-between items-center text-xs shadow-inner">
            <div className="flex items-center space-x-3">
              <CryptoIcon asset={selectedAsset} size="md" showNetworkBadge />
              <div>
                <span className="text-neutral-500 block text-[11px]">Available Vault Balance</span>
                <span className="font-bold font-mono text-neutral-100 text-sm">
                  {currentBalance.toFixed(4)} {assetInfo.symbol}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAmount(currentBalance.toString())}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs hover:bg-amber-500/20 font-mono transition-all"
            >
              MAX
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Recipient Address / Email</label>
            <input
              type="text"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter destination address or email..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Transfer Amount</label>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
              />
              <span className="absolute right-4 top-3 text-xs text-amber-400 font-bold font-mono">
                {assetInfo.symbol}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-950/80 border border-neutral-800 rounded-2xl space-y-1 text-[11px] text-neutral-400">
            <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Multi-Sig Protection</span>
            </div>
            <p className="leading-relaxed">
              Outbound transfer requests are verified cryptographically and dispatched securely to the destination network.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99]"
          >
            <span>{loading ? 'Processing Transfer...' : `Send ${amount || '0'} ${assetInfo.symbol}`}</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
