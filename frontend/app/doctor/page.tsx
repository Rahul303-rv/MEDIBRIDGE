"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { DoctorProfile } from "@/types/api";

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-teal-500" : "bg-zinc-200"}`}>
        {done ? (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <div className="w-2 h-2 rounded-full bg-zinc-400" />
        )}
      </div>
      <span className={`text-sm ${done ? "text-zinc-500 line-through" : "text-zinc-700"}`}>{label}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-36 bg-zinc-200 rounded-2xl" />
      <div className="h-40 bg-zinc-100 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-32 bg-zinc-100 rounded-2xl" />
        <div className="h-32 bg-zinc-100 rounded-2xl" />
        <div className="h-32 bg-zinc-100 rounded-2xl" />
      </div>
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    href: "/doctor/appointments",
    label: "My Schedule",
    desc: "View and manage upcoming consultations",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    href: "/doctor/availability",
    label: "Availability",
    desc: "Manage your bookable time slots",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: "bg-teal-100 text-teal-600",
  },
  {
    href: "/doctor/surgery-recommendations",
    label: "Recommendations",
    desc: "Recommend surgery packages to patients",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    href: "/doctor/profile",
    label: "Edit Profile",
    desc: "Update your specializations and info",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    iconBg: "bg-purple-100 text-purple-600",
  },
];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/doctor/profile")
      .then((res) => setProfile(res.data))
      .finally(() => setLoading(false));
  }, []);

  const doctorName = profile
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

  const hasEducation = profile ? profile.education.length > 0 : false;
  const onboardingDone = profile
    ? profile.is_profile_complete && hasEducation && profile.specializations.length > 0 && profile.is_verified
    : false;

  return (
    <div className="p-8 space-y-8 max-w-4xl">

      {/* Welcome header */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-500 rounded-2xl p-7 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-20 translate-x-20" />
        <div className="absolute bottom-0 left-32 w-40 h-40 bg-white/5 rounded-full translate-y-12" />
        <div className="relative">
          <p className="text-teal-100 text-sm font-medium">{today}</p>
          <h1 className="text-2xl font-extrabold mt-1">
            {greeting}{doctorName ? `, Dr. ${doctorName}` : ""}! 👋
          </h1>
          <p className="text-teal-100 text-sm mt-1">
            Welcome to your MediBridge doctor portal
          </p>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Verification status */}
          {profile && (
            <div className={`rounded-2xl border p-5 ${
              profile.is_verified
                ? "bg-emerald-50 border-emerald-100"
                : "bg-amber-50 border-amber-100"
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{profile.is_verified ? "✅" : "⏳"}</span>
                    <p className={`font-bold text-sm ${profile.is_verified ? "text-emerald-800" : "text-amber-800"}`}>
                      {profile.is_verified ? "Account verified — you are visible to patients" : "Awaiting admin verification"}
                    </p>
                  </div>
                  {!onboardingDone && (
                    <div className="mt-4 grid grid-cols-2 gap-2 ml-7">
                      <CheckItem done={profile.is_profile_complete} label="Profile complete" />
                      <CheckItem done={hasEducation} label="Education added" />
                      <CheckItem done={profile.specializations.length > 0} label="Specializations selected" />
                      <CheckItem done={profile.is_verified} label="Admin verified" />
                    </div>
                  )}
                </div>
                <Link
                  href="/doctor/profile"
                  className={`h-9 px-4 rounded-xl text-sm font-semibold transition-colors shrink-0 inline-flex items-center ${
                    profile.is_profile_complete
                      ? "bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                      : "bg-amber-500 text-white hover:bg-amber-600"
                  }`}
                >
                  {profile.is_profile_complete ? "Edit profile" : "Complete profile →"}
                </Link>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div>
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="bg-white rounded-2xl border border-zinc-200 hover:border-teal-300 hover:shadow-sm p-5 transition-all group"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${action.iconBg}`}>
                    {action.icon}
                  </div>
                  <p className="font-bold text-zinc-900 text-sm group-hover:text-teal-700 transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{action.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Profile tip */}
          {profile && !profile.is_profile_complete && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl shrink-0">
                📋
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-900 text-sm">Your profile is incomplete</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Complete your profile so patients can find and book you.
                </p>
              </div>
              <Link
                href="/doctor/profile"
                className="h-9 px-4 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors shrink-0"
              >
                Complete →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
