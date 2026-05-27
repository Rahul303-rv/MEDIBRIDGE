"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { SurgeryPackage } from "@/types/api";

/* Keys match EXACTLY what the API returns (see seed_data.py) */
const SURGERY_CONFIG: Record<string, { cardBg: string; textColor: string }> = {
  "Bariatric Surgery":        { cardBg: "bg-orange-100 dark:bg-orange-900/30", textColor: "text-orange-700 dark:text-orange-400" },
  "Cardiac Surgery":          { cardBg: "bg-red-100 dark:bg-red-900/30",       textColor: "text-red-700 dark:text-red-400"       },
  "Dental Surgery":           { cardBg: "bg-blue-100 dark:bg-blue-900/30",     textColor: "text-blue-700 dark:text-blue-400"     },
  "ENT Surgery":              { cardBg: "bg-purple-100 dark:bg-purple-900/30", textColor: "text-purple-700 dark:text-purple-400" },
  "Eye Surgery":              { cardBg: "bg-cyan-100 dark:bg-cyan-900/30",     textColor: "text-cyan-700 dark:text-cyan-400"     },
  "Gastroenterology Surgery": { cardBg: "bg-amber-100 dark:bg-amber-900/30",   textColor: "text-amber-700 dark:text-amber-400"   },
  "Gynecology Surgery":       { cardBg: "bg-pink-100 dark:bg-pink-900/30",     textColor: "text-pink-700 dark:text-pink-400"     },
  "Neurosurgery":             { cardBg: "bg-violet-100 dark:bg-violet-900/30", textColor: "text-violet-700 dark:text-violet-400" },
  "Oncology Surgery":         { cardBg: "bg-rose-100 dark:bg-rose-900/30",     textColor: "text-rose-700 dark:text-rose-400"     },
  "Orthopedic Surgery":       { cardBg: "bg-yellow-100 dark:bg-yellow-900/30", textColor: "text-yellow-700 dark:text-yellow-400" },
  "Pulmonology Surgery":      { cardBg: "bg-sky-100 dark:bg-sky-900/30",       textColor: "text-sky-700 dark:text-sky-400"       },
  "Spine Surgery":            { cardBg: "bg-lime-100 dark:bg-lime-900/30",     textColor: "text-lime-700 dark:text-lime-400"     },
  "Transplant Surgery":       { cardBg: "bg-green-100 dark:bg-green-900/30",   textColor: "text-green-700 dark:text-green-400"   },
  "Urology Surgery":          { cardBg: "bg-teal-100 dark:bg-teal-900/30",     textColor: "text-teal-700 dark:text-teal-400"     },
};

