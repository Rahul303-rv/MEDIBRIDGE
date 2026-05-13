"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { DoctorProfile } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";

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
      const details = (err as { response?: { data?: Record<string, string[]> } }).response?.data;
      if (details && typeof details === "object" && !("error" in details)) {
        Object.entries(details).forEach(([k, msgs]) =>
          form.setError(k as keyof FormValues, { message: (msgs as string[])[0] })
        );
      }
      toast.error("Failed to submit request. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Request a Consultation</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Describe your symptoms and our team will match you to the right doctor.
            </p>
          </div>
          <Link href="/patient" className="text-sm text-teal-600 hover:underline">← Dashboard</Link>
        </div>

        <Card className="border border-zinc-200 shadow-sm">
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
                    <p className="text-xs text-zinc-400">Pre-filled from your profile. Edit as needed.</p>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="preferred_doctor" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred doctor <span className="text-zinc-400 font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
                      >
                        <option value="">No preference — let the team decide</option>
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            Dr. {d.first_name} {d.last_name}
                            {d.specializations.length > 0 && ` — ${d.specializations.map((s) => s.name).join(", ")}`}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                  {form.formState.isSubmitting ? "Submitting…" : "Submit Request"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-xs text-zinc-400 text-center">
          In a medical emergency, please call your local emergency number immediately.
          MediBridge is not an emergency service.
        </p>
      </div>
    </main>
  );
}
