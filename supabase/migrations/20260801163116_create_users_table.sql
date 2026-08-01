create type public.user_role as enum ('staff', 'parent', 'admin');

create type public.user_status as enum ('pending', 'active');

create table public.users (
  id                    uuid primary key references auth.users (id) on delete cascade,
  daycare_id            uuid not null references public.daycares (id),
  role                  public.user_role not null,
  status                public.user_status not null default 'active',
  full_name             text not null,
  avatar_url            text,
  notify_on_post        boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.users enable row level security;

with new_auth_user as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, created_at, updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'jose@gmail.com',
    crypt('Abc123456@', gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', 'José', 'role', 'staff'),
    now(),
    now()
  )
  returning id
)
insert into public.users (id, daycare_id, role, status, full_name, notify_on_post, daily_summary_enabled, created_at, updated_at)
select a.id, d.id, 'staff', 'active', 'José', true, true, now(), now()
from new_auth_user a
cross join public.daycares d
where d.name = 'Guardería Sala Soles';
