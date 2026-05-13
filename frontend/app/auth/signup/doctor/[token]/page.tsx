"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import api, { getApiFieldErrors } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const schema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(10, "Password must be at least 10 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
});

type FormValues = z.infer<typeof schema>;

export default function DoctorSignupPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const token = params.token as string;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", first_name: "", last_name: "" },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await api.post("/api/v1/auth/signup/doctor", {
        invite_token: token,
        ...values,
      });
      toast.success("Account created! Please check your email to verify before logging in.");
      router.push("/auth/login");
    } catch (err: unknown) {
      const details = getApiFieldErrors(err);
      if (Object.keys(details).length > 0) {
        Object.entries(details).forEach(([key, msgs]) => {
          const message = msgs[0] ?? "Invalid value.";
          if (key === "invite_token") toast.error(message);
          else form.setError(key as keyof FormValues, { message });
        });
      } else {
        toast.error("Signup failed. Please check the form.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900">Join MediBridge</h1>
          <p className="text-sm text-zinc-500 mt-1">Complete your doctor registration</p>
        </div>

        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Create your account</CardTitle>
            <CardDescription>This link was sent to you by the MediBridge admin team.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="first_name" render={({ field }) => (
                    <FormItem><FormLabel>First name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="last_name" render={({ field }) => (
                    <FormItem><FormLabel>Last name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-teal-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
