"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KPIs {
  pending_intakes: number;
  appointments_today: number;
  new_surgery_bookings_7d: number;
  unverified_doctors: number;
  active_doctors: number;
  confirmed_surgery_revenue_usd: number;
  consultation_revenue_usd: number;
}

function KPICard({
  label, value, sub, href, accent,
}: { label: string; value: string | number; sub?: string; href: string; accent?: string }) {
  return (
    <Link href={href}>
      <Card className={`border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${accent ?? "border-zinc-200"}`}>
        <CardContent className="pt-5 pb-5">
          <p className="text-xs text-zinc-400 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">{value}</p>
          {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

const NAV_LINKS = [
  { href: "/admin/intakes", label: "Intakes" },
  { href: "/admin/doctors", label: "Doctors" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/hospitals", label: "Hospitals" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/bookings", label: "All Bookings" },
  { href: "/admin/audit-log", label: "Audit Log" },
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

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-0.5">MediBridge operations overview</p>
          </div>
        </div>

        {/* Nav pills */}
        <div className="flex flex-wrap gap-2">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              className="px-4 py-1.5 rounded-full text-sm font-medium border border-zinc-200 bg-white text-zinc-600 hover:border-teal-300 hover:text-teal-700 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        {/* KPI cards */}
        {loading ? (
          <p className="text-sm text-zinc-400">Loading dashboard…</p>
        ) : kpis ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard
              label="Pending Intakes"
              value={kpis.pending_intakes}
              sub="Awaiting doctor match"
              href="/admin/intakes"
              accent={kpis.pending_intakes > 0 ? "border-amber-300" : "border-zinc-200"}
            />
            <KPICard
              label="Appointments Today"
              value={kpis.appointments_today}
              sub="Scheduled or in progress"
              href="/admin/bookings?type=consultation"
            />
            <KPICard
              label="New Surgery Bookings"
              value={kpis.new_surgery_bookings_7d}
              sub="Last 7 days"
              href="/admin/bookings?type=surgery"
            />
            <KPICard
              label="Unverified Doctors"
              value={kpis.unverified_doctors}
              sub="Awaiting verification"
              href="/admin/doctors"
              accent={kpis.unverified_doctors > 0 ? "border-amber-300" : "border-zinc-200"}
            />
            <KPICard
              label="Active Doctors"
              value={kpis.active_doctors}
              sub="Verified and available"
              href="/admin/doctors"
              accent="border-emerald-200"
            />
            <KPICard
              label="Surgery Revenue"
              value={`$${kpis.confirmed_surgery_revenue_usd.toLocaleString()}`}
              sub="USD — confirmed bookings"
              href="/admin/bookings?type=surgery&status=confirmed"
              accent="border-teal-200"
            />
            <KPICard
              label="Consultation Revenue"
              value={`$${kpis.consultation_revenue_usd.toLocaleString()}`}
              sub="USD — paid consultations"
              href="/admin/bookings?type=consultation"
              accent="border-teal-200"
            />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Could not load KPIs.</p>
        )}

        {/* Quick links section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              <Card className="border border-zinc-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all cursor-pointer">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-semibold text-zinc-700">{l.label}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-xs text-zinc-400">View and manage →</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
