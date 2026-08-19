'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Send,
  Check,
  CheckCheck,
  Loader2,
  X,
  Forward,
  Edit2,
  Trash2,
  Paperclip,
  FileText,
  Image as ImageIcon,
  CircleAlert,
} from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';
import { readJsonSafely } from '@/lib/safe-json';

/* ─── Types ──────────────────────────────────────────────────────── */
type UserData = {
  _id: string;
  name: string;
  role: string;
  image?: string;
  companyName?: string;
};

type Message = {
  _id: string;
  senderId: string | UserData;
  receiverId: string;
  threadId: string;
  threadType?: 'direct' | 'freelance_order';
  content: string;
  isRead: boolean;
  createdAt: string;
  templateType?: string | null;
  messageType?: 'support_message' | 'admin_message' | 'system_message';
  editCount?: number;
  forwardedFromId?: string;
  isDeletedForEveryone?: boolean;
  attachments?: { url: string; name: string; type: string }[];
  relatedFreelanceOrderId?: string;
};
type Thread = {
  threadId: string;
  lastMessage: Message;
  unreadCount: number;
  threadType: 'direct' | 'freelance_order';
  otherUser: UserData;
  freelanceOrder?: {
    _id: string;
    title: string;
    status: string;
    proposalStatus: string;
  } | null;
};

function supportMessageTypeLabel(type?: Message['messageType']) {
  if (type === 'admin_message') return 'Admin Message';
  if (type === 'system_message') return 'System Message';
  if (type === 'support_message') return 'Support Message';
  return null;
}

/* ─── Colour tokens (mirrors globals.css) ────────────────────────── */
const C = {
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  cyan: '#22d3ee',
  deep: '#1e293b',
  bg: '#f1f5f9',
  gray: '#64748b',
  success: '#10b981',
  danger: '#ef4444',
  border: '#e2e8f0',
  white: '#ffffff',
  /* gradient sent bubble */
  bubbleOut: 'linear-gradient(135deg, #2563eb, #22d3ee)',
  bubbleIn: '#ffffff',
} as const;

/* ─── Helpers ────────────────────────────────────────────────────── */
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const initials = (name: string) => name?.charAt(0).toUpperCase() ?? '?';
const getMessageSenderId = (message: Pick<Message, 'senderId'>) =>
  typeof message.senderId === 'string' ? message.senderId : message.senderId?._id || '';

