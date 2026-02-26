alter table sellers
  add column if not exists rating_avg numeric not null default 0,
  add column if not exists rating_count int not null default 0,
  add column if not exists sla_on_time_rate numeric not null default 0,
  add column if not exists avg_delivery_minutes int not null default 0,
  add column if not exists dispute_rate numeric not null default 0,
  add column if not exists strikes int not null default 0;

alter table listings
  add column if not exists boost_until timestamptz,
  add column if not exists quality_score int not null default 0;

create index if not exists idx_listings_boost on listings(boost_until desc nulls last);
create index if not exists idx_listings_quality on listings(quality_score desc);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  seller_id uuid not null references sellers(user_id) on delete restrict,
  buyer_id uuid not null references profiles(id) on delete restrict,
  rating int not null check (rating between 1 and 5),
  delivery_speed_rating int not null check (delivery_speed_rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(order_id)
);

alter table reviews enable row level security;
create policy if not exists "reviews_select_buyer" on reviews for select using (buyer_id = auth.uid());
create policy if not exists "reviews_select_seller" on reviews for select using (seller_id = auth.uid());
create policy if not exists "reviews_insert_buyer" on reviews for insert with check (buyer_id = auth.uid());

create table if not exists subscriptions_internal (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id) on delete restrict,
  listing_id uuid not null references listings(id) on delete restrict,
  seller_id uuid not null references sellers(user_id) on delete restrict,
  seat_id uuid references seats(id) on delete set null,
  status text not null default 'active',
  renew_every_days int not null default 30,
  next_renew_at timestamptz not null,
  created_at timestamptz not null default now()
);
