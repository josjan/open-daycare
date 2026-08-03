-- Vincula a los padres seedeados con sus hijos (parent_children estaba vacío).
-- Resuelve por valores estables (email de auth.users + full_name de children).
insert into public.parent_children (parent_id, child_id, relationship)
select u.id, c.id, v.relationship::relationship_type
from (values
  ('lucia@gmail.com',  'Mateo Fernández',    'mother'),
  ('diego@gmail.com',  'Mateo Fernández',    'father'),
  ('ana@gmail.com',    'Sofía Méndez',       'mother'),
  ('maria@gmail.com',  'Benjamín Ruiz',      'mother'),
  ('carlos@gmail.com', 'Benjamín Ruiz',      'father'),
  ('paula@gmail.com',  'Tomás Díaz',         'mother'),
  ('laura@gmail.com',  'Emma Castro',        'mother'),
  ('roberto@gmail.com','Lucas Romero',       'father'),
  ('claudia@gmail.com','Olivia Vega',        'mother')
) as v (email, child_full_name, relationship)
join auth.users au on au.email = v.email
join public.users u on u.id = au.id
join public.children c on c.full_name = v.child_full_name
on conflict (parent_id, child_id) do nothing;
