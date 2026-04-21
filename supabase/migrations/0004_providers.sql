create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rut text,
  razon_social text not null,
  giro text,
  direccion text,
  email text,
  telefono text,
  is_active boolean not null default true,
  payment_terms text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists providers_user_created_idx on public.providers(user_id, created_at desc);

create unique index if not exists providers_user_rut_key
on public.providers(user_id, rut)
where rut is not null and length(trim(rut)) > 0;

create trigger providers_set_updated_at
before update on public.providers
for each row
execute function public.set_updated_at();

alter table public.providers enable row level security;

create policy providers_select_own on public.providers
for select
using (auth.uid() = user_id);

create policy providers_insert_own on public.providers
for insert
with check (auth.uid() = user_id);

create policy providers_update_own on public.providers
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy providers_delete_own on public.providers
for delete
using (auth.uid() = user_id);

grant select on public.providers to anon;
grant select, insert, update, delete on public.providers to authenticated;

