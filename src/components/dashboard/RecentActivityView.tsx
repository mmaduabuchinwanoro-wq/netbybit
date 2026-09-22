import React from 'react';
import { History, ArrowUpRight, ArrowDownLeft, Repeat, Send, QrCode } from 'lucide-react';
import { CryptoIcon } from '../CryptoIcon';
import { Transaction, CryptoPrice } from '../../types';

interface RecentActivityViewProps {
  recentTxs: Transaction[];
  prices: CryptoPrice[];
  getValidAssetPrice: (assetId: string) => number;
  formatFiat: (usdAmount: number) => { amount: number; formatted: string; symbol: string; code: string };
  selectedCurrency: string;
  onOpenHistory: () => void;
  onMakeDeposit: () => void;
}

export const RecentActivityView: React.FC<RecentActivityViewProps> = ({
  recentTxs,
  prices,
  getValidAssetPrice,
  formatFiat,
  selectedCurrency,
  onOpenHistory,
  onMakeDeposit,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-[#0e1015] border border-neutral-800/80 space-y-4 shadow-xl">
      <div className="flex justify-between items-center border-b border-neutral-800/80 pb-4">
        <div className="flex items-center space-x-2.5">
          <History className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-neutral-100">Recent Transaction Activity</h3>
          <span className="text-[11px] font-mono text-neutral-400">({recentTxs.length})</span>
        </div>
        <button
          onClick={onOpenHistory}
          className="text-xs text-amber-400 hover:text-amber-300 hover:underline font-bold transition-colors"
        >
          View Full History →
        </button>
      </div>

      {recentTxs.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="inline-flex p-3 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-500">
            <History className="w-5 h-5" />
          </div>
          <p className="text-xs text-neutral-400 font-medium">No transactions recorded yet</p>
          <button
            onClick={onMakeDeposit}
            className="text-xs text-amber-400 font-bold hover:underline"
          >
            Make your first deposit
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Asset</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Est. Fiat Value ({selectedCurrency})</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900 text-xs text-neutral-200 font-mono">
              {recentTxs.map((tx) => {
                const priceObj = prices.find((p) => p.id === tx.asset);
                const priceUsd = priceObj?.price || getValidAssetPrice(tx.asset);
                const fiatVal = formatFiat(tx.amount * priceUsd);

                const isReceiveOrDeposit =
                  tx.type === 'deposit' || tx.type === 'receive' || tx.type === 'credit';
                const isWithdrawOrSend = tx.type === 'withdraw' || tx.type === 'send';
                const isSwap = tx.type === 'swap';

                const isCompleted =
                  tx.status === 'completed' ||
                  (tx.status as string) === 'Successful' ||
                  (tx.status as string) === 'successful' ||
                  (tx.status as string) === 'approved' ||
                  (tx.status as string) === 'success';
                const isPending = tx.status === 'pending' || (tx.status as string) === 'processing';

                return (
                  <tr key={tx.id} className="hover:bg-neutral-950/60 transition-colors">
                    <td className="py-3 px-3 capitalize font-bold font-sans">
                      <div className="flex items-center space-x-2">
                        {isReceiveOrDeposit && <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />}
                        {isWithdrawOrSend && <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />}
                        {isSwap && <Repeat className="w-3.5 h-3.5 text-amber-400" />}
                        <span className={isReceiveOrDeposit ? 'text-emerald-400' : 'text-neutral-200'}>
                          {isReceiveOrDeposit
                            ? 'Received'
                            : tx.type === 'withdraw'
                            ? 'Withdrawal'
                            : tx.type === 'send'
                            ? 'Sent'
                            : isSwap
                            ? 'Swap'
                            : tx.type}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {isSwap ? (
                        <div className="flex items-center space-x-1.5 font-mono text-xs">
                          <CryptoIcon asset={tx.fromAsset || tx.asset} size="xs" />
                          <span className="font-bold text-amber-300">{tx.fromAsset || tx.asset}</span>
                          <span className="text-neutral-500 font-bold">➔</span>
                          <CryptoIcon asset={tx.toAsset || 'USDT'} size="xs" />
                          <span className="font-bold text-emerald-400">{tx.toAsset || 'USDT'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CryptoIcon asset={tx.asset} size="xs" />
                          <span className="font-sans font-bold text-neutral-100">{tx.asset}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold font-mono">
                      {isSwap ? (
                        <span className="text-amber-300">
                          {tx.amount} {tx.fromAsset || tx.asset}
                        </span>
                      ) : (
                        <span className={isWithdrawOrSend ? 'text-neutral-200' : 'text-emerald-400'}>
                          {isWithdrawOrSend ? '-' : '+'}
                          {tx.amount} {tx.asset}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-neutral-300 font-bold font-mono">
                      {fiatVal.formatted}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border inline-flex items-center space-x-1 ${
                          isPending
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {isPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1" />}
                        <span>{isPending ? 'Pending' : isCompleted ? 'Successful' : 'Cancelled'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-neutral-400 text-[11px] font-sans">
                      {new Date(tx.date).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
