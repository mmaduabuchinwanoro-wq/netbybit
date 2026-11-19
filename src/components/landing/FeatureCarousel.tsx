import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CarouselTileIsometric } from './IsometricScenes';

interface FeatureCarouselProps {
  onOpenVault: () => void;
}

const FEATURES: Array<{
  id: string;
  kind: 'heart' | 'candles' | 'gear' | 'shield' | 'devices';
  title: string;
  description: string;
}> = [
  {
    id: 'governance',
    kind: 'heart',
    title: 'Client-First Governance',
    description:
      'Built directly around institutional treasury feedback, multi-role approvals, and transparent custody auditing.',
  },
  {
    id: 'defi',
    kind: 'candles',
    title: 'DeFi & OTC Ready',
    description:
      'Execute cross-chain swaps, liquidity provisioning, and verified protocol interactions inside policy guardrails.',
  },
  {
    id: 'ergonomics',
    kind: 'gear',
    title: 'Zero-Friction Terminal',
    description:
      'Institutional power paired with clear workflows so portfolio operators can sign and settle in seconds.',
  },
  {
    id: 'security',
    kind: 'shield',
    title: 'Air-Gapped Key Protection',
    description:
      'Distributed MPC key shards and hardware security enclaves ensure zero single points of compromise.',
  },
  {
    id: 'cross-platform',
    kind: 'devices',
    title: 'Multi-Device Continuity',
    description:
      'Unified custody operations across desktop web consoles, mobile signers, and hardware cold modules.',
  },
];

export const FeatureCarousel: React.FC<FeatureCarouselProps> = ({ onOpenVault }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const prev = () => setActiveIndex((i) => (i === 0 ? FEATURES.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === FEATURES.length - 1 ? 0 : i + 1));

  // Show 3 cards on desktop centered around activeIndex, 1 card on mobile
  const getVisibleIndices = () => {
    const prevIdx = (activeIndex - 1 + FEATURES.length) % FEATURES.length;
    const nextIdx = (activeIndex + 1) % FEATURES.length;
    return [prevIdx, activeIndex, nextIdx];
  };

  const visibleIndices = getVisibleIndices();

  return (
    <div className="space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          Why Netbybit Custody
        </p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight text-balance">
          Explore what makes Netbybit stand out.
        </h2>
      </div>

      {/* Desktop 3-Card Focus Carousel */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
        {visibleIndices.map((idx, slot) => {
          const item = FEATURES[idx];
          const isCenter = slot === 1;
          return (
            <motion.div
              key={`${item.id}-${slot}`}
              layout
              initial={{ opacity: 0.7, scale: 0.96 }}
              animate={{ opacity: isCenter ? 1 : 0.78, scale: isCenter ? 1 : 0.96 }}
              transition={{ duration: 0.25 }}
              onClick={() => setActiveIndex(idx)}
              className={`rounded-3xl p-8 text-center flex flex-col items-center justify-between cursor-pointer transition-colors ${
                isCenter
                  ? 'card-institutional border-amber-400/45 shadow-[0_24px_60px_-15px_rgba(109,74,255,0.45)]'
                  : 'bg-[#0b0918]/70 border border-purple-500/15 hover:border-purple-400/35'
              }`}
            >
              <div className="mb-6">
                <CarouselTileIsometric kind={item.kind} />
              </div>
              <div className="space-y-2.5">
                <h3 className="font-display text-xl font-bold text-white">{item.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile Single-Card Swipe / Button Carousel */}
      <div className="md:hidden max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={FEATURES[activeIndex].id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="card-institutional rounded-3xl p-7 text-center space-y-5"
          >
            <CarouselTileIsometric kind={FEATURES[activeIndex].kind} />
            <div className="space-y-2">
              <h3 className="font-display text-xl font-bold text-white">
                {FEATURES[activeIndex].title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {FEATURES[activeIndex].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Carousel Controls & Pagination Dots */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous standout capability"
            className="w-11 h-11 rounded-full bg-[#130f29] border border-purple-500/30 hover:border-amber-400/60 text-slate-200 hover:text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2" role="tablist" aria-label="Feature slides">
            {FEATURES.map((f, idx) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={idx === activeIndex}
                aria-label={`Show ${f.title}`}
                onClick={() => setActiveIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === activeIndex
                    ? 'w-6 bg-gradient-to-r from-amber-300 to-amber-500'
                    : 'w-2 bg-purple-400/30 hover:bg-purple-400/60'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            aria-label="Next standout capability"
            className="w-11 h-11 rounded-full bg-[#130f29] border border-purple-500/30 hover:border-amber-400/60 text-slate-200 hover:text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenVault}
          className="btn-netbybit px-7 py-3.5 rounded-full text-sm font-semibold text-white cursor-pointer"
        >
          Open Custody Terminal
        </button>
      </div>
    </div>
  );
};
