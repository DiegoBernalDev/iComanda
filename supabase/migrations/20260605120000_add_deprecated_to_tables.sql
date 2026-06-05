alter table public.tables
  add column if not exists deprecated boolean not null default false;

alter table public.tables
  drop constraint if exists tables_restaurant_id_numero_key;

create unique index if not exists tables_restaurant_id_numero_active_idx
  on public.tables (restaurant_id, numero)
  where deprecated = false;
