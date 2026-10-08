import type { Metadata } from "next";
import { Section } from "@/components/section";
import { Card } from "@/components/ui/card";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <Section className="flex min-h-[70vh] items-center justify-center py-20">
      <Card className="w-full max-w-sm bg-base-900">
        <h1 className="font-display text-2xl text-ink-100">Set a new password</h1>
        <div className="mt-6">
          <ResetPasswordForm />
        </div>
      </Card>
    </Section>
  );
}
