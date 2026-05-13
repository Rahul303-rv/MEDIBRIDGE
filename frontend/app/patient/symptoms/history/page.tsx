"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { SymptomIntake } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

export default function SymptomHistoryPage() {
  const [intakes, setIntakes] = useState<SymptomIntake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/patient/symptom-intakes")
      .then((res) => setIntakes(res.data))
      .finally(() => setLoading(false));
  }, []);

  async function cancelIntake(id: number) {
    try {
      const res = await api.post(`/api/v1/patient/symptom-intakes/${id}/cancel`);
      setIntakes((prev) => prev.map((i) => (i.id === id ? res.data : i)));
      toast.success("Request cancelled.");
    } catch {
      toast.error("Could not cancel request.");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Consultation Requests</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Your submitted symptom requests and their status.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/patient/symptoms" className="text-sm font-medium text-teal-600 hover:underline">
              + New request
            </Link>
            <Link href="/patient" className="text-sm text-zinc-500 hover:underline">← Dashboard</Link>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : intakes.length === 0 ? (
          <Card className="border border-zinc-200 shadow-sm">
            <CardContent className="pt-8 pb-8 text-center space-y-3">
              <p className="text-sm text-zinc-500">You haven&apos;t submitted any consultation requests yet.</p>
              <Link
                href="/patient/symptoms"
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                Request a consultation
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {intakes.map((intake) => (
              <Card key={intake.id} className="border border-zinc-200 shadow-sm">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium text-zinc-900 truncate">{intake.chief_complaint}</p>
                      <p className="text-xs text-zinc-400">
                        {new Date(intake.created_at).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                        {" · "}Duration: {intake.duration}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={SEVERITY_COLORS[intake.severity] ?? ""}>
                        {intake.severity}
                      </Badge>
                      <Badge className={STATUS_COLORS[intake.status] ?? ""}>
                        {intake.status}
                      </Badge>
                    </div>
                  </div>

                  {intake.symptoms && (
                    <p className="text-sm text-zinc-600 line-clamp-2">{intake.symptoms}</p>
                  )}

                  {intake.status === "matched" && intake.matched_doctor_detail && (
                    <div className="rounded-lg bg-teal-50 border border-teal-100 px-4 py-3 space-y-1">
                      <p className="text-xs font-medium text-teal-700 uppercase tracking-wide">Matched Doctor</p>
                      <p className="text-sm font-semibold text-zinc-800">
                        Dr. {intake.matched_doctor_detail.first_name} {intake.matched_doctor_detail.last_name}
                      </p>
                      {intake.matched_doctor_detail.specializations.length > 0 && (
                        <p className="text-xs text-zinc-500">
                          {intake.matched_doctor_detail.specializations.map((s) => s.name).join(", ")}
                        </p>
                      )}
                      {intake.admin_notes && (
                        <p className="text-xs text-zinc-500 mt-1">Note: {intake.admin_notes}</p>
                      )}
                      <Link
                        href={`/doctors/${intake.matched_doctor_detail.slug}`}
                        className="inline-flex items-center text-xs text-teal-600 hover:underline mt-1"
                      >
                        View doctor profile →
                      </Link>
                    </div>
                  )}

                  {intake.status === "pending" && (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => cancelIntake(intake.id)}
                      >
                        Cancel request
                      </Button>
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
