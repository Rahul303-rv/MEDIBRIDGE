"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { AdminSymptomIntake, DoctorProfile } from "@/types/api";

const STATUS_TABS = ["all", "pending", "matched", "cancelled"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const SEVERITY_STYLES: Record<string, { badge: string; label: string }> = {
  mild:     { badge: "bg-emerald-100 text-emerald-700", label: "Mild" },
  moderate: { badge: "bg-amber-100 text-amber-700",    label: "Moderate" },
  severe:   { badge: "bg-red-100 text-red-700",        label: "Severe" },
};

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  pending:   { badge: "bg-amber-100 text-amber-700",   dot: "bg-amber-400" },
  matched:   { badge: "bg-teal-100 text-teal-700",     dot: "bg-teal-400" },
  cancelled: { badge: "bg-zinc-100 text-zinc-400",     dot: "bg-zinc-300" },
};

function IntakeSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 animate-pulse space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-zinc-100 rounded w-56" />
          <div className="h-3 bg-zinc-100 rounded w-72" />
          <div className="h-3 bg-zinc-100 rounded w-40" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-zinc-100 rounded-full" />
          <div className="h-6 w-16 bg-zinc-100 rounded-full" />
        </div>
      </div>
      <div className="h-3 bg-zinc-100 rounded w-full" />
      <div className="h-3 bg-zinc-100 rounded w-4/5" />
    </div>
  );
}

export default function AdminIntakesPage() {
  const [intakes, setIntakes] = useState<AdminSymptomIntake[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusTab>("pending");
  const [matchingId, setMatchingId] = useState<number | null>(null);
  const [matchDoctor, setMatchDoctor] = useState("");
  const [matchNotes, setMatchNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadIntakes(tab: StatusTab) {
    setLoading(true);
    const query = tab !== "all" ? `?status=${tab}` : "";
    api.get(`/api/v1/admin/symptom-intakes${query}`)
      .then((res) => setIntakes(res.data))
      .catch(() => toast.error("Failed to load intakes."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadIntakes(activeTab);
    api.get("/api/v1/public/doctors").then((res) => setDoctors(res.data)).catch(() => {});
  }, [activeTab]);

  async function submitMatch(intakeId: number) {
    if (!matchDoctor) { toast.error("Select a doctor first."); return; }
    setSubmitting(true);
    try {
      const res = await api.post(`/api/v1/admin/symptom-intakes/${intakeId}/match`, {
        doctor_id: Number(matchDoctor),
        ...(matchNotes ? { admin_notes: matchNotes } : {}),
      });
      setIntakes((prev) => prev.map((i) => (i.id === intakeId ? res.data : i)));
      setMatchingId(null);
      setMatchDoctor("");
      setMatchNotes("");
      toast.success("Patient matched to doctor successfully.");
    } catch {
      toast.error("Failed to match. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900">Symptom Intakes</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Review patient requests and match them to the right doctors</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <IntakeSkeleton key={i} />)}
        </div>
      ) : intakes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-14 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-semibold text-zinc-700">All clear!</p>
          <p className="text-zinc-400 text-sm mt-1">No intakes matching this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {intakes.map((intake) => {
            const sev = SEVERITY_STYLES[intake.severity];
            const sta = STATUS_STYLES[intake.status];
            return (
              <div key={intake.id} className="bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 transition-colors overflow-hidden">
                <div className="p-6 space-y-4">

                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${sta?.dot ?? "bg-zinc-300"}`} />
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-900 leading-snug">{intake.chief_complaint}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {intake.patient_name} · {intake.patient_email}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {new Date(intake.created_at).toLocaleDateString("en-US", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                          {" · "}Duration: {intake.duration}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {sev && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${sev.badge}`}>
                          {intake.severity}
                        </span>
                      )}
                      {sta && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${sta.badge}`}>
                          {intake.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Symptoms */}
                  <p className="text-sm text-zinc-600 leading-relaxed">{intake.symptoms}</p>

                  {intake.existing_conditions_note && (
                    <div className="bg-zinc-50 rounded-xl px-4 py-2.5 text-xs text-zinc-500">
                      <span className="font-semibold">Conditions: </span>
                      {intake.existing_conditions_note}
                    </div>
                  )}

                  {intake.preferred_doctor_detail && (
                    <p className="text-xs text-zinc-500">
                      Patient preference: Dr. {intake.preferred_doctor_detail.first_name}{" "}
                      {intake.preferred_doctor_detail.last_name}
                    </p>
                  )}

                  {/* Matched info */}
                  {intake.status === "matched" && intake.matched_doctor_detail && (
                    <div className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-3">
                      <p className="text-sm">
                        <span className="font-bold text-teal-700">Matched: </span>
                        <span className="text-zinc-700">
                          Dr. {intake.matched_doctor_detail.first_name} {intake.matched_doctor_detail.last_name}
                        </span>
                        {intake.matched_by_email && (
                          <span className="text-zinc-400 text-xs"> · by {intake.matched_by_email}</span>
                        )}
                      </p>
                      {intake.admin_notes && (
                        <p className="text-xs text-zinc-500 mt-1">{intake.admin_notes}</p>
                      )}
                    </div>
                  )}

                  {/* Match action */}
                  {intake.status !== "cancelled" && (
                    <div className="pt-1 border-t border-zinc-100">
                      {matchingId === intake.id ? (
                        <div className="space-y-3 pt-3">
                          <select
                            value={matchDoctor}
                            onChange={(e) => setMatchDoctor(e.target.value)}
                            className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-teal-400 transition-colors"
                          >
                            <option value="">Select a doctor…</option>
                            {doctors.map((d) => (
                              <option key={d.id} value={d.id}>
                                Dr. {d.first_name} {d.last_name}
                                {d.specializations.length > 0 && ` — ${d.specializations.map((s) => s.name).join(", ")}`}
                              </option>
                            ))}
                          </select>
                          <textarea
                            rows={2}
                            placeholder="Optional note for the patient…"
                            value={matchNotes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMatchNotes(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400 resize-none transition-colors"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => { setMatchingId(null); setMatchDoctor(""); setMatchNotes(""); }}
                              className="h-9 px-4 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={submitting}
                              onClick={() => submitMatch(intake.id)}
                              className="h-9 px-5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
                            >
                              {submitting ? "Matching…" : "Confirm match"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => { setMatchingId(intake.id); setMatchDoctor(""); setMatchNotes(""); }}
                            className="h-9 px-4 rounded-xl border border-teal-200 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
                          >
                            {intake.status === "matched" ? "Re-match doctor" : "Match to doctor"} →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
