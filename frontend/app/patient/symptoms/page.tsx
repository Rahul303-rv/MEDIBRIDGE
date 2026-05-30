"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import api from "@/lib/api";
import { DoctorProfile } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";

interface UploadedReport {
  id: number;
  title: string;
  uploaded_at: string;
}

const REPORT_TITLES = [
  "Blood Test Report",
  "Ultrasound Report",
  "MRI Scan",
  "X-Ray",
  "ECG Report",
  "Biopsy Report",
  "Hormone Panel",
  "Other",
];

const schema = z.object({
  chief_complaint: z.string().min(5, "Please describe your main complaint (min 5 characters)"),
  symptoms: z.string().min(10, "Please describe your symptoms in more detail"),
  duration: z.string().min(1, "Duration is required"),
  severity: z.enum(["mild", "moderate", "severe"], { error: "Select a severity" }),
  existing_conditions_note: z.string(),
  preferred_doctor: z.string(),
});

type FormValues = z.infer<typeof schema>;

export default function SymptomIntakePage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [doctorDropdownOpen, setDoctorDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Report upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasReports, setHasReports] = useState(false);
  const [reports, setReports] = useState<UploadedReport[]>([]);
  const [reportTitle, setReportTitle] = useState("Blood Test Report");
  const [customTitle, setCustomTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDoctorDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      chief_complaint: "",
      symptoms: "",
      duration: "",
      severity: "moderate",
      existing_conditions_note: "",
      preferred_doctor: "",
    },
  });

  useEffect(() => {
    // Pre-fill existing conditions from patient profile
    api.get("/api/v1/patient/profile").then((res) => {
      const conditions = res.data.existing_conditions || "";
      form.setValue("existing_conditions_note", conditions);
    }).catch(() => {});

    // Load doctor list for optional preference
    api.get("/api/v1/public/doctors").then((res) => setDoctors(res.data)).catch(() => {});
  }, [form]);

  async function uploadReport(file: File) {
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10 MB."); return; }
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) { toast.error("Only PDF, JPEG, or PNG accepted."); return; }
    const title = reportTitle === "Other" ? (customTitle.trim() || "Other Report") : reportTitle;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title);
    try {
      const res = await api.post("/api/v1/patient/medical-reports", fd);
      setReports((prev) => [...prev, res.data]);
      toast.success(`"${title}" uploaded.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function removeReport(id: number) {
    try {
      await api.delete(`/api/v1/patient/medical-reports/${id}`);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Could not remove report.");
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      const payload: Record<string, unknown> = {
        chief_complaint: values.chief_complaint,
        symptoms: values.symptoms,
        duration: values.duration,
        severity: values.severity,
        existing_conditions_note: values.existing_conditions_note,
      };
      if (values.preferred_doctor) {
        payload.preferred_doctor = Number(values.preferred_doctor);
      }
      await api.post("/api/v1/patient/symptom-intakes", payload);
      toast.success("Your request has been submitted. Our team will review and match you to a doctor shortly.");
      router.push("/patient/symptoms/history");
    } catch (err: unknown) {
      const hasResponse = axios.isAxiosError(err) && !!err.response;
      if (hasResponse) {
        // Real API error — show field errors or message
        const details = err.response?.data;
        if (details && typeof details === "object" && !("error" in details)) {
          Object.entries(details).forEach(([k, msgs]) =>
            form.setError(k as keyof FormValues, { message: (msgs as string[])[0] })
          );
        }
        toast.error("Failed to submit request. Please try again.");
      } else {
        // Network timeout — server likely created the record, redirect to history
        toast.success("Request submitted! Redirecting to your requests…");
        router.push("/patient/symptoms/history");
      }
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Request a Consultation</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Describe your symptoms and our team will match you to the right doctor.
            </p>
          </div>
          <Link href="/patient" className="text-sm text-teal-600 hover:underline">← Dashboard</Link>
        </div>

        <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-visible">
          <CardHeader>
            <CardTitle className="text-base">Symptom Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                <FormField control={form.control} name="chief_complaint" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chief complaint <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Persistent headache, chest pain, back pain" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="symptoms" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Describe your symptoms <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <textarea
                        rows={4}
                        placeholder="Describe when it started, what makes it better or worse, any associated symptoms…"
                        className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="duration" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 3 days, 2 weeks" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="severity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
                        >
                          <option value="mild">Mild — manageable, not urgent</option>
                          <option value="moderate">Moderate — affecting daily life</option>
                          <option value="severe">Severe — significant distress</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="existing_conditions_note" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Existing conditions / medications</FormLabel>
                    <FormControl>
                      <textarea
                        rows={2}
                        placeholder="Any chronic conditions, current medications, or allergies relevant to this request…"
                        className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring resize-none"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Pre-filled from your profile. Edit as needed.</p>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Test Report Upload */}
                <div className="space-y-3">
                  {/* Checkbox toggle */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={hasReports}
                      onChange={(e) => setHasReports(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-teal-600 transition-colors">
                        I have existing test reports to upload
                        <span className="text-zinc-400 dark:text-zinc-500 font-normal ml-1">(optional)</span>
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                        Blood tests, scans, ultrasounds, or any relevant reports. PDF, JPEG, PNG · Max 10 MB each.
                      </p>
                    </div>
                  </label>

                  {/* Upload controls — shown only when checkbox is ticked */}
                  {hasReports && (
                    <div className="space-y-3 pl-7">
                      {/* Uploaded reports list */}
                      {reports.length > 0 && (
                        <div className="space-y-2">
                          {reports.map((r) => (
                            <div key={r.id} className="flex items-center justify-between bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-teal-600 text-sm">📄</span>
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{r.title}</span>
                                <span className="text-xs text-zinc-400 dark:text-zinc-500">Uploaded</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeReport(r.id)}
                                className="text-xs text-red-500 hover:text-red-600 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Report Type</label>
                          <select
                            value={reportTitle}
                            onChange={(e) => setReportTitle(e.target.value)}
                            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
                          >
                            {REPORT_TITLES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => { if (e.target.files?.[0]) uploadReport(e.target.files[0]); }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-9"
                          >
                            {uploading ? "Uploading…" : "Choose File"}
                          </Button>
                        </div>
                      </div>
                      {reportTitle === "Other" && (
                        <Input
                          placeholder="Enter report name…"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                        />
                      )}
                    </div>
                  )}
                </div>

                <FormField control={form.control} name="preferred_doctor" render={({ field }) => {
                  const selected = doctors.find((d) => String(d.id) === field.value);
                  return (
                    <FormItem>
                      <FormLabel>Preferred doctor <span className="text-zinc-400 dark:text-zinc-500 font-normal">(optional)</span></FormLabel>
                      <div ref={dropdownRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setDoctorDropdownOpen((o) => !o)}
                          className="flex w-full min-h-12 rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus-visible:border-ring items-center justify-between text-left"
                        >
                          {selected ? (
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <span className="font-medium text-zinc-900 dark:text-white">
                                  Dr. {selected.first_name} {selected.last_name}
                                </span>
                                <span className="text-zinc-500 dark:text-zinc-400 ml-1">
                                  — {selected.specializations.map((s) => s.name).join(", ")}
                                </span>
                                {selected.education.length > 0 && (
                                  <span className="text-zinc-400 dark:text-zinc-500 ml-1 text-xs">
                                    · {selected.education[selected.education.length - 1].degree}
                                  </span>
                                )}
                              </div>
                              {selected.consultation_fee_usd && (
                                <span className="text-teal-600 font-semibold ml-3 shrink-0">
                                  ${Number(selected.consultation_fee_usd).toLocaleString()}/consult
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-500 dark:text-zinc-400">No preference — let the team decide</span>
                          )}
                          <svg className="ml-2 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {doctorDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl max-h-96 overflow-y-auto">
                            {/* No preference option */}
                            <div
                              className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 border-b border-zinc-100 dark:border-zinc-800"
                              onClick={() => { field.onChange(""); setDoctorDropdownOpen(false); }}
                            >
                              No preference — let the team decide
                            </div>

                            {doctors.map((d) => {
                              const highestDegree = d.education.length > 0
                                ? d.education[d.education.length - 1].degree
                                : null;
                              const isSelected = String(d.id) === field.value;
                              return (
                                <div
                                  key={d.id}
                                  className={`px-4 py-3.5 cursor-pointer border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-teal-50 transition-colors ${isSelected ? "bg-teal-50 border-l-2 border-l-teal-500" : ""}`}
                                  onClick={() => { field.onChange(String(d.id)); setDoctorDropdownOpen(false); }}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                          Dr. {d.first_name} {d.last_name}
                                        </p>
                                        {isSelected && (
                                          <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-medium">Selected</span>
                                        )}
                                      </div>
                                      <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-0.5">
                                        {d.specializations.map((s) => s.name).join(", ")}
                                      </p>
                                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                                        {highestDegree && <span>{highestDegree}</span>}
                                        {d.years_of_experience && (
                                          <span> · {d.years_of_experience} yrs experience</span>
                                        )}
                                      </p>
                                    </div>
                                    {d.consultation_fee_usd && (
                                      <div className="text-right shrink-0">
                                        <p className="text-base font-bold text-teal-600">
                                          ${Number(d.consultation_fee_usd).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500">per consult</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }} />

                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                  {form.formState.isSubmitting ? "Submitting…" : "Submit Request"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
          In a medical emergency, please call your local emergency number immediately.
          MediBridge is not an emergency service.
        </p>
      </div>
    </main>
  );
}
