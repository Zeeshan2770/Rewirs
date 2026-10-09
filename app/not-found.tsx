import Link from "next/link";
import { Section } from "@/components/section";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-display text-6xl text-ink-700">404</p>
      <h1 className="mt-4 font-display text-2xl text-ink-100">Page not found</h1>
      <p className="mt-2 text-ink-500">The page you're looking for doesn't exist or has moved.</p>
      <div className="mt-6 flex gap-3">
        <ButtonLink href="/">Back home</ButtonLink>
        <Link href="/course" className="rounded-full border border-base-700 px-4 py-2.5 text-sm text-ink-100">
          View course
        </Link>
      </div>
    </Section>
  );
}
