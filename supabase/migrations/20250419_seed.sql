-- =============================================================
-- SEED — Datos de prueba para desarrollo
-- ⚠️  Ejecutar SOLO en entorno de desarrollo
-- =============================================================

-- Restaurante de prueba
insert into restaurants (id, nombre, slug, direccion, telefono)
values (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Restaurante El Buen Sabor',
  'el-buen-sabor',
  'Av. Siempre Viva 742, La Paz',
  '+591 2 123 4567'
);

-- Mesas de prueba
insert into tables (restaurant_id, numero, capacidad, activa) values
  ('a1b2c3d4-0000-0000-0000-000000000001', 1, 2, true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 2, 4, true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 3, 4, true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 4, 6, true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 5, 2, false),
  ('a1b2c3d4-0000-0000-0000-000000000001', 6, 8, true);

-- Ítems del menú de prueba
insert into menu_items (restaurant_id, nombre, descripcion, precio, categoria, disponible) values
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Silpancho',       'Carne apanada con arroz, papa y huevo frito', 35.00, 'Platos principales', true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Fricasé',         'Caldo de cerdo con chuño y mote',            40.00, 'Platos principales', true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Salteñas (x2)',   'Salteñas de pollo horneadas',                15.00, 'Entradas',           true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Api con pastel',  'Api morado con pastel de queso',             12.00, 'Bebidas',            true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Refresco natural','Refresco de mocochinchi o mango',             8.00, 'Bebidas',            true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Pique macho',     'Papas fritas con carne, chorizo y verduras', 45.00, 'Platos principales', false);

-- Nota: los usuarios (profiles) se crean automáticamente via trigger
-- cuando se registran en Supabase Auth. Ver instrucciones en README.
