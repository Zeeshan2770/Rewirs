-- ============================================================================
-- Rewirs / SuperChad course platform
-- Migration 0001: core schema
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  avatar_url text,
  role text not null default 'student' check (role in ('student', 'admin')),
  suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

-- ----------------------------------------------------------------------------
-- courses
-- ----------------------------------------------------------------------------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  short_description text not null default '',
  price numeric(10, 2) not null default 0,
  currency text not null default 'PKR',
  thumbnail_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- modules
-- ----------------------------------------------------------------------------
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  slug text not null,
  description text not null default '',
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug)
);

create index if not exists modules_course_idx on public.modules (course_id, sort_order);

-- ----------------------------------------------------------------------------
-- lessons
-- ----------------------------------------------------------------------------
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  slug text not null,
  description text not null default '',
  video_url text,
  thumbnail_url text,
  content text not null default '',
  key_takeaways text[] not null default '{}',
  checklist text[] not null default '{}',
  sort_order integer not null default 0,
  is_preview boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug)
);

create index if not exists lessons_module_idx on public.lessons (module_id, sort_order);

-- ----------------------------------------------------------------------------
-- enrollments
-- ----------------------------------------------------------------------------
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  payment_method text not null,
  amount numeric(10, 2) not null,
  currency text not null default 'PKR',
  transaction_reference text not null,
  payment_date date not null,
  payment_proof_path text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  admin_note text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enrollments_user_idx on public.enrollments (user_id);
create index if not exists enrollments_course_idx on public.enrollments (course_id);
create index if not exists enrollments_status_idx on public.enrollments (status);

-- Only one active (pending/approved) enrollment per user per course
create unique index if not exists enrollments_active_unique
  on public.enrollments (user_id, course_id)
  where (status in ('pending', 'approved'));

-- ----------------------------------------------------------------------------
-- lesson_progress
-- ----------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists lesson_progress_user_idx on public.lesson_progress (user_id);

-- ----------------------------------------------------------------------------
-- site_settings (single row)
-- ----------------------------------------------------------------------------
create table if not exists public.site_settings (
  id boolean primary key default true constraint site_settings_singleton check (id = true),
  site_name text not null default 'Rewirs',
  site_description text not null default 'A structured course on grooming, style and presentation.',
  creator_name text not null default 'Rayyan Naeem',
  contact_email text not null default 'chapathan001@gmail.com',
  instagram_url text not null default 'https://www.instagram.com/golden_rayan10/',
  youtube_url text not null default 'https://www.youtube.com/@Rewirs_yt',
  course_price numeric(10, 2) not null default 750,
  currency text not null default 'PKR',
  payment_instructions text not null default 'Send payment via JazzCash / Easypaisa / Bank Transfer to the details we will share on request, then submit the enrollment form with your transaction reference.',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (true) on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- faqs
-- ----------------------------------------------------------------------------
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- contact_messages
-- ----------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'unread' check (status in ('unread', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- announcements
-- ----------------------------------------------------------------------------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
