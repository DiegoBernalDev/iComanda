create or replace function public.get_waiter_table_state_snapshot(p_restaurant_id uuid)
returns table(
  id uuid,
  numero integer,
  capacidad integer,
  activa boolean,
  last_cleared_at timestamptz,
  active_order_id uuid,
  active_order_owner_id uuid,
  active_order_estado estado_orden,
  active_order_created_at timestamptz,
  latest_delivered_order_id uuid,
  latest_delivered_closed_at timestamptz,
  latest_delivered_pago_confirmado boolean,
  active_call_id uuid
)
language sql
security definer
set search_path = public
as $$
  select
    t.id,
    t.numero,
    t.capacidad,
    t.activa,
    t.last_cleared_at,
    active_order.id as active_order_id,
    active_order.mesero_id as active_order_owner_id,
    active_order.estado as active_order_estado,
    active_order.created_at as active_order_created_at,
    delivered_order.id as latest_delivered_order_id,
    delivered_order.closed_at as latest_delivered_closed_at,
    delivered_order.pago_confirmado as latest_delivered_pago_confirmado,
    table_call.id as active_call_id
  from public.tables t
  left join lateral (
    select o.id, o.mesero_id, o.estado, o.created_at
    from public.orders o
    where o.table_id = t.id
      and o.restaurant_id = t.restaurant_id
      and o.estado in ('activa', 'lista')
    order by o.created_at desc
    limit 1
  ) active_order on true
  left join lateral (
    select o.id, o.closed_at, o.pago_confirmado
    from public.orders o
    where o.table_id = t.id
      and o.restaurant_id = t.restaurant_id
      and o.estado = 'entregada'
      and o.closed_at is not null
    order by o.closed_at desc
    limit 1
  ) delivered_order on true
  left join lateral (
    select tc.id
    from public.table_calls tc
    where tc.table_id = t.id
      and tc.restaurant_id = t.restaurant_id
      and tc.atendida = false
    order by tc.created_at desc
    limit 1
  ) table_call on true
  where t.restaurant_id = p_restaurant_id
    and t.activa = true
    and public.get_my_role() in ('admin', 'mesero')
  order by t.numero asc;
$$;

grant execute on function public.get_waiter_table_state_snapshot(uuid) to authenticated;
