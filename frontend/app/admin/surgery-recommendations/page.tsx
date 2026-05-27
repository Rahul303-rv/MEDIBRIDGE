"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";

interface AdminSurgeryRec {
  id: number;
  status: "pending_admin" | "approved" | "rejected";
  admin_notes: string;
  package_name: string;
  hospital_name: string;
  surgery_type: string;
  price_usd: string;
  doctor_name: string;
  patient_name: string;
  patient_email: string;
  notes: string;
  created_at: string;
}

const STATUS_FILTER_TABS: { value: string; label: string }[] = [
  { value: "",               label: "All"      },
  { value: "pending_admin",  label: "Pending"  },
  { value: "approved",       label: "Approved" },
  { value: "rejected",       label: "Rejected" },
];

const STATUS_STYLES: Record<string, string> = {
  pending_admin: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700",
  approved:      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700",
  rejected:      "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  pending_admin: "Pending",
  approved:      "Approved",
  rejected:      "Rejected",
};

export default function AdminSurgeryRecommendationsPage() {
  const [recs, setRecs] = useState<AdminSurgeryRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [approving, setApproving] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    const url = filter
      ? `/api/v1/admin/surgery-recommendations?status=${filter}`
      : "/api/v1/admin/surgery-recommendations";
    api.get(url)
      .then((res) => setRecs(res.data))
      .catch(() => toast.error("Failed to load recommendations."))
      .finally(() => setLoading(false));
  }, [filter]);

  async function quickApprove(rec: AdminSurgeryRec) {
    setApproving(rec.id);
    try {
      await api.patch(`/api/v1/admin/surgery-recommendations/${rec.id}`, { status: "approved" });
      setRecs((prev) => prev.map((r) => r.id === rec.id ? { ...r, status: "approved" } : r));
      toast.success(`Approved — ${rec.patient_name} can now book ${rec.package_name}.`);
    } catch {
      toast.error("Failed to approve.");
    } finally {
      setApproving(null);
    }
  }

  const counts = {
    pending_admin: recs.filter((r) => r.status === "pending_admin").length,
    approved:      recs.filter((r) => r.status === "approved").length,
    rejected:      recs.filter((r) => r.status === "rejected").length,
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Surgery Recommendations</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Review and approve doctor surgery recommendations before patients can book.</p>
          </div>
          {counts.pending_admin > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-semibold border border-amber-200 dark:border-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {counts.pending_admin} pending
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTER_TABS.map((tab) => (
            <button key={tab.value} onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                filter === tab.value
                  ? "bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-400"
                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
              }`}>
              {tab.label}
              {tab.value && counts[tab.value as keyof typeof counts] > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
                  {counts[tab.value as keyof typeof counts]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}
          </div>
        ) : recs.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 dark:text-zinc-500">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
            </svg>
            <p className="text-sm">No recommendations{filter ? ` with status "${STATUS_LABEL[filter]}"` : ""}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recs.map((rec) => (
              <div key={rec.id}
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Package + status */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="font-semibold text-zinc-900 dark:text-white">{rec.package_name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[rec.status]}`}>
                        {STATUS_LABEL[rec.status]}
                      </span>
                    </div>

                    {/* Hospital + surgery type */}
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{rec.hospital_name} · {rec.surgery_type} · ${parseFloat(rec.price_usd).toLocaleString()} USD</p>

                    {/* People */}
                    <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {rec.doctor_name}
                      </span>
                      <span>→</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {rec.patient_name} <span className="text-zinc-400">({rec.patient_email})</span>
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-600">·</span>
                      <span>{new Date(rec.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>

                    {rec.notes && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">&ldquo;{rec.notes}&rdquo;</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {rec.status === "pending_admin" && (
                      <button onClick={() => quickApprove(rec)}
                        disabled={approving === rec.id}
                        className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                        {approving === rec.id ? "…" : "Approve"}
                      </button>
                    )}
                    <Link href={`/admin/surgery-recommendations/${rec.id}`}
                      className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-600 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center">
                      Review →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
