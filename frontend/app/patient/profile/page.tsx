"use client";

import { useEffect, useRef, useState } from "react";
import { ControllerRenderProps, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import api, { getApiFieldErrors } from "@/lib/api";
import { PatientProfile, MedicalReport } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const GENDERS = ["male", "female", "other"] as const;
const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const TIMEZONES = [
  "America/Toronto", "America/New_York", "America/Chicago",
  "America/Denver", "America/Los_Angeles", "America/Vancouver",
  "Europe/London", "Europe/Paris", "Asia/Kolkata", "Asia/Dubai",
  "Australia/Sydney", "Pacific/Auckland",
];

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  date_of_birth: z.string().min(1, "Date of birth is required").refine(
    (d) => new Date(d) < new Date(),
    "Date of birth must be in the past"
  ),
  gender: z.enum(GENDERS, { error: "Select a gender" }),
  phone: z.string().min(1, "Phone number is required"),
  alt_phone: z.string(),
  height_cm: z.string(),
  weight_kg: z.string(),
  blood_group: z.string(),
  country: z.string().min(1, "Country is required"),
  state: z.string(),
  city: z.string(),
  address_line: z.string(),
  postal_code: z.string(),
  timezone: z.string().min(1, "Timezone is required"),
  emergency_contact_name: z.string(),
  emergency_contact_phone: z.string(),
  existing_conditions: z.string(),
  allergies: z.string(),
  current_medications: z.string(),
});

type ProfileForm = z.infer<typeof profileSchema>;

function SelectField({ label, options, field, placeholder }: {
  label: string;
  options: readonly string[];
  field: ControllerRenderProps<ProfileForm, keyof ProfileForm>;
  placeholder?: string;
}) {
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <select
          {...field}
          className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.filter(Boolean).map((o) => (
            <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
          ))}
        </select>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

function TextareaField({
  label,
  field,
  placeholder,
}: {
  label: string;
  field: ControllerRenderProps<ProfileForm, keyof ProfileForm>;
  placeholder?: string;
}) {
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <textarea
          {...field}
          placeholder={placeholder}
          rows={3}
          className="flex w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

// ── Structured current-medications helpers ────────────────────────────────────

type MedEntry = {
  id: string;
  name: string;
  dosage: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
  meal_timing: "before_meal" | "after_meal" | "with_meal" | "any";
  duration_days: string;
  start_date: string;
  instructions: string;
};

const MEAL_OPTIONS: { value: MedEntry["meal_timing"]; label: string }[] = [
  { value: "before_meal", label: "Before Meal" },
  { value: "after_meal",  label: "After Meal"  },
  { value: "with_meal",   label: "With Meal"   },
  { value: "any",         label: "Any Time"    },
];

function newMedEntry(): MedEntry {
  return {
    id: Math.random().toString(36).slice(2),
    name: "", dosage: "",
    morning: false, afternoon: false, evening: false, night: false,
    meal_timing: "after_meal", duration_days: "", start_date: "", instructions: "",
  };
}

function parseMedEntries(raw: string): MedEntry[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return p;
  } catch {}
  return [];
}

