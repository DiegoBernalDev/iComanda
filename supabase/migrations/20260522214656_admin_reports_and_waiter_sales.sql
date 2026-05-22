alter table public.orders
  add column if not exists paid_at timestamptz;

update public.orders
set paid_at = coalesce(paid_at, closed_at, created_at)
where pago_confirmado = true
  and paid_at is null;

create or replace function public.get_report(date_from date, date_to date)
returns json
language sql
as $$
  with sales as (
    select coalesce(sum(o.total), 0)::numeric(10,2) as gross_income
    from public.orders o
    where o.restaurant_id = get_my_restaurant_id()
      and o.estado = 'entregada'
      and o.pago_confirmado = true
      and o.paid_at is not null
      and o.paid_at::date between date_from and date_to
  ), expenses as (
    select coalesce(sum(e.monto), 0)::numeric(10,2) as total_expenses
    from public.expenses e
    where e.restaurant_id = get_my_restaurant_id()
      and e.fecha between date_from and date_to
  )
  select json_build_object(
    'date_from', date_from,
    'date_to', date_to,
    'gross_income', sales.gross_income,
    'total_expenses', expenses.total_expenses,
    'net_income', (sales.gross_income - expenses.total_expenses)::numeric(10,2)
  )
  from sales, expenses;
$$;

create or replace function public.get_top_items(
  date_from date,
  date_to date,
  item_limit int default 10
)
returns table(
  menu_item_id uuid,
  name text,
  total_qty bigint,
  total_revenue numeric
)
language plpgsql
as $$
begin
  return query
  select
    oi.menu_item_id,
    oi.nombre as name,
    sum(oi.cantidad)::bigint as total_qty,
    coalesce(sum(oi.precio_unitario * oi.cantidad), 0)::numeric(10,2) as total_revenue
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.restaurant_id = get_my_restaurant_id()
    and o.estado = 'entregada'
    and o.pago_confirmado = true
    and o.paid_at is not null
    and o.paid_at::date between date_from and date_to
  group by oi.menu_item_id, oi.nombre
  order by sum(oi.cantidad) desc, sum(oi.precio_unitario * oi.cantidad) desc, oi.nombre asc
  limit greatest(coalesce(item_limit, 10), 1);
end;
$$;

create or replace function public.get_waiter_sales(date_from date, date_to date)
returns table(
  mesero_id uuid,
  waiter_name text,
  orders_count bigint,
  total_sales numeric
)
language sql
as $$
  select
    o.mesero_id,
    p.nombre as waiter_name,
    count(*)::bigint as orders_count,
    coalesce(sum(o.total), 0)::numeric(10,2) as total_sales
  from public.orders o
  join public.profiles p on p.id = o.mesero_id
  where o.restaurant_id = get_my_restaurant_id()
    and o.estado = 'entregada'
    and o.pago_confirmado = true
    and o.paid_at is not null
    and o.paid_at::date between date_from and date_to
  group by o.mesero_id, p.nombre
  order by total_sales desc, p.nombre asc;
$$;
