-- La policy anterior en children referenciaba parent_children y su policy de
-- staff referenciaba children: recursión infinita. Se reemplaza por una función
-- SECURITY DEFINER (mismo patrón que private.is_staff) que rompe el ciclo.

create or replace function private.is_linked_parent(child_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.parent_children pc
    where pc.child_id = is_linked_parent.child_id
      and pc.parent_id = (select auth.uid())
  );
$$;

drop policy if exists "children_select_own_linked" on public.children;

create policy "children_select_own_linked"
on public.children
for select
to authenticated
using (private.is_linked_parent(id));
