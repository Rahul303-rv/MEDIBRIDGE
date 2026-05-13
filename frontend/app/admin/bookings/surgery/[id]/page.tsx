"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TravelDocument {
  id: number;
  doc_type: string;
  doc_number: string;
  issue_date: string | null;
  expiry_date: string | null;
  uploaded_at: string;
  is_verified: boolean;
}

interface TravelInfo {
  passport_number: string;
  passport_country: string;
  passport_expiry: string;
  visa_required: boolean;
  visa_status: string;
  current_occupation: string;
  employer: string;
  annual_income_usd: string | null;
  companion_count: number;
  companion_details: string;
  dietary_requirements: string;
  special_needs: string;
}

interface PrescriptionSummary {
  id: number;
  diagnosis: string;
  general_notes: string;
  medicines: { medicine_name: string; dosage: string; duration_days: number }[];
  tests: { test_name: string; urgency: string }[];
}

interface Recommendation {
  doctor_name: string;
  notes: string;
  appointment_id: number | null;
  appointment_date: string | null;
  prescription: PrescriptionSummary | null;
}

interface BookingDetail {
  id: number;
  patient_name: string;
  patient_email: string;
  patient_user_id: number;
  package_name: string;
  package_slug: string;
  hospital_name: string;
  hospital_city: string;
  surgery_type: string;
  status: string;
  tentative_date: string;
  total_amount_usd: string;
  payment_ref: string;
  travel_info: TravelInfo | null;
  documents: TravelDocument[];
  coupon: { code: string; issued_at: string } | null;
  recommendation: Recommendation | null;
  created_at: string;
  updated_at: string;
}

interface PatientProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string | null;
  gender: string;
  blood_group: string;
  height_cm?: number | null;
  weight_kg?: string | null;
  country: string;
  state: string;
  city: string;
  address_line: string;
  postal_code?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  existing_conditions: string;
  allergies: string;
  current_medications: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  info_pending:    "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  payment_pending: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  confirmed:       "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  completed:       "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-100",
  cancelled:       "bg-zinc-100 text-zinc-400 border-zinc-200 hover:bg-zinc-100",
};

const ALL_STATUSES = ["info_pending", "payment_pending", "confirmed", "completed", "cancelled"];

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-zinc-400 w-44 shrink-0">{label}</span>
      <span className="text-zinc-800 break-words">{value}</span>
    </div>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide pt-2 pb-1 border-t border-zinc-100 mt-3">
      {title}
    </p>
  );
}

