import type { Metadata } from "next";
import { Section } from "@/components/section";
import { Card } from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <Section className="flex min-h-[70vh] items-center justify-center py-20">
      <Card className="w-full max-w-sm bg-base-900">
        <h1 className="font-display text-2xl text-ink-100">Create your account</h1>
        <p className="mt-1 text-sm text-ink-600">Sign up, then enroll to get course access.</p>
        <div className="mt-6">
          <SignupForm />
        </div>
      </Card>
    </Section>
  );
}
