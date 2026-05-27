"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import api, { getApiFieldErrors } from "@/lib/api";
import { DoctorAvailabilitySlot } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function SlotSkeleton() {
  return (
    <div className="animate-pulse flex items-center justify-between p-3 border border-zinc-100 dark:border-zinc-800 rounded-xl">
      <div className="h-4 bg-zinc-100 dark:bg-zinc-700 rounded w-40" />
      <div className="h-4 bg-zinc-100 dark:bg-zinc-700 rounded w-14" />
    </div>
  );
}

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
      toast.success("Slot removed.");
    } catch {
      toast.error("Failed to remove slot.");
    }
  }

  const recurring = slots.filter((s) => s.slot_type === "recurring_weekly");
  const specific  = slots.filter((s) => s.slot_type === "specific_date");

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Availability</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Manage your bookable time slots</p>
      </div>

      {/* Recurring weekly */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-white text-sm">Recurring Weekly Slots</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Repeat every week automatically</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowRecurring((v) => !v)}
            className={`h-8 px-3 rounded-xl text-xs font-semibold transition-colors ${
              showRecurring
                ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-100"
            }`}
          >
            {showRecurring ? "Cancel" : "+ Add slot"}
          </button>
        </div>

        <div className="p-5 space-y-3">
          {loading ? (
            <>
              <SlotSkeleton />
              <SlotSkeleton />
            </>
          ) : recurring.length === 0 && !showRecurring ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 py-2">
              No recurring slots. Add one to appear in the patient-facing directory.
            </p>
          ) : (
            recurring.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700/50 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-lg">
                    {DAYS[s.day_of_week ?? 0]}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-300 font-medium">
                    {s.start_time} – {s.end_time}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSlot(s.id)}
                  className="h-7 px-2.5 rounded-lg border border-red-100 text-xs font-semibold text-red-400 hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))
          )}

          {showRecurring && (
            <Form {...recurringForm}>
              <form
                onSubmit={recurringForm.handleSubmit(addRecurring)}
                className="border border-teal-100 bg-teal-50 rounded-xl p-4 space-y-4"
              >
                <p className="text-xs font-bold text-teal-700 uppercase tracking-widest">New recurring slot</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField control={recurringForm.control} name="day_of_week" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Day</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-9 w-full rounded-lg border border-input bg-white dark:bg-zinc-800 dark:border-zinc-700 px-2.5 text-sm outline-none focus-visible:border-ring"
                        >
                          <option value="">Select day…</option>
                          {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={recurringForm.control} name="start_time" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Start time</FormLabel>
                      <FormControl><Input type="time" className="bg-white dark:bg-zinc-800 dark:border-zinc-700" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={recurringForm.control} name="end_time" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">End time</FormLabel>
                      <FormControl><Input type="time" className="bg-white dark:bg-zinc-800 dark:border-zinc-700" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                  Add Slot
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>

      {/* Specific dates */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-white text-sm">Specific Date Slots</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">One-off availability for a specific date</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSpecific((v) => !v)}
            className={`h-8 px-3 rounded-xl text-xs font-semibold transition-colors ${
              showSpecific
                ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100"
            }`}
          >
            {showSpecific ? "Cancel" : "+ Add slot"}
          </button>
        </div>

        <div className="p-5 space-y-3">
          {loading ? (
            <>
              <SlotSkeleton />
            </>
          ) : specific.length === 0 && !showSpecific ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 py-2">No specific date slots added.</p>
          ) : (
            specific.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700/50 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">
                    {s.specific_date}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-300 font-medium">
                    {s.start_time} – {s.end_time}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSlot(s.id)}
                  className="h-7 px-2.5 rounded-lg border border-red-100 text-xs font-semibold text-red-400 hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))
          )}

          {showSpecific && (
            <Form {...specificForm}>
              <form
                onSubmit={specificForm.handleSubmit(addSpecific)}
                className="border border-blue-100 bg-blue-50 rounded-xl p-4 space-y-4"
              >
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">New specific date slot</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField control={specificForm.control} name="specific_date" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Date</FormLabel>
                      <FormControl><Input type="date" className="bg-white dark:bg-zinc-800 dark:border-zinc-700" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={specificForm.control} name="start_time" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Start time</FormLabel>
                      <FormControl><Input type="time" className="bg-white dark:bg-zinc-800 dark:border-zinc-700" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={specificForm.control} name="end_time" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">End time</FormLabel>
                      <FormControl><Input type="time" className="bg-white dark:bg-zinc-800 dark:border-zinc-700" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Add Slot
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
