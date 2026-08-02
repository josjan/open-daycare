drop policy if exists "users_select_staff" on public.users;
drop policy if exists "invitations_select_staff" on public.invitations;
drop policy if exists "invitations_insert_staff" on public.invitations;
drop policy if exists "parent_children_select_staff" on public.parent_children;

create policy "users_select_staff" on public.users
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = (select auth.uid()) and u.role = 'staff'));

create policy "invitations_select_staff" on public.invitations
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = (select auth.uid()) and u.role = 'staff'));

create policy "invitations_insert_staff" on public.invitations
  for insert to authenticated
  with check (exists (select 1 from public.users u where u.id = (select auth.uid()) and u.role = 'staff'));

create policy "parent_children_select_staff" on public.parent_children
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = (select auth.uid()) and u.role = 'staff'));

create index invitations_invited_by_idx on public.invitations (invited_by);