function StructuredMedicationsField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [entries, setEntries] = useState<MedEntry[]>(() => parseMedEntries(value));

  function sync(updated: MedEntry[]) {
    setEntries(updated);
    onChange(updated.length ? JSON.stringify(updated) : "");
  }

  function updateEntry(id: string, patch: Partial<MedEntry>) {
    sync(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  return (
    <div className="space-y-3">
      {entries.length === 0 && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No medicines added yet. Click &quot;+ Add Medicine&quot; to begin.</p>
      )}

      {entries.map((entry) => (
        <div key={entry.id}
          className="rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 p-4 space-y-3">

          {/* Name + Dosage row */}
          <div className="flex items-start gap-3">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Medicine Name</p>
                <input type="text" value={entry.name}
                  onChange={(e) => updateEntry(entry.id, { name: e.target.value })}
                  placeholder="e.g. Tramadol"
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Dosage</p>
                <input type="text" value={entry.dosage}
                  onChange={(e) => updateEntry(entry.id, { dosage: e.target.value })}
                  placeholder="500mg"
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring" />
              </div>
            </div>
            <button type="button" onClick={() => sync(entries.filter((e) => e.id !== entry.id))}
              className="mt-5 p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Timing checkboxes */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Timing:</span>
            {(["morning", "afternoon", "evening", "night"] as const).map((t) => (
              <label key={t} className="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" checked={entry[t]}
                  onChange={(e) => updateEntry(entry.id, { [t]: e.target.checked })}
                  className="rounded accent-blue-600" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300 capitalize">{t}</span>
              </label>
            ))}
          </div>

          {/* Meal timing / Start Date / Duration / Instructions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Meal Timing</p>
              <select value={entry.meal_timing}
                onChange={(e) => updateEntry(entry.id, { meal_timing: e.target.value as MedEntry["meal_timing"] })}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring">
                {MEAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Taking Since</p>
              <input type="date" value={entry.start_date}
                onChange={(e) => updateEntry(entry.id, { start_date: e.target.value })}
                max={new Date().toISOString().split("T")[0]}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Duration (days)</p>
              <input type="number" min={1} value={entry.duration_days}
                onChange={(e) => updateEntry(entry.id, { duration_days: e.target.value })}
                placeholder="e.g. 7"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Instructions</p>
              <input type="text" value={entry.instructions}
                onChange={(e) => updateEntry(entry.id, { instructions: e.target.value })}
                placeholder="e.g. Swallow whole"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring" />
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={() => sync([...entries, newMedEntry()])}
        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        + Add Medicine
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function MedicalReportsSection() {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get("/api/v1/patient/medical-reports")
      .then((res) => setReports(res.data))
      .finally(() => setLoadingReports(false));
  }, []);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Select a file first."); return; }
    if (!title.trim()) { toast.error("Enter a report title."); return; }
    setUploading(true);
    const form = new FormData();
    form.append("title", title.trim());
    form.append("file", file);
    try {
      const res = await api.post("/api/v1/patient/medical-reports", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setReports((prev) => [res.data, ...prev]);
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Report uploaded successfully.");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/api/v1/patient/medical-reports/${id}`);
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success("Report deleted.");
    } catch {
      toast.error("Failed to delete report.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Medical Reports</p>
        <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">PDF, JPG, PNG — max 10 MB</span>
      </div>

      <div className="space-y-4">
        {/* Upload controls — div, not <form>, to avoid nesting inside the profile form */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleUpload(); } }}
            placeholder="Report title (e.g. Blood Test — Jan 2026)"
            className="flex-1 h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-teal-400"
          />
          <label className="flex items-center gap-2 h-10 px-4 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer hover:border-teal-400 transition-colors shrink-0">
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span>Choose file</span>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" />
          </label>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="h-10 px-5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>

        {/* Report list */}
        {loadingReports ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-700 animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No reports uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-700/50">
                <svg className="w-8 h-8 text-teal-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{r.title}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {new Date(r.uploaded_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <a
                  href={r.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline shrink-0"
                >
                  View
                </a>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                  title="Delete report"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientProfilePage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "", last_name: "", date_of_birth: "", gender: "other",
      phone: "", alt_phone: "", height_cm: "", weight_kg: "", blood_group: "",
      country: "", state: "", city: "", address_line: "", postal_code: "",
      timezone: "America/Toronto", emergency_contact_name: "", emergency_contact_phone: "",
      existing_conditions: "", allergies: "", current_medications: "",
    },
  });

  useEffect(() => {
    api.get("/api/v1/patient/profile").then((res) => {
      const p: PatientProfile = res.data;
      form.reset({
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        date_of_birth: p.date_of_birth || "",
        gender: (p.gender as typeof GENDERS[number]) || "other",
        phone: p.phone || "",
        alt_phone: p.alt_phone || "",
        height_cm: p.height_cm != null ? String(p.height_cm) : "",
        weight_kg: p.weight_kg != null ? String(p.weight_kg) : "",
        blood_group: p.blood_group || "",
        country: p.country || "",
        state: p.state || "",
        city: p.city || "",
        address_line: p.address_line || "",
        postal_code: p.postal_code || "",
        timezone: p.timezone || "America/Toronto",
        emergency_contact_name: p.emergency_contact_name || "",
        emergency_contact_phone: p.emergency_contact_phone || "",
        existing_conditions: p.existing_conditions || "",
        allergies: p.allergies || "",
        current_medications: p.current_medications || "",
      });
    }).finally(() => setFetching(false));
  }, [form]);

  async function onSubmit(values: ProfileForm) {
    setLoading(true);
    const payload = {
      ...values,
      height_cm: values.height_cm ? Number(values.height_cm) : null,
      weight_kg: values.weight_kg ? values.weight_kg : null,
    };
    try {
      await api.patch("/api/v1/patient/profile", payload);
      toast.success("Profile saved successfully.");
    } catch (err: unknown) {
      Object.entries(getApiFieldErrors(err)).forEach(([key, msgs]) => {
        form.setError(key as keyof ProfileForm, { message: msgs[0] ?? "Invalid value." });
      });
      toast.error("Failed to save. Please check the fields below.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto text-zinc-500 dark:text-zinc-400 text-sm">Loading profile…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Your Profile</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Keep your medical information up to date.</p>
          </div>
          <Link href="/patient" className="text-sm text-teal-600 hover:underline">← Dashboard</Link>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Personal */}
            <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="first_name" render={({ field }) => (
                  <FormItem><FormLabel>First name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="last_name" render={({ field }) => (
                  <FormItem><FormLabel>Last name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                  <FormItem><FormLabel>Date of birth *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <SelectField label="Gender *" options={GENDERS} field={field} />
                )} />
                <FormField control={form.control} name="blood_group" render={({ field }) => (
                  <SelectField label="Blood group" options={BLOOD_GROUPS} field={field} placeholder="Select…" />
                )} />
                <FormField control={form.control} name="timezone" render={({ field }) => (
                  <SelectField label="Your timezone *" options={TIMEZONES} field={field} />
                )} />
              </CardContent>
            </Card>

            {/* Physical */}
            <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <CardHeader><CardTitle className="text-base">Physical Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="height_cm" render={({ field }) => (
                  <FormItem><FormLabel>Height (cm)</FormLabel><FormControl><Input type="number" min={1} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="weight_kg" render={({ field }) => (
                  <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" step="0.1" min={1} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <CardHeader><CardTitle className="text-base">Contact & Address</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone *</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="alt_phone" render={({ field }) => (
                  <FormItem><FormLabel>Alternate phone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem><FormLabel>Country *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem><FormLabel>State / Province</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="postal_code" render={({ field }) => (
                  <FormItem><FormLabel>Postal code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="sm:col-span-2">
                  <FormField control={form.control} name="address_line" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            {/* Emergency */}
            <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <CardHeader><CardTitle className="text-base">Emergency Contact</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="emergency_contact_name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="emergency_contact_phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Medical */}
            <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Medical History</CardTitle>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  This information helps doctors provide safe, personalised care.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Chronic / Existing Conditions */}
                <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-900/10 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Chronic / Existing Conditions</p>
                    <span className="ml-auto text-[10px] font-medium text-amber-500 dark:text-amber-600 uppercase tracking-wide">Optional</span>
                  </div>
                  <FormField control={form.control} name="existing_conditions" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={3}
                          placeholder={"List diagnosed conditions, one per line.\ne.g. Type 2 Diabetes\nHypertension\nAsthma"}
                          className="flex w-full rounded-lg border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-zinc-800 px-2.5 py-2 text-sm outline-none focus-visible:border-amber-400 dark:focus-visible:border-amber-600 resize-none placeholder:text-zinc-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <p className="text-[11px] text-amber-700/70 dark:text-amber-500/70">
                    Include heart conditions, thyroid issues, autoimmune diseases, mental health diagnoses, etc.
                  </p>
                </div>

                {/* Allergies */}
                <div className="rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50/60 dark:bg-red-900/10 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">Allergies</p>
                    <span className="ml-auto text-[10px] font-medium text-red-500 dark:text-red-600 uppercase tracking-wide">Important</span>
                  </div>
                  <FormField control={form.control} name="allergies" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={3}
                          placeholder={"List allergies, one per line.\ne.g. Penicillin (drug)\nPeanuts (food)\nLatex"}
                          className="flex w-full rounded-lg border border-red-200 dark:border-red-800/60 bg-white dark:bg-zinc-800 px-2.5 py-2 text-sm outline-none focus-visible:border-red-400 dark:focus-visible:border-red-600 resize-none placeholder:text-zinc-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <p className="text-[11px] text-red-700/70 dark:text-red-500/70">
                    Drug allergies are critical — your doctor needs these before prescribing anything.
                  </p>
                </div>

                {/* Current Medications */}
                <div className="rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-900/10 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Current Medications</p>
                    <span className="ml-auto text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Important</span>
                  </div>
                  <FormField control={form.control} name="current_medications" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <StructuredMedicationsField value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <p className="text-[11px] text-blue-700/70 dark:text-blue-500/70">
                    Include supplements, vitamins, and over-the-counter medicines too.
                  </p>
                </div>

                {/* Medical Reports — inside Medical History */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-700">
                  <MedicalReportsSection />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
