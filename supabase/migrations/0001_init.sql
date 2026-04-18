create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.clients (
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

create trigger clients_set_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();

alter table public.clients enable row level security;

create policy clients_select_own on public.clients
for select
using (auth.uid() = user_id);

create policy clients_insert_own on public.clients
for insert
with check (auth.uid() = user_id);

create policy clients_update_own on public.clients
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy clients_delete_own on public.clients
for delete
using (auth.uid() = user_id);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  patente text not null,
  tipo text,
  capacidad text,
  status text not null default 'disponible' check (status in ('disponible','ocupado','mantencion','inactivo')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists vehicles_user_patente_key on public.vehicles(user_id, patente);

create trigger vehicles_set_updated_at
before update on public.vehicles
for each row
execute function public.set_updated_at();

alter table public.vehicles enable row level security;

create policy vehicles_select_own on public.vehicles
for select
using (auth.uid() = user_id);

create policy vehicles_insert_own on public.vehicles
for insert
with check (auth.uid() = user_id);

create policy vehicles_update_own on public.vehicles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy vehicles_delete_own on public.vehicles
for delete
using (auth.uid() = user_id);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rut text,
  nombre text not null,
  licencia_clase text,
  telefono text,
  status text not null default 'disponible' check (status in ('disponible','ocupado','licencia','inactivo')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger drivers_set_updated_at
before update on public.drivers
for each row
execute function public.set_updated_at();

alter table public.drivers enable row level security;

create policy drivers_select_own on public.drivers
for select
using (auth.uid() = user_id);

create policy drivers_insert_own on public.drivers
for insert
with check (auth.uid() = user_id);

create policy drivers_update_own on public.drivers
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy drivers_delete_own on public.drivers
for delete
using (auth.uid() = user_id);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  service_date date not null,
  start_time text,
  origin text,
  destination text,
  service_type text,
  status text not null default 'pendiente' check (status in ('pendiente','asignado','en_curso','completado','cancelado')),
  vehicle_id uuid references public.vehicles(id) on delete set null,
  driver_id uuid references public.drivers(id) on delete set null,
  agreed_amount numeric,
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_user_date_idx on public.services(user_id, service_date);
create index if not exists services_user_status_idx on public.services(user_id, status);

create trigger services_set_updated_at
before update on public.services
for each row
execute function public.set_updated_at();

alter table public.services enable row level security;

create policy services_select_own on public.services
for select
using (auth.uid() = user_id);

create policy services_insert_own on public.services
for insert
with check (auth.uid() = user_id);

create policy services_update_own on public.services
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy services_delete_own on public.services
for delete
using (auth.uid() = user_id);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  service_id uuid references public.services(id) on delete set null,
  invoice_number text,
  issue_date date not null,
  due_date date,
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'emitida' check (status in ('borrador','emitida','pagada','anulada','vencida')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_user_issue_date_idx on public.invoices(user_id, issue_date);

create trigger invoices_set_updated_at
before update on public.invoices
for each row
execute function public.set_updated_at();

alter table public.invoices enable row level security;

create policy invoices_select_own on public.invoices
for select
using (auth.uid() = user_id);

create policy invoices_insert_own on public.invoices
for insert
with check (auth.uid() = user_id);

create policy invoices_update_own on public.invoices
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy invoices_delete_own on public.invoices
for delete
using (auth.uid() = user_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  paid_date date not null,
  method text,
  amount numeric not null,
  reference text,
  created_at timestamptz not null default now()
);

create index if not exists payments_user_paid_date_idx on public.payments(user_id, paid_date);
create index if not exists payments_user_invoice_id_idx on public.payments(user_id, invoice_id);

alter table public.payments enable row level security;

create policy payments_select_own on public.payments
for select
using (auth.uid() = user_id);

create policy payments_insert_own on public.payments
for insert
with check (auth.uid() = user_id);

create policy payments_update_own on public.payments
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy payments_delete_own on public.payments
for delete
using (auth.uid() = user_id);
