"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { AdminSymptomIntake, DoctorProfile } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_TABS = ["all", "pending", "matched", "cancelled"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const SEVERITY_COLORS: Record<string, string> = {
  mild: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  moderate: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  severe: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-100",
  matched: "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-100",
  cancelled: "bg-zinc-100 text-zinc-400 border-zinc-200 hover:bg-zinc-100",
};

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
    const query = tab !== "all" ? `?status=${tab}` : "";
    api.get(`/api/v1/admin/symptom-intakes${query}`)
      .then((res) => setIntakes(res.data))
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
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Symptom Intakes</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Review and match patients to doctors.</p>
          </div>
          <Link href="/admin" className="text-sm text-zinc-500 hover:underline">← Admin</Link>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 border-b border-zinc-200">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setLoading(true); setActiveTab(tab); }}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-teal-600 text-teal-700"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : intakes.length === 0 ? (
          <p className="text-sm text-zinc-500">No intakes found for this filter.</p>
        ) : (
          <div className="space-y-4">
            {intakes.map((intake) => (
              <Card key={intake.id} className="border border-zinc-200 shadow-sm">
                <CardContent className="pt-5 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-zinc-900 truncate">{intake.chief_complaint}</p>
                      <p className="text-xs text-zinc-500">
                        {intake.patient_name} · {intake.patient_email}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {new Date(intake.created_at).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                        {" · "}Duration: {intake.duration}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={SEVERITY_COLORS[intake.severity] ?? ""}>{intake.severity}</Badge>
                      <Badge className={STATUS_COLORS[intake.status] ?? ""}>{intake.status}</Badge>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600">{intake.symptoms}</p>

                  {intake.existing_conditions_note && (
                    <p className="text-xs text-zinc-400">Conditions: {intake.existing_conditions_note}</p>
                  )}

                  {intake.preferred_doctor_detail && (
                    <p className="text-xs text-zinc-500">
                      Patient preference: Dr. {intake.preferred_doctor_detail.first_name}{" "}
                      {intake.preferred_doctor_detail.last_name}
                    </p>
                  )}

                  {intake.status === "matched" && intake.matched_doctor_detail && (
                    <div className="rounded-lg bg-teal-50 border border-teal-100 px-3 py-2 text-sm">
                      <span className="font-medium text-teal-700">Matched: </span>
                      <span className="text-zinc-700">
                        Dr. {intake.matched_doctor_detail.first_name} {intake.matched_doctor_detail.last_name}
                      </span>
                      {intake.matched_by_email && (
                        <span className="text-zinc-400 text-xs"> by {intake.matched_by_email}</span>
                      )}
                      {intake.admin_notes && (
                        <p className="text-xs text-zinc-500 mt-1">Notes: {intake.admin_notes}</p>
                      )}
                    </div>
                  )}

                  {/* Match form */}
                  {intake.status !== "cancelled" && (
                    <div className="flex justify-end">
                      {matchingId === intake.id ? (
                        <div className="w-full space-y-3 border border-zinc-200 rounded-lg p-4">
                          <select
                            value={matchDoctor}
                            onChange={(e) => setMatchDoctor(e.target.value)}
                            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
                          >
                            <option value="">Select a doctor…</option>
                            {doctors.map((d) => (
                              <option key={d.id} value={d.id}>
                                Dr. {d.first_name} {d.last_name}
                                {d.specializations.length > 0 &&
                                  ` — ${d.specializations.map((s) => s.name).join(", ")}`}
                              </option>
                            ))}
                          </select>
                          <textarea
                            rows={2}
                            placeholder="Optional note to the patient…"
                            value={matchNotes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMatchNotes(e.target.value)}
                            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setMatchingId(null); setMatchDoctor(""); setMatchNotes(""); }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              disabled={submitting}
                              onClick={() => submitMatch(intake.id)}
                            >
                              {submitting ? "Matching…" : "Confirm match"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-teal-700 border-teal-200 hover:bg-teal-50"
                          onClick={() => { setMatchingId(intake.id); setMatchDoctor(""); setMatchNotes(""); }}
                        >
                          {intake.status === "matched" ? "Re-match doctor" : "Match to doctor"}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
