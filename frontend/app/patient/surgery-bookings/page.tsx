"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { SurgeryBookingList } from "@/types/api";
import { usePolling } from "@/hooks/use-polling";
import DiscussionPanel from "@/components/discussion-panel";

type Booking = SurgeryBookingList & { recommended_by_doctor?: string | null };

// Map of package_id → patient's recommendation info (used for chat with admin)
type RecMeta = { id: number; unread: number };

const STATUS_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  info_pending:    { badge: "bg-amber-100 text-amber-700",   dot: "bg-amber-400",  label: "Info Pending" },
  payment_pending: { badge: "bg-blue-100 text-blue-700",     dot: "bg-blue-400",   label: "Payment Pending" },
  confirmed:       { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400", label: "Confirmed" },
  completed:       { badge: "bg-zinc-100 text-zinc-600",     dot: "bg-zinc-400",   label: "Completed" },
  cancelled:       { badge: "bg-zinc-100 text-zinc-400",     dot: "bg-zinc-300",   label: "Cancelled" },
};

function BookingSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 animate-pulse space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-zinc-100 dark:bg-zinc-700 rounded w-48" />
          <div className="h-3 bg-zinc-100 dark:bg-zinc-700 rounded w-36" />
          <div className="h-3 bg-zinc-100 dark:bg-zinc-700 rounded w-56" />
        </div>
        <div className="space-y-2 items-end flex flex-col">
          <div className="h-6 w-24 bg-zinc-100 dark:bg-zinc-700 rounded-full" />
          <div className="h-6 w-16 bg-zinc-100 dark:bg-zinc-700 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function SurgeryBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [recsByPackage, setRecsByPackage] = useState<Record<number, RecMeta>>({});
  const [chatBookingId, setChatBookingId] = useState<number | null>(null);

  function fetchAll() {
    Promise.all([
      api.get("/api/v1/patient/surgery-bookings"),
      api.get("/api/v1/patient/surgery-recommendations"),
    ])
      .then(([bRes, rRes]) => {
        setBookings(bRes.data);
        const map: Record<number, RecMeta> = {};
        for (const r of rRes.data as Array<{ id: number; package: number; unread_for_patient: number }>) {
          map[r.package] = { id: r.id, unread: r.unread_for_patient ?? 0 };
        }
        setRecsByPackage(map);
      })
      .catch(() => {/* silent */})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchAll(); }, []);

  // Auto-refresh so admin status changes / unread chat counts appear without manual reload
  usePolling(() => { fetchAll(); }, 10000);

  function markChatRead(packageId: number) {
    setRecsByPackage((prev) => {
      const cur = prev[packageId];
      if (!cur) return prev;
      return { ...prev, [packageId]: { ...cur, unread: 0 } };
    });
  }

  const active = bookings.filter((b) => !["completed", "cancelled"].includes(b.status));
  const past   = bookings.filter((b) => ["completed", "cancelled"].includes(b.status));

  const chatBooking = chatBookingId !== null ? bookings.find((b) => b.id === chatBookingId) ?? null : null;
  const chatRec     = chatBooking ? recsByPackage[chatBooking.package] : undefined;

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Surgery Bookings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Your all-inclusive surgery package bookings</p>
        </div>
        <Link
          href="/packages"
          className="inline-flex items-center justify-center h-9 px-4 rounded-xl border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
        >
          Browse Packages
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <BookingSkeleton key={i} />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-14 text-center">
          <p className="text-5xl mb-4">✂️</p>
          <p className="font-bold text-zinc-700 dark:text-zinc-200 text-lg">No surgery bookings</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2 max-w-xs mx-auto">
            Browse our all-inclusive surgery packages with flights, hotel, and full support included.
          </p>
          <Link
            href="/packages"
            className="mt-5 inline-flex items-center h-10 px-6 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            Browse Packages
          </Link>
        </div>
      ) : (
        <div className="space-y-8">

          {active.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-400" />
                <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Active Bookings</h2>
              </div>
              {active.map((b) => (
                <BookingCard key={b.id} booking={b}
                  rec={recsByPackage[b.package]}
                  onChatOpen={() => setChatBookingId(b.id)} />
              ))}
            </section>
          )}

          {past.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-300" />
                <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Past Bookings</h2>
              </div>
              {past.map((b) => (
                <BookingCard key={b.id} booking={b}
                  rec={recsByPackage[b.package]}
                  onChatOpen={() => setChatBookingId(b.id)} />
              ))}
            </section>
          )}
        </div>
      )}

      {/* ── Chat-with-admin slide-in drawer (shared across all cards) ─────── */}
      {chatBooking && chatRec && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity"
            onClick={() => setChatBookingId(null)}
          />
          <aside className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-zinc-50 dark:bg-zinc-900 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{chatBooking.package_name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Chat with the MediBridge admin team</p>
              </div>
              <button
                onClick={() => setChatBookingId(null)}
                aria-label="Close chat"
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-3">
              <DiscussionPanel
                viewerRole="patient"
                endpoint={`/api/v1/patient/surgery-recommendations/${chatRec.id}/messages`}
                otherPartyName="Admin Team"
                onMessagesRead={() => markChatRead(chatBooking.package)}
              />
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function BookingCard({
  booking: b, rec, onChatOpen,
}: { booking: Booking; rec: RecMeta | undefined; onChatOpen: () => void }) {
  const sta = STATUS_STYLES[b.status];
  const unread = rec?.unread ?? 0;
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-teal-300 hover:shadow-sm transition-all p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-2xl shrink-0">
            ✂️
          </div>
          <div className="min-w-0">
            <p className="font-bold text-zinc-900 dark:text-white text-base">{b.package_name}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{b.hospital_name}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
              <span className="text-xs text-zinc-400 dark:text-zinc-500 capitalize">
                {b.surgery_type.replace(/_/g, " ")}
              </span>
              <span className="text-zinc-200 dark:text-zinc-700 text-xs">·</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                Tentative: {new Date(b.tentative_date).toLocaleDateString("en-US", {
                  year: "numeric", month: "short", day: "numeric",
                })}
              </span>
            </div>
            <p className="text-base font-extrabold text-teal-600 mt-2">
              ${Number(b.total_amount_usd).toLocaleString()} USD
            </p>
            {b.recommended_by_doctor && (
              <p className="text-xs text-teal-600 mt-0.5 font-medium">
                ⭐ Recommended by {b.recommended_by_doctor}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${sta?.dot ?? "bg-zinc-300"}`} />
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${sta?.badge ?? ""}`}>
              {sta?.label ?? b.status}
            </span>
          </div>
          <Link
            href={`/patient/surgery-bookings/${b.id}`}
            className="inline-flex items-center justify-center gap-1 h-8 px-4 rounded-xl border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
          >
            View Details
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Footer — Chat with Admin pinned to bottom-right of the card */}
      {rec && (
        <div className="flex justify-end pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-700">
          <button
            onClick={onChatOpen}
            title={unread > 0
              ? `${unread} new message${unread > 1 ? "s" : ""} from admin`
              : "Chat with admin team"
            }
            className={`relative inline-flex items-center justify-center gap-1.5 h-8 px-4 rounded-xl text-xs font-semibold transition-colors ${
              unread > 0
                ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                : "border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unread > 0 ? `${unread} new message${unread > 1 ? "s" : ""}` : "Chat with Admin"}
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-zinc-800">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
