import { ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-zinc-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-zinc-200" />
        <ListSkeleton count={4} />
      </div>
    </main>
  );
}
