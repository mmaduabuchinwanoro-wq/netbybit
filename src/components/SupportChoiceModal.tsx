import React from 'react';
import {
  X,
  Mail,
  MessageSquare,
  Sparkles,
  Headphones,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Clock,
} from 'lucide-react';

interface SupportChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNetbybitLive: () => void;
}

export const SupportChoiceModal: React.FC<SupportChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectNetbybitLive,
}) => {
  if (!isOpen) return null;

  const handleOpenLiveAgent = () => {
    // Open user's native email client taking them straight to their email inbox
    window.location.href = 'mailto:netbybitsupport@gmail.com?subject=NETBYBIT%20Live%20Agent%20Inquiry';
    onClose();
  };

  const handleOpenNetbybitLive = () => {
    onSelectNetbybitLive();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-neutral-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-neutral-100 animate-scaleUp">
        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 px-6 py-5 border-b border-amber-500/20 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center space-x-1.5">
                <span>Customer Support</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h2>
              <p className="text-xs text-neutral-400">
                Select your preferred support routing channel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Choice Options Body */}
        <div className="relative z-10 p-6 space-y-4">
          {/* OPTION 1: LIVE AGENT (MAILTO) */}
          <div
            onClick={handleOpenLiveAgent}
            className="group relative bg-neutral-950/80 hover:bg-neutral-800/80 border border-amber-500/30 hover:border-amber-400/80 rounded-2xl p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                      Live Agent
                    </h3>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      Direct Email
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Open your native email client to message our dedicated live support desk directly.
                  </p>
                  <div className="pt-1.5 flex items-center space-x-1.5 text-[11px] font-mono text-amber-400 font-bold">
                    <span>netbybitsupport@gmail.com</span>
                    <ExternalLink className="w-3 h-3 opacity-75" />
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:text-amber-300 group-hover:border-amber-400/50 transition-all shrink-0 ml-2">
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          {/* OPTION 2: NETBYBIT LIVE (IN-APP CHAT) */}
          <div
            onClick={handleOpenNetbybitLive}
            className="group relative bg-neutral-950/80 hover:bg-neutral-800/80 border border-amber-500/30 hover:border-amber-400/80 rounded-2xl p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                      NetbyBit Live
                    </h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      In-App Chat
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Open the interactive in-app live chat interface to message support directly on the website.
                  </p>
                  <div className="pt-1.5 flex items-center space-x-1.5 text-[11px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Website Chat Window</span>
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:text-amber-300 group-hover:border-amber-400/50 transition-all shrink-0 ml-2">
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <div className="relative z-10 px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Encrypted Support System</span>
          </div>
          <span className="text-amber-400 font-bold">NETBYBIT Concierge</span>
        </div>
      </div>
    </div>
  );
};