export default function AdminSurgeryBookingDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [newDate, setNewDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [patientOpen, setPatientOpen] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);

  useEffect(() => {
    api.get(`/api/v1/admin/surgery-bookings/${id}`)
      .then((res) => {
        setBooking(res.data);
        setNewStatus(res.data.status);
        setNewDate(res.data.tentative_date);
      })
      .catch(() => toast.error("Failed to load booking."))
      .finally(() => setLoading(false));
  }, [id]);

  async function loadPatient(userId: number) {
    if (patient) { setPatientOpen((v) => !v); return; }
    setPatientLoading(true);
    setPatientOpen(true);
    try {
      const res = await api.get(`/api/v1/admin/users/${userId}`);
      setPatient(res.data);
    } catch {
      toast.error("Failed to load patient profile.");
      setPatientOpen(false);
    } finally {
      setPatientLoading(false);
    }
  }

  async function saveChanges() {
    if (!booking) return;
    setSaving(true);
    try {
      const res = await api.patch(`/api/v1/admin/surgery-bookings/${id}`, {
        status: newStatus,
        tentative_date: newDate,
      });
      setBooking(res.data);
      setNewStatus(res.data.status);
      setNewDate(res.data.tentative_date);
      toast.success("Booking updated.");
    } catch {
      toast.error("Failed to update booking.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelBooking() {
    if (!booking) return;
    if (!confirm(`Cancel this booking for ${booking.patient_name}? This cannot be undone.`)) return;
    setCancelling(true);
    try {
      const res = await api.patch(`/api/v1/admin/surgery-bookings/${id}`, { status: "cancelled" });
      setBooking(res.data);
      setNewStatus("cancelled");
      toast.success("Booking cancelled.");
    } catch {
      toast.error("Failed to cancel booking.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-zinc-50 p-8"><p className="text-sm text-zinc-400">Loading…</p></main>;
  if (!booking) return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <p className="text-sm text-zinc-500">Booking not found.</p>
      <Link href="/admin/bookings?type=surgery" className="text-sm text-teal-600 hover:underline mt-2 block">← Back</Link>
    </main>
  );

  const isDirty = newStatus !== booking.status || newDate !== booking.tentative_date;
  const isCancelled = booking.status === "cancelled";

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-500">Surgery Booking #{booking.id}</p>
            <h1 className="text-2xl font-bold text-zinc-900">{booking.package_name}</h1>
            <p className="text-sm text-zinc-500">{booking.hospital_name}, {booking.hospital_city}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={STATUS_COLORS[booking.status] ?? ""}>{booking.status.replace(/_/g, " ")}</Badge>
            <Link href="/admin/bookings?type=surgery" className="text-sm text-zinc-500 hover:underline">← All Bookings</Link>
          </div>
        </div>

        {/* Booking Info */}
        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Booking Details</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <InfoRow label="Surgery Type" value={booking.surgery_type} />
            <InfoRow label="Amount" value={`$${Number(booking.total_amount_usd).toLocaleString()} USD`} />
            <InfoRow label="Payment Ref" value={booking.payment_ref || "—"} />
            {booking.coupon && <InfoRow label="Voucher Code" value={booking.coupon.code} />}
            <InfoRow label="Created" value={new Date(booking.created_at).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" })} />
            <InfoRow label="Last Updated" value={new Date(booking.updated_at).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
          </CardContent>
        </Card>

        {/* Patient Details — expandable */}
        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Patient</CardTitle>
                <p className="text-sm text-zinc-700 mt-0.5">{booking.patient_name}</p>
                <p className="text-xs text-zinc-400">{booking.patient_email}</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs"
                onClick={() => loadPatient(booking.patient_user_id)}>
                {patientLoading ? "Loading…" : patientOpen ? "Hide Details" : "View Full Profile"}
              </Button>
            </div>
          </CardHeader>

          {patientOpen && (
            <CardContent className="border-t border-zinc-100 pt-4 space-y-2">
              {patientLoading ? (
                <p className="text-sm text-zinc-400">Loading patient profile…</p>
              ) : patient ? (
                <>
                  <SectionDivider title="Personal" />
                  <InfoRow label="Date of Birth" value={patient.date_of_birth ?? undefined} />
                  <InfoRow label="Gender" value={patient.gender} />
                  <InfoRow label="Blood Group" value={patient.blood_group} />
                  <InfoRow label="Phone" value={patient.phone} />

                  <SectionDivider title="Address" />
                  <InfoRow label="Country" value={patient.country} />
                  <InfoRow label="State" value={patient.state} />
                  <InfoRow label="City" value={patient.city} />
                  <InfoRow label="Address" value={patient.address_line} />

                  <SectionDivider title="Medical History" />
                  <InfoRow label="Existing Conditions" value={patient.existing_conditions || "None"} />
                  <InfoRow label="Allergies" value={patient.allergies || "None"} />
                  <InfoRow label="Current Medications" value={patient.current_medications || "None"} />

                  <SectionDivider title="Emergency Contact" />
                  <InfoRow label="Name" value={patient.emergency_contact_name || "—"} />
                  <InfoRow label="Phone" value={patient.emergency_contact_phone || "—"} />

                  <SectionDivider title="Account" />
                  <InfoRow label="Account Status" value={patient.is_active ? "Active" : "Deactivated"} />
                  <InfoRow label="Joined" value={new Date(patient.date_joined).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />
                  <InfoRow label="Last Login" value={patient.last_login ? new Date(patient.last_login).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never"} />

                  <div className="pt-3">
                    <Link href={`/admin/users/${patient.id}`}
                      className="text-xs text-teal-600 hover:underline font-medium">
                      Open full user management page →
                    </Link>
                  </div>
                </>
              ) : null}
            </CardContent>
          )}
        </Card>

        {/* Admin Controls */}
        {!isCancelled && (
          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Manage Booking</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring">
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Tentative Date</label>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={saveChanges} disabled={saving || !isDirty}
                  className="bg-teal-600 text-white hover:bg-teal-700" size="sm">
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
                <Button onClick={cancelBooking} disabled={cancelling} variant="outline" size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                  {cancelling ? "Cancelling…" : "Cancel Booking"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isCancelled && (
          <Card className="border border-red-200 bg-red-50 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-red-700 font-medium">This booking has been cancelled.</p>
            </CardContent>
          </Card>
        )}

        {/* Consultation History */}
        {booking.recommendation && (
          <Card className="border border-teal-200 shadow-sm bg-teal-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-teal-800">Consultation History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{booking.recommendation.doctor_name}</p>
                  {booking.recommendation.appointment_date && (
                    <p className="text-xs text-zinc-500">
                      {new Date(booking.recommendation.appointment_date).toLocaleString("en-US", {
                        weekday: "long", month: "long", day: "numeric", year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                {booking.recommendation.appointment_id && (
                  <Link href={`/admin/bookings?type=consultation`}
                    className="text-xs text-teal-600 hover:underline font-medium shrink-0">
                    Appt #{booking.recommendation.appointment_id}
                  </Link>
                )}
              </div>

              {booking.recommendation.notes && (
                <div className="bg-white rounded-lg border border-teal-100 px-3 py-2">
                  <p className="text-xs text-zinc-400 mb-0.5">Recommendation note</p>
                  <p className="text-sm text-zinc-700">{booking.recommendation.notes}</p>
                </div>
              )}

              {booking.recommendation.prescription && (
                <div className="bg-white rounded-lg border border-teal-100 px-3 py-3 space-y-2">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">Prescription Summary</p>
                  <p className="text-sm font-semibold text-zinc-800">{booking.recommendation.prescription.diagnosis}</p>
                  {booking.recommendation.prescription.general_notes && (
                    <p className="text-xs text-zinc-500">{booking.recommendation.prescription.general_notes}</p>
                  )}
                  {booking.recommendation.prescription.medicines.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Medicines</p>
                      {booking.recommendation.prescription.medicines.map((m, i) => (
                        <p key={i} className="text-xs text-zinc-700">
                          {m.medicine_name} {m.dosage && `(${m.dosage})`} — {m.duration_days} days
                        </p>
                      ))}
                    </div>
                  )}
                  {booking.recommendation.prescription.tests.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Tests</p>
                      {booking.recommendation.prescription.tests.map((t, i) => (
                        <p key={i} className="text-xs text-zinc-700">
                          {t.test_name} <span className={`font-medium ${t.urgency === "urgent" ? "text-red-500" : "text-zinc-400"}`}>({t.urgency})</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Travel Info */}
        {booking.travel_info && (
          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Travel Information</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <InfoRow label="Passport Number" value={booking.travel_info.passport_number} />
              <InfoRow label="Passport Country" value={booking.travel_info.passport_country} />
              <InfoRow label="Passport Expiry" value={booking.travel_info.passport_expiry} />
              <InfoRow label="Visa Required" value={booking.travel_info.visa_required ? "Yes" : "No"} />
              {booking.travel_info.visa_required && (
                <InfoRow label="Visa Status" value={booking.travel_info.visa_status.replace(/_/g, " ")} />
              )}
              <InfoRow label="Occupation" value={booking.travel_info.current_occupation} />
              <InfoRow label="Employer" value={booking.travel_info.employer} />
              {booking.travel_info.annual_income_usd && (
                <InfoRow label="Annual Income" value={`$${Number(booking.travel_info.annual_income_usd).toLocaleString()} USD`} />
              )}
              <InfoRow label="Companions" value={booking.travel_info.companion_count} />
              {booking.travel_info.companion_details && (
                <InfoRow label="Companion Details" value={booking.travel_info.companion_details} />
              )}
              {booking.travel_info.dietary_requirements && (
                <InfoRow label="Dietary Requirements" value={booking.travel_info.dietary_requirements} />
              )}
              {booking.travel_info.special_needs && (
                <InfoRow label="Special Needs" value={booking.travel_info.special_needs} />
              )}
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Uploaded Documents</CardTitle></CardHeader>
          <CardContent>
            {booking.documents.length === 0 ? (
              <p className="text-sm text-zinc-400">No documents uploaded.</p>
            ) : (
              <div className="space-y-2">
                {booking.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-zinc-50 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-800 capitalize">{doc.doc_type.replace(/_/g, " ")}</p>
                      {doc.doc_number && <p className="text-xs text-zinc-400">#{doc.doc_number}</p>}
                      <p className="text-xs text-zinc-400">{new Date(doc.uploaded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {doc.is_verified && (
                        <span className="text-xs text-emerald-600 font-medium">Verified</span>
                      )}
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/surgery-bookings/${booking.id}/documents/${doc.id}/file`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-teal-600 hover:underline font-medium">
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </main>
  );
}
