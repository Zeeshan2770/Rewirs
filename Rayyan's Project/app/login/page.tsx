import type { Metadata } from "next";
import { Section } from "@/components/section";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Section className="flex min-h-[70vh] items-center justify-center py-20">
      <Card className="w-full max-w-sm bg-base-900">
        <h1 className="font-display text-2xl text-ink-100">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-600">Sign in to continue your course.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </Card>
    </Section>
  );
}
