-- Backfill signed metadata for contracts that were approved before the signed columns existed.

update public.contracts
set signed = true,
    signed_at = coalesce(signed_at, updated_at, created_at, now())
where status = 'approved'
  and signed = false;

notify pgrst, 'reload schema';
