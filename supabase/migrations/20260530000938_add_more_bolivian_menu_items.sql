with target_restaurant as (
  select id
  from public.restaurants
  order by created_at asc
  limit 1
), demo_items(nombre, descripcion, precio, categoria, imagen_url) as (
  values
    ('Fricase paceño', 'Caldo picante de cerdo con mote, chuño y pan marraqueta.', 36.00, 'Platos principales', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80'),
    ('Charquekan orureño', 'Charque desmenuzado con mote, papa, huevo y llajwa.', 42.00, 'Platos principales', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80'),
    ('Chicharrón de cerdo', 'Cerdo crocante con mote, papa y salsa picante.', 45.00, 'Platos principales', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=80'),
    ('Huminta al horno', 'Huminta dulce de choclo con queso, servida caliente.', 14.00, 'Entradas', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80'),
    ('Salteña de carne', 'Empanada jugosa tradicional con carne, papa y especias.', 8.00, 'Entradas', 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80'),
    ('Llajwa de la casa', 'Salsa picante boliviana de locoto y tomate.', 5.00, 'Entradas', 'https://images.unsplash.com/photo-1607532941433-304659e8198a?auto=format&fit=crop&w=900&q=80'),
    ('Somó cruceño', 'Bebida fría de maíz pelado con canela.', 9.00, 'Bebidas', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80'),
    ('Chicha morada', 'Refresco de maíz morado con frutas y especias.', 10.00, 'Bebidas', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80')
)
insert into public.menu_items (restaurant_id, nombre, descripcion, precio, categoria, imagen_url, disponible, agotado)
select tr.id, di.nombre, di.descripcion, di.precio, di.categoria, di.imagen_url, true, false
from target_restaurant tr
cross join demo_items di
where not exists (
  select 1
  from public.menu_items mi
  where mi.restaurant_id = tr.id
    and lower(mi.nombre) = lower(di.nombre)
);
