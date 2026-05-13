"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { PatientProfile } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);

  useEffect(() => {
    api.get("/api/v1/patient/profile").then((res) => setProfile(res.data));
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Patient Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {profile
                ? (`${profile.first_name} ${profile.last_name}`.trim() || user?.email)
                : (user?.email ?? "")}
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>

        {/* Profile completeness */}
        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Your Profile</CardTitle>
              {profile && (
                <Badge
                  className={
                    profile.is_complete
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"
                  }
                >
                  {profile.is_complete ? "Complete" : "Incomplete"}
                </Badge>
              )}
            </div>
            {profile && !profile.is_complete && (
              <CardDescription>
                Complete your profile so doctors have the information they need.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {profile && !profile.is_complete ? (
              <Link
                href="/patient/profile"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Complete your profile
              </Link>
            ) : (
              <Link href="/patient/profile" className="text-sm text-teal-600 hover:underline">
                Edit profile
              </Link>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/patient/symptoms">
            <Card className="border border-zinc-200 shadow-sm hover:border-teal-300 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 space-y-1">
                <p className="font-semibold text-zinc-900">Request a Consultation</p>
                <p className="text-sm text-zinc-500">Describe your symptoms and get matched to the right doctor.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/patient/symptoms/history">
            <Card className="border border-zinc-200 shadow-sm hover:border-teal-300 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 space-y-1">
                <p className="font-semibold text-zinc-900">My Requests</p>
                <p className="text-sm text-zinc-500">View your submitted consultation requests and matched doctors.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/patient/appointments">
            <Card className="border border-zinc-200 shadow-sm hover:border-teal-300 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 space-y-1">
                <p className="font-semibold text-zinc-900">Appointments</p>
                <p className="text-sm text-zinc-500">View your upcoming and past consultations.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/patient/prescriptions">
            <Card className="border border-zinc-200 shadow-sm hover:border-teal-300 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 space-y-1">
                <p className="font-semibold text-zinc-900">Prescriptions</p>
                <p className="text-sm text-zinc-500">View and download your prescriptions.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/patient/surgery-bookings">
            <Card className="border border-zinc-200 shadow-sm hover:border-teal-300 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 space-y-1">
                <p className="font-semibold text-zinc-900">Surgery Bookings</p>
                <p className="text-sm text-zinc-500">View and manage your surgery package bookings.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/patient/surgery-recommendations">
            <Card className="border border-zinc-200 shadow-sm hover:border-teal-300 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 space-y-1">
                <p className="font-semibold text-zinc-900">Surgery Recommendations</p>
                <p className="text-sm text-zinc-500">View surgery packages your doctor has recommended.</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
