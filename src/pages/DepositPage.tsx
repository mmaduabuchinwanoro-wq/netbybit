import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA, SupportedAsset } from '../types';
import { CryptoIcon } from '../components/CryptoIcon';
import { BuyCryptoModal } from '../components/BuyCryptoModal';
import { PageHeader } from '../components/PageHeader';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowDownLeft,
  Copy,
  Check,
  ShieldCheck,
  Info,
  CreditCard,
  Layers,
  CheckCircle2,
  Lock,
  Radio,
} from 'lucide-react';

export const DepositPage: React.FC = () => {
  const { user, depositAddresses } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset>('BTC');
  const [copied, setCopied] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  const assetInfo = ASSET_METADATA[selectedAsset];
  const currentAddress = depositAddresses[selectedAsset] || assetInfo.defaultAddress;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Institutional Page Header with Back Navigation */}
      <PageHeader
        title="Deposit & Custody Inflow"
        subtitle="Generate dedicated institutional vault addresses for real-time cryptographic asset custody"
        icon={ArrowDownLeft}
        badge="Multi-Sig Vault"
        badgeType="gold"
        actions={
          <button
            onClick={() => setIsBuyModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center justify-center space-x-2 shrink-0 transform hover:-translate-y-0.5"
          >
            <CreditCard className="w-4 h-4 text-neutral-950" />
            <span>Buy Crypto with Card / Fiat</span>
          </button>
        }
      />

      {/* Asset Selection Tabs */}
      <div>
        <label className="block text-xs font-semibold text-neutral-400 mb-2.5 uppercase tracking-wider">
          Select Asset & Settlement Network
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {Object.values(ASSET_METADATA).map((asset) => {
            const isSelected = selectedAsset === asset.id;
            return (
              <button
                key={asset.id}
                onClick={() => setSelectedAsset(asset.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                    : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <CryptoIcon asset={asset.id} size="sm" />
                <div className="overflow-hidden">
                  <span className="font-bold text-xs block truncate">{asset.symbol}</span>
                  <span className="text-[9px] opacity-75 truncate block font-mono">{asset.network}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Deposit Address & QR Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-neutral-900/95 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* QR Code Column */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-neutral-950/90 border border-neutral-800 rounded-2xl space-y-4 shadow-inner">
          <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-amber-500/20">
            <QRCodeSVG value={currentAddress} size={175} level="H" />
          </div>
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Node Ingress Active</span>
            </div>
            <span className="text-xs font-bold text-neutral-200 block">{assetInfo.name}</span>
            <span className="text-[10px] text-amber-400 font-mono block font-bold">{assetInfo.network} Network</span>
            <p className="text-[10px] text-neutral-500 max-w-[220px] leading-relaxed">
              Scan with hardware cold storage or exchange wallet to deposit
            </p>
          </div>
        </div>

        {/* Address Details Column */}
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                Official Custody Address
              </span>
            </div>
            <div className="flex items-center space-x-3 pt-1">
              <CryptoIcon asset={assetInfo.id} size="lg" showNetworkBadge />
              <div>
                <h3 className="text-xl font-extrabold text-neutral-100">{assetInfo.name} ({assetInfo.symbol})</h3>
                <span className="text-xs text-amber-400 font-mono font-semibold">{assetInfo.network} Protocol</span>
              </div>
            </div>
            <p className="text-xs text-neutral-400 pt-1 leading-relaxed">
              Transfer only <strong className="text-neutral-100">{assetInfo.symbol}</strong> via the{' '}
              <strong className="text-amber-300">{assetInfo.network}</strong> network to this dedicated vault address.
            </p>
          </div>

          {/* Copyable Address Container */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-neutral-400">Institutional Deposit Address</label>
              <span className="text-[10px] font-mono text-neutral-500">Tier-1 Cold Multi-Sig</span>
            </div>
            <div className="flex items-center space-x-2 bg-neutral-950 border border-amber-500/40 rounded-2xl p-3.5 font-mono text-xs text-neutral-100 break-all shadow-inner">
              <span className="flex-1 text-amber-300 font-bold select-all leading-relaxed">{currentAddress}</span>
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center space-x-1.5 shrink-0 transition-all shadow-md shadow-amber-500/20 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Node Monitoring Notice (Replaces simulated transfer form) */}
          <div className="p-4 bg-neutral-950/80 border border-amber-500/20 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
              <Radio className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
              <span>Automated On-Chain Node Settlement</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Inflows to this vault address are detected automatically by NETBYBIT's custody nodes. For safety and regulatory governance, each incoming transfer undergoes confirmation verification and strict compliance approval before settlement.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono text-neutral-400">
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5">
                <span className="text-neutral-500 block text-[10px]">Min. Inflow:</span>
                <span className="text-neutral-200 font-bold">0.0001 {assetInfo.symbol}</span>
              </div>
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5">
                <span className="text-neutral-500 block text-[10px]">Block Confirmations:</span>
                <span className="text-amber-400 font-bold">2 Confirmations</span>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-neutral-950/50 border border-neutral-800/80 text-xs text-neutral-400">
            <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed">
              Sending assets other than {assetInfo.symbol} or using an incompatible network may result in loss. Contact institutional support if you require custom custody contract routes.
            </span>
          </div>
        </div>
      </div>

      <BuyCryptoModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        defaultAsset={selectedAsset}
      />
    </div>
  );
};
