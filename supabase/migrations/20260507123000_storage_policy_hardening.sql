-- Tighten project file storage and keep portal uploads usable for assigned clients.
-- Safe to rerun: policies/functions are replaced by name.

create or replace function public.is_project_client(project_id_text text, user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select case
    when project_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then exists (
        select 1
        from public.projects
        where id = project_id_text::uuid
          and client_id = user_id
      )
    else false
  end;
$$;

drop policy if exists "Project participants insert files" on public.files;
create policy "Project participants insert files"
on public.files for insert
with check (
  user_id = auth.uid()
  and (
    public.is_admin()
    or exists (
      select 1
      from public.projects
      where projects.id = files.project_id
      and projects.client_id = auth.uid()
    )
  )
);

drop policy if exists "Clients upload assigned project files" on storage.objects;
create policy "Clients upload assigned project files"
on storage.objects for insert
with check (
  bucket_id = 'project-files'
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.is_project_client((storage.foldername(name))[1], auth.uid())
);

drop policy if exists "Authenticated users read project files bucket" on storage.objects;
create policy "Authenticated users read project files bucket"
on storage.objects for select
using (
  bucket_id = 'project-files'
  and (
    public.is_admin()
    or public.is_project_client((storage.foldername(name))[1], auth.uid())
  )
);
