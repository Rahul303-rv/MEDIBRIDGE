"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";

interface AdminBooking {
  id: number;
  type: "consultation" | "surgery";
  status: string;
  patient_email: string;
  doctor_email?: string;
  package_name?: string;
  scheduled_start?: string;
  tentative_date?: string;
  total_amount_usd?: string;
  payment_ref: string;
  meeting_link?: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  proposed:        "bg-amber-100 text-amber-700",
  scheduled:       "bg-blue-100 text-blue-700",
  in_progress:     "bg-purple-100 text-purple-700",
  completed:       "bg-emerald-100 text-emerald-700",
  confirmed:       "bg-emerald-100 text-emerald-700",
  cancelled:       "bg-zinc-100 text-zinc-400",
  no_show:         "bg-red-100 text-red-600",
  info_pending:    "bg-amber-100 text-amber-700",
  payment_pending: "bg-blue-100 text-blue-700",
};

const CONSULTATION_STATUSES = ["proposed", "scheduled", "in_progress", "completed", "cancelled", "no_show"];
const SURGERY_STATUSES = ["info_pending", "payment_pending", "confirmed", "completed", "cancelled"];

function BookingSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 shrink-0" />
          <div className="space-y-2">
            <div className="h-4 bg-zinc-100 rounded w-40" />
            <div className="h-3 bg-zinc-100 rounded w-56" />
            <div className="h-3 bg-zinc-100 rounded w-32" />
          </div>
        </div>
        <div className="h-6 w-24 bg-zinc-100 rounded-full" />
      </div>
    </div>
  );
}

export default function AdminBookingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const typeFilter = searchParams.get("type") ?? "";
  const statusFilter = searchParams.get("status") ?? "";

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    api.get(`/api/v1/admin/bookings?${params}`)
      .then((res) => setBookings(res.data))
      .catch(() => toast.error("Failed to load bookings."))
      .finally(() => setLoading(false));
  }, [typeFilter, statusFilter]);

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    if (key === "type") p.delete("status");
    router.push(`/admin/bookings?${p}`);
  }

  const statuses = typeFilter === "surgery" ? SURGERY_STATUSES
    : typeFilter === "consultation" ? CONSULTATION_STATUSES
    : [...CONSULTATION_STATUSES, ...SURGERY_STATUSES.filter((s) => !CONSULTATION_STATUSES.includes(s))];

  return (
    <div className="p-8 space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900">All Bookings</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Consultations and surgery packages</p>
        </div>
        {!loading && (
          <span className="text-sm font-medium text-zinc-400">
            {bookings.length} record{bookings.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl">
          {([["", "All"], ["consultation", "Consultations"], ["surgery", "Surgery"]] as [string, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setParam("type", t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                typeFilter === t
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setParam("status", e.target.value)}
          className="h-9 rounded-xl border border-zinc-200 px-3 text-sm text-zinc-700 bg-white outline-none focus:border-teal-400 transition-colors"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Bookings list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <BookingSkeleton key={i} />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-14 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-semibold text-zinc-700">No bookings found</p>
          <p className="text-zinc-400 text-sm mt-1">Try adjusting the filters above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={`${b.type}-${b.id}`}
              className={`bg-white rounded-2xl border border-zinc-200 p-5 transition-all ${
                b.type === "surgery"
                  ? "hover:border-teal-300 hover:shadow-sm cursor-pointer"
                  : ""
              }`}
              onClick={b.type === "surgery" ? () => router.push(`/admin/bookings/surgery/${b.id}`) : undefined}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                    b.type === "consultation" ? "bg-blue-50" : "bg-teal-50"
                  }`}>
                    {b.type === "consultation" ? "🩺" : "✂️"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-zinc-900 text-sm">
                        {b.type === "surgery" ? b.package_name : `Consultation #${b.id}`}
                      </p>
                      {b.total_amount_usd && (
                        <span className="font-bold text-teal-600 text-sm">
                          ${Number(b.total_amount_usd).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{b.patient_email}</p>
                    {b.doctor_email && (
                      <p className="text-xs text-zinc-400">Dr: {b.doctor_email}</p>
                    )}
                    {b.scheduled_start && (
                      <p className="text-xs text-zinc-400">
                        {new Date(b.scheduled_start).toLocaleString("en-US", {
                          month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    )}
                    {b.tentative_date && (
                      <p className="text-xs text-zinc-400">Tentative: {b.tentative_date}</p>
                    )}
                    {b.type === "consultation" && b.meeting_link && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-zinc-400 font-mono truncate max-w-[200px]">
                          {b.meeting_link}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(b.meeting_link!);
                            toast.success("Link copied.");
                          }}
                          className="text-xs text-zinc-500 hover:text-teal-600 border border-zinc-200 rounded-md px-1.5 py-0.5 transition-colors"
                        >
                          Copy
                        </button>
                        <a
                          href={b.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-teal-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Join
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="shrink-0 space-y-2 text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[b.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                    {b.status.replace(/_/g, " ")}
                  </span>
                  {b.type === "surgery" && (
                    <p className="text-xs font-medium text-teal-600">View details →</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