/* ─── Avatar ─────────────────────────────────────────────────────── */
function Avatar({ user, size = 40 }: { user: UserData; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: `linear-gradient(135deg, ${C.primary}, ${C.cyan})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 800,
        color: C.white,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {user.image ? (
        <img
          src={user.image}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initials(user.name)
      )}
    </div>
  );
}

function AlertModal({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 99999,
        background: '#1E293B',
        color: '#F8FAFC',
        padding: '16px 20px',
        borderRadius: 16,
        boxShadow: '0 20px 40px -8px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#F87171',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircleAlert size={18} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Error Alert</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{message}</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer',
          padding: 4,
          marginLeft: 8,
          display: 'flex',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
      >
        <X size={16} />
      </button>
    </div>
  );
}

function DeleteModal({
  canDeleteForEveryone,
  onDeleteForMe,
  onDeleteForEveryone,
  onClose,
}: {
  canDeleteForEveryone: boolean;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.5)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: C.white,
          borderRadius: 20,
          width: 380,
          boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Gradient Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>
                Delete message
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              cursor: 'pointer',
              color: '#fff',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Actions */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onDeleteForMe}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: 14,
              border: `1.5px solid ${C.border}`,
              background: C.white,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.bg;
              e.currentTarget.style.borderColor = C.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.white;
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: C.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={17} color={C.gray} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.deep }}>Delete for me</div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>
                Only removed from your view
              </div>
            </div>
          </button>

          {canDeleteForEveryone && (
            <button
              onClick={onDeleteForEveryone}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: 14,
                border: '1.5px solid #FECACA',
                background: '#FFF5F5',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FEE2E2';
                e.currentTarget.style.borderColor = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFF5F5';
                e.currentTarget.style.borderColor = '#FECACA';
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={17} color={C.danger} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.danger }}>
                  Delete for everyone
                </div>
                <div style={{ fontSize: 12, color: '#F87171', marginTop: 2 }}>
                  Removed for all (15 min limit)
                </div>
              </div>
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              padding: '12px',
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: C.bg,
              cursor: 'pointer',
              color: C.gray,
              fontSize: 13,
              fontWeight: 700,
              transition: 'all 0.15s',
              marginTop: 2,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.border)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.bg)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Forward Modal ──────────────────────────────────────────────── */
function ForwardModal({
  threads,
  onForward,
  onClose,
}: {
  threads: Thread[];
  onForward: (userId: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.5)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: C.white,
          width: 420,
          borderRadius: 20,
          boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Gradient Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #1e293b 0%, #2563eb 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Forward size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>
                Forward message
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                Choose a conversation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              cursor: 'pointer',
              color: '#fff',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ maxHeight: 340, overflowY: 'auto', padding: '6px 0' }}>
          {threads.map((t) => (
            <div
              key={t.threadId}
              onClick={() => onForward(t.otherUser._id)}
              style={{
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                transition: 'all 0.15s',
                borderBottom: `1px solid ${C.bg}`,
                borderLeft: '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.bg;
                e.currentTarget.style.borderLeftColor = C.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = C.white;
                e.currentTarget.style.borderLeftColor = 'transparent';
              }}
            >
              <Avatar user={t.otherUser} size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: C.deep, fontSize: 14 }}>
                  {t.otherUser.name}
                </div>
                <div style={{ fontSize: 12, color: C.gray, textTransform: 'capitalize' }}>
                  {t.otherUser.role === 'employer'
                    ? t.otherUser.companyName || 'Employer'
                    : t.otherUser.role}
                </div>
              </div>
              <Send size={14} color={C.gray} style={{ opacity: 0.4 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function Inbox({
  currentUserId,
  currentUserRole,
  initiateUserId,
  initiateFreelanceOrderId,
}: {
  currentUserId: string;
  currentUserRole: string;
  initiateUserId?: string;
  initiateFreelanceOrderId?: string;
}) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [template, setTemplate] = useState('');
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; msg: Message | null }>({
    open: false,
    msg: null,
  });
  const [forwardModal, setForwardModal] = useState<{ open: boolean; msg: Message | null }>({
    open: false,
    msg: null,
  });
  const [globalAlert, setGlobalAlert] = useState<string | null>(null);
  const [messagingLocked, setMessagingLocked] = useState(false);

  const [inputFiles, setInputFiles] = useState<File[]>([]);
  const { startUpload, isUploading } = useUploadThing('messageAttachmentUploader', {
    onClientUploadComplete: () => {
      // success handled in send
    },
    onUploadError: (e) => {
      setGlobalAlert(`Upload failed: ${e.message}`);
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('list');

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleThreadSelect(thread: Thread) {
    setSelectedThread(thread);
    setMobilePane('chat');
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px)');
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);

    syncViewport();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncViewport);
      return () => mediaQuery.removeEventListener('change', syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  const buildThreadsUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (initiateUserId) params.set('initiateUser', initiateUserId);
    if (initiateFreelanceOrderId) params.set('freelanceOrder', initiateFreelanceOrderId);

    const query = params.toString();
    return query ? `/api/messages?${query}` : '/api/messages';
  }, [initiateFreelanceOrderId, initiateUserId]);

  /* Refetch threads from server */
  const refetchThreads = useCallback(
    () =>
      fetch(buildThreadsUrl())
        .then((r) =>
          readJsonSafely<{ threads?: Thread[]; initiatedThreadId?: string | null }>(r, {})
        )
        .then((d) => {
          if (d.threads) setThreads(d.threads);
        }),
    [buildThreadsUrl]
  );

  /* ── Fetch Threads ──────────────────────────────────────────── */
  useEffect(() => {
    fetch(buildThreadsUrl())
      .then((r) => readJsonSafely<{ threads?: Thread[]; initiatedThreadId?: string | null }>(r, {}))
      .then((d) => {
        if (d.threads) {
          setThreads(d.threads);
          if (initiateUserId) {
            const tgt = d.threads.find((t: Thread) => t.otherUser._id === initiateUserId);
            if (tgt) {
              setSelectedThread(tgt);
              setMobilePane('chat');
            }
          } else if (initiateFreelanceOrderId) {
            const tgt =
              d.threads.find(
                (t: Thread) =>
                  t.freelanceOrder?._id === initiateFreelanceOrderId ||
                  t.threadId === d.initiatedThreadId
              ) || null;
            if (tgt) {
              setSelectedThread(tgt);
              setMobilePane('chat');
            }
          }
        }
        setIsLoading(false);
      })
      .catch(console.error);
  }, [buildThreadsUrl, initiateFreelanceOrderId, initiateUserId]);

  /* ── Check student → employer messaging eligibility ──────────── */
  useEffect(() => {
    let cancelled = false;
    const ELIGIBLE = ['shortlisted', 'assessment_sent', 'interview_scheduled', 'hired'];

    async function checkEligibility() {
      if (!selectedThread || selectedThread.threadType === 'freelance_order') {
        if (!cancelled) setMessagingLocked(false);
        return;
      }

      // 1. Student → Employer check
      if (currentUserRole === 'student' && selectedThread.otherUser.role === 'employer') {
        try {
          const res = await fetch(
            `/api/applications?employerId=${selectedThread.otherUser._id}&limit=50`
          );
          const d = await readJsonSafely<{ applications?: { status: string }[] }>(res, {});
          const apps: { status: string }[] = d.applications ?? [];
          const hasEligible = apps.some((a) => ELIGIBLE.includes(a.status));
          if (!cancelled) setMessagingLocked(!hasEligible);
        } catch {
          if (!cancelled) setMessagingLocked(false);
        }
        return;
      }

      // 2. Student ↔ Alumni (Mentor) check
      if (
        (currentUserRole === 'student' && selectedThread.otherUser.role === 'alumni') ||
        (currentUserRole === 'alumni' && selectedThread.otherUser.role === 'student')
      ) {
        try {
          // Fetch the sessions involving these two
          // For a student querying their mentor sessions, they just hit /api/mentor-sessions
          // But it's easier to fetch all sessions and filter.
          const roleParam = currentUserRole === 'alumni' ? '?role=mentor' : '';
          const res = await fetch(`/api/mentor-sessions${roleParam}`, { cache: 'no-store' });
          const d = await readJsonSafely<unknown[]>(res, []);
          const sessions = Array.isArray(d) ? d : [];

          // Check if there is an accepted or scheduled session with the other user
          const mentorIdToCheck =
            currentUserRole === 'alumni' ? currentUserId : selectedThread.otherUser._id;
          const studentIdToCheck =
            currentUserRole === 'student' ? currentUserId : selectedThread.otherUser._id;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const hasEligibleSession = sessions.some((s: any) => {
            const mUserId = s.mentorId?.userId;
            const mId = (mUserId?._id || mUserId || s.mentorId)?.toString();
            const stId = (s.studentId?._id || s.studentId)?.toString();

            const isMatch = mId === mentorIdToCheck && stId === studentIdToCheck;

            return isMatch && ['accepted', 'scheduled'].includes(s.status);
          });

          if (!cancelled) setMessagingLocked(!hasEligibleSession);
        } catch {
          if (!cancelled) setMessagingLocked(false);
        }
        return;
      }

      if (!cancelled) setMessagingLocked(false);
    }

    checkEligibility();
    return () => {
      cancelled = true;
    };
  }, [currentUserRole, currentUserId, selectedThread]);

  /* ── Fetch Messages for Selected Thread ─────────────────────── */
  useEffect(() => {
    if (!selectedThread) return;
    fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: selectedThread.threadId }),
    });
    const prevUnread = selectedThread.unreadCount;
    if (prevUnread > 0)
      window.dispatchEvent(new CustomEvent('messages-read', { detail: { count: prevUnread } }));

    fetch(`/api/messages/${selectedThread.threadId}`)
      .then((r) => readJsonSafely<{ messages?: Message[] }>(r, {}))
      .then((d) => {
        setThreads((prev) =>
          prev.map((t) => (t.threadId === selectedThread.threadId ? { ...t, unreadCount: 0 } : t))
        );
        if (d.messages) {
          setMessages(d.messages);
          setTimeout(scrollToBottom, 50);
        }
      });
  }, [selectedThread]);

  /* ── Pusher ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) return;
    if (!pusherRef.current)
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      });

    const ch = pusherRef.current.subscribe(`user-${currentUserId}`);

    ch.bind('new-message', (msg: Message) => {
      if (selectedThread && selectedThread.threadId === msg.threadId) {
        setMessages((prev) => [...prev, msg]);
        fetch('/api/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId: msg.threadId }),
        });
        window.dispatchEvent(new Event('message-intercepted'));
        setTimeout(scrollToBottom, 100);
      } else {
        setThreads((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((t) => t.threadId === msg.threadId);
          if (idx >= 0) {
            updated[idx].lastMessage = msg;
            updated[idx].unreadCount += 1;
          } else {
            refetchThreads();
          }
          return updated.sort(
            (a, b) =>
              new Date(b.lastMessage.createdAt).getTime() -
              new Date(a.lastMessage.createdAt).getTime()
          );
        });
      }
    });

    ch.bind('message-edited', (edited: Message) => {
      setMessages((prev) => prev.map((m) => (m._id === edited._id ? edited : m)));
      setThreads((prev) =>
        prev.map((t) => (t.lastMessage._id === edited._id ? { ...t, lastMessage: edited } : t))
      );
    });

    ch.bind(
      'message-deleted',
      (payload: {
        messageId: string;
        forEveryone: boolean;
        content: string;
        deletedForMeBy: string | null;
      }) => {
        setMessages((prev) => {
          if (payload.forEveryone)
            return prev.map((m) =>
              m._id === payload.messageId
                ? { ...m, content: payload.content, isDeletedForEveryone: true, attachments: [] }
                : m
            );
          if (payload.deletedForMeBy === currentUserId)
            return prev.filter((m) => m._id !== payload.messageId);
          return prev;
        });
      }
    );

    ch.bind('messages-read', (payload: { threadId: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.threadId === payload.threadId && !m.isRead ? { ...m, isRead: true } : m))
      );
      setThreads((prev) =>
        prev.map((t) => {
          if (t.threadId === payload.threadId && !t.lastMessage.isRead) {
            return { ...t, lastMessage: { ...t.lastMessage, isRead: true } };
          }
          return t;
        })
      );
    });

    return () => {
      pusherRef.current?.unsubscribe(`user-${currentUserId}`);
    };
  }, [currentUserId, refetchThreads, selectedThread]);

  const freelanceThreads = threads.filter((thread) => thread.threadType === 'freelance_order');
  const directThreads = threads.filter((thread) => thread.threadType !== 'freelance_order');
  const selectedThreadReadOnly =
    messagingLocked ||
    (selectedThread?.threadType === 'freelance_order' &&
      !!selectedThread.freelanceOrder &&
      (selectedThread.freelanceOrder.proposalStatus !== 'accepted' ||
        ['completed', 'cancelled'].includes(selectedThread.freelanceOrder.status)));

  /* ── Send / Edit ─────────────────────────────────────────────── */
  const handleSendOrEdit = async () => {
    if ((!inputText.trim() && inputFiles.length === 0) || !selectedThread || selectedThreadReadOnly)
      return;
    setIsSending(true);

    if (editingMsg) {
      await fetch('/api/messages/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: editingMsg._id, content: inputText }),
      });
      setEditingMsg(null);
    } else {
      try {
        let uploadedAttachments: { url: string; name: string; type: string }[] = [];
        if (inputFiles.length > 0) {
          const results = await startUpload(inputFiles);
          if (results) {
            uploadedAttachments = results.map(
              (r: {
                ufsUrl?: string;
                url?: string;
                name?: string;
                type?: string;
                serverData?: Record<string, string>;
              }) => {
                const sData = r.serverData || {};
                return {
                  url: sData.ufsUrl || r.ufsUrl || r.url || '',
                  name: sData.name || r.name || 'attachment',
                  type:
                    sData.type ||
                    r.type ||
                    (r.name?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
                };
              }
            );
          }
        }

        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: selectedThread.otherUser._id,
            threadId: selectedThread.threadId,
            threadType: selectedThread.threadType,
            relatedFreelanceOrderId: selectedThread.freelanceOrder?._id,
            content: inputText,
            templateType: template || null,
            attachments: uploadedAttachments,
          }),
        });
        const data = await readJsonSafely<{ message?: Message; error?: string }>(res, {});
        const createdMessage = data.message;

        if (createdMessage) {
          setMessages((prev) => [...prev, createdMessage]);
          setThreads((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((t) => t.threadId === selectedThread.threadId);
            if (idx >= 0) updated[idx].lastMessage = createdMessage;
            return updated.sort(
              (a, b) =>
                new Date(b.lastMessage.createdAt).getTime() -
                new Date(a.lastMessage.createdAt).getTime()
            );
          });
        } else {
          console.error('API error response', data);
          setGlobalAlert(`Send failed from API: ${data.error || 'Unknown error'}`);
        }
      } catch (e) {
        console.error('Send failed exception', e);
        setGlobalAlert(`Send failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    setInputText('');
    setTemplate('');
    setInputFiles([]);
    setIsSending(false);
    scrollToBottom();
  };

  /* ── Delete ──────────────────────────────────────────────────── */
  const handleDeleteForMe = async () => {
    if (!deleteModal.msg) return;
    await fetch(`/api/messages/manage?messageId=${deleteModal.msg._id}&forEveryone=false`, {
      method: 'DELETE',
    });
    setMessages((prev) => prev.filter((m) => m._id !== deleteModal.msg!._id));
    setDeleteModal({ open: false, msg: null });
  };
  const handleDeleteForEveryone = async () => {
    if (!deleteModal.msg) return;
    const res = await fetch(
      `/api/messages/manage?messageId=${deleteModal.msg._id}&forEveryone=true`,
      { method: 'DELETE' }
    );
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === deleteModal.msg!._id
            ? {
                ...m,
                content: '*This message was deleted*',
                isDeletedForEveryone: true,
                attachments: [],
              }
            : m
        )
      );
    } else {
      const d = await readJsonSafely<{ error?: string }>(res, {});
      setGlobalAlert(d.error || 'Cannot delete for everyone'); // fallback
    }
    setDeleteModal({ open: false, msg: null });
  };

  /* ── Forward ─────────────────────────────────────────────────── */
  const handleForwardExecute = async (targetUserId: string) => {
    if (!forwardModal.msg) return;
    const msg = forwardModal.msg;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverId: targetUserId,
        content: msg.content,
        attachments: msg.attachments,
        forwardedFromId: msg._id,
      }),
    });
    setForwardModal({ open: false, msg: null });
    // FIX #3: Refetch threads so left panel shows the forwarded message
    await refetchThreads();
  };

  /* ── Templates ───────────────────────────────────────────────── */
  const applyTemplate = (type: string) => {
    setTemplate(type);
    if (!selectedThread) return;
    const n = selectedThread.otherUser.name.split(' ')[0];
    const texts: Record<string, string> = {
      interview_invite: `Hi ${n},\n\nWe were impressed by your profile and would love to invite you for an interview. Please let us know your availability for a 30-minute video call this week.\n\nBest regards.`,
      rejection: `Hi ${n},\n\nThank you for your interest. Unfortunately, we have decided to move forward with other candidates. We wish you the best in your career.\n\nBest regards.`,
      offer_letter: `Hi ${n},\n\nCongratulations! We are thrilled to offer you a position with our team. Please review the attached details. Welcome aboard!`,
    };
    setInputText(texts[type] ?? '');
  };

  /* ── Loading ─────────────────────────────────────────────────── */
  if (isLoading)
    return (
      <div
        style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}
      >
        <Loader2 className="animate-spin" size={32} color={C.primary} />
      </div>
    );

  const canSend = !selectedThreadReadOnly && (inputText.trim().length > 0 || inputFiles.length > 0);
  const showThreadList = !isMobileViewport || mobilePane === 'list' || !selectedThread;
  const showChatPanel = !isMobileViewport || (!!selectedThread && mobilePane === 'chat');

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <>
      {/* Modals */}
      {globalAlert && <AlertModal message={globalAlert} onClose={() => setGlobalAlert(null)} />}
      {deleteModal.open && deleteModal.msg && (
        <DeleteModal
          canDeleteForEveryone={(() => {
            const sid =
              typeof deleteModal.msg.senderId === 'string'
                ? deleteModal.msg.senderId
                : deleteModal.msg.senderId._id;
            const isSender = sid === currentUserId;
            const ageMs = new Date().getTime() - new Date(deleteModal.msg.createdAt).getTime();
            return isSender && ageMs < 15 * 60 * 1000;
          })()}
          onDeleteForMe={handleDeleteForMe}
          onDeleteForEveryone={handleDeleteForEveryone}
          onClose={() => setDeleteModal({ open: false, msg: null })}
        />
      )}
      {forwardModal.open && forwardModal.msg && (
        <ForwardModal
          threads={directThreads}
          onForward={handleForwardExecute}
          onClose={() => setForwardModal({ open: false, msg: null })}
        />
      )}

      {/* Shell */}
      <div
        style={{
          display: 'flex',
          height: '100%',
          flex: 1,
          minHeight: 0,
          background: C.white,
          borderRadius: isMobileViewport ? 0 : 24,
          boxShadow: isMobileViewport
            ? 'none'
            : '0 4px 24px rgba(37,99,235,0.06), 0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          border: isMobileViewport ? 'none' : `1px solid ${C.border}`,
        }}
      >
        {/* ── LEFT: Thread List ── */}
        {showThreadList && (
          <div
            style={{
              width: isMobileViewport ? '100%' : 300,
              borderRight: isMobileViewport ? 'none' : `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              background: C.white,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: isMobileViewport ? '18px 16px 16px' : '22px 20px 18px',
                background: 'linear-gradient(135deg, #1e293b 100%, #2563eb 0%)',
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Send size={16} color="#fff" style={{ marginLeft: 1 }} />
                  </div>
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 18,
                        fontWeight: 900,
                        color: '#fff',
                        letterSpacing: '-0.3px',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      Messages
                    </h2>
                    {isMobileViewport && (
                      <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>
                        Tap a conversation to open it
                      </div>
                    )}
                  </div>
                </div>
                {isMobileViewport && threads.length > 0 ? (
                  <div
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {threads.length} chats
                  </div>
                ) : null}
              </div>
            </div>

            {/* Thread list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {threads.length === 0 ? (
                <div
                  style={{
                    padding: isMobileViewport ? '32px 24px' : 32,
                    textAlign: 'center',
                    color: C.gray,
                    fontSize: 14,
                  }}
                >
                  No conversations yet
                </div>
              ) : (
                <>
                  {[
                    {
                      key: 'freelance',
                      title: 'Freelance Chats',
                      description: 'Accepted order conversations',
                      items: freelanceThreads,
                      icon: <BriefcaseBusiness size={12} />,
                    },
                    {
                      key: 'direct',
                      title: 'Direct Messages',
                      description: 'General conversations',
                      items: directThreads,
                      icon: <Send size={12} />,
                    },
                  ].map((section) =>
                    section.items.length ? (
                      <div key={section.key}>
                        <div
                          style={{
                            padding: isMobileViewport ? '14px 16px 10px' : '14px 18px 10px',
                            borderBottom: `1px solid ${C.bg}`,
                            background: '#F8FAFC',
                          }}
                        >
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              color: C.gray,
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                            }}
                          >
                            {section.icon}
                            {section.title}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 11, color: C.gray }}>
                            {section.description}
                          </div>
                        </div>
                        {section.items.map((thread) => {
                          const sectionSelected = selectedThread?.threadId === thread.threadId;
                          const sectionUnread = thread.unreadCount > 0;
                          const otherUser = thread.otherUser;
                          const sectionPreview = thread.lastMessage.isDeletedForEveryone
                            ? 'Thread message deleted'
                            : thread.lastMessage.content ||
                              (thread.threadType === 'freelance_order'
                                ? 'Freelance order chat ready'
                                : '');

                          return (
                            <div
                              key={thread.threadId}
                              onClick={() => handleThreadSelect(thread)}
                              style={{
                                padding: isMobileViewport ? '14px 16px' : '14px 24px',
                                cursor: 'pointer',
                                background: sectionSelected
                                  ? 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(34,211,238,0.06))'
                                  : C.white,
                                borderLeft: `4px solid ${sectionSelected ? C.primary : 'transparent'}`,
                                borderBottom: `1px solid ${C.bg}`,
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                if (!sectionSelected) e.currentTarget.style.background = C.bg;
                              }}
                              onMouseLeave={(e) => {
                                if (!sectionSelected) e.currentTarget.style.background = C.white;
                              }}
                            >
                              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ position: 'relative' }}>
                                  <Avatar user={otherUser} size={44} />
                                  {sectionUnread ? (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: -2,
                                        right: -2,
                                        width: 14,
                                        height: 14,
                                        borderRadius: 7,
                                        background: '#06b6d4',
                                        border: '2px solid white',
                                      }}
                                    />
                                  ) : null}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'baseline',
                                      marginBottom: 3,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontWeight: sectionUnread ? 800 : 600,
                                        fontSize: 14,
                                        color: sectionSelected ? C.primary : C.deep,
                                      }}
                                    >
                                      {otherUser.name}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: sectionUnread ? C.primary : C.gray,
                                        fontWeight: 600,
                                        flexShrink: 0,
                                        marginLeft: 8,
                                      }}
                                    >
                                      {fmtTime(thread.lastMessage.createdAt)}
                                    </span>
                                  </div>
                                  {thread.threadType === 'freelance_order' &&
                                  thread.freelanceOrder ? (
                                    <div
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        marginBottom: 6,
                                        padding: '3px 8px',
                                        borderRadius: 999,
                                        background: '#EFF6FF',
                                        border: `1px solid rgba(37, 99, 235, 0.22)`,
                                        color: C.primary,
                                        fontSize: 10,
                                        fontWeight: 800,
                                      }}
                                    >
                                      {thread.freelanceOrder.title}
                                    </div>
                                  ) : null}
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: 13,
                                        color: sectionUnread ? C.deep : C.gray,
                                        fontWeight: sectionUnread ? 600 : 400,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1,
                                        marginRight: 8,
                                      }}
                                    >
                                      {getMessageSenderId(thread.lastMessage) === currentUserId
                                        ? 'You: '
                                        : ''}
                                      {sectionPreview}
                                    </div>
                                    {sectionUnread ? (
                                      <div
                                        style={{
                                          background: C.primary,
                                          color: C.white,
                                          fontSize: 10,
                                          fontWeight: 800,
                                          padding: '2px 7px',
                                          borderRadius: 99,
                                        }}
                                      >
                                        {thread.unreadCount}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null
                  )}
                  {false
                    ? threads.map((thread) => {
                        const sel = selectedThread?.threadId === thread.threadId;
                        const unread = thread.unreadCount > 0;
                        const ou = thread.otherUser;
                        const preview = thread.lastMessage.isDeletedForEveryone
                          ? '🗑 Message deleted'
                          : thread.lastMessage.content || '';

                        return (
                          <div
                            key={thread.threadId}
                            onClick={() => handleThreadSelect(thread)}
                            style={{
                              padding: '14px 24px',
                              cursor: 'pointer',
                              background: sel
                                ? 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(34,211,238,0.06))'
                                : C.white,
                              borderLeft: `4px solid ${sel ? C.primary : 'transparent'}`,
                              borderBottom: `1px solid ${C.bg}`,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              if (!sel) e.currentTarget.style.background = C.bg;
                            }}
                            onMouseLeave={(e) => {
                              if (!sel) e.currentTarget.style.background = C.white;
                            }}
                          >
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <div style={{ position: 'relative' }}>
                                <Avatar user={ou} size={44} />
                                {unread && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: -2,
                                      right: -2,
                                      width: 14,
                                      height: 14,
                                      borderRadius: 7,
                                      background: '#06b6d4',
                                      border: '2px solid white',
                                    }}
                                  />
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'baseline',
                                    marginBottom: 3,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: unread ? 800 : 600,
                                      fontSize: 14,
                                      color: sel ? C.primary : C.deep,
                                    }}
                                  >
                                    {ou.name}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: unread ? C.primary : C.gray,
                                      fontWeight: 600,
                                      flexShrink: 0,
                                      marginLeft: 8,
                                    }}
                                  >
                                    {fmtTime(thread.lastMessage.createdAt)}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 13,
                                      color: unread ? C.deep : C.gray,
                                      fontWeight: unread ? 600 : 400,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      flex: 1,
                                      marginRight: 8,
                                    }}
                                  >
                                    {thread.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                                    {preview}
                                  </div>
                                  {unread && (
                                    <div
                                      style={{
                                        background: C.primary,
                                        color: C.white,
                                        fontSize: 10,
                                        fontWeight: 800,
                                        padding: '2px 7px',
                                        borderRadius: 99,
                                      }}
                                    >
                                      {thread.unreadCount}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    : null}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── RIGHT: Chat Window ── */}
        {showChatPanel && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: C.bg,
              minWidth: 0,
            }}
          >
            {selectedThread ? (
              <>
                {/* Chat Header */}
                <div
                  style={{
                    padding: isMobileViewport ? '12px 14px' : '14px 24px',
                    background: 'linear-gradient(135deg, #1e293b 0%, #2563eb 100%)',
                    borderBottom: `1px solid rgba(255,255,255,0.08)`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobileViewport ? 10 : 14,
                  }}
                >
                  {isMobileViewport && (
                    <button
                      type="button"
                      onClick={() => setMobilePane('list')}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        border: '1px solid rgba(255,255,255,0.18)',
                        background: 'rgba(255,255,255,0.12)',
                        color: C.white,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <Avatar user={selectedThread.otherUser} size={isMobileViewport ? 40 : 46} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        color: C.white,
                        fontSize: isMobileViewport ? 15 : 16,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {selectedThread.otherUser.name}
                    </div>
                    {selectedThread.threadType === 'freelance_order' &&
                    selectedThread.freelanceOrder ? (
                      <>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.95)',
                            fontWeight: 700,
                            marginTop: 2,
                          }}
                        >
                          {selectedThread.freelanceOrder.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)' }}>
                          Freelance order chat ·{' '}
                          {selectedThread.freelanceOrder.status.replace(/_/g, ' ')}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: C.white, textTransform: 'capitalize' }}>
                        {selectedThread.otherUser.role === 'employer'
                          ? selectedThread.otherUser.companyName || 'Employer'
                          : selectedThread.otherUser.role}
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: isMobileViewport ? '16px 14px' : '24px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobileViewport ? 14 : 18,
                  }}
                >
                  {messages.map((msg, i) => {
                    const sid = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id;
                    const isMe = sid === currentUserId;

                    return (
                      <div
                        key={msg._id || i}
                        onMouseEnter={() => setHoveredMsgId(msg._id)}
                        onMouseLeave={() => setHoveredMsgId(null)}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: isMobileViewport ? '84%' : '68%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {supportMessageTypeLabel(msg.messageType) ? (
                          <div
                            style={{
                              marginBottom: 5,
                              padding: '3px 8px',
                              border: `1px solid ${C.border}`,
                              borderRadius: 999,
                              background: C.white,
                              color: C.gray,
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {supportMessageTypeLabel(msg.messageType)}
                          </div>
                        ) : null}
                        {/* Forwarded label */}
                        {msg.forwardedFromId && (
                          <div
                            style={{
                              fontSize: 11,
                              color: C.gray,
                              marginBottom: 4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Forward size={11} /> Forwarded
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            alignItems: 'flex-end',
                            flexDirection: isMe ? 'row-reverse' : 'row',
                          }}
                        >
                          {/* Bubble */}
                          {(() => {
                            const hasText = !!msg.content?.trim();
                            const isImageOnly =
                              !hasText &&
                              msg.attachments &&
                              msg.attachments.length > 0 &&
                              msg.attachments.every((a) => a.type.startsWith('image/'));

                            return (
                              <div
                                style={{
                                  background: isMe ? C.bubbleOut : C.bubbleIn,
                                  color: isMe ? C.white : C.deep,
                                  padding: isImageOnly ? '4px' : '12px 16px',
                                  borderRadius: 20,
                                  borderBottomRightRadius: isMe ? 4 : 20,
                                  borderBottomLeftRadius: isMe ? 20 : 4,
                                  fontSize: 14,
                                  lineHeight: 1.55,
                                  whiteSpace: 'pre-wrap',
                                  boxShadow: isMe
                                    ? '0 4px 14px rgba(37,99,235,0.25)'
                                    : '0 2px 8px rgba(0,0,0,0.06)',
                                  border: isMe ? 'none' : `1px solid ${C.border}`,
                                }}
                              >
                                {msg.isDeletedForEveryone ? (
                                  <span style={{ fontStyle: 'italic', opacity: 0.65 }}>
                                    🗑 This message was deleted
                                  </span>
                                ) : (
                                  hasText && <>{msg.content}</>
                                )}

                                {/* Attachments */}
                                {msg.attachments &&
                                  msg.attachments.length > 0 &&
                                  !msg.isDeletedForEveryone && (
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 6,
                                        marginTop: hasText ? 8 : 0,
                                      }}
                                    >
                                      {msg.attachments.map((att, i) =>
                                        att.type.startsWith('image/') ? (
                                          <a
                                            key={i}
                                            href={att.url}
                                            target="_blank"
                                            rel="noreferrer"
                                          >
                                            <img
                                              src={att.url}
                                              alt={att.name}
                                              style={{
                                                maxWidth: isMobileViewport ? 190 : 220,
                                                maxHeight: isMobileViewport ? 190 : 220,
                                                borderRadius: isImageOnly ? 16 : 12,
                                                objectFit: 'cover',
                                                display: 'block',
                                                border: `1px solid ${
                                                  isMe ? 'rgba(255,255,255,0.2)' : C.border
                                                }`,
                                              }}
                                            />
                                          </a>
                                        ) : (
                                          <a
                                            key={i}
                                            href={att.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 6,
                                              padding: '8px 12px',
                                              background: isMe ? 'rgba(255,255,255,0.15)' : C.bg,
                                              borderRadius: 12,
                                              color: isMe ? C.white : C.primary,
                                              textDecoration: 'none',
                                              fontSize: 13,
                                              border: `1px solid ${isMe ? 'transparent' : C.border}`,
                                            }}
                                          >
                                            <FileText size={16} />
                                            <span
                                              style={{
                                                maxWidth: 160,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                              }}
                                            >
                                              {att.name}
                                            </span>
                                          </a>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            );
                          })()}

                          {/* Hover actions */}
                          {hoveredMsgId === msg._id && !msg.isDeletedForEveryone && (
                            <div
                              style={{
                                display: 'flex',
                                gap: 2,
                                background: C.white,
                                padding: '4px 6px',
                                borderRadius: 20,
                                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                                border: `1px solid ${C.border}`,
                                alignItems: 'center',
                              }}
                            >
                              <ActionBtn
                                icon={<Forward size={13} />}
                                label="Forward"
                                onClick={() => setForwardModal({ open: true, msg })}
                              />
                              {isMe && (msg.editCount ?? 0) < 5 && (
                                <ActionBtn
                                  icon={<Edit2 size={13} />}
                                  label="Edit"
                                  onClick={() => {
                                    setEditingMsg(msg);
                                    setInputText(msg.content);
                                  }}
                                />
                              )}
                              <ActionBtn
                                icon={<Trash2 size={13} />}
                                label="Delete"
                                color={C.danger}
                                onClick={() => setDeleteModal({ open: true, msg })}
                              />
                            </div>
                          )}
                        </div>

                        {/* Meta row */}
                        <div
                          style={{
                            fontSize: 11,
                            color: C.gray,
                            marginTop: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <span>{fmtTime(msg.createdAt)}</span>
                          {(msg.editCount ?? 0) > 0 && <span>· Edited</span>}
                          {isMe &&
                            (msg.isRead ? (
                              <CheckCheck size={14} color={C.primary} strokeWidth={2.5} />
                            ) : (
                              <Check size={14} color={C.gray} strokeWidth={2.5} />
                            ))}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div
                  style={{
                    padding: isMobileViewport
                      ? '12px 12px calc(12px + env(safe-area-inset-bottom))'
                      : '16px 24px',
                    background: C.white,
                    borderTop: `1px solid ${C.border}`,
                  }}
                >
                  {/* Editing indicator */}
                  {editingMsg && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 14px',
                        background: '#FEF9C3',
                        border: `1px solid #FDE68A`,
                        borderRadius: 8,
                        marginBottom: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#92400E',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Edit2 size={14} /> Editing message
                      </div>
                      <X
                        size={15}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setEditingMsg(null);
                          setInputText('');
                        }}
                      />
                    </div>
                  )}

                  {/* Templates */}
                  {currentUserRole === 'employer' &&
                    selectedThread.threadType === 'direct' &&
                    !editingMsg && (
                      <div style={{ marginBottom: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                          {
                            key: 'interview_invite',
                            label: 'Interview Invite',
                            bg: '#EFF6FF',
                            border: '#BFDBFE',
                            color: '#1E40AF',
                          },
                          {
                            key: 'offer_letter',
                            label: 'Offer Letter',
                            bg: '#F0FDF4',
                            border: '#BBF7D0',
                            color: '#166534',
                          },
                          {
                            key: 'rejection',
                            label: 'Rejection',
                            bg: '#FFF1F2',
                            border: '#FECDD3',
                            color: '#9F1239',
                          },
                        ].map((tmpl) => (
                          <button
                            key={tmpl.key}
                            onClick={() => applyTemplate(tmpl.key)}
                            style={{
                              fontSize: 12,
                              padding: '5px 14px',
                              borderRadius: 99,
                              background: tmpl.bg,
                              border: `1px solid ${tmpl.border}`,
                              cursor: 'pointer',
                              color: tmpl.color,
                              fontWeight: 700,
                              transition: 'all 0.15s',
                            }}
                          >
                            + {tmpl.label}
                          </button>
                        ))}
                      </div>
                    )}

                  {messagingLocked && (
                    <div
                      style={{
                        marginBottom: 12,
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: '#FFF7ED',
                        border: '1px solid #FED7AA',
                        color: '#9A3412',
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {selectedThread.otherUser.role === 'employer' ||
                      currentUserRole === 'employer' ? (
                        <>
                          🔒 You can only reply once your application is{' '}
                          <strong>&nbsp;Shortlisted</strong>,&nbsp;
                          <strong>Assessment Sent</strong>,&nbsp;
                          <strong>Interview Scheduled</strong>, or&nbsp;<strong>Hired</strong>. You
                          can still read messages from the employer.
                        </>
                      ) : (
                        <>
                          🔒 You can only message each other if you have an accepted or scheduled
                          mentorship session. Completed or pending sessions are read-only.
                        </>
                      )}
                    </div>
                  )}

                  {!messagingLocked &&
                    selectedThreadReadOnly &&
                    selectedThread?.threadType === 'freelance_order' && (
                      <div
                        style={{
                          marginBottom: 12,
                          padding: '10px 14px',
                          borderRadius: 12,
                          background: '#FFF7ED',
                          border: '1px solid #FED7AA',
                          color: '#9A3412',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        This freelance chat is now read-only because the order is closed.
                      </div>
                    )}

                  {/* File Previews */}
                  {!editingMsg && inputFiles.length > 0 && (
                    <div
                      style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '0 10px 14px' }}
                    >
                      {inputFiles.map((file, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: '#EFF6FF',
                            padding: '6px 12px',
                            borderRadius: 99,
                            fontSize: 12,
                            color: '#1E40AF',
                            border: `1px solid #BFDBFE`,
                          }}
                        >
                          {file.type.startsWith('image/') ? (
                            <ImageIcon size={14} />
                          ) : (
                            <FileText size={14} />
                          )}
                          <span
                            style={{
                              maxWidth: 120,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontWeight: 600,
                            }}
                          >
                            {file.name}
                          </span>
                          <X
                            size={14}
                            style={{ cursor: 'pointer', color: '#1E40AF', opacity: 0.6 }}
                            onClick={() =>
                              setInputFiles((prev) => prev.filter((_, i) => i !== idx))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input row */}
                  <div
                    style={{
                      display: 'flex',
                      gap: isMobileViewport ? 8 : 10,
                      alignItems: 'flex-end',
                      background: C.bg,
                      padding: isMobileViewport ? '8px 8px 8px 12px' : '8px 8px 8px 14px',
                      borderRadius: isMobileViewport ? 20 : 24,
                      border: `1.5px solid ${C.border}`,
                      transition: 'border-color 0.15s',
                    }}
                  >
                    {/* Paperclip */}
                    {!editingMsg && (
                      <>
                        <button
                          title="Attach files (max 4, 8MB each)"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={
                            isSending ||
                            isUploading ||
                            inputFiles.length >= 4 ||
                            selectedThreadReadOnly
                          }
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor:
                              isSending ||
                              isUploading ||
                              inputFiles.length >= 4 ||
                              selectedThreadReadOnly
                                ? 'not-allowed'
                                : 'pointer',
                            color: C.gray,
                            padding: '0 4px 6px 0',
                            display: 'flex',
                            alignItems: 'flex-end',
                            alignSelf: 'stretch',
                            opacity: inputFiles.length >= 4 || selectedThreadReadOnly ? 0.3 : 1,
                          }}
                        >
                          <Paperclip size={20} />
                        </button>
                        <input
                          type="file"
                          multiple
                          accept="image/*,application/pdf"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files) {
                              const incoming = Array.from(e.target.files);
                              setInputFiles((prev) => [...prev, ...incoming].slice(0, 4));
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }
                          }}
                        />
                      </>
                    )}

                    {/* Textarea */}
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={
                        selectedThreadReadOnly
                          ? selectedThread?.threadType === 'freelance_order'
                            ? 'This freelance order chat is closed.'
                            : 'This chat is closed.'
                          : editingMsg
                            ? 'Edit message…'
                            : 'Type a message…'
                      }
                      disabled={isSending || isUploading || selectedThreadReadOnly}
                      style={{
                        flex: 1,
                        minHeight: 24,
                        maxHeight: 120,
                        resize: 'none',
                        padding: '8px 0',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        color: C.deep,
                        lineHeight: 1.5,
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendOrEdit();
                        }
                      }}
                    />

                    {/* Send button */}
                    <button
                      onClick={handleSendOrEdit}
                      disabled={isSending || isUploading || !canSend}
                      style={{
                        width: isMobileViewport ? 40 : 42,
                        height: isMobileViewport ? 40 : 42,
                        borderRadius: isMobileViewport ? 20 : 21,
                        flexShrink: 0,
                        background: canSend ? C.bubbleOut : '#CBD5E1',
                        color: C.white,
                        border: 'none',
                        cursor: canSend ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: canSend ? `0 4px 14px rgba(37,99,235,0.3)` : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      {isSending || isUploading ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Send size={17} style={{ marginLeft: 1 }} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Empty state */
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.25)',
                  }}
                >
                  <Send size={32} color={C.white} style={{ marginLeft: 3 }} />
                </div>
                <p style={{ fontWeight: 700, fontSize: 17, color: C.deep, margin: 0 }}>
                  Select a conversation
                </p>
                <p style={{ fontSize: 13, color: C.gray, margin: 0 }}>
                  Pick a thread from the left to start chatting
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Tiny action button ─────────────────────────────────────────── */
function ActionBtn({
  icon,
  label,
  onClick,
  color = '#64748b',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      style={{
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: '4px 6px',
        color,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
    </button>
  );
}
