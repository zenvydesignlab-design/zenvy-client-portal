create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'client' check (role in ('admin', 'client')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  status text not null default 'Discovery',
  progress integer not null default 0 check (progress between 0 and 100),
  description text,
  deadline date,
  drive_folder_url text,
  drive_folder_id text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sender text not null check (sender in ('admin', 'client')),
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  file_url text not null,
  file_path text,
  name text,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  question text not null,
  type text not null default 'textarea' check (type in ('text', 'textarea', 'dropdown', 'multiple_choice', 'file')),
  options jsonb not null default '[]'::jsonb,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  client_id uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  client_email text,
  client_name text,
  invoice_number text not null,
  title text default 'Invoice',
  description text,
  amount numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  currency text not null default 'INR',
  status text not null default 'pending' check (status in ('paid', 'pending', 'overdue', 'void')),
  due_date date,
  payment_terms text,
  pdf_url text,
  notes text,
  line_items jsonb not null default '[]'::jsonb,
  tax_rate numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  client_id uuid references public.users(id) on delete set null,
  client_email text,
  client_name text,
  title text default 'Project Agreement',
  project_scope text,
  scope text,
  deliverables jsonb not null default '[]'::jsonb,
  timeline text,
  timelines text,
  payment_terms text,
  revisions text,
  revision_limits text,
  ownership_clause text,
  cancellation_clause text,
  ownership_terms text,
  cancellation_terms text,
  notes text,
  signatures jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'sent', 'approved', 'archived')),
  signed boolean not null default false,
  signed_by text,
  signed_email text,
  signed_at timestamptz,
  signature_ip text,
  agreement_version text not null default 'v1.0',
  contract_url text,
  pdf_url text,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null default 'Project call',
  starts_at timestamptz,
  meeting_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  asset_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'revision_requested')),
  feedback text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  audience text check (audience in ('admin', 'client')),
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists invoices_project_id_idx
on public.invoices (project_id);

create index if not exists invoices_project_status_idx
on public.invoices (project_id, status);

create index if not exists invoices_due_date_idx
on public.invoices (due_date);

create index if not exists invoices_created_by_idx
on public.invoices (created_by);

create index if not exists invoices_client_id_idx
on public.invoices (client_id);

create index if not exists invoices_status_idx
on public.invoices (status);

create index if not exists contracts_project_id_idx
on public.contracts (project_id);

create index if not exists contracts_created_by_idx
on public.contracts (created_by);

create index if not exists contracts_client_id_idx
on public.contracts (client_id);

create index if not exists contracts_status_idx
on public.contracts (status);

create index if not exists contracts_signed_idx
on public.contracts (signed);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade default auth.uid(),
  answer text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, user_id)
);

