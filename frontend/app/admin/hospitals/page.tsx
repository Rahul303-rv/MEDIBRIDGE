"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { Hospital } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", city: "", state: "", country: "India",
    description: "", accreditations: "", website: "",
  });

  useEffect(() => {
    api.get("/api/v1/admin/hospitals")
      .then((res) => setHospitals(res.data))
      .catch(() => toast.error("Failed to load hospitals."))
      .finally(() => setLoading(false));
  }, []);

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function createHospital(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/api/v1/admin/hospitals", form);
      setHospitals((prev) => [...prev, res.data]);
      setShowForm(false);
      setForm({ name: "", city: "", state: "", country: "India", description: "", accreditations: "", website: "" });
      toast.success("Hospital created.");
    } catch {
      toast.error("Failed to create hospital.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteHospital(id: number) {
    if (!confirm("Delete this hospital?")) return;
    try {
      await api.delete(`/api/v1/admin/hospitals/${id}`);
      setHospitals((prev) => prev.filter((h) => h.id !== id));
      toast.success("Hospital deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Hospitals</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Manage partner hospitals.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Link href="/admin/packages" className="text-sm text-teal-600 hover:underline self-center">
              Surgery Packages →
            </Link>
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Cancel" : "Add Hospital"}
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">New Hospital</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createHospital} className="space-y-3">
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
                  <textarea required rows={3} value={form.description} onChange={field("description")}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:border-ring" />
                </div>
                <Button type="submit" disabled={saving} size="sm">
                  {saving ? "Creating…" : "Create Hospital"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
        ) : hospitals.length === 0 ? (
          <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <CardContent className="pt-8 pb-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No hospitals yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {hospitals.map((h) => (
              <Card key={h.id} className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <CardContent className="pt-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-white">{h.name}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{h.city}, {h.state}, {h.country}</p>
                    {h.accreditations && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Accreditations: {h.accreditations}</p>
                    )}
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 font-mono">/{h.slug}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/admin/hospitals/${h.id}`}
                      className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      Edit
                    </Link>
                    <Button size="sm" variant="ghost"
                      className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deleteHospital(h.id)}>
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
