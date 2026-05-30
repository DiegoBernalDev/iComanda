create or replace function public.clear_table_after_payment(p_table_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.get_my_role() not in ('admin', 'mesero') then
    raise exception 'Only admins or waiters can clear tables';
  end if;

  if not exists (
    select 1
    from public.orders o
    where o.table_id = p_table_id
      and o.estado = 'entregada'
      and o.pago_confirmado = true
      and o.closed_at is not null
  ) then
    raise exception 'No paid delivered order found for this table';
  end if;

  update public.tables
  set last_cleared_at = now()
  where id = p_table_id;
end;
$$;

grant execute on function public.clear_table_after_payment(uuid) to authenticated;
