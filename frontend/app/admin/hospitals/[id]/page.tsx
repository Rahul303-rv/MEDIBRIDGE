"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { Hospital } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminHospitalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", city: "", state: "", country: "",
    description: "", accreditations: "", website: "", is_partner: true,
  });

  useEffect(() => {
    api.get(`/api/v1/admin/hospitals/${id}`)
      .then((res) => {
        const h: Hospital = res.data;
        setHospital(h);
        setForm({
          name: h.name, city: h.city, state: h.state, country: h.country,
          description: h.description, accreditations: h.accreditations,
          website: h.website, is_partner: h.is_partner,
        });
      })
      .catch(() => toast.error("Failed to load hospital."))
      .finally(() => setLoading(false));
  }, [id]);

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch(`/api/v1/admin/hospitals/${id}`, form);
      setHospital(res.data);
      toast.success("Hospital updated.");
    } catch {
      toast.error("Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteHospital() {
    if (!confirm("Delete this hospital and all its packages?")) return;
    try {
      await api.delete(`/api/v1/admin/hospitals/${id}`);
      toast.success("Hospital deleted.");
      router.push("/admin/hospitals");
    } catch {
      toast.error("Failed to delete.");
    }
  }

  if (loading) return <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8"><p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p></main>;
  if (!hospital) return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Hospital not found.</p>
      <Link href="/admin/hospitals" className="text-sm text-teal-600 hover:underline mt-2 block">← Back</Link>
    </main>
  );

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Edit Hospital</h1>
          <Link href="/admin/hospitals" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">← Hospitals</Link>
        </div>

        <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{hospital.name}</CardTitle>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">/hospitals/{hospital.slug}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-600 dark:text-zinc-300 mb-1 block">Name *</label>
                  <input required value={form.name} onChange={field("name")}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:border-ring" />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 dark:text-zinc-300 mb-1 block">City *</label>
                  <input required value={form.city} onChange={field("city")}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:border-ring" />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 dark:text-zinc-300 mb-1 block">State *</label>
                  <input required value={form.state} onChange={field("state")}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:border-ring" />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 dark:text-zinc-300 mb-1 block">Country</label>
                  <input value={form.country} onChange={field("country")}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:border-ring" />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 dark:text-zinc-300 mb-1 block">Accreditations</label>
                  <input placeholder="JCI,NABH" value={form.accreditations} onChange={field("accreditations")}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:border-ring" />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 dark:text-zinc-300 mb-1 block">Website</label>
                  <input type="url" value={form.website} onChange={field("website")}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:border-ring" />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-600 dark:text-zinc-300 mb-1 block">Description *</label>
                <textarea required rows={4} value={form.description} onChange={field("description")}
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:border-ring" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_partner}
                  onChange={(e) => setForm((f) => ({ ...f, is_partner: e.target.checked }))}
                  className="rounded" />
                <span className="text-sm text-zinc-700 dark:text-zinc-200">Partner hospital (visible publicly)</span>
              </label>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} size="sm">
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
                <Button type="button" size="sm" variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={deleteHospital}>
                  Delete Hospital
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
