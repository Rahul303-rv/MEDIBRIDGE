"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { SurgeryPackage } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";


function InclusionBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-medium border border-teal-100">
      {label}
    </span>
  );
}

function PackageCard({ pkg }: { pkg: SurgeryPackage }) {
  const inclusions: string[] = [];
  if (pkg.includes_flight) inclusions.push(pkg.flight_class === "business" ? "Business Flight" : "Economy Flight");
  if (pkg.includes_accommodation) inclusions.push(
    pkg.accommodation_type === "hotel_4star" ? "4★ Hotel" :
    pkg.accommodation_type === "serviced_apt" ? "Serviced Apt" : "3★ Hotel"
  );
  if (pkg.includes_transport) inclusions.push("Transport");
  if (pkg.includes_visa_assistance) inclusions.push("Visa Assist");
  if (pkg.includes_meals) inclusions.push("Meals");

  return (
    <Card className="border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-5 space-y-4">
        <div>
          <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">
            {pkg.surgery_type.replace(/_/g, " ")}
          </p>
          <h3 className="font-semibold text-zinc-900 text-lg leading-snug">{pkg.name}</h3>
          <p className="text-sm text-zinc-500">{pkg.hospital_name} · {pkg.hospital_city}</p>
        </div>

        <p className="text-sm text-zinc-600 line-clamp-2">{pkg.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {inclusions.map((inc) => <InclusionBadge key={inc} label={inc} />)}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-zinc-50 rounded-lg py-2">
            <p className="font-semibold text-zinc-900">{pkg.total_duration_days}</p>
            <p className="text-xs text-zinc-400">Total days</p>
          </div>
          <div className="bg-zinc-50 rounded-lg py-2">
            <p className="font-semibold text-zinc-900">{pkg.hospital_stay_days}</p>
            <p className="text-xs text-zinc-400">Hospital stay</p>
          </div>
          <div className="bg-zinc-50 rounded-lg py-2">
            <p className="font-semibold text-zinc-900">{pkg.recovery_stay_days}</p>
            <p className="text-xs text-zinc-400">Recovery</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs text-zinc-400">Starting from</p>
            <p className="text-2xl font-bold text-zinc-900">${Number(pkg.price_usd).toLocaleString()}</p>
          </div>
          <Link href={`/packages/${pkg.slug}`}
            className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors">
            View Package
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PackagesPage() {
  const [allPackages, setAllPackages] = useState<SurgeryPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    api.get("/api/v1/public/packages")
      .then((res) => setAllPackages(res.data))
      .finally(() => setLoading(false));
  }, []);

  const surgeryTypes = Array.from(new Set(allPackages.map((p) => p.surgery_type))).sort();
  const filtered = filter ? allPackages.filter((p) => p.surgery_type === filter) : allPackages;

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="bg-white border-b border-zinc-200 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-zinc-900">Surgery Packages</h1>
          <p className="text-zinc-500 mt-2 max-w-xl">
            World-class surgical care at Indian hospitals — bundled with flights, accommodation, and transfer support.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-wrap gap-2">
          {["", ...surgeryTypes].map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                filter === t
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-teal-300 hover:text-teal-700"
              }`}>
              {t === "" ? "All Procedures" : t}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading packages…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500">No packages available for this procedure.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)}
          </div>
        )}
      </div>
    </main>
  );
}
