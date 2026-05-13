"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { DoctorProfile, AvailableSlot } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

    // Check if logged-in patient
    api.get("/api/v1/patient/profile")
      .then(() => setIsPatient(true))
      .catch(() => setIsPatient(false));
  }, [slug, router]);

  useEffect(() => {
    if (!isPatient || !doctor) return;
    api.get(`/api/v1/patient/doctors/${doctor.id}/available-slots`)
      .then((res) => setSlots(res.data.slots ?? []))
      .finally(() => setLoadingSlots(false));
  }, [isPatient, doctor]);

  if (loadingDoctor) {
    return (
      <main className="min-h-screen bg-zinc-50 p-8">
        <p className="text-sm text-zinc-400 text-center mt-24">Loading…</p>
      </main>
    );
  }

  if (!doctor) return null;

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back */}
        <Link href="/doctors" className="text-sm text-teal-600 hover:underline">← Back to doctors</Link>

        {/* Header */}
        <Card className="border border-zinc-200 shadow-sm">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-start gap-4">
              {doctor.profile_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doctor.profile_image}
                  alt={`Dr. ${doctor.first_name} ${doctor.last_name}`}
                  className="w-20 h-20 rounded-full object-cover border border-zinc-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center text-2xl font-bold text-zinc-400">
                  {doctor.first_name[0]}{doctor.last_name[0]}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-xl font-bold text-zinc-900">
                  Dr. {doctor.first_name} {doctor.last_name}
                </h1>
                {doctor.years_of_experience != null && (
                  <p className="text-sm text-zinc-500">{doctor.years_of_experience} years experience</p>
                )}
                {doctor.consultation_fee_usd && (
                  <p className="text-sm font-medium text-teal-700 mt-1">
                    ${doctor.consultation_fee_usd} / {doctor.consultation_duration_min} min
                  </p>
                )}
              </div>
            </div>

            {doctor.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {doctor.specializations.map((s) => (
                  <Badge key={s.id} className="bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-100 text-xs">
                    {s.name}
                  </Badge>
                ))}
              </div>
            )}

            {doctor.bio && (
              <p className="text-sm text-zinc-600 leading-relaxed">{doctor.bio}</p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              {doctor.languages && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Languages</p>
                  <p className="text-sm text-zinc-700">{doctor.languages}</p>
                </div>
              )}
              {doctor.hospital_affiliation && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Hospital</p>
                  <p className="text-sm text-zinc-700">{doctor.hospital_affiliation}</p>
                </div>
              )}
              {doctor.timezone && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Timezone</p>
                  <p className="text-sm text-zinc-700">{doctor.timezone}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Education */}
        {doctor.education.length > 0 && (
          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Education</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {doctor.education.map((e) => (
                <div key={e.id} className="text-sm">
                  <span className="font-medium text-zinc-800">{e.degree}</span>
                  <span className="text-zinc-500"> — {e.institution}</span>
                  {e.year_completed && (
                    <span className="text-zinc-400"> ({e.year_completed})</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Available slots */}
        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Available slots</CardTitle>
          </CardHeader>
          <CardContent>
            {!isPatient ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-zinc-500">Sign in as a patient to see available slots and book a consultation.</p>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  Sign in
                </Link>
              </div>
            ) : loadingSlots ? (
              <p className="text-sm text-zinc-400">Loading slots…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-zinc-500">No upcoming slots available.</p>
            ) : (
              <div className="space-y-2">
                {slots.slice(0, 10).map((slot, i) => (
                  <div key={i} className="flex items-center justify-between border border-zinc-100 rounded-lg p-3">
                    <div className="text-sm text-zinc-700">
                      <span className="font-medium">
                        {new Date(slot.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <span className="text-zinc-500">
                        {" "}{new Date(slot.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        {" – "}
                        {new Date(slot.end).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <Link
                      href={`/patient/book?doctor=${doctor.id}&start=${encodeURIComponent(slot.start)}&end=${encodeURIComponent(slot.end)}`}
                      className="text-xs font-medium text-teal-700 hover:underline"
                    >
                      Book
                    </Link>
                  </div>
                ))}
                {slots.length > 10 && (
                  <p className="text-xs text-zinc-400 pt-1">Showing first 10 of {slots.length} slots.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
