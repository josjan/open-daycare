-- El feed de familia muestra el autor de cada post ("HH:MM · Maestra Caro · Sala").
-- Hoy la policy de users solo permite leer la propia fila o filas del staff del mismo
-- daycare, así que un padre no puede resolver el full_name del autor embebido.
-- Se agrega lectura de perfil para cualquier usuario autenticado del mismo daycare,
-- usando una función SECURITY DEFINER (patrón private.is_staff) para evitar recursión.

create or replace function private.current_user_daycare_id()
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  select u.daycare_id
  from public.users u
  where u.id = (select auth.uid());
$$;

create policy "users_select_same_daycare"
on public.users
for select
to authenticated
using (daycare_id = private.current_user_daycare_id());
