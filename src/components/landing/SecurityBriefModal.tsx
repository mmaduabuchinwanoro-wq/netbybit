import React from 'react';
import { X, ShieldCheck, Cpu, KeyRound, Layers } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { HexLogo } from './HexLogo';

interface SecurityBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECURITY_PILLARS = [
  {
    icon: Cpu,
    title: 'Hardware-Isolated Enclaves',
    detail:
      'Cryptographic key shards are generated and verified inside air-gapped HSM boundaries, ensuring raw private keys never enter browser memory.',
  },
  {
    icon: KeyRound,
    title: 'Threshold MPC Signing (3-of-5)',
    detail:
      'Transactions require distributed threshold quorum approval across independent signer roles with customizable velocity caps.',
  },
  {
    icon: Layers,
    title: 'Pre-Sign Calldata Simulation',
    detail:
      'Every smart contract interaction is deterministically simulated before signature authorization to detect allowance and routing risks.',
  },
  {
    icon: ShieldCheck,
    title: 'Verifiable Reserve Segregation',
    detail:
      'Client assets reside in segregated on-chain vault addresses with continuous cryptographic balance attestation.',
  },
];

export const SecurityBriefModal: React.FC<SecurityBriefModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Netbybit Security Architecture Brief"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl rounded-3xl bg-[#0a0816] border border-purple-500/35 shadow-[0_32px_90px_-15px_rgba(109,74,255,0.6)] p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
              <HexLogo size="sm" showTagline />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close security brief"
                className="w-9 h-9 rounded-full bg-[#14102b] border border-purple-500/30 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                Security Architecture Brief
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                Defense-in-Depth Institutional Custody
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Netbybit combines multi-party computation, hardware isolation, and strict policy governance to safeguard digital reserves at scale.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SECURITY_PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="rounded-2xl bg-[#100d21] border border-purple-500/20 p-4 space-y-2"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-amber-400/35 text-amber-300 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-display text-base font-bold text-white">{pillar.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{pillar.detail}</p>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-netbybit px-6 py-2.5 rounded-full text-sm font-semibold text-white cursor-pointer"
              >
                Close Brief
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
