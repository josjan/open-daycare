create schema if not exists private;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and u.role = 'staff'
  );
$$;

revoke execute on function private.is_staff() from public, anon;
grant execute on function private.is_staff() to authenticated;

drop policy if exists "users_select_staff" on public.users;
create policy "users_select_staff" on public.users
  for select to authenticated
  using (private.is_staff());

drop policy if exists "invitations_select_staff" on public.invitations;
create policy "invitations_select_staff" on public.invitations
  for select to authenticated
  using (private.is_staff());

drop policy if exists "invitations_insert_staff" on public.invitations;
create policy "invitations_insert_staff" on public.invitations
  for insert to authenticated
  with check (private.is_staff());

drop policy if exists "parent_children_select_staff" on public.parent_children;
create policy "parent_children_select_staff" on public.parent_children
  for select to authenticated
  using (private.is_staff());

drop policy if exists "children_select_staff" on public.children;
create policy "children_select_staff" on public.children
  for select to authenticated
  using (private.is_staff());

drop policy if exists "children_insert_staff" on public.children;
create policy "children_insert_staff" on public.children
  for insert to authenticated
  with check (private.is_staff());

drop policy if exists "children_update_staff" on public.children;
create policy "children_update_staff" on public.children
  for update to authenticated
  using (private.is_staff())
  with check (private.is_staff());

drop policy if exists "children_delete_staff" on public.children;
create policy "children_delete_staff" on public.children
  for delete to authenticated
  using (private.is_staff());
