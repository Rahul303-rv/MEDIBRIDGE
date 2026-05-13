"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { SurgeryBookingDetail } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Medicine {
  medicine_name: string;
  dosage: string;
  duration_days: number;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
  meal_timing: string;
}

interface PrescriptionSummary {
  id: number;
  diagnosis: string;
  general_notes: string;
  medicines: Medicine[];
  tests: { test_name: string; urgency: string }[];
}

interface Recommendation {
  id: number;
  doctor_name: string;
  notes: string;
  appointment_id: number | null;
  appointment_date: string | null;
  prescription: PrescriptionSummary | null;
}

type BookingWithRec = SurgeryBookingDetail & { recommendation?: Recommendation | null };

const STATUS_COLORS: Record<string, string> = {
  info_pending:    "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  payment_pending: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  confirmed:       "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  completed:       "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-100",
  cancelled:       "bg-zinc-100 text-zinc-400 border-zinc-200 hover:bg-zinc-100",
};

const STATUS_LABEL: Record<string, string> = {
  info_pending: "Info Pending",
  payment_pending: "Payment Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const MEAL_LABELS: Record<string, string> = {
  before_meal: "Before Meal", after_meal: "After Meal",
  with_meal: "With Meal", any: "Any",
};

function Tick({ val }: { val: boolean }) {
  return val ? <span className="text-teal-600 font-bold">✓</span> : <span className="text-zinc-300">—</span>;
}