create table if not exists public.questionnaire_templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  name text not null default 'Project questionnaire',
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  submitted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  unique (user_id, project_id)
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_project_client(project_id_text text, user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select case
    when project_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then exists (
        select 1
        from public.projects
        where id = project_id_text::uuid
          and client_id = user_id
      )
    else false
  end;
$$;

create or replace function public.sign_contract(
  contract_id uuid,
  signer_name text,
  signer_email text
)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  signed_contract public.contracts;
  request_headers jsonb;
  request_ip text;
begin
  if nullif(trim(signer_name), '') is null then
    raise exception 'Signer name is required';
  end if;

  if nullif(trim(signer_email), '') is null then
    raise exception 'Signer email is required';
  end if;

  request_headers := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  request_ip := coalesce(
    request_headers->>'x-forwarded-for',
    request_headers->>'cf-connecting-ip',
    request_headers->>'x-real-ip'
  );

  update public.contracts
  set status = 'approved',
      signed = true,
      signed_by = trim(signer_name),
      signed_email = trim(signer_email),
      signed_at = now(),
      signature_ip = nullif(split_part(coalesce(request_ip, ''), ',', 1), ''),
      agreement_version = coalesce(nullif(agreement_version, ''), 'v1.0'),
      updated_at = now()
  where id = contract_id
    and (
      public.is_admin()
      or exists (
        select 1
        from public.projects
        where projects.id = contracts.project_id
          and projects.client_id = auth.uid()
      )
    )
  returning * into signed_contract;

  if signed_contract.id is null then
    raise exception 'Contract is unavailable or not assigned to this user';
  end if;

  return signed_contract;
end;
$$;

grant execute on function public.sign_contract(uuid, text, text) to authenticated;

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.messages enable row level security;
alter table public.files enable row level security;
alter table public.invoices enable row level security;
alter table public.contracts enable row level security;
alter table public.meetings enable row level security;
alter table public.approvals enable row level security;
alter table public.notifications enable row level security;
alter table public.questionnaire_templates enable row level security;
alter table public.questionnaire_responses enable row level security;

drop policy if exists "Users can read own profile or admins read all" on public.users;
create policy "Users can read own profile or admins read all"
on public.users for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "Admins can manage users" on public.users;
create policy "Admins can manage users"
on public.users for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Clients read assigned projects" on public.projects;
create policy "Clients read assigned projects"
on public.projects for select
using (client_id = auth.uid() or public.is_admin());

drop policy if exists "Admins manage projects" on public.projects;
create policy "Admins manage projects"
on public.projects for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Project participants read messages" on public.messages;
create policy "Project participants read messages"
on public.messages for select
using (
  public.is_admin()
  or exists (
    select 1 from public.projects
    where projects.id = messages.project_id
    and projects.client_id = auth.uid()
  )
);

drop policy if exists "Project participants send messages" on public.messages;
create policy "Project participants send messages"
on public.messages for insert
with check (
  (public.is_admin() and sender = 'admin')
  or (
    sender = 'client'
    and exists (
    select 1 from public.projects
    where projects.id = messages.project_id
    and projects.client_id = auth.uid()
    )
  )
);

drop policy if exists "Project participants read files" on public.files;
create policy "Project participants read files"
on public.files for select
using (
  public.is_admin()
  or exists (
    select 1 from public.projects
    where projects.id = files.project_id
    and projects.client_id = auth.uid()
  )
);

drop policy if exists "Admins manage questionnaire templates" on public.questionnaire_templates;
create policy "Admins manage questionnaire templates"
on public.questionnaire_templates for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Project participants read questionnaire templates" on public.questionnaire_templates;
create policy "Project participants read questionnaire templates"
on public.questionnaire_templates for select
using (
  public.is_admin()
  or project_id is null
  or exists (
    select 1 from public.projects
    where projects.id = questionnaire_templates.project_id
    and projects.client_id = auth.uid()
  )
);

drop policy if exists "Project participants read questionnaire responses" on public.questionnaire_responses;
create policy "Project participants read questionnaire responses"
on public.questionnaire_responses for select
using (
  public.is_admin()
  or user_id = auth.uid()
);

drop policy if exists "Clients manage own questionnaire responses" on public.questionnaire_responses;
create policy "Clients manage own questionnaire responses"
on public.questionnaire_responses for all
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.projects
    where projects.id = questionnaire_responses.project_id
    and projects.client_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.projects
    where projects.id = questionnaire_responses.project_id
    and projects.client_id = auth.uid()
  )
);

drop policy if exists "Admins manage files" on public.files;
create policy "Admins manage files"
on public.files for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Project participants insert files" on public.files;
create policy "Project participants insert files"
on public.files for insert
with check (
  user_id = auth.uid()
  and (
    public.is_admin()
    or exists (
      select 1 from public.projects
      where projects.id = files.project_id
      and projects.client_id = auth.uid()
    )
  )
);

drop policy if exists "Project participants read invoices" on public.invoices;
create policy "Project participants read invoices"
on public.invoices for select
using (
  public.is_admin()
  or exists (
    select 1 from public.projects
    where projects.id = invoices.project_id
    and projects.client_id = auth.uid()
  )
);

drop policy if exists "Admins manage invoices" on public.invoices;
drop policy if exists "Admins insert invoices" on public.invoices;
create policy "Admins insert invoices"
on public.invoices for insert
with check (
  public.is_admin()
  and (created_by is null or created_by = auth.uid())
);

drop policy if exists "Admins update invoices" on public.invoices;
create policy "Admins update invoices"
on public.invoices for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins delete invoices" on public.invoices;
create policy "Admins delete invoices"
on public.invoices for delete
using (public.is_admin());

drop policy if exists "Project participants read contracts" on public.contracts;
create policy "Project participants read contracts"
on public.contracts for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.projects
    where projects.id = contracts.project_id
    and projects.client_id = auth.uid()
  )
);

