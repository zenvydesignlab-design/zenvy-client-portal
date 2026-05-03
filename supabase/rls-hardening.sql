drop policy if exists "Project participants send messages" on public.messages;

create policy "Project participants send messages"
on public.messages for insert
with check (
  (public.is_admin() and sender = 'admin')
  or (
    sender = 'client'
    and exists (
      select 1
      from public.projects
      where projects.id = messages.project_id
      and projects.client_id = auth.uid()
    )
  )
);
