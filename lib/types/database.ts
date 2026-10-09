export type Role = "student" | "admin";
export type EnrollmentStatus = "pending" | "approved" | "rejected" | "cancelled";
export type MessageStatus = "unread" | "read" | "replied" | "archived";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: Role;
  suspended: boolean;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  currency: string;
  thumbnail_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  description: string;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  description: string;
  video_url: string | null;
  thumbnail_url: string | null;
  content: string;
  key_takeaways: string[];
  checklist: string[];
  sort_order: number;
  is_preview: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  full_name: string;
  email: string;
  phone: string;
  payment_method: string;
  amount: number;
  currency: string;
  transaction_reference: string;
  payment_date: string;
  payment_proof_path: string | null;
  message: string | null;
  status: EnrollmentStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: true;
  site_name: string;
  site_description: string;
  creator_name: string;
  contact_email: string;
  instagram_url: string;
  youtube_url: string;
  course_price: number;
  currency: string;
  payment_instructions: string;
  updated_at: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: MessageStatus;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  published: boolean;
  created_at: string;
}

type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      courses: TableDef<Course>;
      modules: TableDef<CourseModule>;
      lessons: TableDef<Lesson>;
      enrollments: TableDef<Enrollment>;
      lesson_progress: TableDef<LessonProgress>;
      site_settings: TableDef<SiteSettings>;
      faqs: TableDef<Faq>;
      contact_messages: TableDef<ContactMessage>;
      announcements: TableDef<Announcement>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
