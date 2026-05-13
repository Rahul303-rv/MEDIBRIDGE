"use client";

import { useEffect, useState } from "react";
import { ControllerRenderProps, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import api, { getApiFieldErrors } from "@/lib/api";
import { PatientProfile } from "@/types/api";
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
            <h1 className="text-2xl font-bold text-zinc-900">Your Profile</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Keep your medical information up to date.</p>
          </div>
          <Link href="/patient" className="text-sm text-teal-600 hover:underline">← Dashboard</Link>
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
            <Card className="border border-zinc-200 shadow-sm">
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
            <Card className="border border-zinc-200 shadow-sm">
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
            <Card className="border border-zinc-200 shadow-sm">
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
            <Card className="border border-zinc-200 shadow-sm">
              <CardHeader><CardTitle className="text-base">Medical History</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="existing_conditions" render={({ field }) => (
                  <TextareaField label="Existing conditions" field={field} placeholder="e.g. Diabetes, Hypertension" />
                )} />
                <FormField control={form.control} name="allergies" render={({ field }) => (
                  <TextareaField label="Allergies" field={field} placeholder="e.g. Penicillin, Peanuts" />
                )} />
                <FormField control={form.control} name="current_medications" render={({ field }) => (
                  <TextareaField label="Current medications" field={field} placeholder="e.g. Metformin 500mg daily" />
                )} />
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
