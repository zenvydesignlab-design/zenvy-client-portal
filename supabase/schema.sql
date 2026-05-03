create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'client' check (role in ('admin', 'client')),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  status text not null default 'Discovery',
  progress integer not null default 0 check (progress between 0 and 100),
  description text,
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
  type text not null default 'textarea' check (type in ('text', 'textarea', 'file')),
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

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

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.messages enable row level security;
alter table public.files enable row level security;
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
  and auth.role() = 'authenticated'
);
