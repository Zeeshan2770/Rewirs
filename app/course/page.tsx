import type { Metadata } from "next";
import { CourseClient } from "./course-client";

export const metadata: Metadata = {
  title: "Course",
  description: "The full SuperChad curriculum: grooming, skincare, hair, style, fitness, posture and confidence.",
};

export default function CoursePage() {
  return <CourseClient />;
}
