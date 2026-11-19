import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { HexLogo } from './HexLogo';

interface NavbarProps {
  onOpenVault: () => void;
}

const NAV_LINKS = [
  { label: 'Custody', href: '#custody' },
  { label: 'Yield', href: '#yield' },
  { label: 'Web3', href: '#web3' },
  { label: 'Security', href: '#security' },
  { label: 'Clients', href: '#clients' },
];

export const Navbar: React.FC<NavbarProps> = ({ onOpenVault }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLinkClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#06050d]/85 backdrop-blur-xl border-b border-purple-500/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Gold Hexagonal N Logo + NETBYBIT */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
        >
          <HexLogo size="md" />
        </a>

        {/* Zone 2: Single-line Navigation Links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary Navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(link.href);
              }}
              className="text-sm font-medium text-slate-300 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 relative py-1 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[1.5px] after:bg-amber-400 hover:after:w-full after:transition-all after:duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Primary CTA + Mobile Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenVault}
            className="hidden sm:inline-flex items-center justify-center btn-netbybit px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            Launch Vault
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#110e22] border border-purple-500/25 text-slate-200 hover:text-amber-300 hover:border-amber-400/50 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="md:hidden border-t border-purple-500/20 bg-[#080612]/98 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-2"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(link.href);
                }}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-slate-200 hover:text-amber-300 hover:bg-[#130f29] transition-colors"
              >
                <span>{link.label}</span>
              </a>
            ))}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenVault();
                }}
                className="w-full btn-netbybit py-3 px-4 rounded-full text-sm font-semibold text-white cursor-pointer"
              >
                Launch Vault
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
