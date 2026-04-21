create table if not exists public.inventory_sku_counters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  next_int integer not null default 1
);

create or replace function public.next_product_sku(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next int;
begin
  insert into public.inventory_sku_counters(user_id, next_int)
  values (p_user_id, 2)
  on conflict (user_id)
  do update set next_int = public.inventory_sku_counters.next_int + 1
  returning next_int - 1 into v_next;

  return 'SKU-' || lpad(v_next::text, 6, '0');
end;
$$;

create table if not exists public.inventory_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sku text not null,
  name text not null,
  description text,
  unit text,
  min_stock numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists inventory_products_user_sku_key on public.inventory_products(user_id, sku);
create index if not exists inventory_products_user_created_idx on public.inventory_products(user_id, created_at desc);

create trigger inventory_products_set_updated_at
before update on public.inventory_products
for each row
execute function public.set_updated_at();

alter table public.inventory_products enable row level security;

create policy inventory_products_select_own on public.inventory_products
for select
using (auth.uid() = user_id);

create policy inventory_products_insert_own on public.inventory_products
for insert
with check (auth.uid() = user_id);

create policy inventory_products_update_own on public.inventory_products
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy inventory_products_delete_own on public.inventory_products
for delete
using (auth.uid() = user_id);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.inventory_products(id) on delete restrict,
  movement_type text not null check (movement_type in ('ingreso','egreso','ajuste')),
  quantity numeric not null,
  unit_cost numeric,
  reference text,
  notes text,
  movement_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists inventory_movements_user_product_date_idx on public.inventory_movements(user_id, product_id, movement_date desc);

alter table public.inventory_movements enable row level security;

create policy inventory_movements_select_own on public.inventory_movements
for select
using (auth.uid() = user_id);

create policy inventory_movements_insert_own on public.inventory_movements
for insert
with check (auth.uid() = user_id);

create policy inventory_movements_update_own on public.inventory_movements
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy inventory_movements_delete_own on public.inventory_movements
for delete
using (auth.uid() = user_id);

create or replace view public.inventory_products_with_stock as
select
  p.*,
  coalesce(s.stock, 0) as stock
from public.inventory_products p
left join (
  select
    user_id,
    product_id,
    coalesce(
      sum(
        case
          when movement_type = 'ingreso' then quantity
          when movement_type = 'egreso' then -quantity
          else quantity
        end
      ),
      0
    ) as stock
  from public.inventory_movements
  group by user_id, product_id
) s
on s.user_id = p.user_id and s.product_id = p.id;

grant select on public.inventory_products to anon;
grant select on public.inventory_movements to anon;
grant select on public.inventory_products_with_stock to anon;

grant select, insert, update, delete on public.inventory_products to authenticated;
grant select, insert, update, delete on public.inventory_movements to authenticated;
grant select on public.inventory_products_with_stock to authenticated;
grant execute on function public.next_product_sku(uuid) to authenticated;

