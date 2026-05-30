"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { usePolling } from "@/hooks/use-polling";

interface AdminUser {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  is_email_verified: boolean;
  date_joined: string;
  last_login: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  country?: string;
  is_verified?: boolean;
}

const ROLE_TABS = ["all", "patient", "doctor", "admin"] as const;
type RoleTab = (typeof ROLE_TABS)[number];

const ROLE_STYLE: Record<string, string> = {
  admin:   "bg-purple-100 text-purple-700",
  doctor:  "bg-teal-100 text-teal-700",
  patient: "bg-blue-100 text-blue-700",
};

const AVATAR_STYLE: Record<string, string> = {
  admin:   "bg-purple-100 text-purple-700",
  doctor:  "bg-teal-100 text-teal-700",
  patient: "bg-blue-100 text-blue-700",
};

function UserAvatar({ name, role }: { name: string; role: string }) {
  const initials = name && name !== "—"
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : name.slice(0, 2).toUpperCase() || "?";
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${AVATAR_STYLE[role] ?? "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"}`}>
      {initials}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-4 px-6 py-4 animate-pulse ${i !== 0 ? "border-t border-zinc-100 dark:border-zinc-800" : ""}`}
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-zinc-100 dark:bg-zinc-700 rounded w-32" />
            <div className="h-2.5 bg-zinc-100 dark:bg-zinc-700 rounded w-48" />
          </div>
          <div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-700 rounded-full" />
          <div className="h-2.5 w-24 bg-zinc-100 dark:bg-zinc-700 rounded" />
          <div className="h-2.5 w-20 bg-zinc-100 dark:bg-zinc-700 rounded" />
          <div className="h-2.5 w-10 bg-zinc-100 dark:bg-zinc-700 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RoleTab>("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  function load(role: RoleTab, q: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (role !== "all") params.set("role", role);
    if (q) params.set("search", q);
    api.get(`/api/v1/admin/users?${params}`)
      .then((res) => setUsers(res.data))
      .catch(() => toast.error("Failed to load users."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(activeTab, query); }, [activeTab, query]);

  // Auto-refresh so new signups appear without a manual page reload.
  // Silent — does not toggle the loading skeleton.
  usePolling(() => {
    const params = new URLSearchParams();
    if (activeTab !== "all") params.set("role", activeTab);
    if (query) params.set("search", query);
    api.get(`/api/v1/admin/users?${params}`)
      .then((res) => setUsers(res.data))
      .catch(() => {/* silent */});
  }, 10000);

  function handleSearch() { setQuery(search); }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Users</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">All patients, doctors, and admins</p>
        </div>
        {!loading && (
          <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
            {users.length} user{users.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search by email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 text-sm outline-none focus:border-teal-400 transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          className="h-10 px-5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Role tabs */}
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-700 rounded-xl w-fit">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-12 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">No users found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900">
                <th className="text-left px-6 py-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">User</th>
                <th className="text-left px-4 py-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Role</th>
                <th className="text-left px-4 py-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="text-left px-4 py-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Joined</th>
                <th className="px-4 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {users.map((u) => {
                const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";
                return (
                  <tr key={u.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={name} role={u.role} />
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-white text-sm">{name}</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${ROLE_STYLE[u.role] ?? "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"}`}>
                        {u.role || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-0.5">
                        <div className={`flex items-center gap-1 text-xs font-medium ${u.is_email_verified ? "text-emerald-600" : "text-amber-600"}`}>
                          {u.is_email_verified ? "✓ Verified" : "! Unverified"}
                        </div>
                        {u.role === "doctor" && (
                          <div className={`text-xs ${u.is_verified ? "text-emerald-600" : "text-amber-600"}`}>
                            {u.is_verified ? "✓ Approved" : "⏳ Pending"}
                          </div>
                        )}
                        {!u.is_active && (
                          <p className="text-xs text-rose-500 font-medium">Inactive</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                      {new Date(u.date_joined).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
