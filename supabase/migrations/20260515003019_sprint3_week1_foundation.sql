-- =============================================================
-- Sprint 3 - Semana 1 base técnica
-- - Extensiones no destructivas del modelo actual
-- - Soporte rutas públicas /menu/[slug] y /table/[slug]/[tableId]
-- - Realtime para table_calls
-- =============================================================

-- Estado intermedio opcional para órdenes listas (sin romper estados existentes)
alter type estado_orden add value if not exists 'lista';

-- Timestamp de atención para llamadas de mesa (HU-41)
alter table public.table_calls
  add column if not exists atendida_at timestamptz;

create index if not exists idx_table_calls_table_atendida_created
  on public.table_calls (table_id, atendida, created_at desc);

create index if not exists idx_table_calls_restaurant_created
  on public.table_calls (restaurant_id, created_at desc);

-- Publicación Realtime de table_calls
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'table_calls'
  ) then
    alter publication supabase_realtime add table public.table_calls;
  end if;
end $$;

-- Rutas públicas: permitir lectura mínima a sesiones anónimas
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'restaurants'
      and policyname = 'restaurants: anon leen'
  ) then
    create policy "restaurants: anon leen"
      on public.restaurants for select
      using (auth.role() = 'anon');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tables'
      and policyname = 'tables: anon leen'
  ) then
    create policy "tables: anon leen"
      on public.tables for select
      using (auth.role() = 'anon');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'menu_items'
      and policyname = 'menu_items: anon leen disponibles'
  ) then
    create policy "menu_items: anon leen disponibles"
      on public.menu_items for select
      using (
        auth.role() = 'anon'
        and disponible = true
      );
  end if;
end $$;
