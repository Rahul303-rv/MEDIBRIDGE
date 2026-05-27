"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SurgeryRec {
  id: number;
  package_name: string;
  package_slug: string;
  hospital_name: string;
  surgery_type: string;
  price_usd: string;
  doctor_name: string;
  notes: string;
  appointment: number | null;
}

interface Medicine {
  id: number;
  medicine_name: string;
  dosage: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
  meal_timing: string;
  duration_days: number;
  instructions: string;
}

interface Test {
  id: number;
  test_name: string;
  urgency: "routine" | "urgent";
  instructions: string;
}

interface Prescription {
  id: number;
  appointment_id: number;
  appointment_date: string;
  doctor_name: string;
  doctor_reg_no: string;
  patient_name: string;
  diagnosis: string;
  general_notes: string;
  follow_up_required: boolean;
  follow_up_after_days: number | null;
  medicines: Medicine[];
  tests: Test[];
  created_at: string;
}

const MEAL_LABELS: Record<string, string> = {
  before_meal: "Before Meal",
  after_meal: "After Meal",
  with_meal: "With Meal",
  any: "Any",
};

function Tick({ val }: { val: boolean }) {
  return val
    ? <span className="text-teal-600 font-bold">✓</span>
    : <span className="text-zinc-300">—</span>;
}

export default function PatientPrescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [rx, setRx] = useState<Prescription | null>(null);
  const [surgeryRecs, setSurgeryRecs] = useState<SurgeryRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/api/v1/patient/prescriptions/${id}`),
      api.get("/api/v1/patient/surgery-recommendations"),
    ]).then(([rxRes, recRes]) => {
      setRx(rxRes.data);
      const apptId = rxRes.data.appointment_id;
      setSurgeryRecs((recRes.data as SurgeryRec[]).filter((r) => r.appointment === apptId));
    }).finally(() => setLoading(false));
  }, [id]);

  async function downloadPdf() {
    setDownloading(true);
    try {
      const res = await api.get(`/api/v1/patient/prescriptions/${id}/pdf`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not download PDF.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8"><p className="text-sm text-zinc-400">Loading…</p></main>;
  if (!rx) return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <p className="text-sm text-zinc-500">Prescription not found.</p>
      <Link href="/patient/prescriptions" className="text-sm text-teal-600 hover:underline mt-2 block">← Back</Link>
    </main>
  );

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Prescription</h1>
          <div className="flex items-center gap-3">
            <button onClick={downloadPdf} disabled={downloading}
              className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50">
              {downloading ? "Generating…" : "Download PDF"}
            </button>
            <Link href="/patient/prescriptions" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">← Back</Link>
          </div>
        </div>

        {/* Header */}
        <Card className="border border-zinc-200 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">{rx.doctor_name}</p>
                {rx.doctor_reg_no && <p className="text-xs text-zinc-400 dark:text-zinc-500">Reg No: {rx.doctor_reg_no}</p>}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {new Date(rx.appointment_date).toLocaleString("en-US", {
                  weekday: "long", month: "long", day: "numeric", year: "numeric",
                })}
              </p>
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-3">Patient: <strong>{rx.patient_name}</strong></p>
          </CardContent>
        </Card>

        {/* Diagnosis */}
        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Diagnosis</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{rx.diagnosis}</p>
          </CardContent>
        </Card>

        {/* Medicines */}
        {rx.medicines.length > 0 && (
          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Medicines</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-700">
                      <th className="text-left py-2 pr-4 font-medium">Medicine</th>
                      <th className="text-left py-2 pr-3 font-medium">Dosage</th>
                      <th className="text-center py-2 px-2 font-medium">M</th>
                      <th className="text-center py-2 px-2 font-medium">A</th>
                      <th className="text-center py-2 px-2 font-medium">E</th>
                      <th className="text-center py-2 px-2 font-medium">N</th>
                      <th className="text-left py-2 px-3 font-medium">Timing</th>
                      <th className="text-center py-2 px-2 font-medium">Days</th>
                      <th className="text-left py-2 pl-3 font-medium">Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rx.medicines.map((med) => (
                      <tr key={med.id} className="border-b border-zinc-50 dark:border-zinc-800">
                        <td className="py-2 pr-4 text-zinc-900 dark:text-white font-medium">{med.medicine_name}</td>
                        <td className="py-2 pr-3 text-zinc-600 dark:text-zinc-400">{med.dosage}</td>
                        <td className="py-2 px-2 text-center"><Tick val={med.morning} /></td>
                        <td className="py-2 px-2 text-center"><Tick val={med.afternoon} /></td>
                        <td className="py-2 px-2 text-center"><Tick val={med.evening} /></td>
                        <td className="py-2 px-2 text-center"><Tick val={med.night} /></td>
                        <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{MEAL_LABELS[med.meal_timing] ?? med.meal_timing}</td>
                        <td className="py-2 px-2 text-center text-zinc-600 dark:text-zinc-400">{med.duration_days}</td>
                        <td className="py-2 pl-3 text-zinc-500 dark:text-zinc-400 text-xs">{med.instructions || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tests */}
        {rx.tests.length > 0 && (
          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Recommended Tests</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {rx.tests.map((t) => (
                <div key={t.id} className="flex items-start gap-3">
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium flex-1">{t.test_name}</p>
                  <Badge className={t.urgency === "urgent"
                    ? "bg-red-100 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                    : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-700 dark:text-zinc-300 dark:border-zinc-600"}>
                    {t.urgency}
                  </Badge>
                  {t.instructions && <p className="text-xs text-zinc-400">{t.instructions}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Follow-up */}
        {rx.follow_up_required && (
          <Card className="border border-teal-200 dark:border-teal-800 shadow-sm bg-teal-50 dark:bg-teal-900/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-teal-700 dark:text-teal-400 font-medium">
                Follow-up recommended{rx.follow_up_after_days ? ` after ${rx.follow_up_after_days} days` : ""}
              </p>
            </CardContent>
          </Card>
        )}

        {/* General Notes */}
        {rx.general_notes && (
          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">General Notes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-700">{rx.general_notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Surgery Recommendations */}
        {surgeryRecs.length > 0 && (
          <Card className="border border-teal-200 dark:border-teal-800 shadow-sm bg-teal-50 dark:bg-teal-900/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-teal-800 dark:text-teal-300">Surgery Recommended</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {surgeryRecs.map((rec) => (
                <div key={rec.id} className="bg-white dark:bg-zinc-800 rounded-lg border border-teal-100 dark:border-teal-800 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white">{rec.package_name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{rec.hospital_name} · {rec.surgery_type}</p>
                    </div>
                    <p className="text-lg font-bold text-teal-700 dark:text-teal-400 shrink-0">${rec.price_usd}</p>
                  </div>
                  {rec.notes && (
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 border-t border-zinc-100 dark:border-zinc-700 pt-2">{rec.notes}</p>
                  )}
                  <Link
                    href={`/packages/${rec.package_slug}`}
                    className="inline-flex items-center justify-center h-8 px-4 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 transition-colors"
                  >
                    View Package →
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
