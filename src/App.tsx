import React, { useEffect, useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import {
  ShieldCheck,
  Cpu,
  LayoutGrid,
  Boxes,
  Compass,
  LockKeyhole,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Navbar } from './components/landing/Navbar';
import { AnnouncementBar } from './components/landing/AnnouncementBar';
import {
  HeroIsometricScene,
  CoinStacksIsometric,
  SwapPhoneIsometric,
  Web3PortalIsometric,
  VaultSafeIsometric,
  NetbybitCrestIsometric,
  SparkleAccent,
} from './components/landing/IsometricScenes';
import { PartnerMarquee } from './components/landing/PartnerMarquee';
import { FeatureCarousel } from './components/landing/FeatureCarousel';
import { TestimonialsCarousel } from './components/landing/TestimonialsCarousel';
import { VaultSimulatorModal } from './components/landing/VaultSimulatorModal';
import { SecurityBriefModal } from './components/landing/SecurityBriefModal';
import { ConciergeChatWidget } from './components/landing/ConciergeChatWidget';
import { LandingFooter } from './components/landing/LandingFooter';

type CustodyTierId = 'mpc-vault' | 'hardware-s1' | 'web-terminal';

const CUSTODY_TIERS: Array<{
  id: CustodyTierId;
  title: string;
  subtitle: string;
  spec: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'mpc-vault',
    title: 'MPC Cold Vault',
    subtitle: 'Threshold 3-of-5 distributed key sharding for segregated institutional reserves.',
    spec: 'Air-gapped HSM quorum · Multi-chain policy rules',
    icon: ShieldCheck,
  },
  {
    id: 'hardware-s1',
    title: 'Hardware Signer S1',
    subtitle: 'Dedicated offline cryptographic module for zero-exposure executive authorization.',
    spec: 'EAL6+ secure element · QR optical signing',
    icon: Cpu,
  },
  {
    id: 'web-terminal',
    title: 'Custody Web Terminal',
    subtitle: 'Unified portfolio governance, OTC swaps, and automated settlement tracking.',
    spec: 'Role-based approvals · Real-time reserve ledger',
    icon: LayoutGrid,
  },
];

const WEB3_PILLARS = [
  {
    icon: Compass,
    title: 'Discover & Govern Audited Protocols',
    description:
      'Connect institutional treasuries to vetted decentralized liquidity venues with strict policy guardrails.',
  },
  {
    icon: Boxes,
    title: 'Manage Multi-Chain Assets & Tokenized Positions',
    description:
      'Hold, transfer, and audit native tokens, stablecoins, and tokenized instruments from one custody view.',
  },
  {
    icon: LockKeyhole,
    title: 'Simulate Every Transaction Before Signing',
    description:
      'Deterministic calldata decoding flags unexpected approvals or contract risks prior to quorum release.',
  },
];

const TIER_STORAGE_KEY = 'netbybit_selected_tier_v1';

