"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";

interface AdminSurgeryRec {
  id: number;
  status: "pending_admin" | "approved" | "rejected";
  admin_notes: string;
  package: number;
  package_name: string;
  package_slug: string;
  hospital_name: string;
  surgery_type: string;
  price_usd: string;
  doctor_name: string;
  patient_name: string;
  patient_email: string;
  notes: string;
  appointment: number | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending_admin: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700",
  approved:      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700",
  rejected:      "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  pending_admin: "Pending Admin Review",
  approved:      "Approved",
  rejected:      "Rejected",
};

export default function AdminSurgeryRecDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [rec, setRec] = useState<AdminSurgeryRec | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/api/v1/admin/surgery-recommendations/${id}`)
      .then((res) => {
        setRec(res.data);
        setAdminNotes(res.data.admin_notes || "");
      })
      .catch(() => toast.error("Failed to load recommendation."))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateRec(newStatus: AdminSurgeryRec["status"]) {
    if (!rec) return;
    setSaving(true);
    try {
      const res = await api.patch(`/api/v1/admin/surgery-recommendations/${rec.id}`, {
        status: newStatus,
        admin_notes: adminNotes,
      });
      setRec(res.data);
      setAdminNotes(res.data.admin_notes || "");
      toast.success(
        newStatus === "approved"
          ? `Approved — ${rec.patient_name} can now proceed with booking.`
          : newStatus === "rejected"
          ? "Recommendation rejected. Patient has been notified."
          : "Status updated."
      );
    } catch {
      toast.error("Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    if (!rec) return;
    setSaving(true);
    try {
      const res = await api.patch(`/api/v1/admin/surgery-recommendations/${rec.id}`, {
        admin_notes: adminNotes,
      });
      setRec(res.data);
      toast.success("Notes saved.");
    } catch {
      toast.error("Failed to save notes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8"><p className="text-sm text-zinc-400">Loading…</p></main>;
  if (!rec) return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Recommendation not found.</p>
      <Link href="/admin/surgery-recommendations" className="text-sm text-teal-600 hover:underline mt-2 block">← Back</Link>
    </main>
  );

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Surgery Recommendation</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Review details and approve or reject.</p>
          </div>
          <Link href="/admin/surgery-recommendations" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">← Back</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-5">

            {/* Package info */}
            <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Surgery Package</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{rec.package_name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{rec.hospital_name} · {rec.surgery_type}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold text-teal-600 dark:text-teal-400">${parseFloat(rec.price_usd).toLocaleString()}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">USD</p>
                </div>
              </div>
              <Link href={`/packages/${rec.package_slug}`} target="_blank"
                className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline">
                View public package page
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>

            {/* People */}
            <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Parties Involved</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">Doctor</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{rec.doctor_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Patient</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{rec.patient_name}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">{rec.patient_email}</p>
                </div>
              </div>
              {rec.appointment && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Based on appointment <span className="font-mono text-zinc-600 dark:text-zinc-300">#{rec.appointment}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Doctor's clinical notes */}
            {rec.notes && (
              <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Doctor&apos;s Clinical Notes</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line">{rec.notes}</p>
              </div>
            )}
          </div>

          {/* Right: Action panel */}
          <div className="space-y-4">

            {/* Current status */}
            <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Current Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${STATUS_STYLES[rec.status]}`}>
                  {STATUS_LABEL[rec.status]}
                </span>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                  Received {new Date(rec.created_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>

              {/* Admin notes */}
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">
                  Message to Patient
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Optional message shown to the patient after approval or rejection…"
                  className="flex w-full rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 px-3 py-2 text-sm outline-none focus-visible:border-teal-400 resize-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
                />
                <button onClick={saveNotes} disabled={saving}
                  className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors disabled:opacity-50">
                  {saving ? "Saving…" : "Save notes"}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 shadow-sm space-y-3">
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Actions</p>

              <button
                onClick={() => updateRec("approved")}
                disabled={saving || rec.status === "approved"}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {saving ? "Processing…" : rec.status === "approved" ? "Already Approved" : "Approve & Send to Patient"}
              </button>

              <button
                onClick={() => updateRec("rejected")}
                disabled={saving || rec.status === "rejected"}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {rec.status === "rejected" ? "Already Rejected" : "Reject"}
              </button>

              {rec.status !== "pending_admin" && (
                <button
                  onClick={() => updateRec("pending_admin")}
                  disabled={saving}
                  className="w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-600 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                >
                  Reset to Pending
                </button>
              )}
            </div>

            {rec.status === "approved" && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-3">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Patient can now book</p>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80 mt-0.5">
                  {rec.patient_name} will see the full package details and &quot;Book Now&quot; button on their recommendations page.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
