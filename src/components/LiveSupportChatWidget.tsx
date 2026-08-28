import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SupportTicket } from '../types';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import {
  MessageSquare,
  X,
  Send,
  Minimize2,
  Maximize2,
  Headphones,
  Sparkles,
  Mail,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Globe,
  Loader2,
  User as UserIcon,
} from 'lucide-react';

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
  const { user, isLiveChatOpen, setIsLiveChatOpen, openSupportChoice } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Sync external open request from AuthContext
  useEffect(() => {
    if (isLiveChatOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    }
  }, [isLiveChatOpen]);

  const handleCloseChat = () => {
    setIsOpen(false);
    setIsLiveChatOpen(false);
  };

  // Guest State
  const [guestName, setGuestName] = useState(() => localStorage.getItem('netbybit_guest_name') || '');
  const [guestEmail, setGuestEmail] = useState(() => localStorage.getItem('netbybit_guest_email') || '');
  const [guestSubject, setGuestSubject] = useState('');
  const [isGuestStarted, setIsGuestStarted] = useState(() => {
    return !!localStorage.getItem('netbybit_guest_ticket_id');
  });

  // Ticket & Messages State
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [bannerCopied, setBannerCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [isOpen, isMinimized, activeTicket?.replies]);

  // Load existing ticket on startup or when user changes
  useEffect(() => {
    let isMounted = true;
    const loadChat = async () => {
      if (user) {
        try {
          const tickets = await api.getSupportTickets();
          if (isMounted && tickets && tickets.length > 0) {
            setActiveTicket((prev) => {
              if (!prev) return tickets[0];
              const match = tickets.find((t) => t.id === prev.id);
              return match || tickets[0];
            });
          }
        } catch {}
      } else {
        const storedTicketId = localStorage.getItem('netbybit_guest_ticket_id');
        const storedEmail = localStorage.getItem('netbybit_guest_email');
        if (storedTicketId) {
          try {
            const ticket = await api.getGuestSupportTicket(storedTicketId, storedEmail || undefined);
            if (isMounted && ticket) {
              setActiveTicket(ticket);
              setIsGuestStarted(true);
            }
          } catch {}
        }
      }
    };
    loadChat();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // 1. Real-Time Firestore Document Listeners on Active Ticket
  useEffect(() => {
    if (!activeTicket?.id) return;
    const ticketId = activeTicket.id;

    // Listen to changes in support_tickets collection
    const unsub1 = onSnapshot(
      doc(db, 'support_tickets', ticketId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { ...docSnap.data(), id: docSnap.id } as SupportTicket;
          setActiveTicket((prev) => {
            if (!prev) return data;
            // Prevent discarding un-synced optimistic local replies
            const incomingIds = new Set((data.replies || []).map((r) => r.id));
            const pendingLocal = (prev.replies || []).filter(
              (r) => r.id?.startsWith('rpl_user_') && !incomingIds.has(r.id)
            );
            return {
              ...data,
              replies: [...(data.replies || []), ...pendingLocal],
            };
          });
        }
      },
      (err) => {
        console.warn('Real-time ticket listener (support_tickets):', err);
      }
    );

    // Fallback collection listener supportTickets
    const unsub2 = onSnapshot(
      doc(db, 'supportTickets', ticketId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { ...docSnap.data(), id: docSnap.id } as SupportTicket;
          setActiveTicket((prev) => {
            if (!prev) return data;
            const incomingIds = new Set((data.replies || []).map((r) => r.id));
            const pendingLocal = (prev.replies || []).filter(
              (r) => r.id?.startsWith('rpl_user_') && !incomingIds.has(r.id)
            );
            return {
              ...data,
              replies: [...(data.replies || []), ...pendingLocal],
            };
          });
        }
      },
      (err) => {
        console.warn('Real-time ticket listener (supportTickets):', err);
      }
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, [activeTicket?.id]);

  // 2. Real-Time Firestore User Collection Query Listener
  useEffect(() => {
    if (!user?.id) return;
    const currentUserId = user.id;

    const q = query(collection(db, 'support_tickets'), where('userId', '==', currentUserId));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docs: SupportTicket[] = [];
          snapshot.forEach((d) => {
            docs.push({ ...(d.data() as SupportTicket), id: d.id });
          });
          docs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          if (docs.length > 0) {
            setActiveTicket((prev) => {
              if (!prev) return docs[0];
              const match = docs.find((d) => d.id === prev.id);
              return match || docs[0];
            });
          }
        }
      },
      (err) => {
        console.warn('Real-time user tickets listener:', err);
      }
    );

    return () => unsub();
  }, [user?.id]);

  // 3. Fast Revalidation Polling (every 2.5s) when chat is open
  useEffect(() => {
    if (!isOpen) return;

    const poll = async () => {
      try {
        if (user) {
          const tickets = await api.getSupportTickets();
          if (tickets && tickets.length > 0) {
            setActiveTicket((prev) => {
              if (!prev) return tickets[0];
              const match = tickets.find((t) => t.id === prev.id);
              return match || tickets[0];
            });
          }
        } else {
          const storedTicketId = localStorage.getItem('netbybit_guest_ticket_id');
          const storedEmail = localStorage.getItem('netbybit_guest_email');
          if (storedTicketId) {
            const ticket = await api.getGuestSupportTicket(storedTicketId, storedEmail || undefined);
            if (ticket) {
              setActiveTicket(ticket);
              setIsGuestStarted(true);
            }
          }
        }
      } catch {}
    };

    const interval = setInterval(poll, 2500);
    return () => clearInterval(interval);
  }, [isOpen, user]);

  // 4. Instant Broadcast Event & Storage Sync across Tabs and Components
  useEffect(() => {
    const handleTicketUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<SupportTicket>;
      if (customEvent.detail) {
        const updated = customEvent.detail;
        setActiveTicket((prev) => {
          if (!prev || prev.id === updated.id) {
            return updated;
          }
          return prev;
        });
      }
    };

    window.addEventListener('netbybit:ticket_updated', handleTicketUpdated);
    return () => {
      window.removeEventListener('netbybit:ticket_updated', handleTicketUpdated);
    };
  }, []);

  const handleCopyEmail = (key: string = 'banner') => {
    navigator.clipboard.writeText('netbybitsupport@gmail.com');
    if (key === 'banner') {
      setBannerCopied(true);
      setTimeout(() => setBannerCopied(false), 2500);
    } else {
      setCopiedMap((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedMap((prev) => ({ ...prev, [key]: false }));
      }, 2500);
    }
  };

  const handleOpenLiveAgentMail = () => {
    window.location.href = 'mailto:netbybitsupport@gmail.com?subject=NETBYBIT%20Live%20Agent%20Inquiry';
  };

  // Start new guest conversation
  const handleStartGuestChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail.trim() || !inputText.trim()) return;

    setSending(true);
    try {
      localStorage.setItem('netbybit_guest_name', guestName.trim());
      localStorage.setItem('netbybit_guest_email', guestEmail.trim());

      const ticket = await api.createGuestSupportTicket({
        name: guestName.trim() || guestEmail.split('@')[0],
        email: guestEmail.trim(),
        subject: guestSubject.trim() || 'Live Support Inquiry',
        category: 'General Inquiry',
        message: inputText.trim(),
      });

      if (ticket) {
        localStorage.setItem('netbybit_guest_ticket_id', ticket.id);
        setActiveTicket(ticket);
        setIsGuestStarted(true);
        setInputText('');
      }
    } catch (err) {
      console.error('Error starting guest chat:', err);
    } finally {
      setSending(false);
    }
  };

  // Send reply message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setInputText('');

    // Instant local optimistic message
    const tempUserReply = {
      id: 'rpl_user_' + Date.now(),
      sender: 'user' as const,
      senderName: user?.name || guestName || 'User',
      message: text,
      createdAt: new Date().toISOString(),
      status: 'Delivered',
    };

    const tempAutoReply = {
      id: 'rpl_auto_' + (Date.now() + 100),
      sender: 'admin' as const,
      senderName: 'Netbybit Support',
      message: 'Kindly hold on, our support is currently unavailable. Kindly message the live agent.',
      createdAt: new Date(Date.now() + 100).toISOString(),
      status: 'Delivered',
    };

    const hasAlreadyTriggeredOffline = activeTicket?.replies?.some(
      (r) => isStaffSender(r) && (r.message.includes('Kindly hold on, our support is currently unavailable') || r.id?.startsWith('rpl_auto_'))
    );

    setActiveTicket((prev) => {
      if (!prev) {
        return {
          id: 'TKT-' + Math.floor(100000 + Math.random() * 900000),
          userId: user?.id || 'guest',
          userEmail: user?.email || guestEmail || 'user@example.com',
          userName: user?.name || guestName || 'User',
          subject: 'Live Support Inquiry',
          category: 'General Inquiry',
          message: text,
          status: 'Open',
          createdAt: new Date().toISOString(),
          replies: [tempUserReply, tempAutoReply],
        };
      }
      const shouldIncludeAutoReply = !hasAlreadyTriggeredOffline && (!prev.replies || prev.replies.length === 0);
      return {
        ...prev,
        replies: shouldIncludeAutoReply
          ? [...(prev.replies || []), tempUserReply, tempAutoReply]
          : [...(prev.replies || []), tempUserReply],
      };
    });

    try {
      if (user) {
        if (!activeTicket) {
          const newTicket = await api.createSupportTicket({
            subject: 'Live Support Inquiry',
            category: 'General Inquiry',
            message: text,
          });
          setActiveTicket(newTicket);
        } else {
          const updated = await api.replySupportTicket(
            activeTicket.id,
            text,
            'user',
            user.name || user.username || 'User'
          );
          if (updated) setActiveTicket(updated);
        }
      } else {
        if (!activeTicket) {
          const newTicket = await api.createGuestSupportTicket({
            name: guestName.trim() || guestEmail.split('@')[0] || 'Guest',
            email: guestEmail.trim() || 'guest@example.com',
            subject: 'Guest Live Support Inquiry',
            category: 'General Inquiry',
            message: text,
          });
          if (newTicket) {
            localStorage.setItem('netbybit_guest_ticket_id', newTicket.id);
            setActiveTicket(newTicket);
            setIsGuestStarted(true);
          }
        } else {
          const updated = await api.replyGuestSupportTicket(activeTicket.id, {
            name: guestName || 'Guest User',
            email: guestEmail,
            message: text,
          });
          if (updated) setActiveTicket(updated);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* 1. FLOATING SUPPORT BUBBLE TRIGGER (When Chat is Closed) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="group relative flex items-center space-x-2.5 px-4 py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-neutral-950 font-black rounded-full shadow-2xl hover:shadow-amber-500/40 hover:scale-105 transition-all duration-300 border border-amber-300/40 cursor-pointer"
          title="Open NetbyBit Live Support"
        >
          <div className="relative">
            <Headphones className="w-5 h-5 text-neutral-950" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-neutral-950"></span>
            </span>
          </div>
          <span className="text-xs font-black tracking-wide uppercase">Live Support</span>
        </button>
      )}

      {/* 2. CHAT WINDOW (When Open) */}
      {isOpen && (
        <div
          className={`w-[94vw] sm:w-[400px] bg-neutral-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
            isMinimized ? 'h-16' : 'h-[580px] max-h-[85vh]'
          }`}
        >
          {/* TOP HEADER */}
          <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 px-4 py-3.5 border-b border-amber-500/20 flex items-center justify-between shrink-0">
            {/* Title & Avatar */}
            <div className="flex items-center space-x-2.5">
              <SupportAvatar size="sm" />
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    NetbyBit Live Support
                  </h3>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </div>
                <p className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online • In-App Chat</span>
                </p>
              </div>
            </div>

            {/* Top Right Controls & Prominent Live Agent Button */}
            <div className="flex items-center space-x-1.5">
              {/* Prominent Live Agent Direct Button */}
              <button
                onClick={handleOpenLiveAgentMail}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-black text-[10px] shadow-sm transition-all hover:scale-105 cursor-pointer"
                title="Message the live agent via email"
              >
                <Mail className="w-3 h-3" />
                <span>Live Agent</span>
              </button>

              {/* Minimize */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={handleCloseChat}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* QUICK ACTION EMAIL BANNER BAR */}
          {!isMinimized && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 flex items-center justify-between text-[10px] text-amber-300 shrink-0">
              <div className="flex items-center space-x-1.5 font-mono truncate mr-1">
                <Mail className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="text-neutral-400">Email:</span>
                <span className="font-bold text-amber-300 truncate">netbybitsupport@gmail.com</span>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  onClick={() => handleCopyEmail('banner')}
                  className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 hover:text-white font-medium text-[9px] transition-colors cursor-pointer flex items-center space-x-0.5"
                  title="Copy email address"
                >
                  {bannerCopied ? (
                    <>
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-2.5 h-2.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <a
                  href="mailto:netbybitsupport@gmail.com?subject=NETBYBIT%20Live%20Agent%20Inquiry"
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 font-bold text-[9px] border border-amber-500/30 transition-colors inline-flex items-center space-x-0.5"
                >
                  <span>Email Now</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          )}

          {/* CHAT BODY */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-neutral-950/60 text-xs">
              {/* GUEST WELCOME FORM (IF UNREGISTERED GUEST AND NOT STARTED) */}
              {!user && !isGuestStarted && (
                <div className="space-y-3 p-3.5 bg-neutral-900/90 border border-amber-500/30 rounded-2xl animate-fadeIn">
                  <div className="flex items-center space-x-2 text-amber-400">
                    <Headphones className="w-4 h-4" />
                    <span className="font-bold uppercase tracking-wider text-[11px]">
                      Start Guest Live Chat
                    </span>
                  </div>
                  <p className="text-neutral-300 text-xs leading-relaxed">
                    Provide your contact details below to chat with NetbyBit Support:
                  </p>
                  <form onSubmit={handleStartGuestChat} className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-medium mb-1">
                        Your Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-medium mb-1">
                        Email Address <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-medium mb-1">
                        Your Message <span className="text-amber-400">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="How can we assist you today?"
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sending || !guestEmail.trim() || !inputText.trim()}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>{sending ? 'Starting...' : 'Send Message'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* ACTIVE CONVERSATION THREAD */}
              {(user || isGuestStarted) && (
                <>
                  {/* INITIAL ASSISTANT GREETING IF EMPTY */}
                  {(!activeTicket || !activeTicket.replies || activeTicket.replies.length === 0) && (
                    <div className="flex justify-start items-start gap-2.5 my-2">
                      <SupportAvatar size="sm" />
                      <div className="max-w-[85%] flex flex-col items-start">
                        <div className="flex items-center space-x-1.5 mb-1 pl-1">
                          <span className="font-bold text-[11px] text-amber-400">Netbybit Support</span>
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 text-[8px] rounded font-mono font-bold">
                            OFFICIAL
                          </span>
                        </div>
                        <div className="bg-neutral-800 border border-neutral-700/80 text-neutral-100 px-3.5 py-2.5 rounded-2xl rounded-tl-xs shadow-md space-y-2 text-xs">
                          <p className="whitespace-pre-wrap font-medium">
                            Kindly hold on, our support is currently unavailable. Kindly message the live agent.
                          </p>

                          {/* STRUCTURED FALLBACK CARD */}
                          <div className="pt-2 mt-1 border-t border-amber-500/20 flex flex-col space-y-2 bg-amber-500/10 -mx-1.5 p-2.5 rounded-xl border border-amber-500/30">
                            <div className="text-[10px] text-neutral-300 font-mono font-medium">
                              Email: <span className="text-amber-300 font-bold">netbybitsupport@gmail.com</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <a
                                href="mailto:netbybitsupport@gmail.com?subject=NETBYBIT%20Live%20Agent%20Inquiry"
                                className="flex-1 inline-flex items-center justify-center space-x-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-bold px-2.5 py-1.5 rounded-lg text-[10px] shadow transition-all cursor-pointer"
                              >
                                <Mail className="w-3 h-3" />
                                <span>Message Live Agent</span>
                              </a>
                              <button
                                onClick={() => handleCopyEmail('initial')}
                                className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-amber-300 text-[10px] font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                              >
                                {copiedMap['initial'] ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400 font-bold">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MESSAGES LIST */}
                  {activeTicket?.replies?.map((rep, idx) => {
                    const isAdmin = isStaffSender(rep);
                    const repKey = rep.id || `rep_${idx}`;
                    const isAutoOffline =
                      rep.message.includes('Kindly hold on, our support is currently unavailable') ||
                      rep.id?.startsWith('rpl_auto_') ||
                      (rep as any).isAutoReply === true;

                    if (isAdmin) {
                      return (
                        <div key={repKey} className="flex justify-start items-start gap-2.5 my-2 animate-fadeIn">
                          <SupportAvatar size="sm" />
                          <div className="max-w-[85%] flex flex-col items-start">
                            <div className="flex items-center space-x-1.5 mb-1 pl-1">
                              <span className="font-bold text-[11px] text-amber-400">Netbybit Support</span>
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 text-[8px] rounded font-mono font-bold">
                                OFFICIAL
                              </span>
                            </div>

                            <div className="bg-neutral-800 border border-neutral-700/80 text-neutral-100 px-3.5 py-2.5 rounded-2xl rounded-tl-xs shadow-md space-y-2 text-xs break-words">
                              <p className="whitespace-pre-wrap font-medium">{rep.message}</p>

                              {/* STRUCTURED FALLBACK CARD - ONLY ON AUTOMATED OFFLINE RESPONDER */}
                              {isAutoOffline && (
                                <div className="pt-2 mt-1 border-t border-amber-500/20 flex flex-col space-y-2 bg-amber-500/10 -mx-1.5 p-2.5 rounded-xl border border-amber-500/30">
                                  <div className="text-[10px] text-neutral-300 font-mono font-medium">
                                    Email: <span className="text-amber-300 font-bold">netbybitsupport@gmail.com</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <a
                                      href="mailto:netbybitsupport@gmail.com?subject=NETBYBIT%20Live%20Agent%20Inquiry"
                                      className="flex-1 inline-flex items-center justify-center space-x-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-bold px-2.5 py-1.5 rounded-lg text-[10px] shadow transition-all cursor-pointer"
                                    >
                                      <Mail className="w-3 h-3" />
                                      <span>Message Live Agent</span>
                                    </a>
                                    <button
                                      onClick={() => handleCopyEmail(repKey)}
                                      className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-amber-300 text-[10px] font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                                    >
                                      {copiedMap[repKey] ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-400" />
                                          <span className="text-emerald-400 font-bold">Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            <span className="text-[9px] text-neutral-500 font-mono mt-1 pl-1">
                              {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    // User Message (Right Aligned)
                    return (
                      <div key={repKey} className="flex justify-end items-start gap-2 my-2 animate-fadeIn">
                        <div className="max-w-[85%] flex flex-col items-end">
                          <div className="flex items-center space-x-1.5 mb-1 pr-1">
                            <span className="font-bold text-[11px] text-amber-300">
                              {rep.senderName || user?.name || guestName || 'You'}
                            </span>
                          </div>
                          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 px-3.5 py-2.5 rounded-2xl rounded-tr-xs shadow-md text-xs font-medium break-words">
                            <p className="whitespace-pre-wrap">{rep.message}</p>
                          </div>
                          <span className="text-[9px] text-neutral-500 font-mono mt-1 pr-1">
                            {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          )}

          {/* INPUT BAR (WHEN EXPANDED & READY TO CHAT) */}
          {!isMinimized && (user || isGuestStarted) && (
            <div className="p-3 bg-neutral-900 border-t border-amber-500/20 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-neutral-950 border border-neutral-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-bold shadow-md transition-all disabled:opacity-40 cursor-pointer shrink-0"
                  title="Send message"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>

              <div className="flex justify-between items-center text-[9px] text-neutral-400 mt-1.5 font-mono px-1">
                <span className="flex items-center space-x-1 text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Support In-App Chat</span>
                </span>
                <a
                  href="mailto:netbybitsupport@gmail.com?subject=NETBYBIT%20Live%20Agent%20Inquiry"
                  className="text-amber-400 hover:text-amber-200 underline"
                  title="Direct Live Agent Email"
                >
                  netbybitsupport@gmail.com
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
