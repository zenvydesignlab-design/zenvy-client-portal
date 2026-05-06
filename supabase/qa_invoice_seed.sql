with qa as (
  select
    '11111111-1111-4111-8111-111111111111'::uuid as admin_id,
    '22222222-2222-4222-8222-222222222222'::uuid as client_id,
    '33333333-3333-4333-8333-333333333333'::uuid as other_client_id,
    '44444444-4444-4444-8444-444444444444'::uuid as project_id,
    '55555555-5555-4555-8555-555555555555'::uuid as other_project_id,
    '66666666-6666-4666-8666-666666666666'::uuid as invoice_id
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  is_sso_user,
  is_anonymous
)
select
  '00000000-0000-0000-0000-000000000000',
  id,
  'authenticated',
  'authenticated',
  email,
  crypt('ZenvyQA!2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  now(),
  now(),
  null,
  false,
  false
from (
  select admin_id as id, 'zenvy.qa.admin@example.com' as email from qa
  union all
  select client_id as id, 'zenvy.qa.client@example.com' as email from qa
  union all
  select other_client_id as id, 'zenvy.qa.other@example.com' as email from qa
) users_to_seed
on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = now(),
  updated_at = now(),
  deleted_at = null;

with qa as (
  select
    '11111111-1111-4111-8111-111111111111'::uuid as admin_id,
    '22222222-2222-4222-8222-222222222222'::uuid as client_id,
    '33333333-3333-4333-8333-333333333333'::uuid as other_client_id
)
insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  email
)
select
  id,
  id::text,
  id,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  now(),
  now(),
  now(),
  email
from (
  select admin_id as id, 'zenvy.qa.admin@example.com' as email from qa
  union all
  select client_id as id, 'zenvy.qa.client@example.com' as email from qa
  union all
  select other_client_id as id, 'zenvy.qa.other@example.com' as email from qa
) identities_to_seed
on conflict (provider, provider_id) do update set
  identity_data = excluded.identity_data,
  updated_at = now(),
  email = excluded.email;

insert into public.users (id, email, role, status)
values
  ('11111111-1111-4111-8111-111111111111', 'zenvy.qa.admin@example.com', 'admin', 'active'),
  ('22222222-2222-4222-8222-222222222222', 'zenvy.qa.client@example.com', 'client', 'active'),
  ('33333333-3333-4333-8333-333333333333', 'zenvy.qa.other@example.com', 'client', 'active')
on conflict (id) do update set
  email = excluded.email,
  role = excluded.role,
  status = excluded.status;

insert into public.projects (
  id,
  client_id,
  name,
  status,
  progress,
  description,
  deadline,
  drive_folder_url,
  drive_folder_id,
  updated_at
)
values
  (
    '44444444-4444-4444-8444-444444444444',
    '22222222-2222-4222-8222-222222222222',
    'QA Invoice Project',
    'Review',
    72,
    'Temporary project for invoice workflow QA.',
    current_date + interval '14 days',
    'https://drive.google.com/drive/folders/qa-folder',
    'qa-folder',
    now()
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    '33333333-3333-4333-8333-333333333333',
    'Other Client Project',
    'Discovery',
    15,
    'Temporary isolation project for invoice RLS QA.',
    current_date + interval '21 days',
    null,
    null,
    now()
  )
on conflict (id) do update set
  client_id = excluded.client_id,
  name = excluded.name,
  status = excluded.status,
  progress = excluded.progress,
  description = excluded.description,
  deadline = excluded.deadline,
  drive_folder_url = excluded.drive_folder_url,
  drive_folder_id = excluded.drive_folder_id,
  updated_at = now();

insert into public.invoices (
  id,
  project_id,
  created_by,
  invoice_number,
  title,
  amount,
  status,
  due_date,
  pdf_url,
  notes,
  created_at,
  updated_at
)
values (
  '66666666-6666-4666-8666-666666666666',
  '44444444-4444-4444-8444-444444444444',
  '11111111-1111-4111-8111-111111111111',
  'INV-QA-001',
  'QA kickoff invoice',
  42500,
  'pending',
  current_date + interval '7 days',
  'https://drive.google.com/file/d/1QaInvoicePdfPreview/view?usp=sharing',
  'Seeded invoice for end-to-end QA.',
  now(),
  now()
)
on conflict (id) do update set
  invoice_number = excluded.invoice_number,
  title = excluded.title,
  amount = excluded.amount,
  status = excluded.status,
  due_date = excluded.due_date,
  pdf_url = excluded.pdf_url,
  notes = excluded.notes,
  updated_at = now();
