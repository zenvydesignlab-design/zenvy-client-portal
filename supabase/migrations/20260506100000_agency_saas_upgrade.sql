alter table public.users
add column if not exists status text not null default 'active'
check (status in ('active', 'inactive'));

alter table public.projects
add column if not exists deadline date,
add column if not exists drive_folder_url text,
add column if not exists drive_folder_id text;

alter table public.questions
drop constraint if exists questions_type_check;

alter table public.questions
add constraint questions_type_check
check (type in ('text', 'textarea', 'dropdown', 'multiple_choice', 'file'));

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null default 0,
  status text not null default 'unpaid' check (status in ('paid', 'unpaid')),
  due_date date,
  pdf_url text,
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

alter table public.invoices enable row level security;
alter table public.meetings enable row level security;
alter table public.approvals enable row level security;
alter table public.notifications enable row level security;

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
create policy "Admins manage invoices"
on public.invoices for all
using (public.is_admin())
with check (public.is_admin());

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

drop policy if exists "Admins update approvals" on public.approvals;
create policy "Admins update approvals"
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

drop policy if exists "Admins manage notifications" on public.notifications;
create policy "Admins manage notifications"
on public.notifications for all
using (public.is_admin())
with check (public.is_admin());
