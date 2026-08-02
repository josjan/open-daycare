create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id         uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  name       text not null,
  created_at timestamptz not null default now()
);

create index rooms_daycare_id_idx on public.rooms (daycare_id);

create table public.children (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.rooms (id),
  full_name     text not null,
  birth_date    date not null,
  enrolled_at   date not null default current_date,
  medical_notes text,
  allergy_tags  text[] not null default '{}',
  photo_consent boolean not null default true,
  status        public.child_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index children_room_id_idx on public.children (room_id);

alter table public.rooms enable row level security;
alter table public.children enable row level security;

create policy "rooms_select_authenticated" on public.rooms
  for select to authenticated
  using (true);

create policy "children_select_staff" on public.children
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'));

create policy "children_insert_staff" on public.children
  for insert to authenticated
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'));

create policy "children_update_staff" on public.children
  for update to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'));

create policy "children_delete_staff" on public.children
  for delete to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'));

insert into public.rooms (daycare_id, name)
select d.id, r.name
from public.daycares d
cross join (values ('Soles'), ('Lunas'), ('Estrellas')) as r (name)
where d.name = 'Guardería Sala Soles';
