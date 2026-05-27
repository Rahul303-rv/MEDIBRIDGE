"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { PatientProfile } from "@/types/api";

const QUICK_ACTIONS = [
  {
    href: "/patient/symptoms",
    label: "Request Consultation",
    desc: "Describe symptoms and get matched to the right specialist",
    icon: "🩺",
    color: "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-teal-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
    iconBg: "bg-teal-100 text-teal-600",
  },
  {
    href: "/patient/symptoms/history",
    label: "My Requests",
    desc: "Track submitted consultation requests and matched doctors",
    icon: "📋",
    color: "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-teal-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
    iconBg: "bg-amber-100 text-amber-600",
  },
  {
    href: "/patient/appointments",
    label: "Appointments",
    desc: "View upcoming and past video consultations",
    icon: "📅",
    color: "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-teal-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    href: "/patient/prescriptions",
    label: "Prescriptions",
    desc: "Download and view your digital prescriptions",
    icon: "💊",
    color: "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-teal-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
    iconBg: "bg-purple-100 text-purple-600",
  },
  {
    href: "/patient/surgery-bookings",
    label: "Surgery Bookings",
    desc: "Manage your all-inclusive surgery package bookings",
    icon: "✂️",
    color: "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-teal-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
    iconBg: "bg-rose-100 text-rose-600",
  },
  {
    href: "/patient/surgery-recommendations",
    label: "Recommendations",
    desc: "Surgery packages recommended by your doctor",
    icon: "⭐",
    color: "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-teal-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
    iconBg: "bg-amber-100 text-amber-600",
  },
];

function ProfileField({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-teal-500" : "bg-zinc-200 dark:bg-zinc-700"}`}>
        {done && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`text-xs ${done ? "text-zinc-500 dark:text-zinc-400 line-through" : "text-zinc-700 dark:text-zinc-200"}`}>{label}</span>
    </div>
  );
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/patient/profile")
      .then((res) => setProfile(res.data))
      .finally(() => setLoading(false));
  }, []);

  const name = profile
    ? (`${profile.first_name} ${profile.last_name}`.trim() || user?.email?.split("@")[0] || "")
    : (user?.email?.split("@")[0] || "");

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-5xl">

      {/* Welcome header */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-500 rounded-2xl p-7 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-20 translate-x-20" />
        <div className="absolute bottom-0 left-32 w-40 h-40 bg-white/5 rounded-full translate-y-12" />
        <div className="relative">
          <p className="text-teal-100 text-sm font-medium">{today}</p>
          <h1 className="text-2xl font-extrabold mt-1">
            {greeting}{name ? `, ${name}` : ""}! 👋
          </h1>
          <p className="text-teal-100 text-sm mt-1">
            Welcome to your MediBridge health dashboard
          </p>
        </div>
      </div>

      {/* Profile completeness */}
      {!loading && profile && (
        <div className={`rounded-2xl border p-5 ${
          profile.is_complete
            ? "bg-emerald-50 border-emerald-100"
            : "bg-amber-50 border-amber-100"
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{profile.is_complete ? "✅" : "📝"}</span>
                <p className={`font-bold text-sm ${profile.is_complete ? "text-emerald-800" : "text-amber-800"}`}>
                  {profile.is_complete ? "Profile complete" : "Complete your profile"}
                </p>
              </div>
              {!profile.is_complete && (
                <p className="text-xs text-amber-700 mt-1 ml-7">
                  Doctors need your complete profile to provide the best care.
                </p>
              )}
              {!profile.is_complete && (
                <div className="mt-3 ml-7 grid grid-cols-2 gap-1.5">
                  <ProfileField label="Full name" done={!!(profile.first_name && profile.last_name)} />
                  <ProfileField label="Date of birth" done={!!profile.date_of_birth} />
                  <ProfileField label="Blood group" done={!!profile.blood_group} />
                  <ProfileField label="Phone number" done={!!profile.phone} />
                </div>
              )}
            </div>
            <Link
              href="/patient/profile"
              className={`h-9 px-4 rounded-xl text-sm font-semibold transition-colors shrink-0 inline-flex items-center ${
                profile.is_complete
                  ? "bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  : "bg-amber-500 text-white hover:bg-amber-600"
              }`}
            >
              {profile.is_complete ? "Edit profile" : "Complete profile →"}
            </Link>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`rounded-2xl border p-5 transition-all group ${action.color}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-4 ${action.iconBg}`}>
                {action.icon}
              </div>
              <p className="font-bold text-zinc-900 dark:text-white text-sm group-hover:text-teal-700 transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Help banner */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl shrink-0">
          🌐
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-900 dark:text-white text-sm">Looking for a specific doctor?</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Browse our verified specialists and view their profiles.</p>
        </div>
        <Link
          href="/doctors"
          className="h-9 px-4 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors shrink-0"
        >
          Find Doctors
        </Link>
      </div>
    </div>
  );
}
