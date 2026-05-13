import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div>
          <p className="text-7xl font-bold text-zinc-200">404</p>
          <h1 className="text-2xl font-bold text-zinc-900 mt-2">Page not found</h1>
          <p className="text-zinc-500 mt-2">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/"
            className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors">
            Go Home
          </Link>
          <Link href="/doctors"
            className="inline-flex items-center justify-center h-10 px-5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
            Find a Doctor
          </Link>
        </div>
        <p className="text-xs text-zinc-400">
          Need help?{" "}
          <a href="mailto:support@medibridge.local" className="text-teal-600 hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </main>
  );
}
