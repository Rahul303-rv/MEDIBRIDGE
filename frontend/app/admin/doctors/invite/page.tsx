"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import api, { getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const schema = z.object({
  email: z.string().email("Valid email is required"),
});

type FormValues = z.infer<typeof schema>;

export default function AdminDoctorInvitePage() {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await api.post("/api/v1/admin/doctors/invite", values);
      toast.success(`Invitation sent to ${values.email}`);
      form.reset();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to send invitation."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Invite a Doctor</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Send a registration link to a doctor&apos;s email.</p>
          </div>
          <Link href="/admin/doctors" className="text-sm text-teal-600 hover:underline">← All doctors</Link>
        </div>

        <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Send invitation</CardTitle>
            <CardDescription>The doctor will receive an email with a unique sign-up link valid for 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor&apos;s email</FormLabel>
                    <FormControl><Input type="email" placeholder="doctor@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending…" : "Send invitation"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
