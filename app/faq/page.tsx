import type { Metadata } from "next";
import { FaqClient } from "./faq-client";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about enrollment, payment and access.",
};

export default function FaqPage() {
  return <FaqClient />;
}
