create table if not exists public.vehicle_brands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists vehicle_brands_user_name_key
on public.vehicle_brands(user_id, lower(trim(name)));

create trigger vehicle_brands_set_updated_at
before update on public.vehicle_brands
for each row
execute function public.set_updated_at();

alter table public.vehicle_brands enable row level security;

create policy vehicle_brands_select_own on public.vehicle_brands
for select
using (auth.uid() = user_id);

create policy vehicle_brands_insert_own on public.vehicle_brands
for insert
with check (auth.uid() = user_id);

create policy vehicle_brands_update_own on public.vehicle_brands
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy vehicle_brands_delete_own on public.vehicle_brands
for delete
using (auth.uid() = user_id);

create table if not exists public.vehicle_models (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicle_models_user_brand_idx
on public.vehicle_models(user_id, brand_id);

create unique index if not exists vehicle_models_user_brand_name_key
on public.vehicle_models(user_id, brand_id, lower(trim(name)));

create trigger vehicle_models_set_updated_at
before update on public.vehicle_models
for each row
execute function public.set_updated_at();

alter table public.vehicle_models enable row level security;

create policy vehicle_models_select_own on public.vehicle_models
for select
using (auth.uid() = user_id);

create policy vehicle_models_insert_own on public.vehicle_models
for insert
with check (auth.uid() = user_id);

create policy vehicle_models_update_own on public.vehicle_models
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy vehicle_models_delete_own on public.vehicle_models
for delete
using (auth.uid() = user_id);

grant select on public.vehicle_brands to anon;
grant select on public.vehicle_models to anon;

grant select, insert, update, delete on public.vehicle_brands to authenticated;
grant select, insert, update, delete on public.vehicle_models to authenticated;

