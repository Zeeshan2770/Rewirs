import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/section";
import { EnrollClient } from "./enroll-client";

export const metadata: Metadata = { title: "Enroll" };

export default function EnrollPage() {
  return (
    <Section className="pt-16 sm:pt-20">
      <SectionHeading
        title="Enroll in SuperChad"
        description="Payment is verified manually — no card details are ever collected on this site."
      />

      <div className="mt-10">
        <EnrollClient />
      </div>

      <p className="mt-8 text-center text-sm text-ink-700">
        Questions? <Link href="/contact/" className="text-accent hover:text-accent-soft">Contact us</Link> or
        see the <Link href="/faq/" className="text-accent hover:text-accent-soft">FAQ</Link>.
      </p>
    </Section>
  );
}
