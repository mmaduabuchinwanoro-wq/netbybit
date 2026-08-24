import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Transaction } from '../types';
import { CryptoIcon } from '../components/CryptoIcon';
import { PageHeader } from '../components/PageHeader';
import { api } from '../lib/api';
import { History, Search, ArrowDownLeft, ArrowUpRight, Send, QrCode, Repeat, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const TransactionHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.getTransactions()
        .then((txs) => setTransactions(txs))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const filtered = transactions.filter((t) => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch =
      t.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.destinationAddress && t.destinationAddress.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'withdraw':
        return <ArrowUpRight className="w-4 h-4 text-amber-400" />;
      case 'send':
        return <Send className="w-4 h-4 text-blue-400" />;
      case 'swap':
        return <Repeat className="w-4 h-4 text-purple-400" />;
      default:
        return <QrCode className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Page Header with Back Button */}
      <PageHeader
        title="Transaction History"
        subtitle="Complete institutional audit log of deposits, withdrawals, transfers, and swaps"
        icon={History}
        badge="Audited Custody Records"
        badgeType="gold"
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by asset, TX hash, address..."
            className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1.5 bg-neutral-900/90 p-1.5 border border-neutral-800 rounded-2xl overflow-x-auto w-full sm:w-auto">
          {['all', 'deposit', 'withdraw', 'send', 'swap'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-1.5 rounded-xl text-xs capitalize font-bold transition-all ${
                filterType === type
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-neutral-900/95 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="text-center py-16 text-xs text-neutral-400 flex items-center justify-center space-x-2">
            <Clock className="w-4 h-4 animate-spin text-amber-400" />
            <span>Loading transaction ledger...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-xs text-neutral-500">
            No transactions match the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/80 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider font-mono">
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Asset</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Hash / Destination</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-xs text-neutral-200 font-mono">
                {filtered.map((tx) => {
                  const isPending = tx.status === 'pending';
                  const isCompleted = tx.status === 'completed';
                  const isFailed = tx.status === 'failed' || tx.status === 'declined';

                  return (
                    <tr key={tx.id} className="hover:bg-neutral-950/50 transition-colors">
                      <td className="py-4 px-4 font-sans flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 shrink-0">
                          {getIcon(tx.type)}
                        </div>
                        <span className="capitalize font-bold text-neutral-100">{tx.type}</span>
                      </td>
                      <td className="py-4 px-4 font-sans">
                        <div className="flex items-center space-x-2">
                          <CryptoIcon asset={tx.asset} size="xs" />
                          <span className="font-mono font-semibold">{tx.asset}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-neutral-100 font-mono">
                        {tx.amount} {tx.asset}
                      </td>
                      <td className="py-4 px-4 text-[11px] text-neutral-400">
                        <div className="truncate max-w-[150px] font-mono select-all" title={tx.destinationAddress || tx.txHash}>
                          {tx.destinationAddress || tx.txHash}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-sans">
                        {isPending ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>Pending Admin Review</span>
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Settled & Approved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-500/15 text-red-400 border border-red-500/30">
                            <XCircle className="w-3 h-3 text-red-400" />
                            <span>Declined</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-neutral-400 text-[11px] font-mono">
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
    </div>
  );
};
