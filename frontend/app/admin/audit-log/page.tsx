"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AuditEntry {
  id: number;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: number | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditEntry[];
}

const ACTION_COLORS: Record<string, string> = {
  "doctor.invited":            "bg-blue-50 text-blue-700",
  "doctor.verified":           "bg-emerald-50 text-emerald-700",
  "intake.matched":            "bg-teal-50 text-teal-700",
  "booking.confirmed":         "bg-zinc-50 text-zinc-700",
  "surgery.booking.confirmed": "bg-amber-50 text-amber-700",
};

export default function AdminAuditLogPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/v1/admin/audit-log?page=${page}`)
      .then((res) => setData(res.data))
      .catch(() => toast.error("Failed to load audit log."))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Audit Log</h1>
            <p className="text-sm text-zinc-500 mt-0.5">All tracked admin and system actions.</p>
          </div>
          <Link href="/admin" className="text-sm text-zinc-500 hover:underline">← Dashboard</Link>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : !data || data.results.length === 0 ? (
          <Card className="border border-zinc-200 shadow-sm">
            <CardContent className="pt-8 pb-8 text-center text-sm text-zinc-500">No audit log entries yet.</CardContent>
          </Card>
        ) : (
          <>
            <p className="text-xs text-zinc-400">{data.count} total entries</p>
            <div className="space-y-2">
              {data.results.map((entry) => (
                <Card key={entry.id} className="border border-zinc-200 shadow-sm">
                  <CardContent className="pt-3 pb-3 flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_COLORS[entry.action] ?? "bg-zinc-100 text-zinc-600"}`}>
                          {entry.action}
                        </span>
                        {entry.target_type && (
                          <span className="text-xs text-zinc-400">
                            {entry.target_type} #{entry.target_id}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {entry.actor_email ?? "System"} · {entry.ip_address ?? "–"}
                      </p>
                      {Object.keys(entry.metadata).length > 0 && (
                        <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
                          {JSON.stringify(entry.metadata)}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-zinc-400">
                        {new Date(entry.created_at).toLocaleString("en-US", {
                          month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" disabled={!data.previous}
                onClick={() => setPage((p) => p - 1)}>
                ← Previous
              </Button>
              <p className="text-xs text-zinc-400">Page {page}</p>
              <Button variant="outline" size="sm" disabled={!data.next}
                onClick={() => setPage((p) => p + 1)}>
                Next →
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
