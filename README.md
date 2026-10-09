# Rewirs — SuperChad Course Platform

A premium online course platform for creator **Rayyan Naeem**. This is a **fully static site**
that talks directly to Supabase from the browser — there is no server, no functions, and no
build-time content baking for anything that matters day to day. Deploy once, then manage
everything (courses, modules, lessons, enrollments, students, settings) from the live `/admin`
panel with no redeploy required.

Enrollment is **manual**: there is no payment gateway. Students pay externally, submit an
enrollment form with their payment reference, and an admin reviews and approves/rejects it from
`/admin/enrollments`.

---

## 1. How this is different from a typical Next.js app

Every page in this app is a **static HTML/JS file**. All real data - courses, modules, lessons,
enrollments, progress, site settings - is fetched **directly from Supabase in the browser**,
using the public `anon` key. There is no Next.js server, no Server Actions, no middleware, and no
API routes anywhere in this project.

Security still holds up because **Postgres Row Level Security (RLS) is the actual enforcement
layer**, not the app. Every table has RLS policies that check the signed-in user's own session
(`auth.uid()`) - a student can never read another student's data, approve their own enrollment, or
touch admin-only tables, no matter what requests their browser sends. The app's own "is this an
admin" checks (in `lib/auth-context.tsx` / `components/route-guards.tsx`) are just for a smooth
UI (hiding the admin nav, redirecting to `/login`) - they are not what's keeping data safe.

This means deployment really is just: **build once, drag-and-drop the output folder, done.**

---

## 2. Project structure

```
app/                    Routes (Next.js App Router, output: 'export')
  admin/                Admin panel - all client components, gated by <RequireAdmin>
  dashboard/ learn/ profile/   Student area - all client components, gated by <RequireAuth>
  login/ signup/ forgot-password/ reset-password/   Auth (browser Supabase client)
  enroll/               Manual enrollment form (fully live)
  (marketing pages: /, /course, /faq are live-fetched; /about /contact /terms /privacy
   use settings baked in at build time since they rarely change)
components/             Shared React components (ui/ = primitives)
  route-guards.tsx        <RequireAuth> / <RequireAdmin> client-side redirects
lib/
  supabase/client.ts       Browser Supabase client (localStorage session) - used everywhere
  supabase/public.ts       Session-less client used only at build time for static pages
  auth-context.tsx         React context exposing the current user/profile
  settings.ts              Build-time site_settings fetch (about/terms/privacy/contact/layout only)
  types/database.ts        Hand-written types matching the SQL schema
supabase/
  migrations/            Run these against your Supabase project, in order
```

---

## 3. Set up Supabase (the only backend)

### 3.1 Create a project

Create a project at https://supabase.com. From **Project Settings → API**, copy:
- Project URL
- `anon` public key

(You do **not** need the `service_role` key for anything in this app - every admin action runs
under the signed-in admin's own RLS-authorized session.)

### 3.2 Run the migrations

Open the Supabase **SQL Editor** and run the files in `supabase/migrations/`, **in order**:

1. `0001_schema.sql` — tables
2. `0002_functions_triggers.sql` — helper functions + security triggers
3. `0003_rls.sql` — Row Level Security policies + storage buckets/policies
4. `0004_seed.sql` — starter course, modules, one lesson, and FAQs (edit/delete later from admin)

### 3.3 Set Auth URLs

**Authentication → URL Configuration**:
- **Site URL**: your live site's URL (fill this in after step 5 below; `http://localhost:3000`
  works for local testing in the meantime)
- **Redirect URLs**: add `<your-url>/dashboard/` and `<your-url>/reset-password/`

### 3.4 Create your admin account

1. Deploy the site first (§4), or run it locally with `npm run dev`.
2. Sign up through `/signup/` — this always creates a **student** account. The database trigger
   `handle_new_user()` forces `role = 'student'` no matter what the client sends, so there is no
   way to self-promote to admin from the UI.
3. In Supabase **Table Editor → profiles**, find your row and change `role` to `admin`.
4. Log out and back in (or just refresh) — you'll land on `/admin/` instead of `/dashboard/`.

### 3.5 Fill in real settings

Go to `/admin/settings` on your live site and set the real payment instructions
(JazzCash/Easypaisa/bank details), price, and contact/social links. This takes effect **immediately**
on the enroll page and everywhere else that reads settings live - no redeploy.

---

## 4. Deploy to Netlify (drag-and-drop, no Git required)

```bash
# 1. Unzip this project and open a terminal in it
cp .env.example .env.local
# edit .env.local with your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2. Install dependencies and build the static site
npm install
npm run build
```

This produces an `out/` folder containing the entire site as static files.

Then:
1. Go to https://app.netlify.com/drop (or **Sites → Add new site → Deploy manually** in your
   Netlify dashboard).
