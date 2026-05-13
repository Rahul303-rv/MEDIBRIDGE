"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminUserDetail {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  is_email_verified: boolean;
  date_joined: string;
  last_login: string | null;
  // patient + doctor shared
  first_name?: string;
  last_name?: string;
  phone?: string;
  // patient only
  gender?: string;
  blood_group?: string;
  country?: string;
  state?: string;
  city?: string;
  address_line?: string;
  existing_conditions?: string;
  allergies?: string;
  current_medications?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  // doctor only
  bio?: string;
  is_verified?: boolean;
  is_available?: boolean;
  consultation_fee_usd?: string;
  years_of_experience?: number;
  hospital_affiliation?: string;
  medical_council_reg_no?: string;
  specializations?: { id: number; name: string }[];
}

type FormState = Partial<AdminUserDetail>;

function Field({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-zinc-600">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring";
const textareaCls = "flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring resize-none";

export default function AdminUserEditPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>({});
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [settingPw, setSettingPw] = useState(false);

  useEffect(() => {
    api.get(`/api/v1/admin/users/${id}`)
      .then((res) => { setUser(res.data); setForm(res.data); })
      .catch(() => toast.error("Failed to load user."))
      .finally(() => setLoading(false));
  }, [id]);

  function set(key: keyof FormState, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function textProps(key: keyof FormState) {
    return {
      value: (form[key] as string) ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        set(key, e.target.value),
    };
  }

  async function save() {
    setSaving(true);
    try {
      await api.patch(`/api/v1/admin/users/${id}`, form);
      toast.success("User saved.");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword() {
    if (newPassword.length < 8) { toast.error("Minimum 8 characters."); return; }
    setSettingPw(true);
    try {
      await api.post(`/api/v1/admin/users/${id}/set-password`, { new_password: newPassword });
      toast.success("Password updated.");
      setNewPassword("");
    } catch {
      toast.error("Failed to update password.");
    } finally {
      setSettingPw(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-sm text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-sm text-zinc-500">User not found.</p>
      </div>
    );
  }

  const isPatient = user.role === "patient";
  const isDoctor  = user.role === "doctor";

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Edit User</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{user.email}</p>
          </div>
          <Link href="/admin/users" className="text-sm text-zinc-500 hover:underline">← Users</Link>
        </div>

        {/* Account settings */}
        <Card>
          <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email">
                <input type="email" className={inputCls} {...textProps("email")} />
              </Field>
              <Field label="Role">
                <select className={inputCls} {...textProps("role")}>
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>
            </div>
            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.is_email_verified}
                  onChange={(e) => set("is_email_verified", e.target.checked)}
                  className="rounded"
                />
                Email verified
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.is_active}
                  onChange={(e) => set("is_active", e.target.checked)}
                  className="rounded"
                />
                Account active
              </label>
              {isDoctor && (
                <>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.is_verified}
                      onChange={(e) => set("is_verified", e.target.checked)}
                      className="rounded"
                    />
                    Doctor approved
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.is_available}
                      onChange={(e) => set("is_available", e.target.checked)}
                      className="rounded"
                    />
                    Available for bookings
                  </label>
                </>
              )}
            </div>
            <div className="text-xs text-zinc-400 pt-1 space-y-0.5">
              <p>Joined: {new Date(user.date_joined).toLocaleString()}</p>
              {user.last_login && <p>Last login: {new Date(user.last_login).toLocaleString()}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Profile section — patients and doctors */}
        {(isPatient || isDoctor) && (
          <Card>
            <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First name">
                  <input className={inputCls} {...textProps("first_name")} />
                </Field>
                <Field label="Last name">
                  <input className={inputCls} {...textProps("last_name")} />
                </Field>
                <Field label="Phone">
                  <input className={inputCls} {...textProps("phone")} />
                </Field>

                {isPatient && (
                  <>
                    <Field label="Gender">
                      <select className={inputCls} {...textProps("gender")}>
                        <option value="">—</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>
                    <Field label="Blood group">
                      <select className={inputCls} {...textProps("blood_group")}>
                        <option value="">—</option>
                        {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Country">
                      <input className={inputCls} {...textProps("country")} />
                    </Field>
                    <Field label="State / Province">
                      <input className={inputCls} {...textProps("state")} />
                    </Field>
                    <Field label="City">
                      <input className={inputCls} {...textProps("city")} />
                    </Field>
                    <Field label="Address">
                      <input className={inputCls} {...textProps("address_line")} />
                    </Field>
                  </>
                )}

                {isDoctor && (
                  <>
                    <Field label="Years of experience">
                      <input type="number" className={inputCls} {...textProps("years_of_experience")} />
                    </Field>
                    <Field label="Consultation fee (USD)">
                      <input type="number" className={inputCls} {...textProps("consultation_fee_usd")} />
                    </Field>
                    <Field label="Hospital affiliation">
                      <input className={`${inputCls} col-span-2`} {...textProps("hospital_affiliation")} />
                    </Field>
                    <Field label="Medical council reg. no.">
                      <input className={inputCls} {...textProps("medical_council_reg_no")} />
                    </Field>
                  </>
                )}
              </div>

              {isPatient && (
                <div className="space-y-4 pt-2">
                  <Field label="Existing conditions">
                    <textarea rows={2} className={textareaCls} {...textProps("existing_conditions")} />
                  </Field>
                  <Field label="Allergies">
                    <input className={inputCls} {...textProps("allergies")} />
                  </Field>
                  <Field label="Current medications">
                    <input className={inputCls} {...textProps("current_medications")} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Emergency contact name">
                      <input className={inputCls} {...textProps("emergency_contact_name")} />
                    </Field>
                    <Field label="Emergency contact phone">
                      <input className={inputCls} {...textProps("emergency_contact_phone")} />
                    </Field>
                  </div>
                </div>
              )}

              {isDoctor && (
                <Field label="Bio">
                  <textarea rows={4} className={textareaCls} {...textProps("bio")} />
                </Field>
              )}

              {isDoctor && user.specializations && user.specializations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-zinc-600 mb-1">Specializations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.specializations.map((s) => (
                      <span key={s.id} className="px-2 py-0.5 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-100">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

        {/* Password reset */}
        <Card>
          <CardHeader><CardTitle className="text-base text-rose-600">Reset Password</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-zinc-500">
              Set a new password for this user. They will need to use it on their next login.
            </p>
            <Field label="New password (min 8 characters)">
              <input
                type="password"
                placeholder="Enter new password…"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Button
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              onClick={resetPassword}
              disabled={settingPw}
            >
              {settingPw ? "Updating…" : "Set new password"}
            </Button>
          </CardContent>
        </Card>

      </div>
    </main>
  );
}
