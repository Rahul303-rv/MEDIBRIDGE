"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { DoctorProfile, Specialization } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    const params = selectedSpec ? `?specialization=${selectedSpec}` : "";
    api.get(`/api/v1/public/doctors${params}`)
      .then((res) => setDoctors(res.data))
      .finally(() => setLoading(false));
  }, [selectedSpec]);

  function handleSpecChange(slug: string) {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("specialization", slug);
    } else {
      params.delete("specialization");
    }
    router.push(`/doctors?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Find a Doctor</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Browse our verified Indian specialists available for online consultations.</p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-zinc-700">Specialization:</label>
          <select
            value={selectedSpec}
            onChange={(e) => handleSpecChange(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring"
          >
            <option value="">All specializations</option>
            {specializations.map((s) => (
              <option key={s.id} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading doctors…</p>
        ) : doctors.length === 0 ? (
          <p className="text-sm text-zinc-500">No doctors found. Try removing the filter.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {doctors.map((doctor) => (
              <Link key={doctor.id} href={`/doctors/${doctor.slug}`}>
                <Card className="border border-zinc-200 shadow-sm hover:border-teal-300 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-zinc-900">
                          Dr. {doctor.first_name} {doctor.last_name}
                        </p>
                        {doctor.years_of_experience != null && (
                          <p className="text-xs text-zinc-500">{doctor.years_of_experience} years experience</p>
                        )}
                      </div>
                      {doctor.consultation_fee_usd && (
                        <span className="text-sm font-medium text-teal-700">${doctor.consultation_fee_usd}</span>
                      )}
                    </div>
                    {doctor.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doctor.specializations.map((s) => (
                          <Badge key={s.id} className="bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-100 text-xs">
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {doctor.bio && (
                      <p className="text-sm text-zinc-500 line-clamp-2">{doctor.bio}</p>
                    )}
                    {doctor.languages && (
                      <p className="text-xs text-zinc-400">Languages: {doctor.languages}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
