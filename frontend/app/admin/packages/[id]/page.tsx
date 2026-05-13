"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { Hospital, SurgeryPackage } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pkg, setPkg] = useState<SurgeryPackage | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    hospital: "", name: "", surgery_type: "", description: "",
    total_duration_days: "", hospital_stay_days: "", recovery_stay_days: "",
    price_usd: "", includes_flight: false, flight_class: "economy",
    includes_visa_assistance: false, includes_accommodation: false,
    accommodation_type: "hotel_3star", includes_transport: false, includes_meals: false,
    inclusions_text: "", exclusions_text: "", is_active: true,
  });

  useEffect(() => {
    Promise.all([
      api.get(`/api/v1/admin/packages/${id}`),
      api.get("/api/v1/admin/hospitals"),
    ]).then(([pkgRes, hospRes]) => {
      const p: SurgeryPackage = pkgRes.data;
      setPkg(p);
      setHospitals(hospRes.data);
      setForm({
        hospital: String(p.hospital),
        name: p.name, surgery_type: p.surgery_type, description: p.description,
        total_duration_days: String(p.total_duration_days),
        hospital_stay_days: String(p.hospital_stay_days),
        recovery_stay_days: String(p.recovery_stay_days),
        price_usd: p.price_usd,
        includes_flight: p.includes_flight, flight_class: p.flight_class,
        includes_visa_assistance: p.includes_visa_assistance,
        includes_accommodation: p.includes_accommodation,
        accommodation_type: p.accommodation_type,
        includes_transport: p.includes_transport, includes_meals: p.includes_meals,
        inclusions_text: p.inclusions_text, exclusions_text: p.exclusions_text,
        is_active: p.is_active,
      });
    }).catch(() => toast.error("Failed to load package."))
      .finally(() => setLoading(false));
  }, [id]);

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }
  function check(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.checked }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        hospital: Number(form.hospital),
        total_duration_days: Number(form.total_duration_days),
        hospital_stay_days: Number(form.hospital_stay_days),
        recovery_stay_days: Number(form.recovery_stay_days),
      };
      const res = await api.patch(`/api/v1/admin/packages/${id}`, payload);
      setPkg(res.data);
      toast.success("Package updated.");
    } catch {
      toast.error("Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePackage() {
    if (!confirm("Delete this package?")) return;
    try {
      await api.delete(`/api/v1/admin/packages/${id}`);
      toast.success("Package deleted.");
      router.push("/admin/packages");
    } catch {
      toast.error("Failed to delete.");
    }
  }

  const inputCls = "w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:border-ring";

  if (loading) return <main className="min-h-screen bg-zinc-50 p-8"><p className="text-sm text-zinc-400">Loading…</p></main>;
  if (!pkg) return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <p className="text-sm text-zinc-500">Package not found.</p>
      <Link href="/admin/packages" className="text-sm text-teal-600 hover:underline mt-2 block">← Back</Link>
    </main>
  );

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Edit Package</h1>
          <Link href="/admin/packages" className="text-sm text-zinc-500 hover:underline">← Packages</Link>
        </div>

        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{pkg.name}</CardTitle>
            <p className="text-xs text-zinc-400 font-mono">/{pkg.slug}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Hospital *</label>
                  <select required value={form.hospital} onChange={field("hospital")} className={inputCls}>
                    {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Package Name *</label>
                  <input required value={form.name} onChange={field("name")} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Surgery Type *</label>
                  <input required value={form.surgery_type} onChange={field("surgery_type")} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Price (USD) *</label>
                  <input required type="number" step="0.01" min="0" value={form.price_usd} onChange={field("price_usd")} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Total Duration (days) *</label>
                  <input required type="number" min="1" value={form.total_duration_days} onChange={field("total_duration_days")} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Hospital Stay (days) *</label>
                  <input required type="number" min="1" value={form.hospital_stay_days} onChange={field("hospital_stay_days")} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Recovery Stay (days) *</label>
                  <input required type="number" min="0" value={form.recovery_stay_days} onChange={field("recovery_stay_days")} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Flight Class</label>
                  <select value={form.flight_class} onChange={field("flight_class")} className={inputCls}>
                    <option value="economy">Economy</option>
                    <option value="business">Business</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Accommodation Type</label>
                  <select value={form.accommodation_type} onChange={field("accommodation_type")} className={inputCls}>
                    <option value="hotel_3star">3-Star Hotel</option>
                    <option value="hotel_4star">4-Star Hotel</option>
                    <option value="serviced_apt">Serviced Apartment</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-600 mb-1 block">Description *</label>
                <textarea required rows={4} value={form.description} onChange={field("description")} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Inclusions (one per line)</label>
                  <textarea rows={5} value={form.inclusions_text} onChange={field("inclusions_text")} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Exclusions (one per line)</label>
                  <textarea rows={5} value={form.exclusions_text} onChange={field("exclusions_text")} className={inputCls} />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {(["includes_flight", "includes_visa_assistance", "includes_accommodation", "includes_transport", "includes_meals"] as const).map((k) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[k] as boolean} onChange={check(k)} className="rounded" />
                    <span className="text-sm text-zinc-700">{k.replace("includes_", "").replace("_", " ")}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={check("is_active")} className="rounded" />
                  <span className="text-sm text-zinc-700">Active (visible publicly)</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} size="sm">
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
                <Button type="button" size="sm" variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={deletePackage}>
                  Delete Package
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
