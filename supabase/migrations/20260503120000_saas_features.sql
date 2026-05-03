alter table public.files add column if not exists file_path text;

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

alter table public.questionnaire_templates enable row level security;
alter table public.questionnaire_responses enable row level security;

drop policy if exists "Project participants send messages" on public.messages;
create policy "Project participants send messages"
on public.messages for insert
with check (
  (public.is_admin() and sender = 'admin')
  or (
    sender = 'client'
    and exists (
      select 1
      from public.projects
      where projects.id = messages.project_id
      and projects.client_id = auth.uid()
    )
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
    select 1
    from public.projects
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
    select 1
    from public.projects
    where projects.id = questionnaire_responses.project_id
    and projects.client_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.projects
    where projects.id = questionnaire_responses.project_id
    and projects.client_id = auth.uid()
  )
);

drop policy if exists "Authenticated users read project files bucket" on storage.objects;
create policy "Authenticated users read project files bucket"
on storage.objects for select
using (
  bucket_id = 'project-files'
  and auth.role() = 'authenticated'
);
