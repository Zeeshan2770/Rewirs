import type { Metadata } from "next";
import { Section } from "@/components/section";
import { Card } from "@/components/ui/card";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <Section className="flex min-h-[70vh] items-center justify-center py-20">
      <Card className="w-full max-w-sm bg-base-900">
        <h1 className="font-display text-2xl text-ink-100">Reset your password</h1>
        <p className="mt-1 text-sm text-ink-600">We&apos;ll email you a link to reset it.</p>
        <div className="mt-6">
          <ForgotPasswordForm />
        </div>
      </Card>
    </Section>
  );
}
