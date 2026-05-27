"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { SurgeryBookingList } from "@/types/api";

type Booking = SurgeryBookingList & { recommended_by_doctor?: string | null };

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

  useEffect(() => {
    api.get("/api/v1/patient/surgery-bookings")
      .then((res) => setBookings(res.data))
      .finally(() => setLoading(false));
  }, []);

  const active = bookings.filter((b) => !["completed", "cancelled"].includes(b.status));
  const past   = bookings.filter((b) => ["completed", "cancelled"].includes(b.status));

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
          className="h-9 px-4 rounded-xl border border-teal-200 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
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
              {active.map((b) => <BookingCard key={b.id} booking={b} />)}
            </section>
          )}

          {past.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-300" />
                <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Past Bookings</h2>
              </div>
              {past.map((b) => <BookingCard key={b.id} booking={b} />)}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking: b }: { booking: Booking }) {
  const sta = STATUS_STYLES[b.status];
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
        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${sta?.dot ?? "bg-zinc-300"}`} />
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${sta?.badge ?? ""}`}>
              {sta?.label ?? b.status}
            </span>
          </div>
          <Link
            href={`/patient/surgery-bookings/${b.id}`}
            className="h-8 px-3 rounded-xl border border-teal-200 text-xs font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