export default function SurgeryBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingWithRec | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get(`/api/v1/patient/surgery-bookings/${id}`)
      .then((res) => setBooking(res.data))
      .catch(() => toast.error("Failed to load booking."))
      .finally(() => setLoading(false));
  }, [id]);

  async function downloadVoucher() {
    setDownloading(true);
    try {
      const res = await api.get(`/api/v1/patient/surgery-bookings/${id}/voucher`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `MediBridge_Voucher_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download voucher.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-zinc-50 p-8"><p className="text-sm text-zinc-400">Loading…</p></main>;
  if (!booking) return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <p className="text-sm text-zinc-500">Booking not found.</p>
      <Link href="/patient/surgery-bookings" className="text-sm text-teal-600 hover:underline mt-2 block">← Back</Link>
    </main>
  );

  const ti = booking.travel_info;
  const rec = booking.recommendation;
  const nextStep = booking.status === "info_pending"
    ? `/patient/surgery-bookings/new/${booking.package}?resume=${booking.id}&step=2`
    : booking.status === "payment_pending"
    ? `/patient/surgery-bookings/new/${booking.package}?resume=${booking.id}&step=4`
    : null;

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Booking #{booking.id}</h1>
          <Link href="/patient/surgery-bookings" className="text-sm text-zinc-500 hover:underline">← Bookings</Link>
        </div>

        {/* Package + Status */}
        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{booking.package_name}</CardTitle>
              <Badge className={STATUS_COLORS[booking.status] ?? ""}>{STATUS_LABEL[booking.status]}</Badge>
            </div>
            <p className="text-sm text-zinc-500">{booking.hospital_name} · {booking.hospital_city}</p>
            {rec && (
              <p className="text-xs text-teal-700 font-medium mt-1">Recommended by {rec.doctor_name}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Surgery Type</p>
                <p className="text-zinc-700 mt-0.5 capitalize">{booking.surgery_type.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Tentative Date</p>
                <p className="text-zinc-700 mt-0.5">{new Date(booking.tentative_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Package Price</p>
                <p className="text-zinc-700 mt-0.5">${Number(booking.total_amount_usd).toLocaleString()} USD</p>
              </div>
              {booking.payment_ref && (
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">Payment Ref</p>
                  <p className="text-zinc-700 mt-0.5 font-mono text-xs">{booking.payment_ref}</p>
                </div>
              )}
            </div>

            {ti && (
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">Travel Information</p>
                <div className="bg-zinc-50 rounded-lg p-3 text-sm space-y-1">
                  <p><span className="text-zinc-400">Passport:</span> ****{ti.passport_number.slice(-4)} ({ti.passport_country})</p>
                  <p><span className="text-zinc-400">Passport Expiry:</span> {ti.passport_expiry}</p>
                  <p><span className="text-zinc-400">Visa Required:</span> {ti.visa_required ? "Yes" : "No"}</p>
                  <p><span className="text-zinc-400">Occupation:</span> {ti.current_occupation}</p>
                  {ti.employer && <p><span className="text-zinc-400">Employer:</span> {ti.employer}</p>}
                  {ti.companion_count > 0 && <p><span className="text-zinc-400">Companions:</span> {ti.companion_count}</p>}
                </div>
              </div>
            )}

            {booking.documents.length > 0 && (
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">Documents</p>
                <div className="space-y-1">
                  {booking.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-zinc-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-zinc-700 capitalize">{doc.doc_type.replace("_", " ")}</span>
                      <span className={`text-xs ${doc.is_verified ? "text-emerald-600" : "text-zinc-400"}`}>
                        {doc.is_verified ? "Verified" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {booking.coupon && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Voucher</p>
                <p className="font-mono text-sm font-bold text-emerald-700">{booking.coupon.code}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Valid: {booking.coupon.valid_from} — {booking.coupon.valid_until}</p>
              </div>
            )}

            <div className="pt-2 flex gap-3 flex-wrap">
              {booking.status === "confirmed" && (
                <Button size="sm" disabled={downloading} onClick={downloadVoucher}
                  className="bg-teal-600 text-white hover:bg-teal-700 text-xs">
                  {downloading ? "Downloading…" : "Download Voucher PDF"}
                </Button>
              )}
              {nextStep && (
                <Link href={nextStep}
                  className="inline-flex items-center justify-center h-8 px-4 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors">
                  Continue Booking →
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Consultation History */}
        {rec && (
          <Card className="border border-teal-200 shadow-sm bg-teal-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-teal-800">Consultation That Led to This Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-800">{rec.doctor_name}</p>
                  {rec.appointment_date && (
                    <p className="text-xs text-zinc-500">
                      {new Date(rec.appointment_date).toLocaleString("en-US", {
                        weekday: "long", month: "long", day: "numeric", year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                {rec.appointment_id && (
                  <Link href={`/patient/appointments/${rec.appointment_id}`}
                    className="text-xs text-teal-600 hover:underline font-medium shrink-0">
                    View Appointment →
                  </Link>
                )}
              </div>

              {rec.notes && (
                <div className="bg-white rounded-lg border border-teal-100 px-3 py-2">
                  <p className="text-xs text-zinc-500 mb-0.5">Doctor&apos;s recommendation note</p>
                  <p className="text-sm text-zinc-700">{rec.notes}</p>
                </div>
              )}

              {rec.prescription && (
                <div className="space-y-3">
                  <div className="bg-white rounded-lg border border-teal-100 px-3 py-2">
                    <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Diagnosis</p>
                    <p className="text-sm text-zinc-800 font-medium">{rec.prescription.diagnosis}</p>
                    {rec.prescription.general_notes && (
                      <p className="text-xs text-zinc-500 mt-1">{rec.prescription.general_notes}</p>
                    )}
                  </div>

                  {rec.prescription.medicines.length > 0 && (
                    <div className="bg-white rounded-lg border border-teal-100 px-3 py-2">
                      <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">Medicines Prescribed</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-zinc-400 border-b border-zinc-100">
                              <th className="text-left py-1 pr-3 font-medium">Medicine</th>
                              <th className="text-left py-1 pr-2 font-medium">Dosage</th>
                              <th className="text-center py-1 px-1 font-medium">M</th>
                              <th className="text-center py-1 px-1 font-medium">A</th>
                              <th className="text-center py-1 px-1 font-medium">E</th>
                              <th className="text-center py-1 px-1 font-medium">N</th>
                              <th className="text-left py-1 px-2 font-medium">Timing</th>
                              <th className="text-center py-1 px-1 font-medium">Days</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rec.prescription.medicines.map((m, i) => (
                              <tr key={i} className="border-b border-zinc-50">
                                <td className="py-1 pr-3 text-zinc-800 font-medium">{m.medicine_name}</td>
                                <td className="py-1 pr-2 text-zinc-600">{m.dosage}</td>
                                <td className="py-1 px-1 text-center"><Tick val={m.morning} /></td>
                                <td className="py-1 px-1 text-center"><Tick val={m.afternoon} /></td>
                                <td className="py-1 px-1 text-center"><Tick val={m.evening} /></td>
                                <td className="py-1 px-1 text-center"><Tick val={m.night} /></td>
                                <td className="py-1 px-2 text-zinc-500 whitespace-nowrap">{MEAL_LABELS[m.meal_timing] ?? m.meal_timing}</td>
                                <td className="py-1 px-1 text-center text-zinc-600">{m.duration_days}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {rec.prescription.tests.length > 0 && (
                    <div className="bg-white rounded-lg border border-teal-100 px-3 py-2">
                      <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">Tests Recommended</p>
                      <div className="space-y-1">
                        {rec.prescription.tests.map((t, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-sm text-zinc-700">{t.test_name}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              t.urgency === "urgent" ? "bg-red-100 text-red-600" : "bg-zinc-100 text-zinc-500"
                            }`}>{t.urgency}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-right">
                    <Link href={`/patient/prescriptions/${rec.prescription.id}`}
                      className="text-xs text-teal-600 hover:underline font-medium">
                      View Full Prescription →
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
