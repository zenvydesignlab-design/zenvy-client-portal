alter table public.questions
add column if not exists options jsonb not null default '[]'::jsonb;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.questions'::regclass
  and contype = 'c'
  and pg_get_constraintdef(oid) like '%type%';

  if constraint_name is not null then
    execute format('alter table public.questions drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.questions
add constraint questions_type_check
check (type in ('text', 'textarea', 'dropdown', 'file'));
