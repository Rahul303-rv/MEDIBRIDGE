"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";

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

const ACTION_STYLES: Record<string, { badge: string; icon: string }> = {
  "doctor.invited":            { badge: "bg-blue-100 text-blue-700",    icon: "✉️" },
  "doctor.verified":           { badge: "bg-emerald-100 text-emerald-700", icon: "✅" },
  "intake.matched":            { badge: "bg-teal-100 text-teal-700",    icon: "🔗" },
  "booking.confirmed":         { badge: "bg-zinc-100 text-zinc-700",    icon: "📅" },
  "surgery.booking.confirmed": { badge: "bg-amber-100 text-amber-700",  icon: "✂️" },
};

function AuditSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-4 px-6 py-4 animate-pulse ${i !== 0 ? "border-t border-zinc-100" : ""}`}
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="h-5 w-32 bg-zinc-100 rounded-full" />
              <div className="h-5 w-20 bg-zinc-100 rounded-full" />
            </div>
            <div className="h-3 bg-zinc-100 rounded w-48" />
          </div>
          <div className="h-3 w-24 bg-zinc-100 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function AdminAuditLogPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/v1/admin/audit-log?page=${page}`)
      .then((res) => setData(res.data))
      .catch(() => toast.error("Failed to load audit log."))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="p-8 space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900">Audit Log</h1>
          <p className="text-sm text-zinc-500 mt-0.5">All tracked admin and system actions</p>
        </div>
        {data && (
          <span className="text-sm font-medium text-zinc-400">{data.count} entries</span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <AuditSkeleton />
      ) : !data || data.results.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-14 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold text-zinc-700">No audit entries yet</p>
          <p className="text-zinc-400 text-sm mt-1">Actions will appear here as they happen.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
            {data.results.map((entry, idx) => {
              const style = ACTION_STYLES[entry.action];
              return (
                <div
                  key={entry.id}
                  className={`flex items-start gap-4 px-6 py-4 hover:bg-zinc-50/60 transition-colors ${
                    idx !== 0 ? "border-t border-zinc-100" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-sm shrink-0 mt-0.5">
                    {style?.icon ?? "⚙️"}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${style?.badge ?? "bg-zinc-100 text-zinc-600"}`}>
                        {entry.action}
                      </span>
                      {entry.target_type && (
                        <span className="text-xs text-zinc-400 font-mono">
                          {entry.target_type}
                          {entry.target_id ? ` #${entry.target_id}` : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {entry.actor_email ?? "System"}
                      {entry.ip_address && (
                        <span className="text-zinc-300 font-mono ml-2">{entry.ip_address}</span>
                      )}
                    </p>
                    {Object.keys(entry.metadata).length > 0 && (
                      <p className="text-xs text-zinc-400 font-mono truncate">
                        {JSON.stringify(entry.metadata)}
                      </p>
                    )}
                  </div>

                  {/* Time */}
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-zinc-400 whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-zinc-300">
                      {new Date(entry.created_at).toLocaleTimeString("en-US", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <button
              disabled={!data.previous}
              onClick={() => setPage((p) => p - 1)}
              className="h-9 px-4 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <p className="text-sm font-medium text-zinc-400">Page {page}</p>
            <button
              disabled={!data.next}
              onClick={() => setPage((p) => p + 1)}
              className="h-9 px-4 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