drop policy if exists "Admins insert contracts" on public.contracts;
create policy "Admins insert contracts"
on public.contracts for insert
with check (
  public.is_admin()
  and (created_by is null or created_by = auth.uid())
);

drop policy if exists "Admins update contracts" on public.contracts;
create policy "Admins update contracts"
on public.contracts for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins delete contracts" on public.contracts;
create policy "Admins delete contracts"
on public.contracts for delete
using (public.is_admin());

drop policy if exists "Project participants read meetings" on public.meetings;
create policy "Project participants read meetings"
on public.meetings for select
using (
  public.is_admin()
  or exists (
    select 1 from public.projects
    where projects.id = meetings.project_id
    and projects.client_id = auth.uid()
  )
);

drop policy if exists "Admins manage meetings" on public.meetings;
create policy "Admins manage meetings"
on public.meetings for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Project participants read approvals" on public.approvals;
create policy "Project participants read approvals"
on public.approvals for select
using (
  public.is_admin()
  or exists (
    select 1 from public.projects
    where projects.id = approvals.project_id
    and projects.client_id = auth.uid()
  )
);

drop policy if exists "Admins create approvals" on public.approvals;
create policy "Admins create approvals"
on public.approvals for insert
with check (public.is_admin());

drop policy if exists "Project participants update approvals" on public.approvals;
create policy "Project participants update approvals"
on public.approvals for update
using (
  public.is_admin()
  or exists (
    select 1 from public.projects
    where projects.id = approvals.project_id
    and projects.client_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.projects
    where projects.id = approvals.project_id
    and projects.client_id = auth.uid()
  )
);

drop policy if exists "Project participants read questions" on public.questions;
create policy "Project participants read questions"
on public.questions for select
using (
  public.is_admin()
  or exists (
    select 1 from public.projects
    where projects.id = questions.project_id
    and projects.client_id = auth.uid()
  )
);

drop policy if exists "Admins manage questions" on public.questions;
create policy "Admins manage questions"
on public.questions for all
using (public.is_admin());

drop policy if exists "Clients answer assigned project questions" on public.answers;
create policy "Clients answer assigned project questions"
on public.answers for all
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.questions
    join public.projects on projects.id = questions.project_id
    where questions.id = answers.question_id
      and projects.client_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.questions
    join public.projects on projects.id = questions.project_id
    where questions.id = answers.question_id
      and projects.client_id = auth.uid()
  )
);

drop policy if exists "Admins read all answers" on public.answers;
create policy "Admins read all answers"
on public.answers for select
using (public.is_admin());

drop policy if exists "Admins manage notifications" on public.notifications;
create policy "Admins manage notifications"
on public.notifications for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users read assigned notifications" on public.notifications;
create policy "Users read assigned notifications"
on public.notifications for select
using (
  public.is_admin()
  or user_id = auth.uid()
  or audience in (
    select role from public.users where id = auth.uid()
  )
);

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
on public.notifications for update
using (
  user_id = auth.uid()
  or audience in (
    select role from public.users where id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  or audience in (
    select role from public.users where id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', true)
on conflict (id) do nothing;

drop policy if exists "Admins upload project files" on storage.objects;
create policy "Admins upload project files"
on storage.objects for insert
with check (
  bucket_id = 'project-files'
  and public.is_admin()
);

drop policy if exists "Clients upload assigned project files" on storage.objects;
create policy "Clients upload assigned project files"
on storage.objects for insert
with check (
  bucket_id = 'project-files'
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.is_project_client((storage.foldername(name))[1], auth.uid())
);

drop policy if exists "Admins update project files" on storage.objects;
create policy "Admins update project files"
on storage.objects for update
using (
  bucket_id = 'project-files'
  and public.is_admin()
)
with check (
  bucket_id = 'project-files'
  and public.is_admin()
);

drop policy if exists "Admins delete project files" on storage.objects;
create policy "Admins delete project files"
on storage.objects for delete
using (
  bucket_id = 'project-files'
  and public.is_admin()
);

drop policy if exists "Authenticated users read project files bucket" on storage.objects;
create policy "Authenticated users read project files bucket"
on storage.objects for select
using (
  bucket_id = 'project-files'
  and (
    public.is_admin()
    or public.is_project_client((storage.foldername(name))[1], auth.uid())
  )
);
