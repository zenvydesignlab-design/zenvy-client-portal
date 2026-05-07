-- Let assigned clients approve their own contracts without granting admin-level edits.

drop policy if exists "Clients approve assigned contracts" on public.contracts;
create policy "Clients approve assigned contracts"
on public.contracts for update
using (
  exists (
    select 1
    from public.projects
    where projects.id = contracts.project_id
      and projects.client_id = auth.uid()
  )
)
with check (
  status = 'approved'
  and exists (
    select 1
    from public.projects
    where projects.id = contracts.project_id
      and projects.client_id = auth.uid()
  )
);
