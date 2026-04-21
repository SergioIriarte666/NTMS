create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists expense_categories_user_name_key
on public.expense_categories(user_id, lower(trim(name)));

create trigger expense_categories_set_updated_at
before update on public.expense_categories
for each row
execute function public.set_updated_at();

alter table public.expense_categories enable row level security;

create policy expense_categories_select_own on public.expense_categories
for select
using (auth.uid() = user_id);

create policy expense_categories_insert_own on public.expense_categories
for insert
with check (auth.uid() = user_id);

create policy expense_categories_update_own on public.expense_categories
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy expense_categories_delete_own on public.expense_categories
for delete
using (auth.uid() = user_id);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.expense_categories(id) on delete restrict,
  expense_date date not null,
  amount numeric not null,
  payment_method text not null check (payment_method in ('efectivo','transferencia','tarjeta','otro')),
  provider_id uuid references public.providers(id) on delete set null,
  attachment_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_user_date_idx on public.expenses(user_id, expense_date desc);
create index if not exists expenses_user_category_idx on public.expenses(user_id, category_id);
create index if not exists expenses_user_payment_method_idx on public.expenses(user_id, payment_method);

create trigger expenses_set_updated_at
before update on public.expenses
for each row
execute function public.set_updated_at();

alter table public.expenses enable row level security;

create policy expenses_select_own on public.expenses
for select
using (auth.uid() = user_id);

create policy expenses_insert_own on public.expenses
for insert
with check (auth.uid() = user_id);

create policy expenses_update_own on public.expenses
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy expenses_delete_own on public.expenses
for delete
using (auth.uid() = user_id);

grant select on public.expense_categories to anon;
grant select on public.expenses to anon;

grant select, insert, update, delete on public.expense_categories to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;

