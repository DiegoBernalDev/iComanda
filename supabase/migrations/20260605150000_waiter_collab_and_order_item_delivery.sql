alter table public.order_items
  add column if not exists delivered_at timestamptz;

update public.order_items oi
set delivered_at = coalesce(o.paid_at, o.closed_at, o.created_at)
from public.orders o
where o.id = oi.order_id
  and o.estado = 'entregada'
  and oi.delivered_at is null;

drop policy if exists "orders: mesero ve las suyas, admin y chef ven todas" on public.orders;
create policy "orders: mesero colabora en abiertas, admin y chef ven todas"
  on public.orders for select
  using (
    mesero_id = auth.uid()
    or get_my_role() = 'admin'
    or get_my_role() = 'chef'
    or (get_my_role() = 'mesero' and estado in ('activa', 'lista', 'entregada'))
  );

drop policy if exists "orders: mesero actualiza las suyas, admin y chef" on public.orders;
create policy "orders: mesero colabora en abiertas para actualizar"
  on public.orders for update
  using (
    mesero_id = auth.uid()
    or get_my_role() = 'admin'
    or get_my_role() = 'chef'
    or (get_my_role() = 'mesero' and estado in ('activa', 'lista', 'entregada'))
  )
  with check (
    mesero_id = auth.uid()
    or get_my_role() = 'admin'
    or get_my_role() = 'chef'
    or (get_my_role() = 'mesero' and estado in ('activa', 'lista', 'entregada'))
  );

drop policy if exists "order_items: acceso por orden para mesero admin chef" on public.order_items;
create policy "order_items: acceso por orden abierta para mesero admin chef"
  on public.order_items for select
  using (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and (
          orders.mesero_id = auth.uid()
          or get_my_role() = 'admin'
          or get_my_role() = 'chef'
          or (get_my_role() = 'mesero' and orders.estado in ('activa', 'lista', 'entregada'))
        )
    )
  );

drop policy if exists "order_items: mesero inserta en sus órdenes" on public.order_items;
create policy "order_items: mesero inserta en órdenes abiertas"
  on public.order_items for insert
  with check (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and (
          orders.mesero_id = auth.uid()
          or get_my_role() = 'admin'
          or (get_my_role() = 'mesero' and orders.estado in ('activa', 'lista', 'entregada'))
        )
    )
  );

drop policy if exists "order_items: admin gestiona" on public.order_items;
create policy "order_items: admin chef y mesero actualizan abiertas"
  on public.order_items for update
  using (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and (
          orders.mesero_id = auth.uid()
          or get_my_role() = 'admin'
          or get_my_role() = 'chef'
          or (get_my_role() = 'mesero' and orders.estado in ('activa', 'lista', 'entregada'))
        )
    )
  )
  with check (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and (
          orders.mesero_id = auth.uid()
          or get_my_role() = 'admin'
          or get_my_role() = 'chef'
          or (get_my_role() = 'mesero' and orders.estado in ('activa', 'lista', 'entregada'))
        )
    )
  );

create or replace function public.append_order_items(
  p_order_id uuid,
  p_items jsonb
)
returns numeric
language plpgsql
as $$
declare
  v_total numeric(10,2);
  v_estado public.estado_orden;
  v_metodo public.metodo_pago;
  v_pago_confirmado boolean;
begin
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order items are required';
  end if;

  select estado, metodo_pago, pago_confirmado
  into v_estado, v_metodo, v_pago_confirmado
  from public.orders
  where id = p_order_id;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_estado = 'cancelada' then
    raise exception 'Cannot append items to a cancelled order';
  end if;

  if v_estado = 'entregada' and v_metodo = 'qr' and v_pago_confirmado then
    raise exception 'Cannot append items to a paid QR order';
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
    cantidad,
    delivered_at
  )
  select
    p_order_id,
    payload.menu_item_id,
    payload.nombre,
    payload.precio_unitario,
    payload.cantidad,
    null
  from payload;

  update public.orders
  set
    total = coalesce((
      select sum(oi.precio_unitario * oi.cantidad)
      from public.order_items oi
      where oi.order_id = p_order_id
    ), 0),
    estado = case when estado in ('lista', 'entregada') then 'activa' else estado end,
    closed_at = case when estado in ('lista', 'entregada') then null else closed_at end,
    pago_confirmado = case when estado = 'entregada' and metodo_pago <> 'qr' then false else pago_confirmado end,
    paid_at = case when estado = 'entregada' and metodo_pago <> 'qr' then null else paid_at end
  where id = p_order_id
  returning total into v_total;

  return coalesce(v_total, 0);
end;
$$;
