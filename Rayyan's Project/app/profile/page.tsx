"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { RequireAuth, Spinner } from "@/components/route-guards";
import { Section } from "@/components/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { StudentHeader } from "@/components/student-header";
import { formatDate } from "@/lib/utils";
import type { Enrollment } from "@/lib/types/database";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const { userId, profile, refresh } = useAuth();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [nameStatus, setNameStatus] = useState<{ type: "idle" | "success" | "error"; message?: string }>({ type: "idle" });
  const [namePending, setNamePending] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwStatus, setPwStatus] = useState<{ type: "idle" | "success" | "error"; message?: string }>({ type: "idle" });
  const [pwPending, setPwPending] = useState(false);

  const [enrollments, setEnrollments] = useState<(Enrollment & { courses: { title: string } | null })[]>([]);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
  }, [profile?.full_name]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("enrollments")
      .select("*, courses(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setEnrollments((data as any) ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      setNameStatus({ type: "error", message: "Enter your full name." });
      return;
    }
    setNamePending(true);
    // RLS's profiles_update_own_or_admin policy scopes this to the caller's
    // own row, and the guard_profile_update trigger blocks any attempt to
    // sneak `role` or `suspended` through this same form.
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", userId);
    setNamePending(false);
    if (error) {
      setNameStatus({ type: "error", message: "Couldn't update your profile." });
      return;
    }
    setNameStatus({ type: "success", message: "Profile updated." });
    refresh();
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setPwStatus({ type: "error", message: "Password must be at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      setPwStatus({ type: "error", message: "Passwords do not match." });
      return;
    }
    setPwPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPwPending(false);
    if (error) {
      setPwStatus({ type: "error", message: error.message });
      return;
    }
    setPwStatus({ type: "success", message: "Password updated." });
    setPassword("");
    setConfirm("");
  }

  if (!profile) return <Spinner />;

  return (
    <>
      <StudentHeader />
      <Section className="max-w-2xl">
        <h1 className="font-display text-3xl text-ink-100">Your profile</h1>

        <Card className="mt-8 bg-base-900">
          <h2 className="font-display text-lg text-ink-100">Account</h2>
          <p className="mt-1 text-sm text-ink-600">{profile.email}</p>
          <form onSubmit={handleNameSubmit} className="mt-4 space-y-4">
            {nameStatus.type !== "idle" && (
              <Alert variant={nameStatus.type === "success" ? "success" : "error"}>{nameStatus.message}</Alert>
            )}
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} />
            </div>
            <Button type="submit" disabled={namePending}>
              {namePending ? "Saving…" : "Save name"}
            </Button>
          </form>
        </Card>

        <Card className="mt-6 bg-base-900">
          <h2 className="font-display text-lg text-ink-100">Password</h2>
          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
            {pwStatus.type !== "idle" && (
              <Alert variant={pwStatus.type === "success" ? "success" : "error"}>{pwStatus.message}</Alert>
            )}
            <div>
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label htmlFor="confirm_password">Confirm new password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={pwPending}>
              {pwPending ? "Saving…" : "Update password"}
            </Button>
          </form>
        </Card>

        <Card className="mt-6 bg-base-900">
          <h2 className="font-display text-lg text-ink-100">Enrollment history</h2>
          <div className="mt-4 space-y-3">
            {enrollments.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl border border-base-800 px-4 py-3">
                <div>
                  <p className="text-sm text-ink-100">{e.courses?.title ?? "Course"}</p>
                  <p className="text-xs text-ink-600">Submitted {formatDate(e.created_at)}</p>
                </div>
                <Badge status={e.status}>{e.status}</Badge>
              </div>
            ))}
            {enrollments.length === 0 && <p className="text-sm text-ink-600">No enrollment requests yet.</p>}
          </div>
        </Card>
      </Section>
    </>
  );
}
