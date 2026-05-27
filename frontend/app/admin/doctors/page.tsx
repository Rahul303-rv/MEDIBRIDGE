"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { DoctorProfile } from "@/types/api";

interface AdminDoctorProfile extends DoctorProfile {
  email: string;
}

type FilterTab = "all" | "verified" | "unverified";

function DoctorSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-700 shrink-0" />
          <div className="space-y-2">
            <div className="h-4 bg-zinc-100 dark:bg-zinc-700 rounded w-36" />
            <div className="h-3 bg-zinc-100 dark:bg-zinc-700 rounded w-48" />
            <div className="h-3 bg-zinc-100 dark:bg-zinc-700 rounded w-32" />
          </div>
        </div>
        <div className="w-20 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-700 shrink-0" />
      </div>
    </div>
  );
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<AdminDoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    api.get("/api/v1/admin/doctors")
      .then((res) => setDoctors(res.data))
      .catch(() => toast.error("Failed to load doctors."))
      .finally(() => setLoading(false));
  }, []);

  async function verifyDoctor(id: number) {
    setVerifying(id);
    try {
      await api.post(`/api/v1/admin/doctors/${id}/verify`);
      setDoctors((prev) =>
        prev.map((d) => (d.id === id ? { ...d, is_verified: true } : d))
      );
      toast.success("Doctor verified successfully.");
    } catch {
      toast.error("Failed to verify doctor.");
    } finally {
      setVerifying(null);
    }
  }

  const filtered = doctors.filter((d) =>
    filter === "all" ? true : filter === "verified" ? d.is_verified : !d.is_verified
  );

  const counts = {
    all: doctors.length,
    verified: doctors.filter((d) => d.is_verified).length,
    unverified: doctors.filter((d) => !d.is_verified).length,
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Doctors</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Manage doctor accounts and verification</p>
        </div>
        <Link
          href="/admin/doctors/invite"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Invite Doctor
        </Link>
      </div>

      {/* Summary bar */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          {(["all", "verified", "unverified"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                filter === tab
                  ? "bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700"
                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
              }`}
            >
              <p className={`text-2xl font-extrabold ${
                filter === tab
                  ? "text-teal-700 dark:text-teal-400"
                  : "text-zinc-900 dark:text-white"
              }`}>
                {counts[tab]}
              </p>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 capitalize mt-0.5">{tab}</p>
            </button>
          ))}
        </div>
      )}

      {/* Doctor list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <DoctorSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-12 text-center">
          <p className="text-4xl mb-3">👨‍⚕️</p>
          <p className="text-zinc-700 dark:text-zinc-200 font-semibold">No doctors found</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">
            {filter === "unverified" ? "All doctors are verified!" : "Invite a doctor to get started."}
          </p>
          <Link
            href="/admin/doctors/invite"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            Invite a doctor →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doctor) => {
            const name = [doctor.first_name, doctor.last_name].filter(Boolean).join(" ") || "(Name not set)";
            const initials = name !== "(Name not set)"
              ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
              : "?";

            return (
              <div
                key={doctor.id}
                className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 transition-colors p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                      doctor.is_verified ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-zinc-900 dark:text-white">{name}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          doctor.is_verified
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {doctor.is_verified ? "✓ Verified" : "⏳ Pending"}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{doctor.email}</p>
                      {doctor.specializations.length > 0 && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {doctor.specializations.map((s) => s.name).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {!doctor.is_verified ? (
                      <button
                        onClick={() => verifyDoctor(doctor.id)}
                        disabled={verifying === doctor.id}
                        className="h-9 px-5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
                      >
                        {verifying === doctor.id ? "Verifying…" : "Verify"}
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