2. Drag the **`out/` folder** (not the whole project, just `out/`) onto the page.
3. Netlify uploads it and gives you a live URL immediately. That's it - no build step runs on
   Netlify's side, no functions, no server.
4. Go back to Supabase's **Auth → URL Configuration** and set the Site URL / Redirect URLs to
   match this real URL (see §3.3).

**To publish an update later** (new marketing copy, a design tweak, a dependency bump): run
`npm run build` again and drag the new `out/` folder onto the same site in Netlify (or onto
https://app.netlify.com/drop and it'll ask if you want to create a new site or you can drag onto
your existing site's "Deploys" tab). **Content updates** (courses, modules, lessons, enrollments,
FAQs, settings) never need this - they go through `/admin` and appear live immediately.

### Custom domain

Site settings → Domain management → Add a domain, in the Netlify dashboard. Once added, update
Supabase's Site URL/Redirect URLs to the new domain too.

---

## 5. What's live vs. what needs a rebuild

| Page | Data source | Rebuild needed after admin edits? |
|---|---|---|
| Home, Course, FAQ | Supabase, fetched in the browser | No |
| Enroll | Supabase, fetched in the browser | No |
| Dashboard, Learn, Lesson, Profile | Supabase, fetched in the browser | No |
| Admin (all pages) | Supabase, fetched in the browser | No |
| About, Contact, Terms, Privacy | Baked in at `npm run build` time | Yes, if you change creator name/email/social links/price copy on these specific pages |

The four pages in the last row only show static informational text (creator name, contact email,
social links, and a price mention) - they were left build-time for simplicity since that content
almost never changes. If you want them live too, say so and they can be converted the same way as
the others.

---

## 6. How the manual enrollment flow works

1. Student signs up / logs in.
2. `/enroll/` shows the live price and the admin-configured payment instructions.
3. Student pays externally, then submits the enrollment form (name, email, phone/WhatsApp,
   payment method, transaction reference, payment date, optional payment proof, optional
   message) directly to Supabase from the browser. **No card numbers, CVV, OTP, or passwords are
   ever collected.**
4. The row is inserted with `status = 'pending'` (forced by a DB trigger regardless of what the
   client sends).
5. Admin reviews it at `/admin/enrollments/`, optionally views the payment proof (via a
   short-lived signed URL generated client-side against a private storage bucket), and approves
   or rejects with an optional note.
6. Approved students get access to protected lessons immediately - enforced by RLS
   (`has_course_access()`), not just the UI.
7. A student may cancel their own **pending** request; a DB trigger blocks any other
   self-service status change (e.g. self-approval).
8. Duplicate active (pending/approved) enrollments per user/course are blocked by a partial
   unique index in Postgres, not just app logic.

---

## 7. Security model

- **Every** sensitive table has Row Level Security enabled (`supabase/migrations/0003_rls.sql`).
  Since the app talks to Supabase directly from the browser with only the `anon` key, RLS is the
  *entire* security boundary - there's no server layer to fall back on, so it was built to not
  need one.
- `handle_new_user()` (DB trigger) always creates new profiles as `role = 'student'`.
  `guard_profile_update()` (DB trigger) blocks any non-admin from changing their own `role` or
  `suspended` flag, even by calling the Supabase client directly with dev tools open.
- `guard_enrollment_insert()` / `guard_enrollment_update()` force safe defaults on insert and
  restrict students to a single allowed transition (`pending` → `cancelled` on their own row).
  Only an admin session can approve/reject.
- Lesson content is protected at the database layer: the `lessons_select_enrolled` RLS policy
  only returns non-preview lesson rows to users with an `approved` enrollment for that lesson's
  course. The `<RequireAuth>` redirect in `app/learn/**` is a UX nicety on top of this, not the
  actual security boundary - disabling JavaScript or calling the Supabase REST API directly
  changes nothing.
- Payment-proof uploads live in a **private** Storage bucket (`payment-proofs`); only the
  uploading student and admins can read them, via signed URLs.
- Course/lesson media lives in a **public** Storage bucket (`course-media`) but only admins can
  write to it (checked by RLS, not by the app).

---

## 8. Local development

```bash
npm install
npm run dev
```

Visit http://localhost:3000. `next dev` runs normally even with `output: 'export'` set - the
static-export behavior only applies to `npm run build`.

---

## 9. Before going live

- [ ] Run all four migrations against your production Supabase project
- [ ] Set `.env.local` (or your build environment) with the real Supabase URL/anon key
- [ ] `npm run build`, confirm `out/` is generated with no errors
- [ ] Drag `out/` onto Netlify
- [ ] Set Supabase Auth URL Configuration to your real deployed URL
- [ ] Promote your admin account (§3.4)
- [ ] Fill in real payment instructions and price in `/admin/settings`
- [ ] Replace/expand the seed modules and lessons with real content from `/admin`
