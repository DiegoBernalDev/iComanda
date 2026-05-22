alter table public.tables
  add column if not exists last_cleared_at timestamptz;

create or replace function public.create_order_with_items(
  p_restaurant_id uuid,
  p_table_id uuid,
  p_mesero_id uuid,
  p_metodo_pago metodo_pago,
  p_items jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_order_id uuid;
begin
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order items are required';
  end if;

  insert into public.orders (
    restaurant_id,
    table_id,
    mesero_id,
    estado,
    metodo_pago,
    total
  ) values (
    p_restaurant_id,
    p_table_id,
    p_mesero_id,
    'activa',
    p_metodo_pago,
    0
  )
  returning id into v_order_id;

  with payload as (
    select *
    from jsonb_to_recordset(p_items) as item(
      menu_item_id uuid,
      nombre text,
      precio_unitario numeric(10,2),
      cantidad integer
    )
  ), inserted as (
    insert into public.order_items (
      order_id,
      menu_item_id,
      nombre,
      precio_unitario,
      cantidad
    )
    select
      v_order_id,
      payload.menu_item_id,
      payload.nombre,
      payload.precio_unitario,
      payload.cantidad
    from payload
    returning precio_unitario, cantidad
  )
  update public.orders
  set total = coalesce((
    select sum(precio_unitario * cantidad)
    from inserted
  ), 0)
  where id = v_order_id;

  return v_order_id;
end;
$$;

create or replace function public.append_order_items(
  p_order_id uuid,
  p_items jsonb
)
returns numeric
language plpgsql
as $$
declare
  v_total numeric(10,2);
begin
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order items are required';
  end if;

  with payload as (
    select *
    from jsonb_to_recordset(p_items) as item(
      menu_item_id uuid,
      nombre text,
      precio_unitario numeric(10,2),
      cantidad integer
    )
  )
  insert into public.order_items (
    order_id,
    menu_item_id,
    nombre,
    precio_unitario,
    cantidad
  )
  select
    p_order_id,
    payload.menu_item_id,
    payload.nombre,
    payload.precio_unitario,
    payload.cantidad
  from payload;

  update public.orders
  set
    total = coalesce((
      select sum(oi.precio_unitario * oi.cantidad)
      from public.order_items oi
      where oi.order_id = p_order_id
    ), 0),
    estado = case when estado = 'lista' then 'activa' else estado end,
    closed_at = case when estado = 'lista' then null else closed_at end
  where id = p_order_id
  returning total into v_total;

  return coalesce(v_total, 0);
end;
$$;
