create or replace function public.is_project_client(project_id_text text, user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.projects
    where projects.id::text = project_id_text
    and projects.client_id = user_id
  );
$$;

drop policy if exists "Project participants read files" on public.files;
create policy "Project participants read files"
on public.files for select
using (
  public.is_admin()
  or (
    user_id = auth.uid()
    and public.is_project_client(project_id::text, auth.uid())
  )
);

drop policy if exists "Project participants insert files" on public.files;
create policy "Project participants insert files"
on public.files for insert
with check (
  user_id = auth.uid()
  and (
    public.is_admin()
    or public.is_project_client(project_id::text, auth.uid())
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
    or (
      (storage.foldername(name))[2] = auth.uid()::text
      and public.is_project_client((storage.foldername(name))[1], auth.uid())
    )
  )
);