export default function App() {
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<CustodyTierId>(() => {
    try {
      const saved = localStorage.getItem(TIER_STORAGE_KEY) as CustodyTierId | null;
      if (saved && CUSTODY_TIERS.some((t) => t.id === saved)) return saved;
    } catch {
      // Ignore storage access errors
    }
    return 'mpc-vault';
  });

  useEffect(() => {
    try {
      localStorage.setItem(TIER_STORAGE_KEY, selectedTier);
    } catch {
      // Ignore storage quota errors
    }
  }, [selectedTier]);

  const activeTier = CUSTODY_TIERS.find((t) => t.id === selectedTier) || CUSTODY_TIERS[0];

  return (
    <MotionConfig reducedMotion="user">
      <div
        id="top"
        className="min-h-screen bg-[#06050d] text-white flex flex-col overflow-x-hidden relative"
      >
        {/* Top Sticky Header */}
        <Navbar onOpenVault={() => setVaultModalOpen(true)} />

        {/* Scrolling Institutional Announcement Strip */}
        <AnnouncementBar onOpenSecurityBrief={() => setSecurityModalOpen(true)} />

        <main className="flex-1">
          {/* 1. HERO SECTION */}
          <section
            className="relative pt-14 sm:pt-20 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden"
            style={{
              background:
                'radial-gradient(ellipse 90% 70% at 50% 15%, rgba(88, 63, 214, 0.34) 0%, rgba(19, 14, 48, 0.7) 48%, #06050d 100%)',
            }}
          >
            {/* Holographic Dot Matrix Overlay */}
            <div className="absolute inset-0 bg-holo-grid opacity-35 pointer-events-none" />

            {/* Soft Floating Glow Orbs */}
            <div className="absolute top-12 left-1/4 w-72 h-72 rounded-full bg-indigo-600/20 blur-[110px] pointer-events-none" />
            <div className="absolute top-28 right-1/4 w-64 h-64 rounded-full bg-amber-500/12 blur-[110px] pointer-events-none" />

            {/* Floating 4-point Sparkles */}
            <SparkleAccent size={24} className="hidden sm:block absolute top-16 left-[14%]" delay={0.2} />
            <SparkleAccent size={18} gold className="hidden sm:block absolute top-28 right-[16%]" delay={1.1} />

            <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="text-xs sm:text-sm font-semibold uppercase tracking-[0.24em] text-amber-300"
              >
                Netbybit · Institutional Crypto Custody
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.06 }}
                className="font-display text-4xl sm:text-6xl lg:text-[68px] font-extrabold tracking-tight leading-[1.05] text-white text-balance max-w-4xl mx-auto"
              >
                Own Your Institutional Custody
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed"
              >
                Safeguard digital reserves with multi-party cold storage, air-gapped hardware signers, and policy-governed settlement across global blockchains.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.18 }}
                className="flex flex-wrap items-center justify-center gap-4 pt-2"
              >
                <button
                  type="button"
                  onClick={() => setVaultModalOpen(true)}
                  className="btn-netbybit px-7 py-3.5 rounded-full text-sm font-semibold text-white inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Open Custody Terminal</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </button>
                <button
                  type="button"
                  onClick={() => setSecurityModalOpen(true)}
                  className="px-6 py-3.5 rounded-full text-sm font-semibold text-slate-200 bg-[#120e28]/90 border border-purple-500/30 hover:border-amber-400/60 hover:text-amber-200 transition-colors cursor-pointer"
                >
                  Inspect Security Model
                </button>
              </motion.div>

              {/* Isometric Hero Illustration */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.22 }}
                className="pt-4 sm:pt-8"
              >
                <HeroIsometricScene onOpenVault={() => setVaultModalOpen(true)} />
              </motion.div>
            </div>
          </section>

          {/* 2. CHOOSE YOUR NETBYBIT VAULT + PARTNER ECOSYSTEM */}
          <section
            id="custody"
            className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8"
            style={{
              background:
                'linear-gradient(180deg, #06050d 0%, #140f36 45%, #0c091d 100%)',
            }}
          >
            <SparkleAccent size={30} className="hidden md:block mx-auto mb-6" gold />

            <div className="max-w-6xl mx-auto space-y-12">
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">
                  Own Your Crypto Reserves
                </p>
                <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight text-balance">
                  Choose your Netbybit vault.
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  Protect and govern Bitcoin, Ethereum, Tron, and multi-chain institutional holdings across our integrated suite of cold vaults, hardware modules, and web terminals.
                </p>
              </div>

              {/* 3 Interactive Dark Custody Cards with Icons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CUSTODY_TIERS.map((tier) => {
                  const Icon = tier.icon;
                  const isActive = tier.id === selectedTier;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedTier(tier.id)}
                      className={`text-left rounded-3xl p-6 sm:p-7 transition-all cursor-pointer flex flex-col justify-between gap-6 ${
                        isActive
                          ? 'card-institutional border-amber-400/60 shadow-[0_24px_55px_-16px_rgba(109,74,255,0.5)]'
                          : 'card-institutional'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/25 border border-amber-400/35 text-amber-300 flex items-center justify-center">
                            <Icon className="w-6 h-6" />
                          </div>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
                              <Check className="w-3.5 h-3.5" />
                              Selected
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-xl font-bold text-white">{tier.title}</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">{tier.subtitle}</p>
                      </div>
                      <div className="pt-4 border-t border-purple-500/15 text-xs font-mono text-indigo-300">
                        {tier.spec}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Tier Summary Strip */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-[#100d24]/90 border border-purple-500/20 px-6 py-4">
                <div className="text-center sm:text-left">
                  <span className="text-xs uppercase tracking-wider text-amber-300 font-semibold">
                    Active Architecture: {activeTier.title}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5">{activeTier.spec}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setVaultModalOpen(true)}
                  className="btn-netbybit px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Preview {activeTier.title}
                </button>
              </div>

              {/* Partner & Network Marquee */}
              <PartnerMarquee />
            </div>
          </section>

          {/* 3. GROW YOUR CRYPTO / YIELD & EFFORTLESS EXECUTION */}
          <section
            id="yield"
            className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, #0c091d 0%, #080712 50%, #100c26 100%)',
            }}
          >
            {/* Soft top ambient planet glow matching video 01:24 */}
            <div className="absolute -top-24 left-10 w-64 h-64 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
            <SparkleAccent size={24} className="hidden sm:block absolute top-16 right-[22%]" delay={0.5} />

            <div className="max-w-5xl mx-auto space-y-24">
              {/* Top Heading */}
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">
                  Grow Your Treasury
                </p>
                <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight text-balance">
                  Get more from your vault.
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Our custody platform doesn’t just safeguard reserve assets — it unlocks audited validator staking and zero-slippage settlement tailored to institutional risk mandates.
                </p>
              </div>

              {/* Sub-block A: Earn Yield + Isometric Coin Stacks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-1">
                  <CoinStacksIsometric />
                </div>
                <div className="order-2 text-center lg:text-left space-y-4">
                  <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight text-balance">
                    Earn yield inside cold custody.
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
                    Generate predictable treasury returns through segregated validator delegation and automated APY reporting while keys remain hardware-isolated.
                  </p>
                </div>
              </div>

              {/* Sub-block B: Effortless Trading + Isometric Tilted Swap Phone */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1 text-center lg:text-left space-y-5">
                  <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight text-balance">
                    Effortless execution.
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
                    React to market shifts and settle cross-chain conversions between Bitcoin, Ethereum, and stablecoins instantaneously from your Netbybit Custody Console.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setVaultModalOpen(true)}
                      className="btn-netbybit px-6 py-3 rounded-full text-sm font-semibold text-white inline-flex items-center gap-2 cursor-pointer"
                    >
                      <span>Launch Swap Simulator</span>
                      <ArrowRight className="w-4 h-4 text-amber-300" />
                    </button>
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <SwapPhoneIsometric />
                </div>
              </div>
            </div>
          </section>

          {/* 4. GO BEYOND CRYPTO / WEB3 GATEWAY */}
          <section
            id="web3"
            className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(79, 70, 229, 0.28) 0%, #100b29 55%, #080711 100%)',
            }}
          >
            <div className="max-w-5xl mx-auto space-y-14">
              <Web3PortalIsometric />

              <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">
                  Go Beyond Cold Storage
                </p>
                <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight text-balance">
                  We’re bringing Web3 governance to your fingertips.
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  Netbybit is your institutional gateway to decentralized finance. Broad asset support and cross-chain policy enforcement let your team interact with Web3 safely from custody.
                </p>
              </div>

              {/* 3 Dark Cards with Icons matching video 01:42 - 01:44 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {WEB3_PILLARS.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={pillar.title}
                      className="card-institutional rounded-3xl p-7 text-center space-y-4"
                    >
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/25 border border-amber-400/35 text-amber-300 flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-display text-lg font-bold text-white leading-snug">
                        {pillar.title}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 5. EXPLORE WHAT MAKES NETBYBIT STAND OUT (5-Card Carousel) */}
          <section
            id="features"
            className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8"
            style={{
              background:
                'linear-gradient(180deg, #080711 0%, #140e34 50%, #090814 100%)',
            }}
          >
            <div className="max-w-6xl mx-auto">
              <FeatureCarousel onOpenVault={() => setVaultModalOpen(true)} />
            </div>
          </section>

          {/* 6. NOTHING KEEPS ASSETS SAFER THAN VERIFIABLE CUSTODY */}
          <section
            id="security"
            className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
            style={{
              background:
                'radial-gradient(circle at 50% 40%, rgba(99, 102, 241, 0.22) 0%, #0b0917 65%, #06050d 100%)',
            }}
          >
            <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
              <VaultSafeIsometric />

              <div className="space-y-4">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">
                  Verifiable Security Architecture
                </p>
                <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight text-balance">
                  Nothing keeps you safer than transparent custody.
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
                  From threshold cryptographic signing to real-time calldata verification, inspect every security layer engineered into Netbybit Institutional Custody.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setSecurityModalOpen(true)}
                  className="btn-netbybit px-7 py-3.5 rounded-full text-sm font-semibold text-white cursor-pointer"
                >
                  Read Security Brief
                </button>
              </div>
            </div>
          </section>

          {/* 7. TRUSTED BY INSTITUTIONS (Testimonials Carousel) */}
          <section
            id="clients"
            className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8"
            style={{
              background:
                'linear-gradient(180deg, #06050d 0%, #120d2e 50%, #090714 100%)',
            }}
          >
            <div className="max-w-7xl mx-auto">
              <TestimonialsCarousel />
            </div>
          </section>

          {/* 8. FINAL CTA SECTION */}
          <section
            className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 text-center overflow-hidden"
            style={{
              background:
                'radial-gradient(ellipse 75% 65% at 50% 50%, rgba(109, 74, 255, 0.26) 0%, #090714 70%, #05040b 100%)',
            }}
          >
            <SparkleAccent size={24} gold className="hidden sm:block absolute top-16 left-[24%]" />
            <SparkleAccent size={20} className="hidden sm:block absolute bottom-20 right-[22%]" delay={0.9} />

            <div className="max-w-2xl mx-auto space-y-8 relative z-10">
              <NetbybitCrestIsometric />

              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight text-balance">
                Everything you need in one custody vault.
              </h2>

              <div>
                <button
                  type="button"
                  onClick={() => setVaultModalOpen(true)}
                  className="btn-netbybit px-8 py-4 rounded-full text-sm sm:text-base font-semibold text-white inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Launch Netbybit Vault</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* 9. FOOTER */}
        <LandingFooter
          onOpenVault={() => setVaultModalOpen(true)}
          onOpenSecurityBrief={() => setSecurityModalOpen(true)}
        />

        {/* Floating Concierge Button & Local Drawer */}
        <ConciergeChatWidget />

        {/* Interactive LocalStorage Custody Simulator */}
        <VaultSimulatorModal
          isOpen={vaultModalOpen}
          onClose={() => setVaultModalOpen(false)}
        />

        {/* Security Architecture Brief */}
        <SecurityBriefModal
          isOpen={securityModalOpen}
          onClose={() => setSecurityModalOpen(false)}
        />
      </div>
    </MotionConfig>
  );
}
