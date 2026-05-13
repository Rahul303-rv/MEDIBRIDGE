"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import api, { getApiFieldErrors } from "@/lib/api";
import { DoctorProfile, Specialization, DoctorEducation } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const TIMEZONES = [
  "Asia/Kolkata", "Asia/Dubai", "America/Toronto", "America/New_York",
  "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Australia/Sydney", "Pacific/Auckland",
];

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string(),
  bio: z.string(),
  medical_council_reg_no: z.string(),
  years_of_experience: z.string(),
  consultation_fee_usd: z.string(),
  consultation_duration_min: z.string(),
  languages: z.string(),
  hospital_affiliation: z.string(),
  timezone: z.string().min(1, "Timezone is required"),
});

type ProfileForm = z.infer<typeof profileSchema>;

const educationSchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  institution: z.string().min(1, "Institution is required"),
  year_completed: z.string().min(4, "Year is required"),
});

type EducationForm = z.infer<typeof educationSchema>;

export default function DoctorProfilePage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [selectedSpecIds, setSelectedSpecIds] = useState<number[]>([]);
  const [education, setEducation] = useState<DoctorEducation[]>([]);
  const [showEduForm, setShowEduForm] = useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "", last_name: "", phone: "", bio: "",
      medical_council_reg_no: "", years_of_experience: "",
      consultation_fee_usd: "", consultation_duration_min: "30",
      languages: "", hospital_affiliation: "", timezone: "Asia/Kolkata",
    },
  });

  const eduForm = useForm<EducationForm>({
    resolver: zodResolver(educationSchema),
    defaultValues: { degree: "", institution: "", year_completed: "" },
  });

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/doctor/profile"),
      api.get("/api/v1/doctor/education"),
    ]).then(([profileRes, eduRes]) => {
      const p: DoctorProfile = profileRes.data;
      form.reset({
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        phone: p.phone || "",
        bio: p.bio || "",
        medical_council_reg_no: p.medical_council_reg_no || "",
        years_of_experience: p.years_of_experience != null ? String(p.years_of_experience) : "",
        consultation_fee_usd: p.consultation_fee_usd != null ? String(p.consultation_fee_usd) : "",
        consultation_duration_min: String(p.consultation_duration_min || 30),
        languages: p.languages || "",
        hospital_affiliation: p.hospital_affiliation || "",
        timezone: p.timezone || "Asia/Kolkata",
      });
      setSelectedSpecIds(p.specializations.map((s) => s.id));
      setEducation(eduRes.data);
    }).finally(() => setFetching(false));

    api.get("/api/v1/public/specializations").then((res) => {
      setSpecializations(res.data);
    }).catch(() => {
      // public endpoint not yet wired — load from profile instead
    });
  }, [form]);

  async function onSubmit(values: ProfileForm) {
    setLoading(true);
    const payload = {
      ...values,
      years_of_experience: values.years_of_experience ? Number(values.years_of_experience) : null,
      consultation_fee_usd: values.consultation_fee_usd ? values.consultation_fee_usd : null,
      consultation_duration_min: Number(values.consultation_duration_min),
      specialization_ids: selectedSpecIds,
    };
    try {
      await api.patch("/api/v1/doctor/profile", payload);
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

  async function addEducation(values: EducationForm) {
    try {
      const res = await api.post("/api/v1/doctor/education", {
        ...values,
        year_completed: Number(values.year_completed),
      });
      setEducation((prev) => [...prev, res.data]);
      eduForm.reset();
      setShowEduForm(false);
      toast.success("Education entry added.");
    } catch {
      toast.error("Failed to add education entry.");
    }
  }

  async function removeEducation(id: number) {
    try {
      await api.delete(`/api/v1/doctor/education/${id}`);
      setEducation((prev) => prev.filter((e) => e.id !== id));
    } catch {
      toast.error("Failed to remove education entry.");
    }
  }

  function toggleSpec(id: number) {
    setSelectedSpecIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  if (fetching) {
    return (
      <main className="min-h-screen bg-zinc-50 p-8">
        <div className="max-w-2xl mx-auto text-zinc-500 text-sm">Loading profile…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Doctor Profile</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Keep your information up to date.</p>
          </div>
          <Link href="/doctor" className="text-sm text-teal-600 hover:underline">← Dashboard</Link>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Personal */}
            <Card className="border border-zinc-200 shadow-sm">
              <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="first_name" render={({ field }) => (
                  <FormItem><FormLabel>First name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="last_name" render={({ field }) => (
                  <FormItem><FormLabel>Last name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="timezone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="sm:col-span-2">
                  <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={3}
                          className="flex w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            {/* Professional */}
            <Card className="border border-zinc-200 shadow-sm">
              <CardHeader><CardTitle className="text-base">Professional Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="medical_council_reg_no" render={({ field }) => (
                  <FormItem><FormLabel>Medical council reg. no.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="years_of_experience" render={({ field }) => (
                  <FormItem><FormLabel>Years of experience</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="consultation_fee_usd" render={({ field }) => (
                  <FormItem><FormLabel>Consultation fee (USD)</FormLabel><FormControl><Input type="number" step="0.01" min={0} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="consultation_duration_min" render={({ field }) => (
                  <FormItem><FormLabel>Consultation duration (min)</FormLabel><FormControl><Input type="number" min={15} step={5} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="languages" render={({ field }) => (
                  <FormItem><FormLabel>Languages (comma-separated)</FormLabel><FormControl><Input placeholder="English, Hindi, Tamil" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="hospital_affiliation" render={({ field }) => (
                  <FormItem><FormLabel>Hospital affiliation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Specializations */}
            {specializations.length > 0 && (
              <Card className="border border-zinc-200 shadow-sm">
                <CardHeader><CardTitle className="text-base">Specializations</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {specializations.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSpec(s.id)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          selectedSpecIds.includes(s.id)
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-white text-zinc-700 border-zinc-300 hover:border-teal-400"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </Form>

        {/* Education */}
        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Education</CardTitle>
              <button
                type="button"
                onClick={() => setShowEduForm((v) => !v)}
                className="text-sm text-teal-600 hover:underline"
              >
                {showEduForm ? "Cancel" : "+ Add entry"}
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {education.length === 0 && !showEduForm && (
              <p className="text-sm text-zinc-400">No education entries yet.</p>
            )}
            {education.map((e) => (
              <div key={e.id} className="flex items-start justify-between text-sm border border-zinc-100 rounded-lg p-3">
                <div>
                  <p className="font-medium text-zinc-800">{e.degree}</p>
                  <p className="text-zinc-500">{e.institution} · {e.year_completed}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeEducation(e.id)}
                  className="text-xs text-red-500 hover:underline ml-4 shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
            {showEduForm && (
              <Form {...eduForm}>
                <form onSubmit={eduForm.handleSubmit(addEducation)} className="space-y-3 border border-zinc-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField control={eduForm.control} name="degree" render={({ field }) => (
                      <FormItem><FormLabel>Degree</FormLabel><FormControl><Input placeholder="MBBS, MD…" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={eduForm.control} name="year_completed" render={({ field }) => (
                      <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" min={1950} max={new Date().getFullYear()} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="sm:col-span-2">
                      <FormField control={eduForm.control} name="institution" render={({ field }) => (
                        <FormItem><FormLabel>Institution</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </div>
                  <Button type="submit" size="sm">Add</Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
