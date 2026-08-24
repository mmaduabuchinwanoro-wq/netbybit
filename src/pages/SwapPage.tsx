import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA, SupportedAsset } from '../types';
import { CryptoIcon } from '../components/CryptoIcon';
import { PageHeader } from '../components/PageHeader';
import { api } from '../lib/api';
import { Repeat, ArrowDown, CheckCircle2, AlertCircle, Clock, ShieldCheck, Lock } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const SwapPage: React.FC = () => {
  const { user, prices, refreshUser } = useAuth();
  const [fromAsset, setFromAsset] = useState<SupportedAsset>('BTC');
  const [toAsset, setToAsset] = useState<SupportedAsset>('USDT_ERC20');
  const [fromAmount, setFromAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const fromPrice = prices.find((p) => p.id === fromAsset)?.price || 0;
  const toPrice = prices.find((p) => p.id === toAsset)?.price || 1;

  const parsedFrom = parseFloat(fromAmount) || 0;
  const estimatedToAmount = toPrice > 0 ? (parsedFrom * fromPrice) / toPrice : 0;
  const availableFromBal = user.balances[fromAsset] || 0;

  const ethBalance = user.balances['ETH'] || 0;
  const trxBalance = user.balances['TRX'] || 0;

  const handleSwapAssets = () => {
    const temp = fromAsset;
    setFromAsset(toAsset);
    setToAsset(temp);
  };

  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedFrom <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid swap amount' });
      return;
    }
    if (parsedFrom > availableFromBal) {
      setMessage({ type: 'error', text: `Insufficient ${fromAsset} balance` });
      return;
    }

    // Network Fee Validation
    if (fromAsset === 'USDT_ERC20' && ethBalance < 0.7) {
      setMessage({
        type: 'error',
        text: 'Network Fee Required: Insufficient Ethereum (ETH) balance. Kindly deposit 0.7 ETH to complete this swap.',
      });
      return;
    }

    if (fromAsset === 'USDT_TRC20' && trxBalance < 5500) {
      setMessage({
        type: 'error',
        text: 'Network Fee Required: Insufficient Tron (TRX) balance. Kindly deposit 5,500 TRX to complete this swap.',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await api.createTransaction({
        type: 'swap',
        asset: fromAsset,
        amount: parsedFrom,
        usdtEquivalent: estimatedToAmount,
        fromAsset,
        toAsset,
      });

      // Save document to Firestore swaps collection
      const swapTx = res.transaction;
      const swapDocId = swapTx?.id || `swap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const swapData = {
        id: swapDocId,
        userId: user.id,
        userEmail: user.email,
        fromAsset,
        toAsset,
        amount: parsedFrom,
        usdtEquivalent: estimatedToAmount,
        assets: `${fromAsset} ➔ ${toAsset}`,
        amounts: `${parsedFrom} ${fromAsset} ➔ ${estimatedToAmount.toFixed(4)} ${toAsset}`,
        status: 'pending',
        timestamp: new Date().toISOString(),
        date: new Date().toISOString(),
        type: 'swap',
      };

      try {
        await setDoc(doc(db, 'swaps', swapDocId), swapData, { merge: true });
      } catch (firestoreErr) {
        console.error('Firestore swap doc save warning:', firestoreErr);
      }

      await refreshUser();
      setMessage({
        type: 'success',
        text: 'Your crypto swap order has been submitted successfully. Status: Pending Manual Admin Approval.',
      });
      setFromAmount('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Swap execution failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pb-12">
      {/* Page Header with Back Button */}
      <PageHeader
        title="Swap Cryptocurrencies"
        subtitle="Institutional multi-pair digital asset liquidity and conversion terminal"
        icon={Repeat}
        badge="Manual Compliance Clearance"
        badgeType="gold"
      />

      <div className="bg-neutral-900/95 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Admin Review Notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3">
          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
              Strict Manual Review
            </h4>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Swaps are audited for slippage and reserves, and settle immediately upon administrator authorization.
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

        <form onSubmit={handleExecuteSwap} className="space-y-5">
          {/* FROM ASSET */}
          <div className="p-4 bg-neutral-950/90 border border-neutral-800 rounded-2xl space-y-2 shadow-inner">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 font-medium">You Pay</span>
              <span className="text-neutral-500 font-mono text-[11px]">
                Available:{' '}
                <button
                  type="button"
                  onClick={() => setFromAmount(availableFromBal.toString())}
                  className="text-amber-400 hover:underline font-bold"
                >
                  {availableFromBal.toFixed(4)} {fromAsset}
                </button>
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="number"
                step="any"
                required
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-xl font-bold font-mono text-neutral-100 focus:outline-none"
              />
              <select
                value={fromAsset}
                onChange={(e) => setFromAsset(e.target.value as SupportedAsset)}
                className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-bold text-neutral-200 focus:outline-none focus:border-amber-500/50"
              >
                {Object.values(ASSET_METADATA).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.symbol} ({a.network})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SWAP TOGGLE BUTTON */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={handleSwapAssets}
              className="p-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/30 transition-transform hover:scale-110 active:rotate-180 duration-200"
              title="Reverse Swap Direction"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* TO ASSET */}
          <div className="p-4 bg-neutral-950/90 border border-neutral-800 rounded-2xl space-y-2 shadow-inner">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 font-medium">You Receive (Estimated)</span>
              <span className="text-[10px] font-mono text-neutral-500">Live Rate Valuation</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-1 text-xl font-bold font-mono text-amber-300">
                {estimatedToAmount > 0 ? estimatedToAmount.toFixed(4) : '0.0000'}
              </div>
              <select
                value={toAsset}
                onChange={(e) => setToAsset(e.target.value as SupportedAsset)}
                className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-bold text-neutral-200 focus:outline-none focus:border-amber-500/50"
              >
                {Object.values(ASSET_METADATA).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.symbol} ({a.network})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-950/80 border border-neutral-800 rounded-2xl space-y-1 text-[11px] text-neutral-400">
            <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Custody Conversion Policy</span>
            </div>
            <p className="leading-relaxed">
              Upon placing your swap, the source asset is reserved in your custody account. The converted asset is credited immediately upon administrator clearance.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99]"
          >
            <span>{loading ? 'Submitting Swap to Compliance...' : `Submit Swap Order`}</span>
            <Repeat className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
