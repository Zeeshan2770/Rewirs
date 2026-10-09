-- ============================================================================
-- Rewirs / SuperChad course platform
-- Migration 0002: functions & triggers
-- ============================================================================

-- ----------------------------------------------------------------------------
-- updated_at helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

drop trigger if exists trg_modules_updated_at on public.modules;
create trigger trg_modules_updated_at before update on public.modules
  for each row execute function public.set_updated_at();

drop trigger if exists trg_lessons_updated_at on public.lessons;
create trigger trg_lessons_updated_at before update on public.lessons
  for each row execute function public.set_updated_at();

drop trigger if exists trg_enrollments_updated_at on public.enrollments;
create trigger trg_enrollments_updated_at before update on public.enrollments
  for each row execute function public.set_updated_at();

drop trigger if exists trg_lesson_progress_updated_at on public.lesson_progress;
create trigger trg_lesson_progress_updated_at before update on public.lesson_progress
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- is_admin(uid): security definer so it can read profiles regardless of the
-- caller's own RLS visibility. Used throughout RLS policies below.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p where p.id = uid and p.role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- has_course_access(uid, cid): true if the user has an approved enrollment
-- ----------------------------------------------------------------------------
create or replace function public.has_course_access(uid uuid, cid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.profiles p on p.id = e.user_id
    where e.user_id = uid
      and e.course_id = cid
      and e.status = 'approved'
      and coalesce(p.suspended, false) = false
  );
$$;

-- ----------------------------------------------------------------------------
-- New auth.users -> profiles row. Role is ALWAYS 'student' here; it can only
-- ever be promoted by an existing admin editing the row directly (service
-- role / trusted server code), never by the signing-up user.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Prevent self role-escalation and prevent students from suspending
-- themselves back to active. Only an admin caller may change role/suspended.
-- ----------------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    if new.role is distinct from old.role then
      raise exception 'Only an admin can change a profile role';
    end if;
    if new.suspended is distinct from old.suspended then
      raise exception 'Only an admin can change suspension status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_update on public.profiles;
create trigger trg_guard_profile_update before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ----------------------------------------------------------------------------
-- Enrollments: force safe defaults on insert regardless of client payload,
-- and restrict what a non-admin can change afterwards (only pending ->
-- cancelled, by the owner, with no other field changes).
-- ----------------------------------------------------------------------------
create or replace function public.guard_enrollment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.user_id := auth.uid();
  new.status := 'pending';
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.admin_note := null;
  return new;
end;
$$;

drop trigger if exists trg_guard_enrollment_insert on public.enrollments;
create trigger trg_guard_enrollment_insert before insert on public.enrollments
  for each row execute function public.guard_enrollment_insert();

create or replace function public.guard_enrollment_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin(auth.uid()) then
    new.reviewed_by := auth.uid();
    if new.status is distinct from old.status then
      new.reviewed_at := now();
    end if;
    return new;
  end if;

  -- Non-admins may only cancel their own still-pending request, and may not
  -- touch any other column.
  if old.user_id <> auth.uid() then
    raise exception 'Not authorized to modify this enrollment';
  end if;
  if old.status <> 'pending' or new.status <> 'cancelled' then
    raise exception 'Students may only cancel a pending enrollment';
  end if;
  if new.full_name is distinct from old.full_name
    or new.email is distinct from old.email
    or new.phone is distinct from old.phone
    or new.payment_method is distinct from old.payment_method
    or new.amount is distinct from old.amount
    or new.transaction_reference is distinct from old.transaction_reference
    or new.payment_date is distinct from old.payment_date
    or new.payment_proof_path is distinct from old.payment_proof_path
    or new.course_id is distinct from old.course_id
    or new.admin_note is distinct from old.admin_note
  then
    raise exception 'Students may not modify enrollment details';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_enrollment_update on public.enrollments;
create trigger trg_guard_enrollment_update before update on public.enrollments
  for each row execute function public.guard_enrollment_update();

-- ----------------------------------------------------------------------------
-- lesson_progress: force user_id to caller and require approved access to
-- the lesson's course before allowing a row to be written.
-- ----------------------------------------------------------------------------
create or replace function public.guard_lesson_progress_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
begin
  select m.course_id into v_course_id
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where l.id = new.lesson_id;

  if v_course_id is null then
    raise exception 'Lesson not found';
  end if;

  if not public.is_admin(auth.uid()) then
    new.user_id := auth.uid();
    if not public.has_course_access(auth.uid(), v_course_id) then
      raise exception 'No approved enrollment for this course';
    end if;
  end if;

  if tg_op = 'INSERT' then
    if new.completed then
      new.completed_at := now();
    else
      new.completed_at := null;
    end if;
  elsif tg_op = 'UPDATE' then
    if new.completed and not old.completed then
      new.completed_at := now();
    elsif not new.completed then
      new.completed_at := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_lesson_progress_insert on public.lesson_progress;
create trigger trg_guard_lesson_progress_insert before insert on public.lesson_progress
  for each row execute function public.guard_lesson_progress_write();

drop trigger if exists trg_guard_lesson_progress_update on public.lesson_progress;
create trigger trg_guard_lesson_progress_update before update on public.lesson_progress
  for each row execute function public.guard_lesson_progress_write();

-- ----------------------------------------------------------------------------
-- site_settings updated_at
-- ----------------------------------------------------------------------------
drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

drop trigger if exists trg_faqs_updated_at on public.faqs;
create trigger trg_faqs_updated_at before update on public.faqs
  for each row execute function public.set_updated_at();
