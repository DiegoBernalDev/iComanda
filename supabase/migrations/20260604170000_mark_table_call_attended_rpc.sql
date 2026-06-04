create or replace function public.mark_table_call_attended(p_call_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.get_my_role() not in ('admin', 'mesero') then
    raise exception 'No autorizado para marcar llamadas como atendidas';
  end if;

  update public.table_calls
  set atendida = true,
      atendida_at = now()
  where id = p_call_id
    and atendida = false;
end;
$$;

grant execute on function public.mark_table_call_attended(uuid) to authenticated;
