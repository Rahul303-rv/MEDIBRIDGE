"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { SurgeryPackage } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MedicineRow {
  medicine_name: string;
  dosage: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
  meal_timing: "before_meal" | "after_meal" | "with_meal" | "any";
  duration_days: number;
  instructions: string;
}

interface TestRow {
  test_name: string;
  urgency: "routine" | "urgent";
  instructions: string;
}

const emptyMedicine = (): MedicineRow => ({
  medicine_name: "", dosage: "",
  morning: false, afternoon: false, evening: false, night: false,
  meal_timing: "any", duration_days: 1, instructions: "",
});

const emptyTest = (): TestRow => ({
  test_name: "", urgency: "routine", instructions: "",
});

export default function PrescribePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [diagnosis, setDiagnosis] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [followUp, setFollowUp] = useState(false);
  const [followUpDays, setFollowUpDays] = useState(7);
  const [medicines, setMedicines] = useState<MedicineRow[]>([emptyMedicine()]);
  const [tests, setTests] = useState<TestRow[]>([]);
  const [prescriptionId, setPrescriptionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Surgery recommendation (optional)
  const [packages, setPackages] = useState<SurgeryPackage[]>([]);
  const [recommendSurgery, setRecommendSurgery] = useState(false);
  const [surgeryPackageId, setSurgeryPackageId] = useState("");
  const [surgeryNotes, setSurgeryNotes] = useState("");

  useEffect(() => {
    Promise.all([
      api.get(`/api/v1/doctor/appointments/${id}/prescription`).catch(() => null),
      api.get("/api/v1/public/packages"),
    ]).then(([rxRes, pkgRes]) => {
      if (rxRes) {
        const p = rxRes.data;
        setPrescriptionId(p.id);
        setDiagnosis(p.diagnosis);
        setGeneralNotes(p.general_notes || "");
        setFollowUp(p.follow_up_required);
        setFollowUpDays(p.follow_up_after_days || 7);
        setMedicines(p.medicines.length > 0 ? p.medicines : [emptyMedicine()]);
        setTests(p.tests);
      }
      setPackages(pkgRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

  function updateMedicine(i: number, field: keyof MedicineRow, value: unknown) {
    setMedicines((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  }

  function updateTest(i: number, field: keyof TestRow, value: string) {
    setTests((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!diagnosis.trim()) { toast.error("Diagnosis is required."); return; }
    setSaving(true);
    const payload = {
      diagnosis,
      general_notes: generalNotes,
      follow_up_required: followUp,
      follow_up_after_days: followUp ? followUpDays : null,
      medicines: medicines.filter((m) => m.medicine_name.trim()),
      tests: tests.filter((t) => t.test_name.trim()),
    };
    try {
      if (prescriptionId) {
        await api.patch(`/api/v1/doctor/prescriptions/${prescriptionId}`, payload);
        toast.success("Prescription updated.");
      } else {
        await api.post(`/api/v1/doctor/appointments/${id}/prescription`, payload);
        toast.success("Prescription saved.");
      }
      // If doctor selected a surgery package, send recommendation too
      if (surgeryPackageId) {
        try {
          await api.post("/api/v1/doctor/surgery-recommendations", {
            appointment_id: Number(id),
            package_id: Number(surgeryPackageId),
            notes: surgeryNotes,
          });
          toast.success("Surgery recommendation sent to patient.");
        } catch {
          toast.error("Prescription saved but surgery recommendation failed.");
        }
      }
      router.push(`/doctor/appointments/${id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg || "Failed to save prescription.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8"><p className="text-sm text-zinc-400">Loading…</p></main>;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {prescriptionId ? "Edit Prescription" : "Write Prescription"}
          </h1>
          <Link href={`/doctor/appointments/${id}`} className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">← Back</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Diagnosis */}
          <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Diagnosis *</CardTitle></CardHeader>
            <CardContent>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows={3}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring resize-none"
                placeholder="e.g. Acute bronchitis"
              />
            </CardContent>
          </Card>

          {/* Medicines */}
          <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Medicines</CardTitle>
                <Button type="button" size="sm" variant="outline" className="text-xs"
                  onClick={() => setMedicines((prev) => [...prev, emptyMedicine()])}>
                  + Add Medicine
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {medicines.map((med, i) => (
                <div key={i} className="border border-zinc-100 dark:border-zinc-700 rounded-lg p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Medicine Name</label>
                      <input type="text" value={med.medicine_name}
                        onChange={(e) => updateMedicine(i, "medicine_name", e.target.value)}
                        className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
                        placeholder="e.g. Azithromycin 500mg" />
                    </div>
                    <div style={{width:"110px"}}>
                      <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Dosage</label>
                      <input type="text" value={med.dosage}
                        onChange={(e) => updateMedicine(i, "dosage", e.target.value)}
                        className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
                        placeholder="500mg" />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Timing:</span>
                    {(["morning","afternoon","evening","night"] as const).map((t) => (
                      <label key={t} className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                        <input type="checkbox" checked={med[t]}
                          onChange={(e) => updateMedicine(i, t, e.target.checked)}
                          className="rounded" />
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <div>
                      <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Meal Timing</label>
                      <select value={med.meal_timing}
                        onChange={(e) => updateMedicine(i, "meal_timing", e.target.value)}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring">
                        <option value="before_meal">Before Meal</option>
                        <option value="after_meal">After Meal</option>
                        <option value="with_meal">With Meal</option>
                        <option value="any">Any</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Duration (days)</label>
                      <input type="number" min={1} value={med.duration_days}
                        onChange={(e) => updateMedicine(i, "duration_days", parseInt(e.target.value) || 1)}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring w-20" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Instructions</label>
                      <input type="text" value={med.instructions}
                        onChange={(e) => updateMedicine(i, "instructions", e.target.value)}
                        className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
                        placeholder="e.g. Take with water" />
                    </div>
                    {medicines.length > 1 && (
                      <div className="flex items-end">
                        <Button type="button" size="sm" variant="ghost"
                          className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setMedicines((prev) => prev.filter((_, idx) => idx !== i))}>
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tests */}
          <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recommended Tests</CardTitle>
                <Button type="button" size="sm" variant="outline" className="text-xs"
                  onClick={() => setTests((prev) => [...prev, emptyTest()])}>
                  + Add Test
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {tests.length === 0 && <p className="text-xs text-zinc-400">No tests added.</p>}
              {tests.map((t, i) => (
                <div key={i} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Test Name</label>
                    <input type="text" value={t.test_name}
                      onChange={(e) => updateTest(i, "test_name", e.target.value)}
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
                      placeholder="e.g. Chest X-ray" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Urgency</label>
                    <select value={t.urgency}
                      onChange={(e) => updateTest(i, "urgency", e.target.value)}
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring">
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Instructions</label>
                    <input type="text" value={t.instructions}
                      onChange={(e) => updateTest(i, "instructions", e.target.value)}
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
                      placeholder="Optional" />
                  </div>
                  <Button type="button" size="sm" variant="ghost"
                    className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => setTests((prev) => prev.filter((_, idx) => idx !== i))}>
                    Remove
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Follow-up + Notes */}
          <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <CardContent className="pt-5 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={followUp}
                  onChange={(e) => setFollowUp(e.target.checked)}
                  className="rounded" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Recommend follow-up</span>
                {followUp && (
                  <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    after
                    <input type="number" min={1} value={followUpDays}
                      onChange={(e) => setFollowUpDays(parseInt(e.target.value) || 7)}
                      className="rounded border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:border-ring w-16" />
                    days
                  </span>
                )}
              </label>

              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">General Notes</label>
                <textarea value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring resize-none"
                  placeholder="Additional advice or instructions for the patient" />
              </div>
            </CardContent>
          </Card>

          {/* Surgery Recommendation (optional) */}
          <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <CardContent className="pt-5 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={recommendSurgery}
                  onChange={(e) => {
                    setRecommendSurgery(e.target.checked);
                    if (!e.target.checked) { setSurgeryPackageId(""); setSurgeryNotes(""); }
                  }}
                  className="rounded"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Recommend Surgery</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">(optional)</span>
              </label>

              {recommendSurgery && (
                <div className="space-y-3 pl-7">
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Surgery Package</label>
                    <select value={surgeryPackageId} onChange={(e) => setSurgeryPackageId(e.target.value)}
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring">
                      <option value="">Select a package…</option>
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.hospital_name} (${p.price_usd})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Clinical reason / notes for patient</label>
                    <textarea rows={2} value={surgeryNotes} onChange={(e) => setSurgeryNotes(e.target.value)}
                      placeholder="Why you're recommending this procedure…"
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring resize-none" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}
              className="bg-teal-600 text-white hover:bg-teal-700">
              {saving ? "Saving…" : prescriptionId ? "Update Prescription" : "Save Prescription"}
            </Button>
            <Link href={`/doctor/appointments/${id}`}
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-zinc-200 dark:border-zinc-600 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
              Cancel
            </Link>
          </div>

        </form>
      </div>
    </main>
  );
}
