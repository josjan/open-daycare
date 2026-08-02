drop policy if exists "children_select_staff" on public.children;
drop policy if exists "children_insert_staff" on public.children;
drop policy if exists "children_update_staff" on public.children;
drop policy if exists "children_delete_staff" on public.children;

create policy "children_select_staff" on public.children
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = (select auth.uid()) and u.role = 'staff'));

create policy "children_insert_staff" on public.children
  for insert to authenticated
  with check (exists (select 1 from public.users u where u.id = (select auth.uid()) and u.role = 'staff'));

create policy "children_update_staff" on public.children
  for update to authenticated
  using (exists (select 1 from public.users u where u.id = (select auth.uid()) and u.role = 'staff'))
  with check (exists (select 1 from public.users u where u.id = (select auth.uid()) and u.role = 'staff'));

create policy "children_delete_staff" on public.children
  for delete to authenticated
  using (exists (select 1 from public.users u where u.id = (select auth.uid()) and u.role = 'staff'));
