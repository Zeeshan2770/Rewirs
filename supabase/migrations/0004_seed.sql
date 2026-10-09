-- ============================================================================
-- Rewirs / SuperChad course platform
-- Migration 0004: starter content (safe to edit/remove from the admin panel)
-- ============================================================================

insert into public.courses (title, slug, description, short_description, price, currency, published)
values (
  'SuperChad',
  'superchad',
  'SuperChad is a structured, practical course on grooming, skincare, hairstyle, clothing, fitness and posture, built around consistent daily habits and honest presentation rather than shortcuts.',
  'A structured routine for grooming, style, fitness and confident presentation.',
  750,
  'PKR',
  true
)
on conflict (slug) do nothing;

do $$
declare
  v_course_id uuid;
  v_module_id uuid;
begin
  select id into v_course_id from public.courses where slug = 'superchad';

  insert into public.modules (course_id, title, slug, description, sort_order, published) values
    (v_course_id, 'Foundations', 'foundations', 'Why consistency beats intensity, and how to set a routine you will actually keep.', 1, true),
    (v_course_id, 'Grooming', 'grooming', 'Daily and weekly grooming habits that make the biggest visible difference.', 2, true),
    (v_course_id, 'Skincare', 'skincare', 'A simple, sustainable skincare routine suited to a beginner.', 3, true),
    (v_course_id, 'Hair & Hairstyle', 'hair-hairstyle', 'Choosing and maintaining a hairstyle that suits your face and lifestyle.', 4, true),
    (v_course_id, 'Clothing & Style', 'clothing-style', 'Building a small, versatile wardrobe and dressing for your body.', 5, true),
    (v_course_id, 'Fitness & Healthy Habits', 'fitness-healthy-habits', 'General, responsible guidance on movement, sleep and nutrition basics.', 6, true),
    (v_course_id, 'Posture & Presentation', 'posture-presentation', 'How you stand, sit and move changes how put-together you look.', 7, true),
    (v_course_id, 'Confidence', 'confidence', 'Practical, repeatable habits that build genuine confidence over time.', 8, true),
    (v_course_id, 'The Complete Routine', 'the-complete-routine', 'Putting every module together into one sustainable daily/weekly routine.', 9, true)
  on conflict (course_id, slug) do nothing;

  select id into v_module_id from public.modules where course_id = v_course_id and slug = 'foundations';

  insert into public.lessons (module_id, title, slug, description, content, key_takeaways, checklist, sort_order, is_preview, published)
  values (
    v_module_id,
    'Welcome to SuperChad',
    'welcome-to-superchad',
    'What this course covers, how it is structured, and how to get the most out of it.',
    E'This course is built around one idea: small, consistent habits compound into a noticeably better presentation over a few months. It is not about chasing perfection or believing that appearance decides your worth — it does not. It is about showing up as the most put-together, confident version of yourself.\n\nEach module below covers one area — grooming, skincare, hair, clothing, fitness, posture and confidence — and ends with a short practical checklist you can start using the same day. Work through the modules in order the first time, then revisit specific lessons whenever you need a refresher.',
    array['Consistency matters far more than intensity', 'This course focuses on habits, not shortcuts', 'Your worth is not defined by appearance — this course is about presentation and confidence, not self-worth'],
    array['Read through the Foundations module', 'Block 15 minutes on your calendar for a daily routine', 'Set a reminder to revisit your progress in two weeks'],
    1,
    true,
    true
  )
  on conflict (module_id, slug) do nothing;
end $$;

insert into public.faqs (question, answer, sort_order, published) values
  ('How do I get access after I pay?', 'Submit the enrollment form with your payment reference after sending payment. Our team manually verifies each payment and approves access, usually within 24-48 hours.', 1, true),
  ('What payment methods are accepted?', 'Check the Enroll page for the current list of accepted payment methods and instructions — this is configurable and may change from time to time.', 2, true),
  ('Is this course a substitute for medical or dermatological advice?', 'No. SuperChad is general educational content on grooming, style and habits. It is not medical advice, and you should consult a qualified professional for any health or skin concern.', 3, true),
  ('Can I get a refund?', 'See our Terms page for the current refund policy.', 4, true),
  ('Do I need any special equipment?', 'No. The course focuses on habits and routines that use everyday, affordable products.', 5, true)
on conflict do nothing;
