import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA, SupportedAsset } from '../types';
import { CryptoIcon } from '../components/CryptoIcon';
import { PageHeader } from '../components/PageHeader';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, Shield, Radio, Info } from 'lucide-react';

export const ReceivePage: React.FC = () => {
  const { user, depositAddresses } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset>('BTC');
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const assetInfo = ASSET_METADATA[selectedAsset];
  const address = depositAddresses[selectedAsset] || assetInfo.defaultAddress;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-12">
      {/* Page Header with Back Button */}
      <PageHeader
        title="Receive Crypto"
        subtitle="Dedicated multi-chain addresses for receiving institutional digital asset transfers"
        icon={QrCode}
        badge="Vault Ingress"
        badgeType="gold"
      />

      <div className="bg-neutral-900/95 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Asset Selector */}
        <div>
          <label className="block text-xs font-semibold text-neutral-400 mb-2.5 uppercase tracking-wider text-left">
            Select Asset
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {Object.values(ASSET_METADATA).map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAsset(a.id)}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedAsset === a.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                {a.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* QR Code Container */}
        <div className="p-5 bg-white rounded-3xl inline-block mx-auto shadow-2xl border-4 border-amber-500/20">
          <QRCodeSVG value={address} size={185} level="H" />
        </div>

        <div className="space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 font-mono block">
              {assetInfo.name} ({assetInfo.network} Network)
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Node Online</span>
            </span>
          </div>

          <div className="bg-neutral-950 border border-amber-500/30 rounded-2xl p-3.5 font-mono text-xs text-neutral-200 select-all break-all shadow-inner">
            {address}
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Address Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Vault Address</span>
              </>
            )}
          </button>
        </div>

        <div className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-2xl text-[11px] text-neutral-400 text-left space-y-1">
          <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
            <Info className="w-3.5 h-3.5" />
            <span>Settlement Requirements</span>
          </div>
          <p className="leading-relaxed">
            Send only {assetInfo.symbol} on the {assetInfo.network} network. Deposits are verified on-chain and credited to your balance following automated node confirmation and administrator compliance clearance.
          </p>
        </div>
      </div>
    </div>
  );
};
