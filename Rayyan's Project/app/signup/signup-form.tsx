"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Label, Input, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function SignupForm() {
  const supabase = createClient();
  const router = useRouter();

  const [values, setValues] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const nextErrors: Record<string, string> = {};
    if (values.full_name.trim().length < 2) nextErrors.full_name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = "Enter a valid email address.";
    if (values.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    if (values.password !== values.confirm) nextErrors.confirm = "Passwords do not match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);

    // Role is never sent here and never trusted from the client: the
    // handle_new_user() database trigger always creates new profiles as
    // role = 'student', regardless of what any client sends.
    const { data, error } = await supabase.auth.signUp({
      email: values.email.trim(),
      password: values.password,
      options: {
        data: { full_name: values.full_name.trim() },
        emailRedirectTo: `${window.location.origin}/dashboard/`,
      },
    });

    setPending(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard/");
      router.refresh();
      return;
    }

    setCheckEmail(true);
  }

  if (checkEmail) {
    return <Alert variant="success">Check your email to confirm your account, then log in.</Alert>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError && <Alert variant="error">{formError}</Alert>}

      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          required
          autoComplete="name"
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
          autoComplete="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
        />
        <FieldError>{errors.email}</FieldError>
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
        />
        <FieldError>{errors.password}</FieldError>
      </div>

      <div>
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          type="password"
          required
          autoComplete="new-password"
          value={values.confirm}
          onChange={(e) => setValues((v) => ({ ...v, confirm: e.target.value }))}
        />
        <FieldError>{errors.confirm}</FieldError>
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-ink-600">
        Already have an account?{" "}
        <Link href="/login/" className="text-accent hover:text-accent-soft">
          Log in
        </Link>
      </p>
    </form>
  );
}
