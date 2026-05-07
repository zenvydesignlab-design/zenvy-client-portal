-- Digital agreement audit fields and signing RPC.
-- Clients sign through the RPC so they do not receive broad contract update access.

alter table public.contracts
add column if not exists signed_by text,
add column if not exists signed_email text,
add column if not exists signature_ip text,
add column if not exists agreement_version text not null default 'v1.0';

update public.contracts
set signed_by = coalesce(signed_by, client_name),
    signed_email = coalesce(signed_email, client_email),
    agreement_version = coalesce(nullif(agreement_version, ''), 'v1.0')
where signed = true
   or agreement_version is null
   or agreement_version = '';

drop policy if exists "Clients approve assigned contracts" on public.contracts;

create or replace function public.sign_contract(
  contract_id uuid,
  signer_name text,
  signer_email text
)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  signed_contract public.contracts;
  request_headers jsonb;
  request_ip text;
begin
  if nullif(trim(signer_name), '') is null then
    raise exception 'Signer name is required';
  end if;

  if nullif(trim(signer_email), '') is null then
    raise exception 'Signer email is required';
  end if;

  request_headers := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  request_ip := coalesce(
    request_headers->>'x-forwarded-for',
    request_headers->>'cf-connecting-ip',
    request_headers->>'x-real-ip'
  );

  update public.contracts
  set status = 'approved',
      signed = true,
      signed_by = trim(signer_name),
      signed_email = trim(signer_email),
      signed_at = now(),
      signature_ip = nullif(split_part(coalesce(request_ip, ''), ',', 1), ''),
      agreement_version = coalesce(nullif(agreement_version, ''), 'v1.0'),
      updated_at = now()
  where id = contract_id
    and (
      public.is_admin()
      or exists (
        select 1
        from public.projects
        where projects.id = contracts.project_id
          and projects.client_id = auth.uid()
      )
    )
  returning * into signed_contract;

  if signed_contract.id is null then
    raise exception 'Contract is unavailable or not assigned to this user';
  end if;

  return signed_contract;
end;
$$;

grant execute on function public.sign_contract(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