/* Unique SVG icon per surgery type — keys match API values exactly */
function SurgeryIcon({ type, className }: { type: string; className: string }) {
  switch (type) {

    case "Cardiac Surgery":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35z"/>
        </svg>
      );

    case "Neurosurgery":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.5 2C7.5 2 6 3.5 6 5.5c0 1 .4 2 1 2.7C6.4 9 6 10 6 11c0 2.2 1.8 4 4 4h4c2.2 0 4-1.8 4-4 0-1-.4-2-1-2.8.6-.7 1-1.7 1-2.7C18 3.5 16.5 2 14.5 2c-.9 0-1.7.3-2.3.8C11.6 2.3 10.6 2 9.5 2z" fill="currentColor" stroke="none" opacity="0.4"/>
          <path d="M9.5 2C7.5 2 6 3.5 6 5.5c0 1 .4 2 1 2.7C6.4 9 6 10 6 11c0 2.2 1.8 4 4 4h4c2.2 0 4-1.8 4-4 0-1-.4-2-1-2.8.6-.7 1-1.7 1-2.7C18 3.5 16.5 2 14.5 2c-.9 0-1.7.3-2.3.8C11.6 2.3 10.6 2 9.5 2z"/>
          <path d="M9 7h6M9 10h6M10 13h4M12 15v2"/>
        </svg>
      );

    case "Dental Surgery":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C9.24 2 7 4.24 7 7c0 1.7.78 3.22 2 4.22V18c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-6.78A5.98 5.98 0 0017 7c0-2.76-2.24-5-5-5zm-1 9.72V18h2v-6.28A3.99 3.99 0 0112 12a3.99 3.99 0 01-1-.28z" opacity="0.9"/>
        </svg>
      );

    case "ENT Surgery":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 3C3.8 3 2 5 2 7.5c0 1.5.7 2.8 1.8 3.7C2.7 12.3 2 13.6 2 15c0 2.8 2.2 5 5 5 .6 0 1.2-.1 1.7-.3.3 1.3.9 2.3 1.8 3 .5.4 1 .3 1.4-.1.4-.4.3-1-.1-1.3-.8-.7-1.3-1.7-1.3-2.8 0-1.3.7-2.4 1.8-3.1.7-.5.7-1.6 0-2C11 13 10.5 12 10.5 11c0-1 .5-2 1.1-2.5.7-.7.7-1.8.1-2.5C10.9 5 9.5 4.5 8 4.5c-.5 0-1 .1-1.4.3C6.3 3.7 6.2 3 6 3z" opacity="0.9"/>
        </svg>
      );

    case "Eye Surgery":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        </svg>
      );

    case "Gastroenterology Surgery":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C9 2 7 4.5 7 7c0 1.5.5 2.8 1.3 3.8C7 12.5 6.5 14 6.5 15.5 6.5 18.5 9 21 12 21s5.5-2.5 5.5-5.5c0-1.5-.5-3-1.8-4.7C16.5 9.8 17 8.5 17 7c0-2.5-2-5-5-5zm0 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 13c-1.4 0-2.5-1.1-2.5-2.5S10.6 13 12 13s2.5 1.1 2.5 2.5S13.4 18 12 18z"/>
        </svg>
      );

    case "Gynecology Surgery":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a5 5 0 100 10A5 5 0 0012 2zm0 12c-1.1 0-2 .9-2 2v1H9v2h3v3h2v-3h3v-2h-1v-1c0-1.1-.9-2-2-2z"/>
        </svg>
      );

    case "Bariatric Surgery":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v2M5.6 5.6l1.4 1.4M3 12h2M18.4 5.6l-1.4 1.4M21 12h-2M6.3 17H3v-2l3.3-5h4.4L8 15h3l-1 4-3.7-2zm11.4 0H21v-2l-3.3-5h-4.4L16 15h-3l1 4 3.7-2z"/>
          <circle cx="12" cy="10" r="2"/>
        </svg>
      );

    case "Oncology Surgery":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C9.8 2 8 3.8 8 6s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm-4.5 9c-2 0-3.5 1.5-3.5 3.5S5.5 18 7.5 18s3.5-1.5 3.5-3.5S9.5 11 7.5 11zm9 0c-2 0-3.5 1.5-3.5 3.5S14.5 18 16.5 18s3.5-1.5 3.5-3.5S18.5 11 16.5 11z" opacity="0.9"/>
        </svg>
      );

    case "Orthopedic Surgery":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 4a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4zM6 16a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4zM7.5 6h9v2h-9zM6.5 8h1v8h-1zM16.5 8h1v8h-1zM7.5 16h9v2h-9z"/>
        </svg>
      );

    case "Pulmonology Surgery":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2v5.5C9 7.5 6 10 6 13.5 6 17 8.5 20 12 20s6-3 6-6.5C18 10 15 7.5 12 7.5V2zM9 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" opacity="0.9"/>
        </svg>
      );

    case "Spine Surgery":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <rect x="8" y="2" width="8" height="4" rx="1"/>
          <rect x="8" y="7.5" width="8" height="4" rx="1" opacity="0.7"/>
          <rect x="8" y="13" width="8" height="4" rx="1"/>
          <rect x="8" y="18.5" width="8" height="3.5" rx="1" opacity="0.7"/>
          <rect x="5" y="3.5" width="3" height="1.5" rx="0.5"/>
          <rect x="16" y="3.5" width="3" height="1.5" rx="0.5"/>
          <rect x="5" y="9" width="3" height="1.5" rx="0.5"/>
          <rect x="16" y="9" width="3" height="1.5" rx="0.5"/>
          <rect x="5" y="14.5" width="3" height="1.5" rx="0.5"/>
          <rect x="16" y="14.5" width="3" height="1.5" rx="0.5"/>
        </svg>
      );

    case "Transplant Surgery":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35z" opacity="0.35"/>
          <path d="M9 11l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <circle cx="19" cy="19" r="4" fill="currentColor"/>
          <path d="M17 19h4M19 17v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );

    case "Urology Surgery":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.5 2 6 5.5 6 9.5 6 15 9 20 12 22c3-2 6-7 6-12.5C18 5.5 15.5 2 12 2zm0 4a2 2 0 110 4 2 2 0 010-4z" opacity="0.9"/>
        </svg>
      );

    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      );
  }
}

function getInclusions(pkg: SurgeryPackage): { icon: string; label: string }[] {
  const list: { icon: string; label: string }[] = [];
  if (pkg.includes_flight)
    list.push({ icon: "✈️", label: pkg.flight_class === "business" ? "Business Flight" : "Economy Flight" });
  if (pkg.includes_accommodation)
    list.push({
      icon: "🏨",
      label: pkg.accommodation_type === "hotel_4star" ? "4★ Hotel"
           : pkg.accommodation_type === "serviced_apt" ? "Serviced Apt" : "3★ Hotel",
    });
  if (pkg.includes_transport)       list.push({ icon: "🚗", label: "Transport" });
  if (pkg.includes_visa_assistance)  list.push({ icon: "📋", label: "Visa Assist" });
  if (pkg.includes_meals)            list.push({ icon: "🍽️", label: "Meals" });
  return list;
}

function PackageCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden animate-pulse">
      <div className="h-1 bg-zinc-100 dark:bg-zinc-800" />
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-24" />
            <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4" />
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
          </div>
        </div>
        <div className="h-9 bg-zinc-100 dark:bg-zinc-800 rounded" />
        <div className="flex gap-1.5">
          <div className="h-5 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
          <div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          <div className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          <div className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-8 w-28 bg-zinc-100 dark:bg-zinc-800 rounded" />
          <div className="h-9 w-28 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function PackageCard({ pkg }: { pkg: SurgeryPackage }) {
  const inclusions = getInclusions(pkg);
  const cfg = SURGERY_CONFIG[pkg.surgery_type] ?? {
    cardBg: "bg-zinc-100 dark:bg-zinc-800",
    textColor: "text-zinc-600 dark:text-zinc-400",
  };

  return (
    <div className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-teal-400 to-cyan-400" />
      <div className="p-5 flex flex-col flex-1 space-y-4">

        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cfg.cardBg} ${cfg.textColor}`}>
            <SurgeryIcon type={pkg.surgery_type} className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${cfg.textColor}`}>
              {pkg.surgery_type}
            </p>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base leading-snug mt-0.5 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
              {pkg.name}
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {pkg.hospital_name} · {pkg.hospital_city}
            </p>
          </div>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">{pkg.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {inclusions.map((inc) => (
            <span key={inc.label}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-medium border border-teal-100 dark:border-teal-800">
              {inc.icon} {inc.label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { val: pkg.total_duration_days, lbl: "Days Total" },
            { val: pkg.hospital_stay_days,  lbl: "In Hospital" },
            { val: pkg.recovery_stay_days,  lbl: "Recovery" },
          ].map(({ val, lbl }) => (
            <div key={lbl} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl py-3 border border-zinc-100 dark:border-zinc-700">
              <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">{val}</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-semibold uppercase tracking-wide">{lbl}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1 mt-auto">
          <div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wide">Starting from</p>
            <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              ${Number(pkg.price_usd).toLocaleString()}
              <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500 ml-1">USD</span>
            </p>
          </div>
          <Link href={`/packages/${pkg.slug}`}
            className="h-10 px-5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors flex items-center gap-1.5">
            View Package
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </div>
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
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-500 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-white/5 rounded-full translate-y-24" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 mb-4 sm:mb-5">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
              </svg>
              <span className="text-xs font-semibold text-white/90 uppercase tracking-widest">Surgery Tourism</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">World-Class Surgery Packages</h1>
            <p className="text-teal-100 mt-2 sm:mt-3 text-sm sm:text-lg leading-relaxed">
              All-inclusive surgical care at India&apos;s top hospitals — bundled with flights, accommodation, visa support, and transfers.
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-5 sm:mt-8">
              {["JCI-Accredited Hospitals", "Flight + Hotel Included", "24/7 Coordinator Support"].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-300" />
                  <span className="text-xs sm:text-sm text-white/80 font-medium">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">

        {/* Filter */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
          <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Filter by procedure</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                filter === ""
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-600 hover:border-teal-300 dark:hover:border-teal-600 hover:text-teal-700 dark:hover:text-teal-400"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
              All Procedures
            </button>

            {surgeryTypes.map((t) => {
              const cfg = SURGERY_CONFIG[t];
              const active = filter === t;
              return (
                <button key={t} onClick={() => setFilter(t)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                    active
                      ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                      : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-600 hover:border-teal-300 dark:hover:border-teal-600 hover:text-teal-700 dark:hover:text-teal-400"
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
                    active ? "bg-white/20 text-white" : `${cfg?.cardBg ?? "bg-zinc-100 dark:bg-zinc-700"} ${cfg?.textColor ?? "text-zinc-500 dark:text-zinc-400"}`
                  }`}>
                    <SurgeryIcon type={t} className="w-3.5 h-3.5" />
                  </span>
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {!loading && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{filtered.length}</span> package{filtered.length !== 1 ? "s" : ""} available
            {filter && ` · ${filter}`}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <PackageCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-16 text-center">
            <p className="font-bold text-zinc-700 dark:text-zinc-200 text-lg">No packages found</p>
            <button onClick={() => setFilter("")} className="mt-4 h-10 px-6 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors">
              View All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)}
          </div>
        )}

        {!loading && (
          <div className="bg-gradient-to-r from-teal-600 to-cyan-500 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6 text-white">
            <div className="flex-1">
              <p className="font-extrabold text-xl">Need help choosing the right package?</p>
              <p className="text-teal-100 text-sm mt-1">Speak with a MediBridge coordinator — we&apos;ll match you to the right hospital and surgeon.</p>
            </div>
            <Link href="/patient/symptoms" className="shrink-0 h-11 px-6 rounded-xl bg-white text-teal-700 text-sm font-bold hover:bg-teal-50 transition-colors">
              Get a Consultation →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
