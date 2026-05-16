"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface PrescriptionSummary {
  id: number;
  appointment_id: number;
  appointment_date: string;
  doctor_name: string;
  diagnosis: string;
  created_at: string;
}

function PrescriptionSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 shrink-0" />
          <div className="space-y-2">
            <div className="h-4 bg-zinc-100 rounded w-32" />
            <div className="h-3 bg-zinc-100 rounded w-44" />
            <div className="h-3 bg-zinc-100 rounded w-64" />
          </div>
        </div>
        <div className="w-16 h-8 bg-zinc-100 rounded-xl shrink-0" />
      </div>
    </div>
  );
}

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/patient/prescriptions")
      .then((res) => setPrescriptions(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900">My Prescriptions</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Digital prescriptions from your consultations</p>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <PrescriptionSkeleton key={i} />)}
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-14 text-center">
          <p className="text-5xl mb-4">💊</p>
          <p className="font-bold text-zinc-700 text-lg">No prescriptions yet</p>
          <p className="text-zinc-400 text-sm mt-2">
            Your prescriptions will appear here after your consultations are completed.
          </p>
          <Link
            href="/patient/symptoms"
            className="mt-5 inline-flex items-center h-10 px-6 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            Request a Consultation
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => {
            const initials = rx.doctor_name
              .split(" ")
              .filter((w) => w !== "Dr.")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <Link key={rx.id} href={`/patient/prescriptions/${rx.id}`}>
                <div className="bg-white rounded-2xl border border-zinc-200 hover:border-teal-300 hover:shadow-sm transition-all p-5 group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Doctor avatar */}
                      <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-900 group-hover:text-teal-700 transition-colors">
                          {rx.doctor_name}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {new Date(rx.appointment_date).toLocaleString("en-US", {
                            weekday: "short", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                        <p className="text-sm text-zinc-600 mt-1.5 line-clamp-2 leading-relaxed">
                          {rx.diagnosis}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span className="text-xs font-semibold text-teal-700 group-hover:text-teal-800 transition-colors whitespace-nowrap">
                        View →
                      </span>
                      <span className="text-xs text-zinc-400 whitespace-nowrap">
                        {new Date(rx.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
