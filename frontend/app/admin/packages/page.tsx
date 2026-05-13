"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { Hospital, SurgeryPackage } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<SurgeryPackage[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    hospital: "", name: "", surgery_type: "", description: "",
    total_duration_days: "", hospital_stay_days: "", recovery_stay_days: "",
    price_usd: "", includes_flight: false, flight_class: "economy",
    includes_visa_assistance: false, includes_accommodation: false,
    accommodation_type: "hotel_3star", includes_transport: false, includes_meals: false,
    inclusions_text: "", exclusions_text: "",
  });

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/admin/packages"),
      api.get("/api/v1/admin/hospitals"),
    ]).then(([pkgRes, hospRes]) => {
      setPackages(pkgRes.data);
      setHospitals(hospRes.data);
    }).catch(() => toast.error("Failed to load data."))
      .finally(() => setLoading(false));
  }, []);

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function check(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.checked }));
  }

  async function createPackage(e: React.FormEvent) {
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
      const res = await api.post("/api/v1/admin/packages", payload);
      setPackages((prev) => [...prev, res.data]);
      setShowForm(false);
      toast.success("Package created.");
    } catch {
      toast.error("Failed to create package.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(pkg: SurgeryPackage) {
    try {
      const res = await api.patch(`/api/v1/admin/packages/${pkg.id}`, { is_active: !pkg.is_active });
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? res.data : p)));
    } catch {
      toast.error("Failed to update.");
    }
  }

  async function deletePackage(id: number) {
    if (!confirm("Delete this package?")) return;
    try {
      await api.delete(`/api/v1/admin/packages/${id}`);
      setPackages((prev) => prev.filter((p) => p.id !== id));
      toast.success("Package deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  }

  const inputCls = "w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:border-ring";

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Surgery Packages</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Manage bundled surgery packages.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/hospitals" className="text-sm text-teal-600 hover:underline self-center">
              ← Hospitals
            </Link>
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Cancel" : "Add Package"}
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">New Surgery Package</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createPackage} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-600 mb-1 block">Hospital *</label>
                    <select required value={form.hospital} onChange={field("hospital")} className={inputCls}>
                      <option value="">Select hospital</option>
                      {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-600 mb-1 block">Package Name *</label>
                    <input required value={form.name} onChange={field("name")} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-600 mb-1 block">Surgery Type *</label>
                    <input required placeholder="e.g. knee_replacement" value={form.surgery_type} onChange={field("surgery_type")} className={inputCls} />
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
                  <textarea required rows={3} value={form.description} onChange={field("description")} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-600 mb-2 block">Inclusions (one per line)</label>
                    <textarea rows={4} placeholder="Airport transfer&#10;Post-op care&#10;Meals" value={form.inclusions_text} onChange={field("inclusions_text")} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-600 mb-2 block">Exclusions (one per line)</label>
                    <textarea rows={4} placeholder="International flights&#10;Visa fees" value={form.exclusions_text} onChange={field("exclusions_text")} className={inputCls} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  {(["includes_flight", "includes_visa_assistance", "includes_accommodation", "includes_transport", "includes_meals"] as const).map((k) => (
                    <label key={k} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[k] as boolean} onChange={check(k)} className="rounded" />
                      <span className="text-sm text-zinc-700">{k.replace("includes_", "").replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
                <Button type="submit" disabled={saving} size="sm">
                  {saving ? "Creating…" : "Create Package"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : packages.length === 0 ? (
          <Card className="border border-zinc-200 shadow-sm">
            <CardContent className="pt-8 pb-8 text-center text-sm text-zinc-500">No packages yet.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="border border-zinc-200 shadow-sm">
                <CardContent className="pt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-zinc-900">{pkg.name}</p>
                      <Badge className={pkg.is_active
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-zinc-100 text-zinc-400 border-zinc-200 hover:bg-zinc-100"}>
                        {pkg.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-500">{pkg.hospital_name} · {pkg.hospital_city}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {pkg.surgery_type.replace(/_/g, " ")} · ${pkg.price_usd} · {pkg.total_duration_days} days
                    </p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {pkg.includes_flight && <span className="text-xs text-teal-600">Flight</span>}
                      {pkg.includes_accommodation && <span className="text-xs text-teal-600">Hotel</span>}
                      {pkg.includes_transport && <span className="text-xs text-teal-600">Transport</span>}
                      {pkg.includes_visa_assistance && <span className="text-xs text-teal-600">Visa</span>}
                      {pkg.includes_meals && <span className="text-xs text-teal-600">Meals</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => toggleActive(pkg)}>
                      {pkg.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Link href={`/admin/packages/${pkg.id}`}
                      className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
                      Edit
                    </Link>
                    <Button size="sm" variant="ghost"
                      className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deletePackage(pkg.id)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
