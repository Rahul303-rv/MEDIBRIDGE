"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .post("/api/v1/auth/verify-email", { token })
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.error?.message || "Verification failed.");
      });
  }, [token]);

  return (
    <Card className="border border-zinc-200 shadow-sm text-center">
      <CardHeader>
        <CardTitle className="text-2xl text-zinc-900">
          {status === "loading" && "Verifying…"}
          {status === "success" && "Email verified!"}
          {status === "error" && "Verification failed"}
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "success" && (
          <Link
            href="/auth/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Sign in to your account
          </Link>
        )}
        {status === "error" && (
          <p className="text-sm text-zinc-500">
            Need a new link?{" "}
            <Link href="/auth/signup" className="text-teal-600 hover:underline">
              Sign up again
            </Link>{" "}
            or{" "}
            <Link href="/auth/login" className="text-teal-600 hover:underline">
              try logging in
            </Link>
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}
