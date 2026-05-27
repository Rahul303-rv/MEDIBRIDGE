"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { DoctorProfile, Specialization } from "@/types/api";

function VerifiedBadge({ size = "md" }: { size?: "sm" | "md" }) {
  const px = size === "sm" ? 20 : 26;
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 22 22"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", flexShrink: 0 }}
    >
      <title>Verified Doctor</title>
      {/* Twitter/X-style starburst — viewBox must be 0 0 22 22 */}
      <path
        fill="#1D9BF0"
        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681.132-.636.075-1.297-.164-1.902.583-.256 1.077-.694 1.42-1.24.343-.545.533-1.176.523-1.82z"
      />
      {/* White checkmark */}
      <path
        fill="white"
        d="M9.662 17.001l-4.518-4.52 1.415-1.414 3.103 3.104 6.039-6.04 1.414 1.414-7.453 7.456z"
      />
    </svg>
  );
}

function AvatarCircle({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = [
    "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  ];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

const SPEC_COLORS: Record<string, string> = {
  Cardiology:         "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  Orthopedics:        "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
  Neurology:          "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
  Oncology:           "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
  "General Surgery":  "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600",
  Gastroenterology:   "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  Gynecology:         "bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800",
  Ophthalmology:      "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800",
  Pulmonology:        "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800",
  Urology:            "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800",
  "ENT Surgery":      "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
  Neurosurgery:       "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800",
  "Spine Surgery":    "bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800",
  "Transplant Surgery": "bg-lime-50 text-lime-700 border-lime-100 dark:bg-lime-900/20 dark:text-lime-400 dark:border-lime-800",
};

function specColor(name: string) {
  return SPEC_COLORS[name] ?? "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600";
}

export default function PublicDoctorsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedSpec = searchParams.get("specialization") || "";

  useEffect(() => {
    api.get("/api/v1/public/specializations").then((res) => setSpecializations(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = selectedSpec ? `?specialization=${selectedSpec}` : "";
    api.get(`/api/v1/public/doctors${params}`)
      .then((res) => setDoctors(res.data))
      .finally(() => setLoading(false));
  }, [selectedSpec]);

  function handleSpecChange(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("specialization", slug);
    } else {
      params.delete("specialization");
    }
    router.push(`/doctors?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">

      {/* Hero header */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-600 py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">Find a Doctor</h1>
          <p className="text-teal-100 mt-2 sm:mt-3 text-sm sm:text-base max-w-xl mx-auto">
            Browse our verified Indian specialists available for same-day online consultations
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">

        {/* Specialization filter pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSpecChange("")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedSpec === ""
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-teal-300 dark:hover:border-teal-600 hover:text-teal-700 dark:hover:text-teal-400"
            }`}
          >
            All Specialties
          </button>
          {specializations.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSpecChange(s.slug)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedSpec === s.slug
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-teal-300 dark:hover:border-teal-600 hover:text-teal-700 dark:hover:text-teal-400"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Doctor count */}
        {!loading && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Showing <span className="font-semibold text-zinc-700 dark:text-zinc-200">{doctors.length}</span> doctor{doctors.length !== 1 ? "s" : ""}
            {selectedSpec && specializations.find(s => s.slug === selectedSpec) && (
              <> in <span className="font-semibold text-teal-700 dark:text-teal-400">{specializations.find(s => s.slug === selectedSpec)?.name}</span></>
            )}
          </p>
        )}

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 animate-pulse space-y-3">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-zinc-600 dark:text-zinc-300 font-medium">No doctors found</p>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">Try removing the filter or selecting a different specialty</p>
            <button
              onClick={() => handleSpecChange("")}
              className="mt-5 px-5 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              Show all doctors
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.map((doctor) => (
              <Link key={doctor.id} href={`/doctors/${doctor.slug}`} className="group">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 group-hover:border-teal-400 dark:group-hover:border-teal-500 group-hover:shadow-lg transition-all h-full flex flex-col overflow-hidden">

                  {/* Card top accent */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 to-cyan-400" />

                  <div className="p-5 flex flex-col flex-1 space-y-4">

                    {/* Header: avatar + name + fee */}
                    <div className="flex items-start gap-3">
                      {/* Avatar with verified badge overlaid */}
                      <div className="relative shrink-0" style={{ overflow: "visible" }}>
                        <AvatarCircle name={`${doctor.first_name} ${doctor.last_name}`} />
                        {doctor.is_verified && (
                          <div className="absolute -bottom-2 -right-2 z-10 drop-shadow-md">
                            <VerifiedBadge size="md" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-zinc-100 text-base leading-tight group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                              Dr. {doctor.first_name} {doctor.last_name}
                            </p>
                            {doctor.is_verified && (
                              <p className="text-xs text-blue-500 dark:text-blue-400 font-medium mt-0.5">
                                Verified Medical Professional
                              </p>
                            )}
                          </div>
                          {doctor.consultation_fee_usd && (
                            <div className="text-right shrink-0">
                              <p className="text-lg font-extrabold text-teal-600 dark:text-teal-400">
                                ${Number(doctor.consultation_fee_usd).toLocaleString()}
                              </p>
                              <p className="text-xs text-zinc-400 dark:text-zinc-500">per consult</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Specializations */}
                    {doctor.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {doctor.specializations.map((s) => (
                          <span
                            key={s.id}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${specColor(s.name)}`}
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-sm">
                      {doctor.years_of_experience != null && (
                        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                          <span className="text-base">🏅</span>
                          <span className="font-semibold">{doctor.years_of_experience}</span>
                          <span className="text-zinc-400 dark:text-zinc-500 text-xs">yrs exp</span>
                        </div>
                      )}
                      {doctor.consultation_duration_min && (
                        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                          <span className="text-base">⏱</span>
                          <span className="font-semibold">{doctor.consultation_duration_min}</span>
                          <span className="text-zinc-400 dark:text-zinc-500 text-xs">min</span>
                        </div>
                      )}
                    </div>

                    {/* Hospital */}
                    {doctor.hospital_affiliation && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <span>🏥</span>
                        {doctor.hospital_affiliation}
                      </p>
                    )}

                    {/* Bio */}
                    {doctor.bio && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{doctor.bio}</p>
                    )}

                    {/* Languages */}
                    {doctor.languages && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                        <span>🌐</span> {doctor.languages}
                      </p>
                    )}

                    {/* CTA button */}
                    <div className="pt-2 mt-auto">
                      <div className="w-full flex items-center justify-center h-10 rounded-xl bg-teal-50 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 text-sm font-semibold group-hover:bg-teal-600 group-hover:text-white dark:group-hover:bg-teal-600 dark:group-hover:text-white transition-colors border border-teal-100 dark:border-zinc-700 group-hover:border-teal-600">
                        View Profile & Book →
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-10 sm:mt-16 bg-zinc-900 dark:bg-zinc-950 text-zinc-400 py-10 px-4 sm:px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold text-white hover:text-teal-400 transition-colors">MediBridge</Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/doctors" className="hover:text-white transition-colors">Doctors</Link>
            <Link href="/packages" className="hover:text-white transition-colors">Packages</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Login</Link>
          </nav>
          <p className="text-xs">© {new Date().getFullYear()} MediBridge. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
