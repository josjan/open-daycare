create type public.relationship_type as enum ('father', 'mother', 'guardian');

create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references public.children (id),
  invited_by  uuid not null references public.users (id),
  full_name   text not null,
  email       text not null,
  relationship public.relationship_type not null,
  code        text not null unique,
  status      public.invitation_status not null default 'pending',
  expires_at  timestamptz not null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

create index invitations_child_id_idx on public.invitations (child_id);
create index invitations_email_idx on public.invitations (email);

create table public.parent_children (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.users (id),
  child_id     uuid not null references public.children (id),
  relationship public.relationship_type not null,
  created_at   timestamptz not null default now(),
  unique (parent_id, child_id)
);

create index parent_children_child_id_idx  on public.parent_children (child_id);
create index parent_children_parent_id_idx on public.parent_children (parent_id);

alter table public.invitations     enable row level security;
alter table public.parent_children enable row level security;

create policy "users_select_staff" on public.users
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'));

create policy "invitations_select_staff" on public.invitations
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'));

create policy "invitations_insert_staff" on public.invitations
  for insert to authenticated
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'));

create policy "parent_children_select_staff" on public.parent_children
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'staff'));
