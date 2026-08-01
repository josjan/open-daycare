create table public.daycares (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  address    text,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;

insert into public.daycares (name, address) values
  ('Guardería Sala Soles', 'Av. del Sol 123, Centro'),
  ('Guardería Los Peques', 'Calle Luna 45, Villa Verde'),
  ('Guardería Arcoíris', 'Calle Arcoíris 89, Col. Colores'),
  ('Guardería Estrellitas', 'Av. Estrellas 210, Norte');
