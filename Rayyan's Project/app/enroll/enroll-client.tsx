"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/settings";
import { Label, Input, FieldError } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button, ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/route-guards";
import type { Course, Enrollment, SiteSettings } from "@/lib/types/database";

const MAX_PROOF_BYTES = 5 * 1024 * 1024;

export function EnrollClient() {
  const { userId, profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [course, setCourse] = useState<Course | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [existing, setExisting] = useState<Enrollment | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [{ data: courseRow }, { data: settingsRow }] = await Promise.all([
        supabase.from("courses").select("*").eq("slug", "superchad").maybeSingle(),
        supabase.from("site_settings").select("*").eq("id", true).single(),
      ]);

      if (cancelled) return;
      setCourse(courseRow ?? null);
      setSettings((settingsRow as unknown as SiteSettings) ?? null);

      if (userId && courseRow) {
        const { data: enrollmentRow } = await supabase
          .from("enrollments")
          .select("*")
          .eq("user_id", userId)
          .eq("course_id", courseRow.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!cancelled) setExisting(enrollmentRow ?? null);
      }

      if (!cancelled) setDataLoading(false);
    }

    if (!authLoading) load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, userId]);

  if (authLoading || dataLoading) return <Spinner />;

  if (!course || !settings) {
    return <p className="text-sm text-ink-600">The course isn&apos;t available for enrollment right now.</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
      <Card className="h-fit bg-base-900">
        <h2 className="font-display text-lg text-ink-100">Payment instructions</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink-400">{settings.payment_instructions}</p>
        <div className="mt-5 rounded-xl border border-base-800 bg-base-950 p-4 text-sm">
          <p className="text-ink-600">Amount to pay</p>
          <p className="mt-1 font-display text-2xl text-ink-100">{formatPrice(course.price, course.currency)}</p>
        </div>
        <ol className="mt-5 space-y-2 text-sm text-ink-500">
          <li>1. Send payment using the instructions above.</li>
          <li>2. Fill out the enrollment form with your payment reference.</li>
          <li>3. We manually verify and approve your access, usually within 24-48 hours.</li>
        </ol>
      </Card>

      {!userId ? (
        <Card className="h-fit text-center">
          <p className="text-ink-100">Create an account or log in to enroll.</p>
          <p className="mt-1 text-sm text-ink-600">You&apos;ll come right back here after signing in.</p>
          <div className="mt-6 flex justify-center gap-3">
            <ButtonLink href="/signup/">Create account</ButtonLink>
            <ButtonLink href="/login/" variant="secondary">Log in</ButtonLink>
          </div>
        </Card>
      ) : existing && existing.status !== "rejected" && existing.status !== "cancelled" ? (
        <Card className="h-fit text-center">
          <Badge status={existing.status}>{existing.status}</Badge>
          <p className="mt-4 text-ink-100">
            {existing.status === "approved"
              ? "You already have access to this course."
              : "Your enrollment request is pending verification."}
          </p>
          <div className="mt-6">
            <ButtonLink href="/dashboard/" variant="secondary">
              Go to dashboard
            </ButtonLink>
          </div>
        </Card>
      ) : (
        <Card>
          <EnrollForm course={course} defaultName={profile?.full_name ?? ""} defaultEmail={profile?.email ?? ""} />
        </Card>
      )}
    </div>
  );
}

