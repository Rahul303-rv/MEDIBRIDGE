"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { SurgeryBookingDetail, SurgeryPackage, TravelDocument } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Step tracker ──────────────────────────────────────────────────────────────

const STEPS = [
  "Select Date",
  "Travel Info",
  "Documents",
  "Review",
  "Payment",
  "Confirmed",
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              i < current ? "bg-teal-600 border-teal-600 text-white"
              : i === current ? "bg-white border-teal-600 text-teal-600"
              : "bg-white border-zinc-300 text-zinc-400"
            }`}>{i < current ? "✓" : i + 1}</div>
            <span className={`text-xs mt-1 text-center ${i === current ? "text-teal-600 font-medium" : "text-zinc-400"}`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-4 mx-1 ${i < current ? "bg-teal-600" : "bg-zinc-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Travel info defaults ──────────────────────────────────────────────────────

const emptyTravelInfo = {
  passport_number: "",
  passport_country: "",
  passport_expiry: "",
  visa_required: false,
  visa_status: "not_required",
  current_occupation: "",
  employer: "",
  annual_income_usd: "",
  companion_count: 0,
  companion_details: "",
  dietary_requirements: "",
  special_needs: "",
};

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function NewSurgeryBookingPage() {
  const { packageId } = useParams<{ packageId: string }>();

  const [pkg, setPkg] = useState<SurgeryPackage | null>(null);
  const [step, setStep] = useState(0);
  const [booking, setBooking] = useState<SurgeryBookingDetail | null>(null);
  const [tentativeDate, setTentativeDate] = useState("");
  const [travelInfo, setTravelInfo] = useState(emptyTravelInfo);
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    api.get("/api/v1/public/packages")
      .then((res) => {
        const found = (res.data as SurgeryPackage[]).find((p) => p.id === Number(packageId));
        if (found) setPkg(found);
        else toast.error("Package not found.");
      })
      .catch(() => toast.error("Failed to load package."));
  }, [packageId]);

  // ── Step 0: Date ────────────────────────────────────────────────────────────

  async function createBooking() {
    if (!tentativeDate) { toast.error("Please pick a tentative date."); return; }
    setSaving(true);
    try {
      const res = await api.post("/api/v1/patient/surgery-bookings", {
        package_id: Number(packageId),
        tentative_date: tentativeDate,
      });
      setBooking(res.data);
      setStep(1);
    } catch {
      toast.error("Failed to create booking.");
    } finally {
      setSaving(false);
    }
  }

  // ── Step 1: Travel info ─────────────────────────────────────────────────────

  function tiField(key: keyof typeof travelInfo) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setTravelInfo((f) => ({ ...f, [key]: e.target.value }));
  }

  async function saveTravelInfo() {
    if (!booking) return;
    setSaving(true);
    try {
      const payload = {
        ...travelInfo,
        companion_count: Number(travelInfo.companion_count),
        annual_income_usd: travelInfo.annual_income_usd || null,
        visa_status: travelInfo.visa_required ? travelInfo.visa_status : "not_required",
      };
      await api.put(`/api/v1/patient/surgery-bookings/${booking.id}/travel-info`, payload);
      setStep(2);
    } catch {
      toast.error("Failed to save travel info.");
    } finally {
      setSaving(false);
    }
  }

  // ── Step 2: Documents ───────────────────────────────────────────────────────

  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<string>("passport");

  async function uploadDocument(file: File) {
    if (!booking) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10 MB."); return; }
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) { toast.error("Only PDF, JPEG, or PNG accepted."); return; }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_type", uploadDocType);
    try {
      const res = await api.post(`/api/v1/patient/surgery-bookings/${booking.id}/documents`, fd);
      setDocuments((prev) => [...prev, res.data]);
      toast.success("Document uploaded.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function removeDocument(docId: number) {
    if (!booking) return;
    try {
      await api.delete(`/api/v1/patient/surgery-bookings/${booking.id}/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      toast.error("Could not remove document.");
    }
  }

  const hasPassport = documents.some((d) => d.doc_type === "passport");
  const hasGovtId = documents.some((d) => d.doc_type === "govt_id");
  const hasVisa = documents.some((d) => d.doc_type === "visa");
  const needsVisa = travelInfo.visa_required;
  const canProceedDocs = true;

  // ── Step 4: Payment ─────────────────────────────────────────────────────────

  async function confirmBooking() {
    if (!booking) return;
    setSaving(true);
    try {
      const res = await api.post(`/api/v1/patient/surgery-bookings/${booking.id}/confirm`);
      setBooking(res.data);
      setShowPayment(false);
      setStep(5);
    } catch {
      toast.error("Payment failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function downloadVoucher() {
    if (!booking) return;
    try {
      const res = await api.get(`/api/v1/patient/surgery-bookings/${booking.id}/voucher`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `MediBridge_Voucher_${booking.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download voucher.");
    }
  }

  const inputCls = "w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:border-ring";

  if (!pkg) return <main className="min-h-screen bg-zinc-50 p-8"><p className="text-sm text-zinc-400">Loading package…</p></main>;

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">Booking</p>
            <h1 className="text-xl font-bold text-zinc-900">{pkg.name}</h1>
            <p className="text-sm text-zinc-500">{pkg.hospital_name} · ${Number(pkg.price_usd).toLocaleString()} USD</p>
          </div>
          <Link href="/patient/surgery-bookings" className="text-sm text-zinc-500 hover:underline">← My Bookings</Link>
        </div>

        <StepBar current={step} />

        {/* Step 0: Date */}
        {step === 0 && (
          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Step 1: Choose Tentative Date</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-500">Pick an approximate travel date. This is not a confirmed booking date — our team will contact you to finalise.</p>
              <div>
                <label className="text-xs text-zinc-600 mb-1 block">Tentative Surgery Date *</label>
                <input type="date" value={tentativeDate} min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setTentativeDate(e.target.value)}
                  className={inputCls} />
              </div>
              <Button onClick={createBooking} disabled={saving || !tentativeDate} size="sm"
                className="bg-teal-600 text-white hover:bg-teal-700">
                {saving ? "Creating…" : "Continue →"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Travel info */}
        {step === 1 && (
          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Step 2: Travel Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Passport Number *</label>
                  <input required value={travelInfo.passport_number} onChange={tiField("passport_number")} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Passport Country *</label>
                  <input required value={travelInfo.passport_country} onChange={tiField("passport_country")} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Passport Expiry *</label>
                  <input type="date" required value={travelInfo.passport_expiry} onChange={tiField("passport_expiry")} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Current Occupation *</label>
                  <input required value={travelInfo.current_occupation} onChange={tiField("current_occupation")} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Employer</label>
                  <input value={travelInfo.employer} onChange={tiField("employer")} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Annual Income (USD)</label>
                  <input type="number" min="0" value={travelInfo.annual_income_usd} onChange={tiField("annual_income_usd")} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Companions</label>
                  <input type="number" min="0" value={travelInfo.companion_count}
                    onChange={(e) => setTravelInfo((f) => ({ ...f, companion_count: Number(e.target.value) }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Visa Status</label>
                  <select value={travelInfo.visa_status} onChange={tiField("visa_status")} className={inputCls}>
                    <option value="not_required">Not Required</option>
                    <option value="not_applied">Not Applied Yet</option>
                    <option value="applied">Applied</option>
                    <option value="granted">Granted</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={travelInfo.visa_required}
                  onChange={(e) => setTravelInfo((f) => ({ ...f, visa_required: e.target.checked,
                    visa_status: e.target.checked ? "not_applied" : "not_required" }))}
                  className="rounded" />
                <span className="text-sm text-zinc-700">Visa required for India</span>
              </label>
              {Number(travelInfo.companion_count) > 0 && (
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Companion Details (one per line)</label>
                  <textarea rows={3} placeholder="Name, Relation, Passport #" value={travelInfo.companion_details} onChange={tiField("companion_details")} className={inputCls} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Dietary Requirements</label>
                  <textarea rows={2} value={travelInfo.dietary_requirements} onChange={tiField("dietary_requirements")} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Special Needs</label>
                  <textarea rows={2} value={travelInfo.special_needs} onChange={tiField("special_needs")} className={inputCls} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => setStep(0)}>← Back</Button>
                <Button size="sm" disabled={saving || !travelInfo.passport_number || !travelInfo.passport_expiry || !travelInfo.current_occupation}
                  onClick={saveTravelInfo} className="bg-teal-600 text-white hover:bg-teal-700">
                  {saving ? "Saving…" : "Continue →"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Documents */}
        {step === 2 && (
          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Step 3: Upload Documents</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p className="text-zinc-600">Required: <span className="font-medium">Passport scan</span>, <span className="font-medium">Government ID</span>{needsVisa && <>, <span className="font-medium">Visa</span></>}</p>
                <p className="text-xs text-zinc-400">Accepted: PDF, JPEG, PNG · Max 10 MB per file</p>
              </div>

              {/* Uploaded docs */}
              {documents.length > 0 && (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-zinc-50 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-sm font-medium text-zinc-700 capitalize">{doc.doc_type.replace("_", " ")}</span>
                        <span className="text-xs text-zinc-400 ml-2">Uploaded</span>
                      </div>
                      <button onClick={() => removeDocument(doc.id)}
                        className="text-xs text-red-500 hover:text-red-600">Remove</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Document Type</label>
                  <select value={uploadDocType} onChange={(e) => setUploadDocType(e.target.value)} className={inputCls}>
                    <option value="passport">Passport</option>
                    {needsVisa && <option value="visa">Visa</option>}
                    <option value="govt_id">Government ID</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <input ref={fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) uploadDocument(e.target.files[0]); }} />
                  <Button type="button" variant="outline" size="sm" disabled={uploading}
                    onClick={() => fileInput.current?.click()} className="w-full">
                    {uploading ? "Uploading…" : "Choose File"}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>← Back</Button>
                <Button size="sm" disabled={!canProceedDocs}
                  onClick={() => setStep(3)} className="bg-teal-600 text-white hover:bg-teal-700">
                  Continue →
                </Button>
              </div>
              {(needsVisa ? !hasPassport || !hasGovtId || !hasVisa : !hasPassport || !hasGovtId) && documents.length === 0 && (
                <p className="text-xs text-amber-600">
                  Recommended: upload Passport and Government ID before proceeding.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Step 4: Review Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-zinc-50 rounded-lg p-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Package</p>
                  <p className="font-semibold text-zinc-900">{pkg.name}</p>
                  <p className="text-zinc-500">{pkg.hospital_name} · {pkg.hospital_city}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-zinc-400 text-xs">Tentative Date</p><p className="text-zinc-700">{tentativeDate}</p></div>
                  <div><p className="text-zinc-400 text-xs">Duration</p><p className="text-zinc-700">{pkg.total_duration_days} days</p></div>
                  <div><p className="text-zinc-400 text-xs">Passport</p><p className="text-zinc-700">****{travelInfo.passport_number.slice(-4)} ({travelInfo.passport_country})</p></div>
                  <div><p className="text-zinc-400 text-xs">Occupation</p><p className="text-zinc-700">{travelInfo.current_occupation}</p></div>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {documents.map((d) => (
                      <span key={d.id} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full capitalize">{d.doc_type.replace("_", " ")}</span>
                    ))}
                  </div>
                </div>
                <div className="border-t border-zinc-200 pt-3">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">Total Amount</p>
                  <p className="text-2xl font-bold text-zinc-900 mt-1">${Number(pkg.price_usd).toLocaleString()} USD</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => setStep(2)}>← Back</Button>
                <Button size="sm" onClick={() => setStep(4)} className="bg-teal-600 text-white hover:bg-teal-700">
                  Proceed to Payment →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Payment */}
        {step === 4 && (
          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Step 5: Payment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <p className="text-sm text-teal-800 font-medium">Amount Due</p>
                <p className="text-3xl font-bold text-zinc-900 mt-1">${Number(pkg.price_usd).toLocaleString()}</p>
                <p className="text-xs text-zinc-500 mt-1">USD · {pkg.name}</p>
              </div>

              {!showPayment ? (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-500">This is a demo payment. No real transaction will occur.</p>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={() => setStep(3)}>← Back</Button>
                    <Button size="sm" onClick={() => setShowPayment(true)} className="bg-amber-500 text-white hover:bg-amber-600">
                      Open Payment Dialog
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-zinc-700">Demo Payment Terminal</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-zinc-500 mb-1 block">Card Number</label>
                      <input defaultValue="4111 1111 1111 1111" readOnly className={`${inputCls} bg-zinc-50 text-zinc-400`} />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Expiry</label>
                      <input defaultValue="12/28" readOnly className={`${inputCls} bg-zinc-50 text-zinc-400`} />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">CVV</label>
                      <input defaultValue="123" readOnly className={`${inputCls} bg-zinc-50 text-zinc-400`} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="ghost" size="sm" onClick={() => setShowPayment(false)}>Cancel</Button>
                    <Button size="sm" disabled={saving} onClick={confirmBooking}
                      className="bg-teal-600 text-white hover:bg-teal-700">
                      {saving ? "Processing…" : `Pay $${Number(pkg.price_usd).toLocaleString()}`}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 5: Confirmed */}
        {step === 5 && booking && (
          <Card className="border border-emerald-200 shadow-sm bg-emerald-50">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="text-5xl">✅</div>
              <h2 className="text-xl font-bold text-zinc-900">Booking Confirmed!</h2>
              <p className="text-sm text-zinc-600">
                Your surgery package has been booked. Your voucher PDF has been emailed to you.
              </p>
              {booking.coupon && (
                <div className="inline-block bg-white border border-emerald-200 rounded-lg px-4 py-2">
                  <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Voucher Code</p>
                  <p className="font-mono text-lg font-bold text-emerald-700">{booking.coupon.code}</p>
                </div>
              )}
              <div className="flex gap-3 justify-center flex-wrap">
                <Button size="sm" onClick={downloadVoucher} className="bg-teal-600 text-white hover:bg-teal-700">
                  Download Voucher PDF
                </Button>
                <Link href="/patient/surgery-bookings"
                  className="inline-flex items-center justify-center h-8 px-4 rounded-lg border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50">
                  View All Bookings
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
