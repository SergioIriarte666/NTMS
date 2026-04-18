create table if not exists public.client_branches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  direccion text,
  email text,
  telefono text,
  is_default boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists client_branches_client_name_key
on public.client_branches(client_id, lower(name));

create index if not exists client_branches_user_client_idx
on public.client_branches(user_id, client_id);

create trigger client_branches_set_updated_at
before update on public.client_branches
for each row
execute function public.set_updated_at();

alter table public.client_branches enable row level security;

create policy client_branches_select_own on public.client_branches
for select
using (auth.uid() = user_id);

create policy client_branches_insert_own on public.client_branches
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.clients c
    where c.id = client_id and c.user_id = auth.uid()
  )
);

create policy client_branches_update_own on public.client_branches
for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.clients c
    where c.id = client_id and c.user_id = auth.uid()
  )
);

create policy client_branches_delete_own on public.client_branches
for delete
using (auth.uid() = user_id);

alter table public.services
add column if not exists branch_id uuid references public.client_branches(id) on delete set null;

create index if not exists services_user_branch_idx on public.services(user_id, branch_id);

alter table public.invoices
add column if not exists branch_id uuid references public.client_branches(id) on delete set null;

create index if not exists invoices_user_branch_idx on public.invoices(user_id, branch_id);

