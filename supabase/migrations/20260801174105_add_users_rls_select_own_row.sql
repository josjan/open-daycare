create policy "users_select_own" on public.users
  for select
  to authenticated
  using ((select auth.uid()) = id);

grant select on public.users to authenticated;
