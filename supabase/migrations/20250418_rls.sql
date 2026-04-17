-- =============================================================
-- MIGRACIÓN 02 — Row Level Security
-- HU-10: RLS para la tabla orders
-- HU-11: RLS para expenses, menu_items y table_calls
-- =============================================================

-- ── Habilitar RLS en todas las tablas ────────────────────────
alter table profiles    enable row level security;
alter table restaurants enable row level security;
alter table tables      enable row level security;
alter table menu_items  enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;
alter table expenses    enable row level security;
alter table table_calls enable row level security;

-- =============================================================
-- profiles
-- =============================================================

-- Cada usuario ve su propio perfil; admin ve todos
create policy "profiles: leer propio o admin"
  on profiles for select
  using (
    id = auth.uid()
    or get_my_role() = 'admin'
  );

-- Solo admin puede insertar/actualizar/eliminar perfiles
create policy "profiles: admin gestiona"
  on profiles for all
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- =============================================================
-- restaurants
-- =============================================================

create policy "restaurants: usuarios autenticados leen"
  on restaurants for select
  using (auth.role() = 'authenticated');

create policy "restaurants: solo admin modifica"
  on restaurants for all
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- =============================================================
-- tables
-- =============================================================

create policy "tables: usuarios autenticados leen"
  on tables for select
  using (auth.role() = 'authenticated');

create policy "tables: solo admin modifica"
  on tables for all
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- =============================================================
-- menu_items — HU-11
-- =============================================================

-- Lectura: cualquier usuario autenticado (mesero necesita ver el menú)
create policy "menu_items: autenticados leen"
  on menu_items for select
  using (auth.role() = 'authenticated');

-- Escritura: solo admin
create policy "menu_items: admin gestiona"
  on menu_items for all
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- =============================================================
-- orders — HU-10
-- =============================================================

-- Mesero: solo ve sus propias órdenes
-- Admin: ve todas las órdenes del restaurante
create policy "orders: mesero ve las suyas, admin ve todas"
  on orders for select
  using (
    mesero_id = auth.uid()
    or get_my_role() = 'admin'
  );

-- Mesero: puede crear órdenes asignadas a sí mismo
create policy "orders: mesero crea"
  on orders for insert
  with check (
    mesero_id = auth.uid()
    and get_my_role() = 'mesero'
  );

-- Mesero: puede actualizar sus propias órdenes activas
-- Admin: puede actualizar cualquier orden
create policy "orders: mesero actualiza las suyas, admin todas"
  on orders for update
  using (
    mesero_id = auth.uid()
    or get_my_role() = 'admin'
  );

-- Solo admin puede eliminar órdenes
create policy "orders: solo admin elimina"
  on orders for delete
  using (get_my_role() = 'admin');

-- =============================================================
-- order_items
-- =============================================================

create policy "order_items: acceso según orden padre"
  on order_items for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and (orders.mesero_id = auth.uid() or get_my_role() = 'admin')
    )
  );

create policy "order_items: mesero inserta en sus órdenes"
  on order_items for insert
  with check (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.mesero_id = auth.uid()
    )
  );

create policy "order_items: admin gestiona"
  on order_items for all
  using (get_my_role() = 'admin');

-- =============================================================
-- expenses — HU-11
-- =============================================================

create policy "expenses: solo admin"
  on expenses for all
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- =============================================================
-- table_calls — HU-11
-- =============================================================

-- Mesero: ve las llamadas de sus mesas
-- Admin: ve todas
create policy "table_calls: mesero y admin leen"
  on table_calls for select
  using (
    get_my_role() = 'admin'
    or exists (
      select 1 from orders
      where orders.table_id = table_calls.table_id
        and orders.mesero_id = auth.uid()
        and orders.estado = 'activa'
    )
  );

-- Inserción libre para sesiones anónimas de mesa (Sprint 3)
create policy "table_calls: insertar"
  on table_calls for insert
  with check (true);

-- Solo admin y mesero pueden marcar como atendida
create policy "table_calls: marcar atendida"
  on table_calls for update
  using (
    get_my_role() = 'admin'
    or get_my_role() = 'mesero'
  );
