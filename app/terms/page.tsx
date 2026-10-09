import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/section";
import { getSiteSettings, formatPrice } from "@/lib/settings";

export const metadata: Metadata = { title: "Terms" };

export default async function TermsPage() {
  const settings = await getSiteSettings();

  return (
    <Section className="pt-16 sm:pt-20">
      <SectionHeading title="Terms of service" />
      <div className="prose-lesson mt-8">
        <h2>1. The course</h2>
        <p>
          {settings.site_name} sells access to the SuperChad course, an educational course covering
          grooming, skincare, hairstyle, clothing, fitness, posture and personal presentation. The
          current price is {formatPrice(settings.course_price, settings.currency)}, a one-time
          payment for lifetime access to published lessons.
        </p>

        <h2>2. Manual enrollment</h2>
        <p>
          This site does not process payments directly. You pay externally using the instructions
          shown on the Enroll page, then submit an enrollment form with your payment reference. Our
          team manually verifies each submission before granting access. We never ask for card
          numbers, CVVs, OTPs, or account passwords through the enrollment form.
        </p>

        <h2>3. Refunds</h2>
        <p>
          Refund requests are handled case by case. Contact us at {settings.contact_email} within 7
          days of approval if you believe you are eligible for a refund.
        </p>

        <h2>4. No medical advice</h2>
        <p>
          Content in this course is general education about grooming, skincare, fitness and
          presentation habits. It is not medical, dermatological or professional health advice, and
          it does not replace consultation with a qualified professional.
        </p>

        <h2>5. No guarantees about outcomes</h2>
        <p>
          We do not promise that completing this course will change your relationships, popularity,
          or social status. Results from habits vary by person, and appearance does not determine
          your worth.
        </p>

        <h2>6. Account and access</h2>
        <p>
          You are responsible for keeping your account credentials secure. Access may be suspended
          for abuse, sharing of account access, or fraudulent enrollment submissions.
        </p>

        <h2>7. Changes</h2>
        <p>We may update these terms from time to time. Continued use of the site after a change constitutes acceptance of the update.</p>

        <h2>8. Contact</h2>
        <p>Questions about these terms can be sent to {settings.contact_email}.</p>
      </div>
    </Section>
  );
}
