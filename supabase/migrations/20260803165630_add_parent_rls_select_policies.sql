-- Los padres necesitan leer sus propios vínculos y los datos de sus hijos para
-- el feed de familia y el sidebar familia. Hasta ahora solo el staff podía SELECT.

create policy "parent_children_select_own"
on public.parent_children
for select
to authenticated
using (parent_id = auth.uid());

create policy "children_select_own_linked"
on public.children
for select
to authenticated
using (
  exists (
    select 1
    from public.parent_children pc
    where pc.child_id = children.id
      and pc.parent_id = auth.uid()
  )
);
