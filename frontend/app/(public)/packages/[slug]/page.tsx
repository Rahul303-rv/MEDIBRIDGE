"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { SurgeryPackageDetail, SurgeryPackage } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Tick({ yes }: { yes: boolean }) {
  return yes
    ? <span className="text-teal-600 font-semibold">✓</span>
    : <span className="text-zinc-300">—</span>;
}

function RelatedCard({ pkg }: { pkg: SurgeryPackage }) {
  return (
    <Card className="border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-4 space-y-2">
        <p className="text-xs text-zinc-400 uppercase tracking-wide">{pkg.surgery_type.replace(/_/g, " ")}</p>
        <p className="font-medium text-zinc-900 leading-snug">{pkg.name}</p>
        <p className="text-sm text-zinc-500">{pkg.hospital_name} · {pkg.hospital_city}</p>
        <p className="text-xl font-bold text-zinc-900">${Number(pkg.price_usd).toLocaleString()}</p>
        <Link href={`/packages/${pkg.slug}`}
          className="inline-flex items-center justify-center w-full h-8 rounded-lg border border-teal-600 text-teal-600 text-xs font-medium hover:bg-teal-50 transition-colors">
          View Package
        </Link>
      </CardContent>
    </Card>
  );
}

export default function PackageDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [pkg, setPkg] = useState<SurgeryPackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/api/v1/public/packages/${slug}`)
      .then((res) => setPkg(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <main className="min-h-screen bg-zinc-50 p-8"><p className="text-sm text-zinc-400">Loading…</p></main>;
  if (notFound || !pkg) return (
    <main className="min-h-screen bg-zinc-50 p-8 text-center">
      <p className="text-zinc-500">Package not found.</p>
      <Link href="/packages" className="text-teal-600 hover:underline mt-2 block">← All Packages</Link>
    </main>
  );

  const inclusions = pkg.inclusions_text ? pkg.inclusions_text.split("\n").filter(Boolean) : [];
  const exclusions = pkg.exclusions_text ? pkg.exclusions_text.split("\n").filter(Boolean) : [];
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="bg-white border-b border-zinc-200 py-10">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sm text-zinc-400 mb-1">{pkg.surgery_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
          <h1 className="text-3xl font-bold text-zinc-900">{pkg.name}</h1>
          <p className="text-zinc-500 mt-1">{pkg.hospital_name} · {pkg.hospital_city}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-zinc-200 shadow-sm">
              <CardContent className="pt-5 space-y-4">
                <div>
                  <h2 className="font-semibold text-zinc-900 mb-2">About this Package</h2>
                  <p className="text-sm text-zinc-600 leading-relaxed">{pkg.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-zinc-50 rounded-xl py-4">
                    <p className="text-2xl font-bold text-zinc-900">{pkg.total_duration_days}</p>
                    <p className="text-xs text-zinc-400 mt-1">Total days</p>
                  </div>
                  <div className="bg-zinc-50 rounded-xl py-4">
                    <p className="text-2xl font-bold text-zinc-900">{pkg.hospital_stay_days}</p>
                    <p className="text-xs text-zinc-400 mt-1">Hospital stay</p>
                  </div>
                  <div className="bg-zinc-50 rounded-xl py-4">
                    <p className="text-2xl font-bold text-zinc-900">{pkg.recovery_stay_days}</p>
                    <p className="text-xs text-zinc-400 mt-1">Recovery days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">What&apos;s Included</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2"><Tick yes={pkg.includes_flight} /> <span className="text-zinc-700">Flight ({pkg.flight_class})</span></div>
                  <div className="flex items-center gap-2"><Tick yes={pkg.includes_accommodation} /> <span className="text-zinc-700">Accommodation</span></div>
                  <div className="flex items-center gap-2"><Tick yes={pkg.includes_transport} /> <span className="text-zinc-700">Airport Transfer</span></div>
                  <div className="flex items-center gap-2"><Tick yes={pkg.includes_visa_assistance} /> <span className="text-zinc-700">Visa Assistance</span></div>
                  <div className="flex items-center gap-2"><Tick yes={pkg.includes_meals} /> <span className="text-zinc-700">Meals</span></div>
                </div>

                {inclusions.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">Also included</p>
                    <ul className="space-y-1">
                      {inclusions.map((item, i) => (
                        <li key={i} className="text-sm text-zinc-600 flex items-start gap-2">
                          <span className="text-teal-600 mt-0.5">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {exclusions.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">Not included</p>
                    <ul className="space-y-1">
                      {exclusions.map((item, i) => (
                        <li key={i} className="text-sm text-zinc-500 flex items-start gap-2">
                          <span className="text-zinc-400 mt-0.5">✕</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {pkg.related_packages.length > 0 && (
              <div>
                <h2 className="font-semibold text-zinc-900 mb-3">Similar Packages</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pkg.related_packages.map((r) => <RelatedCard key={r.id} pkg={r} />)}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border border-teal-200 shadow-sm bg-teal-50 sticky top-6">
              <CardContent className="pt-5 space-y-4">
                <div>
                  <p className="text-xs text-teal-600 uppercase tracking-wide">Package Price</p>
                  <p className="text-3xl font-bold text-zinc-900 mt-1">
                    ${Number(pkg.price_usd).toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">USD · per person</p>
                </div>

                <div className="space-y-1.5 text-sm">
                  {pkg.includes_accommodation && (
                    <p className="text-zinc-600">
                      🏨 {pkg.accommodation_type === "hotel_4star" ? "4-Star Hotel" : pkg.accommodation_type === "serviced_apt" ? "Serviced Apartment" : "3-Star Hotel"}
                    </p>
                  )}
                  {pkg.includes_flight && (
                    <p className="text-zinc-600">✈️ {pkg.flight_class === "business" ? "Business Class" : "Economy"} flight</p>
                  )}
                </div>

                <Link
                  href={`/patient/surgery-bookings/new/${pkg.id}`}
                  className="inline-flex items-center justify-center w-full h-11 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors">
                  Book This Package
                </Link>
                <p className="text-xs text-center text-zinc-400">No upfront payment required</p>

                <div className="pt-2 border-t border-teal-200">
                  <Link href="/packages" className="text-xs text-teal-600 hover:underline">← All packages</Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
