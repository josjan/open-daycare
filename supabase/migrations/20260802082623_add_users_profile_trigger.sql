create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.raw_user_meta_data is null or new.raw_user_meta_data ->> 'daycare_id' is null) then
    return new; -- signups fuera del flujo de la app no crean perfil
  end if;

  insert into public.users (
    id, daycare_id, role, status, full_name,
    avatar_url, notify_on_post, daily_summary_enabled, created_at, updated_at
  )
  values (
    new.id,
    (new.raw_user_meta_data ->> 'daycare_id')::uuid,
    (new.raw_user_meta_data ->> 'role')::public.user_role,
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
