import React, { useEffect, useState } from 'react';
import { X, ArrowRightLeft, RotateCcw, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { HexLogo } from './HexLogo';

interface VaultSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AssetKey = 'BTC' | 'ETH' | 'USDT' | 'SOL' | 'TRX';

interface VaultState {
  balances: Record<AssetKey, number>;
  history: Array<{
    id: string;
    pair: string;
    amount: string;
    timestamp: string;
  }>;
}

const STORAGE_KEY = 'netbybit_vault_sim_v1';

const ASSET_PRICES: Record<AssetKey, number> = {
  BTC: 87315,
  ETH: 3200,
  USDT: 1,
  SOL: 215,
  TRX: 0.24,
};

const ASSET_LABELS: Record<AssetKey, string> = {
  BTC: 'Bitcoin Vault',
  ETH: 'Ethereum MPC',
  USDT: 'Tether Treasury',
  SOL: 'Solana Staked',
  TRX: 'Tron Settlement',
};

const DEFAULT_VAULT_STATE: VaultState = {
  balances: {
    BTC: 112.4,
    ETH: 1240,
    USDT: 2060710,
    SOL: 4800,
    TRX: 1250000,
  },
  history: [
    {
      id: 'sim-init-1',
      pair: 'ETH → USDT',
      amount: '12.50 ETH settled to Treasury',
      timestamp: 'Initial Vault Baseline',
    },
  ],
};

function loadVaultState(): VaultState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VAULT_STATE;
    const parsed = JSON.parse(raw) as VaultState;
    if (parsed && parsed.balances && typeof parsed.balances.BTC === 'number') {
      return parsed;
    }
  } catch {
    // Fallback cleanly to default simulated state
  }
  return DEFAULT_VAULT_STATE;
}

export const VaultSimulatorModal: React.FC<VaultSimulatorModalProps> = ({ isOpen, onClose }) => {
  const [vault, setVault] = useState<VaultState>(() => loadVaultState());
  const [fromAsset, setFromAsset] = useState<AssetKey>('ETH');
  const [toAsset, setToAsset] = useState<AssetKey>('USDT');
  const [amountInput, setAmountInput] = useState('5');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [vault]);

  const totalUsd = (Object.keys(vault.balances) as AssetKey[]).reduce(
    (sum, key) => sum + vault.balances[key] * ASSET_PRICES[key],
    0
  );

  const parsedAmount = parseFloat(amountInput) || 0;
  const estimatedReceive =
    fromAsset === toAsset
      ? parsedAmount
      : (parsedAmount * ASSET_PRICES[fromAsset]) / ASSET_PRICES[toAsset];

  const handleSimulatedSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAsset === toAsset) {
      setFeedback('Select two different custody assets to convert.');
      return;
    }
    if (parsedAmount <= 0 || parsedAmount > vault.balances[fromAsset]) {
      setFeedback(`Enter a valid amount up to ${vault.balances[fromAsset].toLocaleString()} ${fromAsset}.`);
      return;
    }

    const nextBalances = {
      ...vault.balances,
      [fromAsset]: Number((vault.balances[fromAsset] - parsedAmount).toFixed(4)),
      [toAsset]: Number((vault.balances[toAsset] + estimatedReceive).toFixed(4)),
    };

    const nextEntry = {
      id: `sim-${Date.now()}`,
      pair: `${fromAsset} → ${toAsset}`,
      amount: `${parsedAmount.toLocaleString()} ${fromAsset} → ${estimatedReceive.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${toAsset}`,
      timestamp: new Date().toLocaleTimeString(),
    };

    setVault({
      balances: nextBalances,
      history: [nextEntry, ...vault.history].slice(0, 6),
    });
    setFeedback(`Simulated settlement complete: ${nextEntry.amount}`);
  };

  const handleReset = () => {
    setVault(DEFAULT_VAULT_STATE);
    setFeedback('Local custody simulation reset to baseline.');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Netbybit Custody Terminal Preview"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0a0816] border border-purple-500/35 shadow-[0_32px_90px_-15px_rgba(109,74,255,0.6)] p-6 sm:p-8 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
              <HexLogo size="sm" showTagline />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#14102b] border border-purple-500/30 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close custody terminal"
                  className="w-9 h-9 rounded-full bg-[#14102b] border border-purple-500/30 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Valuation Summary */}
            <div className="rounded-2xl bg-[#110e24] border border-purple-500/25 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-amber-300 font-semibold">
                  Interactive Front-End Vault Preview
                </div>
                <div className="mt-1 font-display text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
                  ${totalUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Simulated custody state persisted locally in browser storage. No network calls.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>3-of-5 MPC Quorum Policy</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Balances */}
              <div className="space-y-3">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-300">
                  Segregated Custody Balances
                </h3>
                <div className="space-y-2">
                  {(Object.keys(vault.balances) as AssetKey[]).map((key) => {
                    const usdVal = vault.balances[key] * ASSET_PRICES[key];
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-2xl bg-[#100d21] border border-purple-500/15 px-4 py-3"
                      >
                        <div>
                          <div className="text-sm font-bold text-white">{key}</div>
                          <div className="text-xs text-slate-400">{ASSET_LABELS[key]}</div>
                        </div>
                        <div className="text-right tabular-nums">
                          <div className="text-sm font-semibold text-white">
                            ${usdVal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </div>
                          <div className="text-xs font-mono text-amber-300/90">
                            {vault.balances[key].toLocaleString()} {key}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Simulated OTC Swap */}
              <div className="space-y-4">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-300">
                  Simulate Treasury Conversion
                </h3>
                <form onSubmit={handleSimulatedSwap} className="rounded-2xl bg-[#100d21] border border-purple-500/20 p-4 space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">From</label>
                      <select
                        value={fromAsset}
                        onChange={(e) => setFromAsset(e.target.value as AssetKey)}
                        className="w-full rounded-xl bg-[#080612] border border-purple-500/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                      >
                        {(Object.keys(ASSET_PRICES) as AssetKey[]).map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">To</label>
                      <select
                        value={toAsset}
                        onChange={(e) => setToAsset(e.target.value as AssetKey)}
                        className="w-full rounded-xl bg-[#080612] border border-purple-500/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                      >
                        {(Object.keys(ASSET_PRICES) as AssetKey[]).map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Amount ({fromAsset})</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="w-full rounded-xl bg-[#080612] border border-purple-500/30 px-3 py-2 text-sm text-white tabular-nums focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                    <span>Estimated Settlement</span>
                    <span className="font-mono font-semibold text-amber-300 tabular-nums">
                      {estimatedReceive.toLocaleString(undefined, { maximumFractionDigits: 4 })} {toAsset}
                    </span>
                  </div>

                  {feedback && (
                    <div className="flex items-center gap-2 text-xs text-emerald-300 pt-1">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{feedback}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full btn-netbybit py-2.5 px-4 rounded-full text-sm font-semibold text-white inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Execute Local Settlement</span>
                  </button>
                </form>

                {/* Recent Simulated Settlements */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Local Settlement Ledger
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {vault.history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs rounded-xl bg-[#100d21] border border-white/5 px-3 py-2"
                      >
                        <span className="font-medium text-white truncate pr-2">{item.amount}</span>
                        <span className="font-mono text-[11px] text-slate-400 shrink-0">
                          {item.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
