"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";

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

const ROLE_BADGE: Record<string, string> = {
  admin:   "bg-purple-100 text-purple-700",
  doctor:  "bg-teal-100 text-teal-700",
  patient: "bg-zinc-100 text-zinc-600",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RoleTab>("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  function load(role: RoleTab, q: string) {
    const params = new URLSearchParams();
    if (role !== "all") params.set("role", role);
    if (q) params.set("search", q);
    api.get(`/api/v1/admin/users?${params}`)
      .then((res) => setUsers(res.data))
      .catch(() => toast.error("Failed to load users."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(activeTab, query); }, [activeTab, query]);

  function handleSearch() {
    setLoading(true);
    setQuery(search);
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Users</h1>
            <p className="text-sm text-zinc-500 mt-0.5">All patients, doctors, and admins.</p>
          </div>
          <Link href="/admin" className="text-sm text-zinc-500 hover:underline">← Admin</Link>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Search by email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            className="flex-1 h-9 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring"
          />
          <button
            onClick={handleSearch}
            className="px-4 h-9 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            Search
          </button>
        </div>

        {/* Role tabs */}
        <div className="flex gap-1 border-b border-zinc-200">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setLoading(true); setActiveTab(tab); }}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-teal-600 text-teal-700"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-zinc-500">No users found.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {users.map((u) => {
                  const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";
                  return (
                    <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900">{name}</p>
                        <p className="text-xs text-zinc-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role] ?? "bg-zinc-100 text-zinc-500"}`}>
                          {u.role || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 space-y-0.5">
                        <p className={`text-xs font-medium ${u.is_email_verified ? "text-emerald-600" : "text-amber-600"}`}>
                          {u.is_email_verified ? "Email verified" : "Email unverified"}
                        </p>
                        {u.role === "doctor" && (
                          <p className={`text-xs ${u.is_verified ? "text-emerald-600" : "text-amber-600"}`}>
                            {u.is_verified ? "Doctor approved" : "Approval pending"}
                          </p>
                        )}
                        {!u.is_active && (
                          <p className="text-xs text-rose-600">Inactive</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {new Date(u.date_joined).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="text-xs font-medium text-teal-700 hover:underline whitespace-nowrap"
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
    </main>
  );
}
