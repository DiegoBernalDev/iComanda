create type material_movement_type as enum ('consumo', 'reposicion');

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  nombre text not null,
  unidad text not null default 'unidad',
  stock_minimo integer not null default 0 check (stock_minimo >= 0),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.material_stock_movements (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  movement_type material_movement_type not null,
  quantity integer not null check (quantity > 0),
  reason text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_materials_restaurant_created
  on public.materials (restaurant_id, created_at desc);

create index idx_material_movements_restaurant_created
  on public.material_stock_movements (restaurant_id, created_at desc);

create index idx_material_movements_material_created
  on public.material_stock_movements (material_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'materials'
  ) then
    alter publication supabase_realtime add table public.materials;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'material_stock_movements'
  ) then
    alter publication supabase_realtime add table public.material_stock_movements;
  end if;
end $$;

create or replace function public.get_material_stock_snapshot()
returns table(
  id uuid,
  restaurant_id uuid,
  nombre text,
  unidad text,
  stock_minimo integer,
  activo boolean,
  created_at timestamptz,
  current_stock bigint
)
language sql
as $$
  select
    m.id,
    m.restaurant_id,
    m.nombre,
    m.unidad,
    m.stock_minimo,
    m.activo,
    m.created_at,
    coalesce(sum(case when msm.movement_type = 'reposicion' then msm.quantity else -msm.quantity end), 0)::bigint as current_stock
  from public.materials m
  left join public.material_stock_movements msm on msm.material_id = m.id
  where m.restaurant_id = get_my_restaurant_id()
  group by m.id, m.restaurant_id, m.nombre, m.unidad, m.stock_minimo, m.activo, m.created_at
  order by m.nombre asc;
$$;
