-- =============================================================
-- MIGRACIÓN 01 — Schema inicial iComanda
-- HU-03: Crear migración de esquema inicial de la base de datos
-- HU-04: Constraint orden activa única por mesa
-- HU-05: Trigger set_closed_at
-- HU-08: Trigger sync_role_to_auth
-- =============================================================

-- ── Tipos enumerados ──────────────────────────────────────────
create type rol_usuario   as enum ('mesero', 'admin');
create type estado_orden  as enum ('activa', 'entregada', 'cancelada');
create type metodo_pago   as enum ('efectivo', 'qr', 'tarjeta');

-- ── profiles ─────────────────────────────────────────────────
-- Extiende auth.users con nombre, rol y estado activo
create table profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  nombre     text        not null,
  email      text        not null,
  rol        rol_usuario not null default 'mesero',
  activo     boolean     not null default true,
  created_at timestamptz not null default now()
);

-- ── restaurants ───────────────────────────────────────────────
create table restaurants (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  slug       text not null unique,
  direccion  text,
  telefono   text,
  owner_id   uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── tables ────────────────────────────────────────────────────
create table tables (
  id            uuid    primary key default gen_random_uuid(),
  restaurant_id uuid    not null references restaurants(id) on delete cascade,
  numero        integer not null,
  capacidad     integer not null default 4,
  activa        boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (restaurant_id, numero)
);

-- ── menu_items ────────────────────────────────────────────────
create table menu_items (
  id            uuid           primary key default gen_random_uuid(),
  restaurant_id uuid           not null references restaurants(id) on delete cascade,
  nombre        text           not null,
  descripcion   text,
  precio        numeric(10,2)  not null check (precio >= 0),
  categoria     text,
  imagen_url    text,
  disponible    boolean        not null default true,
  created_at    timestamptz    not null default now()
);

-- ── orders ────────────────────────────────────────────────────
create table orders (
  id               uuid          primary key default gen_random_uuid(),
  restaurant_id    uuid          not null references restaurants(id) on delete cascade,
  table_id         uuid          not null references tables(id),
  mesero_id        uuid          not null references profiles(id),
  estado           estado_orden  not null default 'activa',
  metodo_pago      metodo_pago,
  pago_confirmado  boolean       not null default false,
  total            numeric(10,2) not null default 0,
  created_at       timestamptz   not null default now(),
  closed_at        timestamptz
);

-- HU-04: solo puede haber una orden activa por mesa a la vez
create unique index one_active_order_per_table
  on orders (table_id)
  where estado = 'activa';

-- ── order_items ───────────────────────────────────────────────
create table order_items (
  id              uuid          primary key default gen_random_uuid(),
  order_id        uuid          not null references orders(id) on delete cascade,
  menu_item_id    uuid          references menu_items(id) on delete set null,
  -- Snapshot de precio al momento del pedido (HU persistencia histórica)
  nombre          text          not null,
  precio_unitario numeric(10,2) not null check (precio_unitario >= 0),
  cantidad        integer       not null default 1 check (cantidad > 0),
  created_at      timestamptz   not null default now()
);

-- ── expenses ─────────────────────────────────────────────────
create table expenses (
  id            uuid          primary key default gen_random_uuid(),
  restaurant_id uuid          not null references restaurants(id) on delete cascade,
  descripcion   text          not null,
  monto         numeric(10,2) not null check (monto > 0),
  fecha         date          not null default current_date,
  created_by    uuid          references profiles(id) on delete set null,
  created_at    timestamptz   not null default now()
);

-- ── table_calls ───────────────────────────────────────────────
create table table_calls (
  id            uuid        primary key default gen_random_uuid(),
  table_id      uuid        not null references tables(id) on delete cascade,
  restaurant_id uuid        not null references restaurants(id) on delete cascade,
  atendida      boolean     not null default false,
  created_at    timestamptz not null default now()
);

-- =============================================================
-- FUNCIONES Y TRIGGERS
-- =============================================================

-- HU-05: set_closed_at cuando una orden cambia de activa a entregada/cancelada
create or replace function set_closed_at()
returns trigger language plpgsql as $$
begin
  if OLD.estado = 'activa' and NEW.estado in ('entregada', 'cancelada') then
    NEW.closed_at = now();
  end if;
  return NEW;
end;
$$;

create trigger trg_set_closed_at
  before update on orders
  for each row execute function set_closed_at();

-- HU-08: sync_role_to_auth — sincroniza el rol del perfil al JWT de Supabase Auth
create or replace function sync_role_to_auth()
returns trigger language plpgsql security definer as $$
begin
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                          || jsonb_build_object('rol', NEW.rol::text)
  where id = NEW.id;
  return NEW;
end;
$$;

create trigger trg_sync_role_to_auth
  after insert or update of rol on profiles
  for each row execute function sync_role_to_auth();

-- Helper: obtener el rol del usuario actual (usado en RLS)
create or replace function get_my_role()
returns text language sql security definer stable as $$
  select rol::text from profiles where id = auth.uid()
$$;

-- Helper: obtener el restaurant_id del usuario actual
create or replace function get_my_restaurant_id()
returns uuid language sql security definer stable as $$
  select r.id
  from restaurants r
  where r.owner_id = auth.uid()
     or exists (
       select 1 from orders o
       join tables t on t.id = o.table_id
       where o.mesero_id = auth.uid()
         and t.restaurant_id = r.id
       limit 1
     )
  limit 1
$$;
