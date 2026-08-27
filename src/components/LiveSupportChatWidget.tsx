import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Headphones, Sparkles } from 'lucide-react';

export const getInitials = (name?: string, fallback = 'US'): string => {
  if (!name || !name.trim()) return fallback;
  const clean = name.trim();
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0].replace(/[^a-zA-Z0-9]/g, '')[0] || '';
    const second = parts[1].replace(/[^a-zA-Z0-9]/g, '')[0] || '';
    const combined = (first + second).toUpperCase();
    if (combined.length >= 1) return combined.padEnd(2, combined[0]);
  }
  const lettersOnly = clean.replace(/[^a-zA-Z0-9]/g, '');
  if (lettersOnly.length >= 2) {
    return lettersOnly.slice(0, 2).toUpperCase();
  }
  if (lettersOnly.length === 1) {
    return (lettersOnly + lettersOnly).toUpperCase();
  }
  return fallback;
};

export const isStaffSender = (replyOrSender?: { sender?: string; senderName?: string } | string): boolean => {
  if (!replyOrSender) return false;
  if (typeof replyOrSender === 'string') {
    const s = replyOrSender.toLowerCase();
    return (
      s === 'admin' ||
      s === 'staff' ||
      s === 'support' ||
      s.includes('support') ||
      s.includes('admin') ||
      s.includes('netbybit')
    );
  }
  const senderRole = (replyOrSender.sender || '').toLowerCase();
  const name = (replyOrSender.senderName || '').toLowerCase();
  if (senderRole === 'admin' || senderRole === 'staff' || senderRole === 'support') return true;
  if (
    name.includes('support') ||
    name.includes('admin') ||
    name.includes('netbybit') ||
    name === 'platform administrator'
  ) {
    return true;
  }
  return false;
};

export const SupportAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'w-7 h-7'
      : size === 'lg'
      ? 'w-10 h-10'
      : 'w-8 h-8';
  const iconSizeClasses =
    size === 'sm'
      ? 'w-3.5 h-3.5'
      : size === 'lg'
      ? 'w-5 h-5'
      : 'w-4 h-4';

  return (
    <div
      className={`relative ${sizeClasses} rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-[1.5px] shadow-md shadow-amber-500/25 shrink-0 ring-1 ring-amber-400/40 ${className}`}
      title="Netbybit Support Agent"
    >
      <div className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center text-amber-400">
        <Headphones className={iconSizeClasses} />
      </div>
    </div>
  );
};

export const LiveSupportChatWidget: React.FC = () => {
  const { openSupportChoice } = useAuth();

  return (
    <div className="fixed bottom-5 right-5 z-40 font-sans">
      {/* Floating Support Button that opens the Dual Option Prompt */}
      <button
        onClick={openSupportChoice}
        className="group relative flex items-center space-x-2.5 px-4 py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-neutral-950 font-black rounded-full shadow-2xl hover:shadow-amber-500/40 hover:scale-105 transition-all duration-300 border border-amber-300/40 cursor-pointer"
        title="Contact Customer Support"
      >
        <div className="relative">
          <Headphones className="w-5 h-5 text-neutral-950" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-neutral-950"></span>
          </span>
        </div>
        <span className="text-xs font-black tracking-wide uppercase">Support</span>
      </button>
    </div>
  );
};
