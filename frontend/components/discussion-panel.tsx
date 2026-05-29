"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Message {
  id: number;
  sender_role: "admin" | "doctor" | "patient";
  sender_name: string;
  sender_email: string;
  body: string;
  created_at: string;
}

interface DiscussionPanelProps {
  /** The role of the *current viewer* — determines bubble alignment & color */
  viewerRole: "admin" | "doctor" | "patient";
  /** Endpoint for GET/POST messages, e.g. /api/v1/admin/surgery-recommendations/6/messages */
  endpoint: string;
  /** Display name of the other party, e.g. "Dr. Kavita Mishra" or "Admin Team" */
  otherPartyName: string;
  /** Optional callback when unread count changes (so list pages can refresh) */
  onMessagesRead?: () => void;
}

const POLL_MS = 5000;

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function DiscussionPanel({
  viewerRole,
  endpoint,
  otherPartyName,
  onMessagesRead,
}: DiscussionPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageId = useRef<number>(0);

  // Fetch messages
  async function load(initial = false) {
    try {
      const res = await api.get(endpoint);
      const newMsgs: Message[] = res.data;
      setMessages(newMsgs);
      // Mark-as-read happens server-side on GET, so notify parent
      if (newMsgs.length > 0) {
        const maxId = newMsgs[newMsgs.length - 1].id;
        if (maxId > lastMessageId.current) {
          lastMessageId.current = maxId;
          if (!initial) onMessagesRead?.();
        }
      }
    } catch {
      if (initial) toast.error("Failed to load discussion.");
    } finally {
      if (initial) setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await api.post(endpoint, { body });
      setMessages((prev) => [...prev, res.data]);
      setDraft("");
      onMessagesRead?.();
    } catch {
      toast.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-3 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 border-b border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
            <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">Discussion</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">with {otherPartyName}</p>
          </div>
        </div>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {messages.length} message{messages.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 max-h-[400px] min-h-[200px] bg-zinc-50/50 dark:bg-zinc-900/20">
        {loading ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-8">Loading discussion…</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2 opacity-50">💬</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">No messages yet</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Start the discussion to ask {otherPartyName} about this recommendation.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_role === viewerRole;
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isOwn
                    ? "bg-teal-600 text-white rounded-br-sm"
                    : "bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-600 rounded-bl-sm"
                }`}>
                  {!isOwn && (
                    <p className={`text-xs font-semibold mb-0.5 ${
                      msg.sender_role === "doctor"
                        ? "text-teal-600 dark:text-teal-400"
                        : msg.sender_role === "patient"
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-blue-600 dark:text-blue-400"
                    }`}>
                      {msg.sender_name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                  <p className={`text-[10px] mt-1 ${isOwn ? "text-teal-100" : "text-zinc-400 dark:text-zinc-500"}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="px-3 py-3 border-t border-zinc-100 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <div className="flex gap-2 items-end">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder={`Message ${otherPartyName}…`}
            className="flex-1 resize-none rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 px-3 py-2 text-sm outline-none focus-visible:border-teal-400 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 max-h-32"
          />
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            className="h-9 px-4 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5 px-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
