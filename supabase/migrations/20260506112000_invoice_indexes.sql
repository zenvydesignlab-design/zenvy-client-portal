create index if not exists invoices_project_id_idx
on public.invoices (project_id);

create index if not exists invoices_project_status_idx
on public.invoices (project_id, status);

create index if not exists invoices_due_date_idx
on public.invoices (due_date);

create index if not exists invoices_created_by_idx
on public.invoices (created_by);
