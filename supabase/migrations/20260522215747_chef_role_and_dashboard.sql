alter type public.rol_usuario add value if not exists 'chef';

drop policy if exists "orders: mesero ve las suyas, admin ve todas" on public.orders;
create policy "orders: mesero ve las suyas, admin y chef ven todas"
  on public.orders for select
  using (
    mesero_id = auth.uid()
    or get_my_role() = 'admin'
    or get_my_role() = 'chef'
  );

drop policy if exists "orders: mesero actualiza las suyas, admin todas" on public.orders;
create policy "orders: mesero actualiza las suyas, admin y chef"
  on public.orders for update
  using (
    mesero_id = auth.uid()
    or get_my_role() = 'admin'
    or get_my_role() = 'chef'
  );

drop policy if exists "order_items: acceso según orden padre" on public.order_items;
create policy "order_items: acceso por orden para mesero admin chef"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and (
          orders.mesero_id = auth.uid()
          or get_my_role() = 'admin'
          or get_my_role() = 'chef'
        )
    )
  );
