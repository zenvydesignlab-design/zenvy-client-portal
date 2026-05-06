create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  invoice_number text,
  title text,
  amount numeric(12,2) not null default 0,
  status text not null default 'pending',
  due_date date,
  pdf_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoices
add column if not exists created_by uuid references public.users(id) on delete set null default auth.uid(),
add column if not exists invoice_number text,
add column if not exists title text,
add column if not exists amount numeric(12,2) not null default 0,
add column if not exists status text not null default 'pending',
add column if not exists due_date date,
add column if not exists pdf_url text,
add column if not exists notes text,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

update public.invoices
set status = 'pending'
where status = 'unpaid';

update public.invoices
set invoice_number = coalesce(invoice_number, nullif(title, ''), 'INV-' || left(id::text, 8))
where invoice_number is null or invoice_number = '';

update public.invoices
set title = coalesce(nullif(title, ''), invoice_number)
where title is null or title = '';

alter table public.invoices
alter column invoice_number set not null,
alter column title set not null,
alter column status set default 'pending';

alter table public.invoices
drop constraint if exists invoices_status_check;

alter table public.invoices
add constraint invoices_status_check
check (status in ('paid', 'pending', 'overdue'));

alter table public.invoices enable row level security;

drop policy if exists "Project participants read invoices" on public.invoices;
create policy "Project participants read invoices"
on public.invoices for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.projects
    where projects.id = invoices.project_id
    and projects.client_id = auth.uid()
  )
);

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

drop policy if exists "Admins manage invoices" on public.invoices;
