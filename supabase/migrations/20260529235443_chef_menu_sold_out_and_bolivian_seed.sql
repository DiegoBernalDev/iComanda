alter table public.menu_items
  add column if not exists agotado boolean not null default false;

create or replace function public.set_menu_item_sold_out(
  p_menu_item_id uuid,
  p_agotado boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.get_my_role() not in ('admin', 'chef') then
    raise exception 'Only admins or chefs can update kitchen availability';
  end if;

  update public.menu_items
  set agotado = p_agotado
  where id = p_menu_item_id;

  if not found then
    raise exception 'Menu item not found';
  end if;
end;
$$;

grant execute on function public.set_menu_item_sold_out(uuid, boolean) to authenticated;

with target_restaurant as (
  select id
  from public.restaurants
  order by created_at asc
  limit 1
), demo_items(nombre, descripcion, precio, categoria, imagen_url) as (
  values
    ('Silpancho cochabambino', 'Milanesa de res con arroz, papa, huevo y ensalada fresca.', 38.00, 'Platos principales', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80'),
    ('Sopa de maní', 'Sopa boliviana de maní con carne, verduras y papas fritas.', 24.00, 'Entradas', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80'),
    ('Anticucho paceño', 'Brochetas de corazón con papa y salsa de maní.', 28.00, 'Entradas', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80'),
    ('Majadito oriental', 'Arroz con charque, huevo y plátano frito al estilo oriental.', 34.00, 'Platos principales', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=80'),
    ('Api morado', 'Bebida caliente de maíz morado con especias.', 10.00, 'Bebidas', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80'),
    ('Mocochinchi', 'Refresco tradicional de durazno deshidratado con canela.', 9.00, 'Bebidas', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80')
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
