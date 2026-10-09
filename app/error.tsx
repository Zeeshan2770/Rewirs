"use client";

import { useEffect } from "react";
import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-2xl text-ink-100">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-ink-500">
        An unexpected error occurred. You can try again, or head back to the homepage.
      </p>
      <div className="mt-6">
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </Section>
  );
}
