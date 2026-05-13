"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div>
          <p className="text-6xl font-bold text-zinc-200">!</p>
          <h1 className="text-2xl font-bold text-zinc-900 mt-2">Something went wrong</h1>
          <p className="text-zinc-500 mt-2">
            An unexpected error occurred. This has been logged. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-zinc-400 font-mono mt-2">Error ID: {error.digest}</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} className="bg-teal-600 text-white hover:bg-teal-700">
            Try Again
          </Button>
          <Link href="/"
            className="inline-flex items-center justify-center h-10 px-5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
            Go Home
          </Link>
        </div>
        <p className="text-xs text-zinc-400">
          Still having trouble?{" "}
          <a href="mailto:support@medibridge.local" className="text-teal-600 hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </main>
  );
}
