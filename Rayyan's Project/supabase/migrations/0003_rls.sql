-- ============================================================================
-- Rewirs / SuperChad course platform
-- Migration 0003: Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.site_settings enable row level security;
alter table public.faqs enable row level security;
alter table public.contact_messages enable row level security;
alter table public.announcements enable row level security;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin(auth.uid()));

create policy "profiles_insert_admin_only"
  on public.profiles for insert
  with check (public.is_admin(auth.uid()));
  -- Normal signups are created by the handle_new_user() trigger (security
  -- definer), which bypasses RLS entirely, so this only governs direct inserts.

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin(auth.uid()))
  with check (id = auth.uid() or public.is_admin(auth.uid()));
  -- The guard_profile_update trigger further blocks role/suspended changes
  -- by non-admins even though this policy allows the row update itself.

create policy "profiles_delete_admin_only"
  on public.profiles for delete
  using (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- courses
-- ----------------------------------------------------------------------------
create policy "courses_select_published_or_admin"
  on public.courses for select
  using (published = true or public.is_admin(auth.uid()));

create policy "courses_write_admin_only"
  on public.courses for insert
  with check (public.is_admin(auth.uid()));

create policy "courses_update_admin_only"
  on public.courses for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "courses_delete_admin_only"
  on public.courses for delete
  using (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- modules
-- ----------------------------------------------------------------------------
create policy "modules_select_published_or_admin"
  on public.modules for select
  using (
    public.is_admin(auth.uid())
    or (
      published = true
      and exists (select 1 from public.courses c where c.id = course_id and c.published = true)
    )
  );

create policy "modules_write_admin_only"
  on public.modules for insert
  with check (public.is_admin(auth.uid()));

create policy "modules_update_admin_only"
  on public.modules for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "modules_delete_admin_only"
  on public.modules for delete
  using (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- lessons - the protected content table
-- ----------------------------------------------------------------------------
create policy "lessons_select_admin"
  on public.lessons for select
  using (public.is_admin(auth.uid()));

create policy "lessons_select_preview"
  on public.lessons for select
  using (
    published = true
    and is_preview = true
    and exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id and m.published = true and c.published = true
    )
  );

create policy "lessons_select_enrolled"
  on public.lessons for select
  using (
    published = true
    and exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id
        and m.published = true
        and c.published = true
        and public.has_course_access(auth.uid(), c.id)
    )
  );

create policy "lessons_write_admin_only"
  on public.lessons for insert
  with check (public.is_admin(auth.uid()));

create policy "lessons_update_admin_only"
  on public.lessons for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "lessons_delete_admin_only"
  on public.lessons for delete
  using (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- enrollments
-- ----------------------------------------------------------------------------
create policy "enrollments_select_own_or_admin"
  on public.enrollments for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "enrollments_insert_own"
  on public.enrollments for insert
  with check (user_id = auth.uid());
  -- guard_enrollment_insert trigger forces user_id/status regardless.

create policy "enrollments_update_own_or_admin"
  on public.enrollments for update
  using (user_id = auth.uid() or public.is_admin(auth.uid()))
  with check (user_id = auth.uid() or public.is_admin(auth.uid()));
  -- guard_enrollment_update trigger restricts exactly what a non-admin may change.

create policy "enrollments_delete_admin_only"
  on public.enrollments for delete
  using (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- lesson_progress
-- ----------------------------------------------------------------------------
create policy "lesson_progress_select_own_or_admin"
  on public.lesson_progress for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "lesson_progress_insert_own"
  on public.lesson_progress for insert
  with check (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "lesson_progress_update_own_or_admin"
  on public.lesson_progress for update
  using (user_id = auth.uid() or public.is_admin(auth.uid()))
  with check (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "lesson_progress_delete_own_or_admin"
  on public.lesson_progress for delete
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- site_settings
-- ----------------------------------------------------------------------------
create policy "site_settings_select_all"
  on public.site_settings for select
  using (true);

create policy "site_settings_update_admin_only"
  on public.site_settings for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "site_settings_insert_admin_only"
  on public.site_settings for insert
  with check (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- faqs
-- ----------------------------------------------------------------------------
create policy "faqs_select_published_or_admin"
  on public.faqs for select
  using (published = true or public.is_admin(auth.uid()));

create policy "faqs_write_admin_only"
  on public.faqs for insert
  with check (public.is_admin(auth.uid()));

create policy "faqs_update_admin_only"
  on public.faqs for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "faqs_delete_admin_only"
  on public.faqs for delete
  using (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- contact_messages - anyone (including anonymous visitors) may submit one;
-- only admins may read or manage the inbox.
-- ----------------------------------------------------------------------------
create policy "contact_messages_insert_anyone"
  on public.contact_messages for insert
  with check (true);

create policy "contact_messages_select_admin_only"
  on public.contact_messages for select
  using (public.is_admin(auth.uid()));

create policy "contact_messages_update_admin_only"
  on public.contact_messages for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "contact_messages_delete_admin_only"
  on public.contact_messages for delete
  using (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- announcements
-- ----------------------------------------------------------------------------
create policy "announcements_select_published_or_admin"
  on public.announcements for select
  using (published = true or public.is_admin(auth.uid()));

create policy "announcements_write_admin_only"
  on public.announcements for insert
  with check (public.is_admin(auth.uid()));

create policy "announcements_update_admin_only"
  on public.announcements for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "announcements_delete_admin_only"
  on public.announcements for delete
  using (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- storage buckets
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('course-media', 'course-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- course-media: public read (thumbnails etc.), admin-only write
create policy "course_media_public_read"
  on storage.objects for select
  using (bucket_id = 'course-media');

create policy "course_media_admin_write"
  on storage.objects for insert
  with check (bucket_id = 'course-media' and public.is_admin(auth.uid()));

create policy "course_media_admin_update"
  on storage.objects for update
  using (bucket_id = 'course-media' and public.is_admin(auth.uid()));

create policy "course_media_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'course-media' and public.is_admin(auth.uid()));

-- payment-proofs: private. Owner may upload into their own user-id-prefixed
-- folder and read their own files; admins may read/manage all.
create policy "payment_proofs_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "payment_proofs_owner_or_admin_read"
  on storage.objects for select
  using (
    bucket_id = 'payment-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin(auth.uid())
    )
  );

create policy "payment_proofs_admin_manage"
  on storage.objects for update
  using (bucket_id = 'payment-proofs' and public.is_admin(auth.uid()));

create policy "payment_proofs_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'payment-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin(auth.uid())
    )
  );
