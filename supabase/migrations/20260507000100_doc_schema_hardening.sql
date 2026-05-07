-- Add ownership and cancellation terms to contracts
alter table public.contracts
add column if not exists ownership_terms text,
add column if not exists cancellation_terms text;

-- Add granular financial fields to invoices
alter table public.invoices
add column if not exists subtotal numeric(12,2) default 0,
add column if not exists tax_amount numeric(12,2) default 0,
add column if not exists total numeric(12,2) default 0;

-- Update total from amount if total is 0
update public.invoices set total = amount where total = 0;
