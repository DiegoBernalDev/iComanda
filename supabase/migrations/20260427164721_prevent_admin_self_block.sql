-- Evita que un administrador bloquee su propia cuenta.
create or replace function prevent_admin_self_block()
returns trigger
language plpgsql
as $$
begin
  if OLD.rol = 'admin'
    and OLD.id = auth.uid()
    and OLD.activo = true
    and NEW.activo = false
  then
    raise exception 'No podés bloquear tu propio usuario administrador.';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_prevent_admin_self_block on profiles;

create trigger trg_prevent_admin_self_block
  before update of activo on profiles
  for each row
  execute function prevent_admin_self_block();
