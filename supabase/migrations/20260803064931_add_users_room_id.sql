alter table public.users add column room_id uuid references public.rooms (id);

create index users_room_id_idx on public.users (room_id);

update public.users
set room_id = (select r.id from public.rooms r where r.name = 'Soles' limit 1)
where full_name = 'José' and role = 'staff';
