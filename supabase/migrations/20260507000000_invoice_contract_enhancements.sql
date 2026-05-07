-- Add line items and tax to invoices
alter table public.invoices
add column if not exists line_items jsonb default '[]'::jsonb,
add column if not exists tax_rate numeric(5,2) default 0,
add column if not exists client_name text,
add column if not exists client_email text;

-- Add details to contracts
alter table public.contracts
add column if not exists scope text,
add column if not exists deliverables jsonb default '[]'::jsonb,
add column if not exists timelines text,
add column if not exists payment_terms text,
add column if not exists revision_limits text,
add column if not exists status text default 'draft',
add column if not exists client_name text,
add column if not exists client_email text;
