alter table public.questions
add column if not exists options jsonb not null default '[]'::jsonb;

drop policy if exists "Admins delete questions" on public.questions;
create policy "Admins delete questions"
on public.questions for delete
using (public.is_admin());
