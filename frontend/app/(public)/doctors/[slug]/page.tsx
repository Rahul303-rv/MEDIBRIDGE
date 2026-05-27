"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { DoctorProfile, AvailableSlot } from "@/types/api";

export default function PublicDoctorDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isPatient, setIsPatient] = useState(false);

  useEffect(() => {
    api.get(`/api/v1/public/doctors/${slug}`)
      .then((res) => setDoctor(res.data))
      .catch(() => router.replace("/doctors"))
      .finally(() => setLoadingDoctor(false));

    api.get("/api/v1/patient/profile")
      .then(() => setIsPatient(true))
      .catch(() => setIsPatient(false));
  }, [slug, router]);

  useEffect(() => {
    if (!isPatient || !doctor) return;
    setLoadingSlots(true);
    api.get(`/api/v1/patient/doctors/${doctor.id}/available-slots`)
      .then((res) => setSlots(res.data.slots ?? []))
      .finally(() => setLoadingSlots(false));
  }, [isPatient, doctor]);

  if (loadingDoctor) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-8">
        <p className="text-sm text-zinc-400 text-center mt-24">Loading…</p>
      </main>
    );
  }

  if (!doctor) return null;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back */}
        <Link href="/doctors" className="text-sm text-teal-600 dark:text-teal-400 hover:underline">
          ← Back to doctors
        </Link>

        {/* Header card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 space-y-4">
          <div className="flex items-start gap-4">
            {doctor.profile_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doctor.profile_image}
                alt={`Dr. ${doctor.first_name} ${doctor.last_name}`}
                className="w-20 h-20 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-500 dark:text-zinc-400 shrink-0">
                {doctor.first_name[0]}{doctor.last_name[0]}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Dr. {doctor.first_name} {doctor.last_name}
              </h1>
              {doctor.years_of_experience != null && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{doctor.years_of_experience} years experience</p>
              )}
              {doctor.consultation_fee_usd && (
                <p className="text-sm font-medium text-teal-700 dark:text-teal-400 mt-1">
                  ${doctor.consultation_fee_usd} / {doctor.consultation_duration_min} min
                </p>
              )}
            </div>
          </div>

          {doctor.specializations.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {doctor.specializations.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600"
                >
                  {s.name}
                </span>
              ))}
            </div>
          )}

          {doctor.bio && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{doctor.bio}</p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            {doctor.languages && (
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">Languages</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{doctor.languages}</p>
              </div>
            )}
            {doctor.hospital_affiliation && (
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">Hospital</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{doctor.hospital_affiliation}</p>
              </div>
            )}
            {doctor.timezone && (
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">Timezone</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{doctor.timezone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Education */}
        {doctor.education.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 space-y-3">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Education</h2>
            <div className="space-y-2">
              {doctor.education.map((e) => (
                <div key={e.id} className="text-sm">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{e.degree}</span>
                  <span className="text-zinc-500 dark:text-zinc-400"> — {e.institution}</span>
                  {e.year_completed && (
                    <span className="text-zinc-400 dark:text-zinc-500"> ({e.year_completed})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available slots */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Available slots</h2>

          {!isPatient ? (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Sign in as a patient to see available slots and book a consultation.
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                Sign in
              </Link>
            </div>
          ) : loadingSlots ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading slots…</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No upcoming slots available.</p>
          ) : (
            <div className="space-y-2">
              {slots.slice(0, 10).map((slot, i) => (
                <div key={i} className="flex items-center justify-between border border-zinc-100 dark:border-zinc-700 rounded-lg p-3 bg-zinc-50/50 dark:bg-zinc-800/50">
                  <div className="text-sm text-zinc-700 dark:text-zinc-200">
                    <span className="font-medium">
                      {new Date(slot.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {" "}{new Date(slot.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      {" – "}
                      {new Date(slot.end).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <Link
                    href={`/patient/book?doctor=${doctor.id}&start=${encodeURIComponent(slot.start)}&end=${encodeURIComponent(slot.end)}`}
                    className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline"
                  >
                    Book
                  </Link>
                </div>
              ))}
              {slots.length > 10 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 pt-1">Showing first 10 of {slots.length} slots.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
