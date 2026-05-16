"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";

interface KPIs {
  pending_intakes: number;
  appointments_today: number;
  new_surgery_bookings_7d: number;
  unverified_doctors: number;
  active_doctors: number;
  confirmed_surgery_revenue_usd: number;
  consultation_revenue_usd: number;
}

function StatCard({
  label, value, sub, href, icon, accent, alert,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href: string;
  icon: React.ReactNode;
  accent: string;
  alert?: boolean;
}) {
  return (
    <Link href={href}>
      <div className={`bg-white rounded-2xl border p-6 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${
        alert ? "border-amber-200 hover:border-amber-300" : "border-zinc-200 hover:border-zinc-300"
      }`}>
        {alert && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400" />
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-extrabold text-zinc-900 mt-2 group-hover:text-zinc-800">{value}</p>
            {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
            {icon}
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-2.5 bg-zinc-100 rounded w-24" />
          <div className="h-8 bg-zinc-100 rounded w-16" />
          <div className="h-2 bg-zinc-100 rounded w-32" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-zinc-100 shrink-0" />
      </div>
    </div>
  );
}

const QUICK_ACTIONS = [
  { href: "/admin/intakes", label: "Review Intakes", desc: "Match patients to doctors", icon: "📋", color: "border-amber-200 hover:border-amber-400 hover:bg-amber-50" },
  { href: "/admin/doctors", label: "Verify Doctors", desc: "Approve pending accounts", icon: "✅", color: "border-teal-200 hover:border-teal-400 hover:bg-teal-50" },
  { href: "/admin/doctors/invite", label: "Invite Doctor", desc: "Add a new specialist", icon: "➕", color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50" },
  { href: "/admin/hospitals", label: "Manage Hospitals", desc: "Hospitals & packages", icon: "🏥", color: "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50" },
];

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/admin/dashboard")
      .then((res) => setKpis(res.data))
      .catch(() => toast.error("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="p-8 space-y-8 max-w-6xl">

      {/* Page header */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{today}</p>
        <h1 className="text-2xl font-extrabold text-zinc-900 mt-1">Operations Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Live overview of MediBridge activity</p>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(7)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard
            label="Pending Intakes"
            value={kpis.pending_intakes}
            sub="Awaiting doctor match"
            href="/admin/intakes"
            alert={kpis.pending_intakes > 0}
            accent={kpis.pending_intakes > 0 ? "bg-amber-100 text-amber-600" : "bg-zinc-100 text-zinc-400"}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8h6m-6 4h3" />
              </svg>
            }
          />
          <StatCard
            label="Appointments Today"
            value={kpis.appointments_today}
            sub="Scheduled or in progress"
            href="/admin/bookings?type=consultation"
            accent="bg-blue-100 text-blue-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            label="Surgery Bookings"
            value={kpis.new_surgery_bookings_7d}
            sub="Last 7 days"
            href="/admin/bookings?type=surgery"
            accent="bg-purple-100 text-purple-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <StatCard
            label="Unverified Doctors"
            value={kpis.unverified_doctors}
            sub="Awaiting verification"
            href="/admin/doctors"
            alert={kpis.unverified_doctors > 0}
            accent={kpis.unverified_doctors > 0 ? "bg-amber-100 text-amber-600" : "bg-zinc-100 text-zinc-400"}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <StatCard
            label="Active Doctors"
            value={kpis.active_doctors}
            sub="Verified and available"
            href="/admin/doctors"
            accent="bg-emerald-100 text-emerald-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Surgery Revenue"
            value={`$${kpis.confirmed_surgery_revenue_usd.toLocaleString()}`}
            sub="USD — confirmed bookings"
            href="/admin/bookings?type=surgery&status=confirmed"
            accent="bg-teal-100 text-teal-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Consultation Revenue"
            value={`$${kpis.consultation_revenue_usd.toLocaleString()}`}
            sub="USD — paid consultations"
            href="/admin/bookings?type=consultation"
            accent="bg-teal-100 text-teal-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82V15a1 1 0 01-.553.894L16 18M15 10L12 9m3 1v8m-3-8L8.447 7.931A1 1 0 007 8.82V15a1 1 0 00.553.894L12 17m0 0v1m0-9V9" />
              </svg>
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center">
          <p className="text-zinc-500 text-sm">Could not load KPIs. Please refresh.</p>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`bg-white border rounded-2xl p-5 transition-all group ${a.color}`}
            >
              <p className="text-2xl mb-3">{a.icon}</p>
              <p className="font-semibold text-zinc-900 text-sm group-hover:text-zinc-800">{a.label}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
