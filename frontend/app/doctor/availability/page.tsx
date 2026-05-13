"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import api, { getApiFieldErrors } from "@/lib/api";
import { DoctorAvailabilitySlot } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const recurringSchema = z.object({
  day_of_week: z.string().min(1, "Day is required"),
  start_time: z.string().min(1, "Start time required"),
  end_time: z.string().min(1, "End time required"),
});

const specificSchema = z.object({
  specific_date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time required"),
  end_time: z.string().min(1, "End time required"),
});

type RecurringForm = z.infer<typeof recurringSchema>;
type SpecificForm = z.infer<typeof specificSchema>;

export default function DoctorAvailabilityPage() {
  const [slots, setSlots] = useState<DoctorAvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showSpecific, setShowSpecific] = useState(false);

  const recurringForm = useForm<RecurringForm>({
    resolver: zodResolver(recurringSchema),
    defaultValues: { day_of_week: "", start_time: "", end_time: "" },
  });

  const specificForm = useForm<SpecificForm>({
    resolver: zodResolver(specificSchema),
    defaultValues: { specific_date: "", start_time: "", end_time: "" },
  });

  useEffect(() => {
    api.get("/api/v1/doctor/slots")
      .then((res) => setSlots(res.data))
      .finally(() => setLoading(false));
  }, []);

  async function addRecurring(values: RecurringForm) {
    try {
      const res = await api.post("/api/v1/doctor/slots", {
        slot_type: "recurring_weekly",
        day_of_week: Number(values.day_of_week),
        start_time: values.start_time,
        end_time: values.end_time,
      });
      setSlots((prev) => [...prev, res.data]);
      recurringForm.reset();
      setShowRecurring(false);
      toast.success("Recurring slot added.");
    } catch (err: unknown) {
      Object.entries(getApiFieldErrors(err)).forEach(([k, msgs]) =>
        recurringForm.setError(k as keyof RecurringForm, { message: msgs[0] ?? "Invalid value." })
      );
      toast.error("Failed to add slot.");
    }
  }

  async function addSpecific(values: SpecificForm) {
    try {
      const res = await api.post("/api/v1/doctor/slots", {
        slot_type: "specific_date",
        specific_date: values.specific_date,
        start_time: values.start_time,
        end_time: values.end_time,
      });
      setSlots((prev) => [...prev, res.data]);
      specificForm.reset();
      setShowSpecific(false);
      toast.success("Specific date slot added.");
    } catch (err: unknown) {
      Object.entries(getApiFieldErrors(err)).forEach(([k, msgs]) =>
        specificForm.setError(k as keyof SpecificForm, { message: msgs[0] ?? "Invalid value." })
      );
      toast.error("Failed to add slot.");
    }
  }

  async function removeSlot(id: number) {
    try {
      await api.delete(`/api/v1/doctor/slots/${id}`);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Failed to remove slot.");
    }
  }

  const recurring = slots.filter((s) => s.slot_type === "recurring_weekly");
  const specific = slots.filter((s) => s.slot_type === "specific_date");

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Availability</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Manage your bookable time slots.</p>
          </div>
          <Link href="/doctor" className="text-sm text-teal-600 hover:underline">← Dashboard</Link>
        </div>

        {/* Recurring weekly */}
        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recurring weekly slots</CardTitle>
              <button type="button" onClick={() => setShowRecurring((v) => !v)} className="text-sm text-teal-600 hover:underline">
                {showRecurring ? "Cancel" : "+ Add slot"}
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <p className="text-sm text-zinc-400">Loading…</p> : recurring.length === 0 && !showRecurring ? (
              <p className="text-sm text-zinc-400">No recurring slots. Add one to appear in the public directory.</p>
            ) : (
              recurring.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm border border-zinc-100 rounded-lg p-3">
                  <span className="text-zinc-700">
                    <span className="font-medium">{DAYS[s.day_of_week ?? 0]}</span>{" "}
                    {s.start_time} – {s.end_time}
                  </span>
                  <button type="button" onClick={() => removeSlot(s.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              ))
            )}
            {showRecurring && (
              <Form {...recurringForm}>
                <form onSubmit={recurringForm.handleSubmit(addRecurring)} className="space-y-3 border border-zinc-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField control={recurringForm.control} name="day_of_week" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day</FormLabel>
                        <FormControl>
                          <select {...field} className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring">
                            <option value="">Select…</option>
                            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={recurringForm.control} name="start_time" render={({ field }) => (
                      <FormItem><FormLabel>Start</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={recurringForm.control} name="end_time" render={({ field }) => (
                      <FormItem><FormLabel>End</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <Button type="submit" size="sm">Add</Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Specific dates */}
        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Specific date slots</CardTitle>
              <button type="button" onClick={() => setShowSpecific((v) => !v)} className="text-sm text-teal-600 hover:underline">
                {showSpecific ? "Cancel" : "+ Add slot"}
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <p className="text-sm text-zinc-400">Loading…</p> : specific.length === 0 && !showSpecific ? (
              <p className="text-sm text-zinc-400">No specific date slots.</p>
            ) : (
              specific.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm border border-zinc-100 rounded-lg p-3">
                  <span className="text-zinc-700">
                    <span className="font-medium">{s.specific_date}</span>{" "}
                    {s.start_time} – {s.end_time}
                  </span>
                  <button type="button" onClick={() => removeSlot(s.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              ))
            )}
            {showSpecific && (
              <Form {...specificForm}>
                <form onSubmit={specificForm.handleSubmit(addSpecific)} className="space-y-3 border border-zinc-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField control={specificForm.control} name="specific_date" render={({ field }) => (
                      <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={specificForm.control} name="start_time" render={({ field }) => (
                      <FormItem><FormLabel>Start</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={specificForm.control} name="end_time" render={({ field }) => (
                      <FormItem><FormLabel>End</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
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
