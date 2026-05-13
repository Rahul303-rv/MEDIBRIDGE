"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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

const STATUS_COLORS: Record<string, string> = {
  proposed:        "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  scheduled:       "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-100",
  in_progress:     "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  completed:       "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  confirmed:       "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  cancelled:       "bg-zinc-100 text-zinc-400 border-zinc-200 hover:bg-zinc-100",
  no_show:         "bg-red-100 text-red-600 border-red-200 hover:bg-red-100",
  info_pending:    "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  payment_pending: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
};

const CONSULTATION_STATUSES = ["proposed", "scheduled", "in_progress", "completed", "cancelled", "no_show"];
const SURGERY_STATUSES = ["info_pending", "payment_pending", "confirmed", "completed", "cancelled"];

export default function AdminBookingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const typeFilter = searchParams.get("type") ?? "";
  const statusFilter = searchParams.get("status") ?? "";

  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    api.get(`/api/v1/admin/bookings?${params}`)
      .then((res) => setBookings(res.data))
      .catch(() => toast.error("Failed to load bookings."))
      .finally(() => setLoading(false));
  }, [typeFilter, statusFilter]);

  function setParam(key: string, value: string) {
    setLoading(true);
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    if (key === "type") p.delete("status");
    router.push(`/admin/bookings?${p}`);
  }

  const statuses = typeFilter === "surgery" ? SURGERY_STATUSES
    : typeFilter === "consultation" ? CONSULTATION_STATUSES
    : [...CONSULTATION_STATUSES, ...SURGERY_STATUSES.filter((s) => !CONSULTATION_STATUSES.includes(s))];

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">All Bookings</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Consultations and surgery packages.</p>
          </div>
          <Link href="/admin" className="text-sm text-zinc-500 hover:underline">← Dashboard</Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            {["", "consultation", "surgery"].map((t) => (
              <button key={t} onClick={() => setParam("type", t)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  typeFilter === t
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-teal-300"
                }`}>
                {t === "" ? "All" : t === "consultation" ? "Consultations" : "Surgery"}
              </button>
            ))}
          </div>
          <select value={statusFilter} onChange={(e) => setParam("status", e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 bg-white outline-none focus:border-teal-400">
            <option value="">All Statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : bookings.length === 0 ? (
          <Card className="border border-zinc-200 shadow-sm">
            <CardContent className="pt-8 pb-8 text-center text-sm text-zinc-500">No bookings found.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <Card key={`${b.type}-${b.id}`}
                className={`border border-zinc-200 shadow-sm ${b.type === "surgery" ? "hover:border-teal-300 transition-colors cursor-pointer" : ""}`}
                onClick={b.type === "surgery" ? () => router.push(`/admin/bookings/surgery/${b.id}`) : undefined}>
                <CardContent className="pt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        b.type === "consultation" ? "bg-blue-50 text-blue-700" : "bg-teal-50 text-teal-700"
                      }`}>{b.type}</span>
                      <p className="text-sm font-medium text-zinc-900 truncate">
                        {b.type === "surgery" ? b.package_name : `#${b.id}`}
                      </p>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{b.patient_email}</p>
                    {b.doctor_email && <p className="text-xs text-zinc-400">Dr: {b.doctor_email}</p>}
                    {b.scheduled_start && (
                      <p className="text-xs text-zinc-400">
                        {new Date(b.scheduled_start).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                    {b.tentative_date && <p className="text-xs text-zinc-400">Tentative: {b.tentative_date}</p>}
                    {b.total_amount_usd && <p className="text-xs text-zinc-500 font-medium">${Number(b.total_amount_usd).toLocaleString()}</p>}
                    {b.payment_ref && <p className="text-xs text-zinc-300 font-mono">{b.payment_ref}</p>}
                    {b.type === "consultation" && b.meeting_link && (
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-zinc-400 font-mono truncate max-w-[240px]">{b.meeting_link}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(b.meeting_link!); toast.success("Link copied."); }}
                          className="text-xs text-zinc-500 hover:text-teal-600 border border-zinc-200 rounded px-1.5 py-0.5 transition-colors"
                        >
                          Copy
                        </button>
                        <a href={b.meeting_link} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-medium text-teal-600 hover:underline">
                          Join
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    <Badge className={STATUS_COLORS[b.status] ?? ""}>{b.status.replace(/_/g, " ")}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <p className="text-xs text-zinc-400 text-right">{bookings.length} record{bookings.length !== 1 ? "s" : ""}</p>
      </div>
    </main>
  );
}
