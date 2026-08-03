create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_daycare_id uuid;
begin
  if (new.raw_user_meta_data is null or new.raw_user_meta_data ->> 'daycare_id' is null) then
    return new; -- signups fuera del flujo de la app no crean perfil
  end if;

  if (new.raw_user_meta_data ->> 'daycare_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return new; -- daycare_id malformado: no crear perfil
  end if;

  v_daycare_id := (new.raw_user_meta_data ->> 'daycare_id')::uuid;

  if not exists (select 1 from public.daycares d where d.id = v_daycare_id) then
    return new; -- daycare desconocido: no crear perfil
  end if;

  insert into public.users (
    id, daycare_id, role, status, full_name,
    avatar_url, notify_on_post, daily_summary_enabled, created_at, updated_at
  )
  values (
    new.id,
    v_daycare_id,
    'parent', -- rol fijado en el servidor; nunca se confía en metadata del usuario
    'active',
    new.raw_user_meta_data ->> 'full_name',
    null,
    true,
    true,
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
