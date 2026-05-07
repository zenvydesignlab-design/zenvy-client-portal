-- Final production stabilization for invoice/contract schema drift.
-- Safe to rerun: all schema changes are idempotent and PostgREST is notified.

alter table public.invoices
add column if not exists client_email text,
add column if not exists client_name text,
add column if not exists invoice_number text,
add column if not exists amount numeric(12,2) not null default 0,
add column if not exists subtotal numeric(12,2) not null default 0,
add column if not exists tax_rate numeric(5,2) not null default 0,
add column if not exists total numeric(12,2) not null default 0,
add column if not exists currency text not null default 'INR',
add column if not exists status text not null default 'pending',
add column if not exists due_date date,
add column if not exists notes text,
add column if not exists payment_terms text,
add column if not exists pdf_url text,
add column if not exists line_items jsonb not null default '[]'::jsonb,
add column if not exists created_by uuid references public.users(id) on delete set null default auth.uid(),
add column if not exists created_at timestamptz not null default now();

alter table public.invoices
add column if not exists client_id uuid references public.users(id) on delete set null,
add column if not exists title text,
add column if not exists description text,
add column if not exists tax numeric(12,2) not null default 0,
add column if not exists updated_at timestamptz not null default now();

update public.invoices
set invoice_number = coalesce(nullif(invoice_number, ''), 'INV-' || upper(left(id::text, 8))),
    title = coalesce(nullif(title, ''), nullif(invoice_number, ''), 'Invoice'),
    subtotal = coalesce(nullif(subtotal, 0), amount, total, 0),
    tax_rate = coalesce(tax_rate, 0),
    tax = coalesce(tax, 0),
    total = coalesce(nullif(total, 0), amount, subtotal, 0),
    amount = coalesce(nullif(amount, 0), total, subtotal, 0),
    currency = coalesce(nullif(currency, ''), 'INR'),
    status = case
      when status in ('paid', 'pending', 'overdue', 'void') then status
      when status in ('sent', 'draft', 'unpaid') then 'pending'
      else 'pending'
    end,
    line_items = coalesce(line_items, '[]'::jsonb),
    updated_at = coalesce(updated_at, now())
where invoice_number is null
   or invoice_number = ''
   or title is null
   or title = ''
   or subtotal is null
   or total is null
   or amount is null
   or currency is null
   or currency = ''
   or status not in ('paid', 'pending', 'overdue', 'void')
   or line_items is null
   or updated_at is null;

alter table public.invoices alter column invoice_number set not null;
alter table public.invoices alter column title set default 'Invoice';
alter table public.invoices alter column title drop not null;

alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices
add constraint invoices_status_check
check (status in ('paid', 'pending', 'overdue', 'void'));

alter table public.contracts
add column if not exists project_id uuid references public.projects(id) on delete cascade,
add column if not exists client_email text,
add column if not exists client_name text,
add column if not exists project_scope text,
add column if not exists deliverables jsonb not null default '[]'::jsonb,
add column if not exists timeline text,
add column if not exists payment_terms text,
add column if not exists revisions text,
add column if not exists ownership_clause text,
add column if not exists cancellation_clause text,
add column if not exists notes text,
add column if not exists pdf_url text,
add column if not exists signed boolean not null default false,
add column if not exists signed_at timestamptz,
add column if not exists created_by uuid references public.users(id) on delete set null default auth.uid(),
add column if not exists created_at timestamptz not null default now();

alter table public.contracts
add column if not exists client_id uuid references public.users(id) on delete set null,
add column if not exists title text,
add column if not exists status text not null default 'draft',
add column if not exists scope text,
add column if not exists timelines text,
add column if not exists revision_limits text,
add column if not exists ownership_terms text,
add column if not exists cancellation_terms text,
add column if not exists contract_url text,
add column if not exists signatures jsonb not null default '{}'::jsonb,
add column if not exists updated_at timestamptz not null default now();

update public.contracts
set title = coalesce(nullif(title, ''), 'Project Agreement'),
    project_scope = coalesce(project_scope, scope),
    timeline = coalesce(timeline, timelines),
    revisions = coalesce(revisions, revision_limits),
    ownership_clause = coalesce(ownership_clause, ownership_terms),
    cancellation_clause = coalesce(cancellation_clause, cancellation_terms),
    pdf_url = coalesce(pdf_url, nullif(contract_url, '')),
    deliverables = coalesce(deliverables, '[]'::jsonb),
    signed = signed or status in ('approved', 'signed'),
    signed_at = case
      when signed_at is null and status in ('approved', 'signed') then updated_at
      else signed_at
    end,
    status = case
      when status in ('draft', 'sent', 'approved', 'archived') then status
      when status = 'signed' then 'approved'
      else 'draft'
    end,
    updated_at = coalesce(updated_at, now())
where title is null
   or title = ''
   or project_scope is null
   or timeline is null
   or revisions is null
   or ownership_clause is null
   or cancellation_clause is null
   or pdf_url is null
   or deliverables is null
   or signed is null
   or status not in ('draft', 'sent', 'approved', 'archived')
   or updated_at is null;

alter table public.contracts alter column title set default 'Project Agreement';
alter table public.contracts alter column title drop not null;
alter table public.contracts alter column contract_url drop not null;

alter table public.contracts drop constraint if exists contracts_status_check;
alter table public.contracts
add constraint contracts_status_check
check (status in ('draft', 'sent', 'approved', 'archived'));

create index if not exists invoices_project_id_idx on public.invoices (project_id);
create index if not exists invoices_client_id_idx on public.invoices (client_id);
create index if not exists invoices_status_idx on public.invoices (status);
create index if not exists invoices_created_by_idx on public.invoices (created_by);
create index if not exists invoices_due_date_idx on public.invoices (due_date);

create index if not exists contracts_project_id_idx on public.contracts (project_id);
create index if not exists contracts_client_id_idx on public.contracts (client_id);
create index if not exists contracts_status_idx on public.contracts (status);
create index if not exists contracts_created_by_idx on public.contracts (created_by);
create index if not exists contracts_signed_idx on public.contracts (signed);

alter table public.invoices enable row level security;
alter table public.contracts enable row level security;
alter table public.files enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.questionnaire_templates enable row level security;
alter table public.questionnaire_responses enable row level security;
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

drop policy if exists "Admins insert invoices" on public.invoices;
create policy "Admins insert invoices"
on public.invoices for insert
with check (public.is_admin());

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
    select 1 from public.projects
    where projects.id = contracts.project_id
      and projects.client_id = auth.uid()
  )
);

drop policy if exists "Admins insert contracts" on public.contracts;
create policy "Admins insert contracts"
on public.contracts for insert
with check (public.is_admin());

drop policy if exists "Admins update contracts" on public.contracts;
create policy "Admins update contracts"
on public.contracts for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Clients approve assigned contracts" on public.contracts;
create policy "Clients approve assigned contracts"
on public.contracts for update
using (
  exists (
    select 1 from public.projects
    where projects.id = contracts.project_id
      and projects.client_id = auth.uid()
  )
)
with check (
  status = 'approved'
  and signed = true
  and exists (
    select 1 from public.projects
    where projects.id = contracts.project_id
      and projects.client_id = auth.uid()
  )
);

drop policy if exists "Admins delete contracts" on public.contracts;
create policy "Admins delete contracts"
on public.contracts for delete
using (public.is_admin());

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
using (public.is_admin())
with check (public.is_admin());

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

notify pgrst, 'reload schema';
