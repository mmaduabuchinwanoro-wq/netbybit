import React, { useEffect, useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface ChatMessage {
  id: string;
  sender: 'desk' | 'visitor';
  text: string;
  time: string;
}

const STORAGE_KEY = 'netbybit_concierge_msgs_v1';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    sender: 'desk',
    text: 'Welcome to the Netbybit Institutional Custody Desk. Select a topic below or leave a note — messages are saved locally in your browser.',
    time: 'Concierge',
  },
];

const QUICK_TOPICS: Array<{ label: string; reply: string }> = [
  {
    label: 'MPC Cold Storage',
    reply:
      'Netbybit uses 3-of-5 threshold MPC sharding across hardware security modules so no single signer ever holds a complete key.',
  },
  {
    label: 'Supported Networks',
    reply:
      'Segregated vaults currently cover Bitcoin, Ethereum, Arbitrum, Avalanche, Solana, BNB Chain, Polygon, and Tron settlement rails.',
  },
  {
    label: 'OTC Settlement',
    reply:
      'Institutional swaps settle atomically inside custody with pre-trade calldata simulation and deterministic fee verification.',
  },
];

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_MESSAGES;
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MESSAGES;
  } catch {
    return INITIAL_MESSAGES;
  }
}

export const ConciergeChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages());
  const [draft, setDraft] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Ignore storage quota errors
    }
  }, [messages]);

  const appendExchange = (visitorText: string, deskReply: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      { id: `v-${Date.now()}`, sender: 'visitor', text: visitorText, time: now },
      { id: `d-${Date.now() + 1}`, sender: 'desk', text: deskReply, time: now },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    setDraft('');
    appendExchange(
      trimmed,
      'Thank you. Your inquiry has been logged locally in this preview session. For formal institutional onboarding, contact custody@netbybit.com.'
    );
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="mb-3 w-[320px] sm:w-[350px] rounded-3xl bg-[#0b0918]/98 border border-purple-500/35 shadow-[0_24px_60px_-10px_rgba(0,0,0,0.9)] overflow-hidden backdrop-blur-2xl"
          >
            <div className="px-4 py-3.5 bg-gradient-to-r from-[#1a133d] to-[#110d29] border-b border-purple-500/25 flex items-center justify-between">
              <div>
                <div className="font-display text-sm font-bold text-amber-300">
                  Netbybit Custody Desk
                </div>
                <div className="text-[11px] text-slate-300">Institutional Client Concierge</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close concierge drawer"
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-64 overflow-y-auto space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'visitor' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      m.sender === 'visitor'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-[#15112e] border border-purple-500/20 text-slate-200'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="mt-1 text-[10px] text-slate-500">{m.time}</span>
                </div>
              ))}
            </div>

            {/* Quick-Topic Guides */}
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICK_TOPICS.map((topic) => (
                <button
                  key={topic.label}
                  type="button"
                  onClick={() => appendExchange(topic.label, topic.reply)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#161233] border border-purple-500/25 text-indigo-200 hover:border-amber-400/50 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  {topic.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-3 border-t border-purple-500/20 flex items-center gap-2 bg-[#080612]"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask about Netbybit custody..."
                aria-label="Message Netbybit concierge"
                className="flex-1 bg-[#130f29] border border-purple-500/25 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="w-9 h-9 rounded-xl btn-netbybit flex items-center justify-center text-white shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Launcher matching the video's bottom-right chat bubble */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Toggle Netbybit concierge"
        className="w-13 h-13 rounded-full btn-netbybit flex items-center justify-center text-white shadow-[0_14px_35px_rgba(79,134,247,0.55)] cursor-pointer"
      >
        {open ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
      </button>
    </div>
  );
};
