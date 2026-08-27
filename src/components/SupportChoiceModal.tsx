import React, { useState } from 'react';
import {
  X,
  Mail,
  MessageSquare,
  Sparkles,
  Headphones,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  ChevronLeft,
} from 'lucide-react';

interface SupportChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNetbybitLive?: () => void;
}

export const SupportChoiceModal: React.FC<SupportChoiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedOption, setSelectedOption] = useState<'main' | 'netbybit_live'>('main');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('netbybitsupport@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenLiveAgent = () => {
    window.location.href =
      'mailto:netbybitsupport@gmail.com?subject=NETBYBIT%20Live%20Agent%20Inquiry';
    handleClose();
  };

  const handleClose = () => {
    setSelectedOption('main');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-fadeIn"
      onClick={handleClose}
    >
      {/* Modal Card */}
      <div
        className="relative w-full max-w-lg bg-neutral-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-neutral-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 px-6 py-5 border-b border-amber-500/20 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {selectedOption === 'netbybit_live' ? (
              <button
                onClick={() => setSelectedOption('main')}
                className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer mr-1"
                title="Back to options"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center space-x-1.5">
                <span>
                  {selectedOption === 'netbybit_live'
                    ? 'NetbyBit Live Support'
                    : 'Customer Support'}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h2>
              <p className="text-xs text-neutral-400">
                {selectedOption === 'netbybit_live'
                  ? 'Live support status & direct concierge routing'
                  : 'Select your preferred support routing channel'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Choice Options Body */}
        {selectedOption === 'main' ? (
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
                      Open your native email client to message our dedicated live support desk directly from your inbox.
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

            {/* OPTION 2: NETBYBIT LIVE */}
            <div
              onClick={() => setSelectedOption('netbybit_live')}
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
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                        Live Desk
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Connect to our live support channel for immediate assistance and agent inquiries.
                    </p>
                    <div className="pt-1.5 flex items-center space-x-1.5 text-[11px] font-mono text-amber-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>Direct Agent Routing</span>
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:text-amber-300 group-hover:border-amber-400/50 transition-all shrink-0 ml-2">
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* NETBYBIT LIVE OFFLINE NOTICE VIEW */
          <div className="relative z-10 p-6 space-y-5 animate-fadeIn">
            {/* Notice Box */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2.5 text-amber-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Support Status Update
                </span>
              </div>
              <p className="text-sm font-medium text-neutral-100 leading-relaxed">
                "Hello, we are unavailable right now. Kindly message our live agent."
              </p>
            </div>

            {/* Clickable Live Agent Email Action Card */}
            <div className="space-y-2">
              <p className="text-xs text-neutral-400">
                Click below to send an email to our dedicated live support desk:
              </p>

              <a
                href="mailto:netbybitsupport@gmail.com?subject=NETBYBIT%20Live%20Agent%20Inquiry"
                onClick={handleClose}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-bold transition-all shadow-lg hover:shadow-amber-500/25 group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-950/20 flex items-center justify-center text-neutral-950 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-neutral-900 font-semibold">Message Live Agent</div>
                    <div className="text-sm font-black font-mono">netbybitsupport@gmail.com</div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-xs font-black">
                  <span>Open Email</span>
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </a>
            </div>

            {/* Copy Email Helper */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
              <div className="flex items-center space-x-2 font-mono text-neutral-300 truncate">
                <span className="text-neutral-500">Email:</span>
                <span className="text-amber-400 font-semibold select-all">netbybitsupport@gmail.com</span>
              </div>
              <button
                onClick={handleCopyEmail}
                className="flex items-center space-x-1 text-[11px] text-neutral-400 hover:text-amber-300 font-medium px-2 py-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 ml-2"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Back Button */}
            <div className="pt-1 flex items-center justify-between">
              <button
                onClick={() => setSelectedOption('main')}
                className="text-xs text-neutral-400 hover:text-amber-300 font-medium flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Choose another option</span>
              </button>

              <button
                onClick={handleClose}
                className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Footer info note */}
        <div className="relative z-10 px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Encrypted Support Desk</span>
          </div>
          <span className="text-amber-400 font-bold">NETBYBIT Concierge</span>
        </div>
      </div>
    </div>
  );
};
