import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion } from 'motion/react';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  organization: string;
  initials: string;
  accent: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 'kestrel',
    quote:
      'Moving our multi-chain treasury from fragmented browser wallets to Netbybit cut settlement approval cycles from 45 minutes to under 3 minutes while enforcing 3-of-5 MPC quorum controls.',
    author: 'Henrik Lindholm',
    role: 'Head of Digital Treasury',
    organization: 'Kestrel Quantitative Capital',
    initials: 'HL',
    accent: 'from-amber-400 to-amber-600',
  },
  {
    id: 'veridian',
    quote:
      'Hardware-isolated signing paired with pre-execution smart contract simulation gave our risk committee the confidence to deploy institutional liquidity across Ethereum and Arbitrum.',
    author: 'Nadia Al-Mansoor',
    role: 'Chief Information Security Officer',
    organization: 'Veridian Custody Partners',
    initials: 'NA',
    accent: 'from-blue-400 to-purple-500',
  },
  {
    id: 'nordic',
    quote:
      'Netbybit bridges cold-storage rigor with clean portfolio analytics. Every BTC, ETH, and USDT reserve movement is immediately verifiable for our quarterly external audits.',
    author: 'Thomas Gallagher',
    role: 'Managing Director, Operations',
    organization: 'Northbridge Asset Management',
    initials: 'TG',
    accent: 'from-indigo-400 to-amber-400',
  },
  {
    id: 'solstice',
    quote:
      'Having one unified policy console across desktop web terminals and mobile hardware signers eliminated manual CSV reconciliations across our regional trading desks.',
    author: 'Claire Takahashi',
    role: 'VP of Settlement Infrastructure',
    organization: 'Solstice Liquidity Desk',
    initials: 'CT',
    accent: 'from-purple-400 to-blue-500',
  },
];

export const TestimonialsCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const prev = () => setActiveIndex((i) => (i === 0 ? TESTIMONIALS.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === TESTIMONIALS.length - 1 ? 0 : i + 1));

  return (
    <div className="space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          Institutional Verification
        </p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight text-balance">
          Trusted by institutions.
        </h2>
      </div>

      {/* Desktop Grid / Tablet & Desktop 3-Column View */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {TESTIMONIALS.map((t, idx) => {
          const isHighlighted = idx === activeIndex;
          return (
            <motion.article
              key={t.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveIndex(idx)}
              className={`rounded-3xl p-6 flex flex-col justify-between gap-6 cursor-pointer transition-all ${
                isHighlighted
                  ? 'card-institutional border-amber-400/50 shadow-[0_20px_50px_-15px_rgba(109,74,255,0.4)]'
                  : 'card-institutional'
              }`}
            >
              <div className="space-y-4">
                <Quote className="w-5 h-5 text-amber-400/75" aria-hidden="true" />
                <p className="text-sm text-slate-200 leading-relaxed">“{t.quote}”</p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-purple-500/15">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.accent} flex items-center justify-center text-xs font-display font-bold text-[#070510] shrink-0`}
                >
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{t.author}</div>
                  <div className="text-xs text-slate-400 truncate">
                    {t.role}, {t.organization}
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      {/* Mobile Single Card Carousel */}
      <div className="md:hidden max-w-md mx-auto">
        <article className="card-institutional rounded-3xl p-6 space-y-6">
          <div className="space-y-3">
            <Quote className="w-5 h-5 text-amber-400/80" aria-hidden="true" />
            <p className="text-sm text-slate-200 leading-relaxed">
              “{TESTIMONIALS[activeIndex].quote}”
            </p>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-purple-500/15">
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${TESTIMONIALS[activeIndex].accent} flex items-center justify-center text-xs font-display font-bold text-[#070510] shrink-0`}
            >
              {TESTIMONIALS[activeIndex].initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {TESTIMONIALS[activeIndex].author}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {TESTIMONIALS[activeIndex].role}, {TESTIMONIALS[activeIndex].organization}
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous testimonial"
          className="w-10 h-10 rounded-full bg-[#130f29] border border-purple-500/30 hover:border-amber-400/60 text-slate-200 hover:text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          {TESTIMONIALS.map((t, idx) => (
            <button
              key={t.id}
              type="button"
              aria-label={`View testimonial from ${t.author}`}
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
          aria-label="Next testimonial"
          className="w-10 h-10 rounded-full bg-[#130f29] border border-purple-500/30 hover:border-amber-400/60 text-slate-200 hover:text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
