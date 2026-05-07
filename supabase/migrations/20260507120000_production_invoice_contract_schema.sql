-- Production invoice and contract shape for the Zenvy Client Experience Portal.
-- Safe to rerun: every column/constraint/index change is guarded.

alter table public.invoices
add column if not exists client_id uuid references public.users(id) on delete set null,
add column if not exists client_email text,
add column if not exists description text,
add column if not exists subtotal numeric(12,2) not null default 0,
add column if not exists tax numeric(12,2) not null default 0,
add column if not exists total numeric(12,2) not null default 0,
add column if not exists currency text not null default 'INR',
add column if not exists payment_terms text,
add column if not exists line_items jsonb not null default '[]'::jsonb,
add column if not exists tax_rate numeric(5,2) not null default 0,
add column if not exists updated_at timestamptz not null default now();

update public.invoices
set status = 'pending'
where status = 'unpaid';

update public.invoices
set subtotal = coalesce(nullif(subtotal, 0), amount, total, 0),
    total = coalesce(nullif(total, 0), amount, subtotal, 0),
    currency = coalesce(nullif(currency, ''), 'INR')
where subtotal = 0 or total = 0 or currency is null or currency = '';

alter table public.invoices
drop constraint if exists invoices_status_check;

alter table public.invoices
add constraint invoices_status_check
check (status in ('paid', 'pending', 'overdue', 'void'));

create index if not exists invoices_client_id_idx on public.invoices (client_id);
create index if not exists invoices_status_idx on public.invoices (status);

alter table public.contracts
add column if not exists client_id uuid references public.users(id) on delete set null,
add column if not exists client_email text,
add column if not exists timeline text,
add column if not exists revisions text,
add column if not exists ownership_terms text,
add column if not exists cancellation_terms text,
add column if not exists signatures jsonb not null default '{}'::jsonb,
add column if not exists status text not null default 'draft',
add column if not exists pdf_url text,
add column if not exists updated_at timestamptz not null default now();

update public.contracts
set timeline = coalesce(timeline, timelines),
    revisions = coalesce(revisions, revision_limits),
    pdf_url = coalesce(pdf_url, nullif(contract_url, ''))
where timeline is null
   or revisions is null
   or pdf_url is null;

alter table public.contracts
alter column contract_url drop not null;

alter table public.contracts
drop constraint if exists contracts_status_check;

alter table public.contracts
add constraint contracts_status_check
check (status in ('draft', 'sent', 'approved', 'archived'));

create index if not exists contracts_client_id_idx on public.contracts (client_id);
create index if not exists contracts_status_idx on public.contracts (status);
