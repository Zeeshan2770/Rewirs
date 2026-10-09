"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Section, SectionHeading } from "@/components/section";
import { Spinner } from "@/components/route-guards";
import type { Faq } from "@/lib/types/database";

export function FaqClient() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<Faq[]>([]);

  useEffect(() => {
    supabase
      .from("faqs")
      .select("*")
      .eq("published", true)
      .order("sort_order")
      .then(({ data }) => {
        setFaqs(data ?? []);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Section className="pt-16 sm:pt-20">
      <SectionHeading title="Frequently asked questions" />
      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-10 divide-y divide-base-800 border-y border-base-800">
          {faqs.map((faq) => (
            <details key={faq.id} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-ink-100">
                {faq.question}
                <span className="ml-4 text-ink-600 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">{faq.answer}</p>
            </details>
          ))}
          {faqs.length === 0 && <p className="py-6 text-sm text-ink-600">No questions published yet.</p>}
        </div>
      )}
    </Section>
  );
}
