"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { SurgeryPackageDetail, SurgeryPackage } from "@/types/api";

const SURGERY_ICONS: Record<string, string> = {
  bariatric_surgery:       "⚖️",
  cardiac_surgery:         "❤️",
  dental_surgery:          "🦷",
  ent_surgery:             "👂",
  eye_surgery:             "👁️",
  gastroenterology_surgery:"🫁",
  gynecology_surgery:      "🌸",
  neurosurgery:            "🧠",
  oncology_surgery:        "🎗️",
  orthopedic_surgery:      "🦴",
  pulmonology_surgery:     "🫀",
  spine_surgery:           "🦴",
  transplant_surgery:      "💚",
  urology_surgery:         "💧",
};

function InclusionRow({ included, label, detail }: { included: boolean; label: string; detail?: string }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${
      included ? "bg-teal-50 border-teal-100" : "bg-zinc-50 border-zinc-100 opacity-50"
    }`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
        included ? "bg-teal-500" : "bg-zinc-300"
      }`}>
        {included ? (
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <div>
        <p className={`text-sm font-semibold ${included ? "text-zinc-800" : "text-zinc-400"}`}>{label}</p>
        {detail && <p className="text-xs text-zinc-400 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

function RelatedCard({ pkg }: { pkg: SurgeryPackage }) {
  const icon = SURGERY_ICONS[pkg.surgery_type] ?? "🏥";
  return (
    <Link href={`/packages/${pkg.slug}`}>
      <div className="group bg-white rounded-xl border border-zinc-200 hover:border-teal-300 hover:shadow-md transition-all p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-lg shrink-0">{icon}</div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
              {pkg.surgery_type.replace(/_/g, " ")}
            </p>
            <p className="font-bold text-zinc-900 text-sm leading-snug mt-0.5 group-hover:text-teal-700 transition-colors">
              {pkg.name}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">{pkg.hospital_name} · {pkg.hospital_city}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-lg font-extrabold text-zinc-900">
            ${Number(pkg.price_usd).toLocaleString()}
            <span className="text-xs font-normal text-zinc-400 ml-1">USD</span>
          </p>
          <span className="text-xs font-semibold text-teal-600 group-hover:text-teal-700">View →</span>
        </div>
      </div>
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <main className="min-h-screen bg-zinc-50 animate-pulse">
      <div className="h-56 bg-zinc-200" />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-zinc-200 h-48" />
            <div className="bg-white rounded-2xl border border-zinc-200 h-64" />
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200 h-64" />
        </div>
      </div>
    </main>
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

  if (loading) return <DetailSkeleton />;

  if (notFound || !pkg) return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-5xl mb-4">🔍</p>
        <p className="font-bold text-zinc-700 text-lg">Package not found</p>
        <Link href="/packages" className="mt-4 inline-flex h-10 px-5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors items-center">
          ← All Packages
        </Link>
      </div>
    </main>
  );

  const inclusions = pkg.inclusions_text ? pkg.inclusions_text.split("\n").filter(Boolean) : [];
  const exclusions = pkg.exclusions_text ? pkg.exclusions_text.split("\n").filter(Boolean) : [];
  const surgeryIcon = SURGERY_ICONS[pkg.surgery_type] ?? "🏥";
  const surgeryLabel = pkg.surgery_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <main className="min-h-screen bg-zinc-50">

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-500 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-20 translate-x-20" />
        <div className="absolute bottom-0 left-24 w-56 h-56 bg-white/5 rounded-full translate-y-16" />
        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <Link
            href="/packages"
            className="inline-flex items-center gap-1.5 text-sm text-teal-100 hover:text-white transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Packages
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-4xl shrink-0">
              {surgeryIcon}
            </div>
            <div>
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/15 border border-white/20 mb-3">
                <span className="text-xs font-bold text-white/90 uppercase tracking-widest">{surgeryLabel}</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white leading-tight">{pkg.name}</h1>
              <p className="text-teal-100 mt-1.5 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {pkg.hospital_name} · {pkg.hospital_city}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-8 flex flex-wrap gap-4">
            {[
              { value: pkg.total_duration_days, label: "Total Days" },
              { value: pkg.hospital_stay_days, label: "Hospital Stay" },
              { value: pkg.recovery_stay_days, label: "Recovery Days" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 border border-white/15 rounded-xl px-5 py-3 text-center">
                <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                <p className="text-xs text-teal-100 mt-0.5 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* About */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
              <h2 className="font-extrabold text-zinc-900 text-lg">About This Package</h2>
              <p className="text-sm text-zinc-600 leading-relaxed">{pkg.description}</p>
            </div>

            {/* Inclusions */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
              <h2 className="font-extrabold text-zinc-900 text-lg">Package Inclusions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InclusionRow
                  included={pkg.includes_flight}
                  label="Flight"
                  detail={pkg.includes_flight ? (pkg.flight_class === "business" ? "Business class" : "Economy class") : "Not included"}
                />
                <InclusionRow
                  included={pkg.includes_accommodation}
                  label="Accommodation"
                  detail={pkg.includes_accommodation
                    ? (pkg.accommodation_type === "hotel_4star" ? "4-Star Hotel"
                      : pkg.accommodation_type === "serviced_apt" ? "Serviced Apartment" : "3-Star Hotel")
                    : "Not included"}
                />
                <InclusionRow included={pkg.includes_transport} label="Airport Transfer" />
                <InclusionRow included={pkg.includes_visa_assistance} label="Visa Assistance" />
                <InclusionRow included={pkg.includes_meals} label="Meals" />
              </div>

              {inclusions.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">Also Included</p>
                  <ul className="space-y-2">
                    {inclusions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-600">
                        <svg className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {exclusions.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">Not Included</p>
                  <ul className="space-y-2">
                    {exclusions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-400">
                        <svg className="w-4 h-4 text-zinc-300 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Related packages */}
            {pkg.related_packages.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-extrabold text-zinc-900 text-lg">Similar Packages</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pkg.related_packages.map((r) => <RelatedCard key={r.id} pkg={r} />)}
                </div>
              </div>
            )}
          </div>

          {/* Sticky booking sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-teal-200 overflow-hidden sticky top-6">
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 px-5 py-4 border-b border-teal-100">
                <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">Package Price</p>
                <p className="text-4xl font-extrabold text-zinc-900 mt-1">
                  ${Number(pkg.price_usd).toLocaleString()}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">USD · all-inclusive · per person</p>
              </div>

              <div className="p-5 space-y-4">
                {/* Key highlights */}
                <div className="space-y-2">
                  {pkg.includes_accommodation && (
                    <div className="flex items-center gap-2.5 text-sm text-zinc-600">
                      <span className="text-lg">🏨</span>
                      {pkg.accommodation_type === "hotel_4star" ? "4-Star Hotel"
                        : pkg.accommodation_type === "serviced_apt" ? "Serviced Apartment" : "3-Star Hotel"}
                    </div>
                  )}
                  {pkg.includes_flight && (
                    <div className="flex items-center gap-2.5 text-sm text-zinc-600">
                      <span className="text-lg">✈️</span>
                      {pkg.flight_class === "business" ? "Business Class Flight" : "Economy Flight"}
                    </div>
                  )}
                  {pkg.includes_transport && (
                    <div className="flex items-center gap-2.5 text-sm text-zinc-600">
                      <span className="text-lg">🚗</span>
                      Airport Transfer Included
                    </div>
                  )}
                  {pkg.includes_visa_assistance && (
                    <div className="flex items-center gap-2.5 text-sm text-zinc-600">
                      <span className="text-lg">📋</span>
                      Visa Assistance
                    </div>
                  )}
                </div>

                <Link
                  href={`/patient/surgery-bookings/new/${pkg.id}`}
                  className="flex items-center justify-center w-full h-12 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-colors gap-2"
                >
                  Book This Package
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <p className="text-xs text-center text-zinc-400">
                  No upfront payment required · Free cancellation
                </p>

                {/* Consultation nudge */}
                <div className="pt-3 border-t border-zinc-100 space-y-2">
                  <p className="text-xs font-semibold text-zinc-700">Not sure if this is right for you?</p>
                  <Link
                    href="/patient/symptoms"
                    className="flex items-center justify-center w-full h-9 rounded-xl border border-teal-200 text-teal-700 text-xs font-semibold hover:bg-teal-50 transition-colors"
                  >
                    Get a Free Consultation
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
