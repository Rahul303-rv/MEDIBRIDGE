"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { DoctorProfile } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={done ? "text-emerald-600" : "text-zinc-400"}>
        {done ? "✓" : "○"}
      </span>
      <span className={done ? "text-zinc-700" : "text-zinc-500"}>{label}</span>
    </div>
  );
}

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);

  useEffect(() => {
    api.get("/api/v1/doctor/profile").then((res) => setProfile(res.data));
  }, []);

  const hasEducation = profile ? profile.education.length > 0 : false;

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Doctor Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {profile && (profile.first_name || profile.last_name)
                ? `Dr. ${profile.first_name} ${profile.last_name}`.trim()
                : (user?.email ?? "")}
            </p>
          </div>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>

        {/* Onboarding checklist */}
        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Onboarding Status</CardTitle>
              {profile && (
                <Badge
                  className={
                    profile.is_verified
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"
                  }
                >
                  {profile.is_verified ? "Verified" : "Awaiting verification"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile ? (
              <>
                <CheckItem done={profile.is_profile_complete} label="Profile complete" />
                <CheckItem done={hasEducation} label="Education added" />
                <CheckItem done={profile.specializations.length > 0} label="Specializations selected" />
                <CheckItem done={profile.is_verified} label="Admin verified" />
              </>
            ) : (
              <p className="text-sm text-zinc-400">Loading…</p>
            )}
            <div className="pt-2">
              <Link href="/doctor/profile" className="text-sm text-teal-600 hover:underline">
                {profile?.is_profile_complete ? "Edit profile" : "Complete your profile →"}
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/doctor/availability">
            <Card className="border border-zinc-200 shadow-sm hover:border-teal-300 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 space-y-1">
                <p className="font-semibold text-zinc-900">Availability</p>
                <p className="text-sm text-zinc-500">Manage your bookable time slots.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/doctor/appointments">
            <Card className="border border-zinc-200 shadow-sm hover:border-teal-300 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 space-y-1">
                <p className="font-semibold text-zinc-900">Appointments</p>
                <p className="text-sm text-zinc-500">View and manage your scheduled consultations.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/doctor/surgery-recommendations">
            <Card className="border border-zinc-200 shadow-sm hover:border-teal-300 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 space-y-1">
                <p className="font-semibold text-zinc-900">Surgery Recommendations</p>
                <p className="text-sm text-zinc-500">Recommend surgery packages to your patients.</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
