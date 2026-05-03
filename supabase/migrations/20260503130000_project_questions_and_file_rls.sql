alter table public.files add column if not exists user_id uuid references public.users(id) on delete set null;

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

alter table public.questions enable row level security;
alter table public.answers enable row level security;

drop policy if exists "Project participants read files" on public.files;
create policy "Project participants read files"
on public.files for select
using (
  public.is_admin()
  or (
    user_id = auth.uid()
    and exists (
      select 1
      from public.projects
      where projects.id = files.project_id
      and projects.client_id = auth.uid()
    )
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
      select 1
      from public.projects
      where projects.id = files.project_id
      and projects.client_id = auth.uid()
    )
  )
);

drop policy if exists "Project participants read questions" on public.questions;
create policy "Project participants read questions"
on public.questions for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.projects
    where projects.id = questions.project_id
    and projects.client_id = auth.uid()
  )
);

drop policy if exists "Admins insert questions" on public.questions;
create policy "Admins insert questions"
on public.questions for insert
with check (
  public.is_admin()
  and created_by = auth.uid()
);

drop policy if exists "Admins update questions" on public.questions;
create policy "Admins update questions"
on public.questions for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Project participants read answers" on public.answers;
create policy "Project participants read answers"
on public.answers for select
using (
  public.is_admin()
  or (
    user_id = auth.uid()
    and exists (
      select 1
      from public.questions
      join public.projects on projects.id = questions.project_id
      where questions.id = answers.question_id
      and projects.client_id = auth.uid()
    )
  )
);

drop policy if exists "Clients answer assigned project questions" on public.answers;
create policy "Clients answer assigned project questions"
on public.answers for insert
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

drop policy if exists "Clients update own answers" on public.answers;
create policy "Clients update own answers"
on public.answers for update
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

update storage.buckets
set public = false
where id = 'project-files';

drop policy if exists "Admins upload project files" on storage.objects;
create policy "Admins upload project files"
on storage.objects for insert
with check (
  bucket_id = 'project-files'
  and public.is_admin()
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "Clients upload assigned project files" on storage.objects;
create policy "Clients upload assigned project files"
on storage.objects for insert
with check (
  bucket_id = 'project-files'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.projects
    where projects.id::text = (storage.foldername(name))[1]
    and projects.client_id = auth.uid()
  )
);

drop policy if exists "Authenticated users read project files bucket" on storage.objects;
create policy "Authenticated users read project files bucket"
on storage.objects for select
using (
  bucket_id = 'project-files'
  and (
    public.is_admin()
    or (
      (storage.foldername(name))[2] = auth.uid()::text
      and exists (
        select 1
        from public.projects
        where projects.id::text = (storage.foldername(name))[1]
        and projects.client_id = auth.uid()
      )
    )
  )
);
