create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key,
  role text not null default 'buyer',
  phone text,
  buyer_verification text not null default 'unverified',
  seller_verification text not null default 'unverified',
  created_at timestamptz not null default now()
);

create table if not exists sellers (
  user_id uuid primary key references profiles(id) on delete cascade,
  display_name text not null,
  status text not null default 'pending',
  mp_user_id text,
  mp_access_token text,
  mp_refresh_token text,
  mp_token_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists kyc_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null,
  provider text not null,
  provider_session_id text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers(user_id) on delete cascade,
  category text not null,
  platform text not null,
  plan_name text not null,
  proof_plan_url text,
  delivery_method text not null,
  sla_minutes int not null default 120,
  capacity_total int not null,
  capacity_available int not null,
  price_cents int not null,
  currency text not null default 'MXN',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete restrict,
  seller_id uuid not null references sellers(user_id) on delete restrict,
  buyer_id uuid not null references profiles(id) on delete restrict,
  quantity int not null default 1,
  subtotal_cents int not null,
  platform_fee_cents int not null,
  seller_payout_cents int not null,
  total_cents int not null,
  currency text not null default 'MXN',
  status text not null default 'created',
  escrow_release_at timestamptz,
  paid_at timestamptz,
  delivery_deadline_at timestamptz,
  delivered_marked_at timestamptz,
  delivered_at timestamptz,
  payment_reservation_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists seats (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete restrict,
  buyer_id uuid not null references profiles(id) on delete restrict,
  status text not null default 'pending',
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists delivery_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  seller_id uuid not null references sellers(user_id) on delete restrict,
  buyer_id uuid not null references profiles(id) on delete restrict,
  method text not null,
  invited_email text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null default 'mercadopago',
  mp_preference_id text,
  mp_payment_id text,
  mp_status text,
  amount_cents int not null,
  currency text not null default 'MXN',
  created_at timestamptz not null default now()
);

create table if not exists disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  opened_by uuid not null references profiles(id) on delete restrict,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table sellers enable row level security;
alter table kyc_sessions enable row level security;
alter table listings enable row level security;
alter table orders enable row level security;
alter table seats enable row level security;
alter table delivery_events enable row level security;
alter table payments enable row level security;
alter table disputes enable row level security;

create policy "profiles_select_own" on profiles for select using (id = auth.uid());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());

create policy "sellers_select_own" on sellers for select using (user_id = auth.uid());
create policy "sellers_upsert_own" on sellers for insert with check (user_id = auth.uid());
create policy "sellers_update_own" on sellers for update using (user_id = auth.uid());

create policy "listings_select_public" on listings for select using (status = 'active');
create policy "listings_insert_seller" on listings for insert with check (seller_id = auth.uid());
create policy "listings_update_seller" on listings for update using (seller_id = auth.uid());

create policy "orders_select_buyer" on orders for select using (buyer_id = auth.uid());
create policy "orders_select_seller" on orders for select using (seller_id = auth.uid());

create policy "seats_select_buyer" on seats for select using (buyer_id = auth.uid());
create policy "delivery_select_buyer" on delivery_events for select using (buyer_id = auth.uid());
create policy "delivery_select_seller" on delivery_events for select using (seller_id = auth.uid());
