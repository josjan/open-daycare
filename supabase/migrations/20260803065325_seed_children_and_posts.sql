insert into public.children (room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, photo_consent, status)
select r.id, k.full_name, k.birth_date, k.enrolled_at, k.medical_notes, k.allergy_tags, true, 'active'
from public.rooms r
cross join (values
  ('Mateo Fernández', '2022-03-12'::date, '2025-02-01'::date, 'Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.', array['peanut']),
  ('Sofía Méndez',    '2023-08-05'::date, '2025-03-01'::date, null, '{}'::text[]),
  ('Benjamín Ruiz',   '2022-01-20'::date, '2025-01-01'::date, null, '{}'::text[]),
  ('Valentina Soto',  '2023-11-14'::date, '2025-04-01'::date, null, '{}'::text[]),
  ('Tomás Díaz',      '2022-02-08'::date, '2025-02-01'::date, 'Intolerancia a la lactosa. No leche ni derivados.', array['lactose']),
  ('Emma Castro',     '2023-04-30'::date, '2025-05-01'::date, null, '{}'::text[]),
  ('Lucas Romero',    '2022-06-17'::date, '2025-03-01'::date, null, '{}'::text[]),
  ('Olivia Vega',     '2023-09-22'::date, '2025-06-01'::date, null, '{}'::text[])
) as k (full_name, birth_date, enrolled_at, medical_notes, allergy_tags)
where r.name = 'Soles';

with parent_users as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, created_at, updated_at
  )
  select
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p.email,
    crypt('Abc123456@', gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', p.full_name, 'role', 'parent'),
    now(),
    now()
  from (values
    ('Lucía Fernández', 'lucia@gmail.com'),
    ('Diego Fernández', 'diego@gmail.com'),
    ('Ana Méndez',      'ana@gmail.com'),
    ('María Ruiz',      'maria@gmail.com'),
    ('Carlos Ruiz',     'carlos@gmail.com'),
    ('Paula Díaz',      'paula@gmail.com'),
    ('Laura Castro',    'laura@gmail.com'),
    ('Roberto Romero',  'roberto@gmail.com'),
    ('Claudia Vega',    'claudia@gmail.com')
  ) as p (full_name, email)
  returning id, raw_user_meta_data->>'full_name' as full_name
)
insert into public.users (id, daycare_id, role, status, full_name, notify_on_post, daily_summary_enabled, created_at, updated_at)
select pu.id, d.id, 'parent', 'active', pu.full_name, true, true, now(), now()
from parent_users pu
cross join public.daycares d
where d.name = 'Guardería Sala Soles';

-- post-1: logro de Mateo (3 · 1)
with p as (
  insert into public.posts (author_id, room_id, type, title, body, published_at)
  select u.id, null, 'achievement', null,
         '¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.',
         now() - interval '1 hour'
  from public.users u where u.full_name = 'José'
  returning id
)
, pc as (
  insert into public.post_children (post_id, child_id)
  select p.id, c.id
  from p join public.children c on c.full_name = 'Mateo Fernández'
)
, r as (
  insert into public.reactions (post_id, user_id, type)
  select p.id, u.id, 'love'
  from p join public.users u
    on u.full_name in ('Lucía Fernández', 'Diego Fernández', 'Ana Méndez')
)
insert into public.comments (post_id, author_id, body)
select p.id, u.id, '¡Qué orgullo, Mateo!'
from p join public.users u on u.full_name = 'Lucía Fernández';

-- post-2: actividad de Mateo (5 · 2)
with p as (
  insert into public.posts (author_id, room_id, type, title, body, published_at)
  select u.id, null, 'activity', null,
         'Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.',
         now() - interval '5 hours'
  from public.users u where u.full_name = 'José'
  returning id
)
, pc as (
  insert into public.post_children (post_id, child_id)
  select p.id, c.id
  from p join public.children c on c.full_name = 'Mateo Fernández'
)
, r as (
  insert into public.reactions (post_id, user_id, type)
  select p.id, u.id, 'love'
  from p join public.users u
    on u.full_name in ('Lucía Fernández', 'Diego Fernández', 'Ana Méndez', 'María Ruiz', 'Carlos Ruiz')
)
insert into public.comments (post_id, author_id, body)
select p.id, u.id, c.body
from p
join (values
  ('Lucía Fernández', '¡Hermoso!'),
  ('Ana Méndez',      '¡Qué artista!')
) as c (full_name, body) on true
join public.users u on u.full_name = c.full_name;

-- post-3: anuncio general (8 · 0)
with p as (
  insert into public.posts (author_id, room_id, type, title, body, published_at)
  select u.id, (select r.id from public.rooms r where r.name = 'Soles' limit 1),
         'announcement', 'Anuncio general',
         'El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.',
         now() - interval '7 hours'
  from public.users u where u.full_name = 'José'
  returning id
)
insert into public.reactions (post_id, user_id, type)
select p.id, u.id, 'love'
from p join public.users u
  on u.full_name in ('Lucía Fernández', 'Diego Fernández', 'Ana Méndez', 'María Ruiz', 'Carlos Ruiz', 'Paula Díaz', 'Laura Castro', 'Roberto Romero');