function EnrollForm({
  course,
  defaultName,
  defaultEmail,
}: {
  course: Course;
  defaultName: string;
  defaultEmail: string;
}) {
  const supabase = createClient();
  const [values, setValues] = useState({
    full_name: defaultName,
    email: defaultEmail,
    phone: "",
    payment_method: "",
    payment_date: "",
    transaction_reference: "",
    message: "",
  });
  const [proof, setProof] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (values.full_name.trim().length < 2) nextErrors.full_name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = "Enter a valid email address.";
    if (values.phone.trim().length < 7) nextErrors.phone = "Enter a valid phone/WhatsApp number.";
    if (!values.payment_method) nextErrors.payment_method = "Select a payment method.";
    if (values.transaction_reference.trim().length < 3)
      nextErrors.transaction_reference = "Enter your transaction reference.";
    if (!values.payment_date) nextErrors.payment_date = "Select the payment date.";
    if (proof && proof.size > MAX_PROOF_BYTES) nextErrors.payment_proof = "File must be under 5MB.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    setStatus("idle");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPending(false);
      setStatus("error");
      setMessage("Your session expired. Please log in again.");
      return;
    }

    // Duplicate-prevention check (also enforced server-side by a partial
    // unique index, so this is a friendlier error message, not the only
    // guard).
    const { data: dupe } = await supabase
      .from("enrollments")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .in("status", ["pending", "approved"])
      .maybeSingle();

    if (dupe) {
      setPending(false);
      setStatus("error");
      setMessage(
        dupe.status === "approved"
          ? "You already have access to this course."
          : "You already have a pending enrollment request for this course."
      );
      return;
    }

    let paymentProofPath: string | null = null;
    if (proof) {
      const ext = proof.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      // Storage RLS requires the first path segment to equal the caller's
      // own auth.uid(), so this upload can only ever land in the user's
      // own folder.
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, proof, { contentType: proof.type });
      if (uploadError) {
        setPending(false);
        setStatus("error");
        setMessage("Couldn't upload payment proof. Try again.");
        return;
      }
      paymentProofPath = path;
    }

    // Trigger guard_enrollment_insert() forces user_id/status server-side
    // regardless of what's sent here.
    const { error } = await supabase.from("enrollments").insert({
      user_id: user.id,
      course_id: course.id,
      full_name: values.full_name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      payment_method: values.payment_method,
      amount: course.price,
      currency: course.currency,
      transaction_reference: values.transaction_reference.trim(),
      payment_date: values.payment_date,
      payment_proof_path: paymentProofPath,
      message: values.message.trim() || null,
    });

    setPending(false);

    if (error) {
      setStatus("error");
      setMessage(
        (error as { code?: string }).code === "23505"
          ? "You already have an active enrollment request for this course."
          : "Something went wrong submitting your request. Please try again."
      );
      return;
    }

    setStatus("success");
    setMessage("Enrollment request received. Your payment is pending verification.");
  }

  if (status === "success") {
    return <Alert variant="success">{message}</Alert>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {status === "error" && message && <Alert variant="error">{message}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            required
            value={values.full_name}
            onChange={(e) => setValues((v) => ({ ...v, full_name: e.target.value }))}
          />
          <FieldError>{errors.full_name}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          />
          <FieldError>{errors.email}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="phone">Phone / WhatsApp</Label>
        <Input
          id="phone"
          required
          placeholder="+92 3XX XXXXXXX"
          value={values.phone}
          onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
        />
        <FieldError>{errors.phone}</FieldError>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="payment_method">Payment method</Label>
          <Select
            id="payment_method"
            required
            value={values.payment_method}
            onChange={(e) => setValues((v) => ({ ...v, payment_method: e.target.value }))}
          >
            <option value="" disabled>Select method</option>
            <option value="JazzCash">JazzCash</option>
            <option value="Easypaisa">Easypaisa</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Other">Other</option>
          </Select>
          <FieldError>{errors.payment_method}</FieldError>
        </div>
        <div>
          <Label htmlFor="payment_date">Payment date</Label>
          <Input
            id="payment_date"
            type="date"
            required
            value={values.payment_date}
            onChange={(e) => setValues((v) => ({ ...v, payment_date: e.target.value }))}
          />
          <FieldError>{errors.payment_date}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="transaction_reference">Transaction / reference ID</Label>
        <Input
          id="transaction_reference"
          required
          value={values.transaction_reference}
          onChange={(e) => setValues((v) => ({ ...v, transaction_reference: e.target.value }))}
        />
        <FieldError>{errors.transaction_reference}</FieldError>
      </div>

      <div>
        <Label htmlFor="payment_proof">Payment proof (optional, image or PDF, max 5MB)</Label>
        <Input
          id="payment_proof"
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setProof(e.target.files?.[0] ?? null)}
        />
        <FieldError>{errors.payment_proof}</FieldError>
      </div>

      <div>
        <Label htmlFor="message">Message (optional)</Label>
        <Textarea
          id="message"
          rows={3}
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
        />
      </div>

      <p className="text-xs text-ink-700">
        We will never ask for your card number, CVV, OTP or account password. This form only
        collects a payment reference so we can manually verify your payment.
      </p>

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? "Submitting…" : "Submit enrollment request"}
      </Button>
    </form>
  );
}
