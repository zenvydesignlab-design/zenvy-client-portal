alter table public.projects
add column if not exists drive_folder_url text,
add column if not exists drive_folder_id text;

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  contract_url text not null,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists contracts_project_id_idx
on public.contracts (project_id);

create index if not exists contracts_created_by_idx
on public.contracts (created_by);

alter table public.contracts enable row level security;

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
