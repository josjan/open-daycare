create type public.post_type as enum (
  'meal', 'nap', 'activity', 'achievement', 'photo', 'announcement', 'mood'
);

create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.users (id),
  room_id      uuid references public.rooms (id),
  type         public.post_type not null,
  title        text,
  body         text not null,
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index posts_author_id_idx on public.posts (author_id);
create index posts_room_id_idx on public.posts (room_id);

create table public.post_children (
  post_id  uuid not null references public.posts (id),
  child_id uuid not null references public.children (id),
  primary key (post_id, child_id)
);

create index post_children_post_id_idx on public.post_children (post_id);
create index post_children_child_id_idx on public.post_children (child_id);

create table public.post_photos (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id),
  url        text not null,
  width      int,
  height     int,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create index post_photos_post_id_idx on public.post_photos (post_id);

create table public.reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id),
  user_id    uuid not null references public.users (id),
  type       text not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index reactions_post_id_idx on public.reactions (post_id);
create index reactions_user_id_idx on public.reactions (user_id);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id),
  author_id  uuid not null references public.users (id),
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_post_id_idx on public.comments (post_id);
create index comments_author_id_idx on public.comments (author_id);

alter table public.posts enable row level security;
alter table public.post_children enable row level security;
alter table public.post_photos enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;

-- posts: SELECT para cualquier authenticated del mismo daycare
create policy "posts_select_authenticated" on public.posts
  for select to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and (
          posts.room_id is null
          or exists (
            select 1 from public.rooms r
            where r.id = posts.room_id and r.daycare_id = u.daycare_id
          )
          or exists (
            select 1
            from public.post_children pc
            join public.children c on c.id = pc.child_id
            join public.rooms r on r.id = c.room_id
            where pc.post_id = posts.id and r.daycare_id = u.daycare_id
          )
        )
    )
  );

create policy "posts_insert_staff" on public.posts
  for insert to authenticated
  with check (
    private.is_staff()
    and author_id = (select auth.uid())
    and (
      room_id is null
      or exists (
        select 1 from public.rooms r
        where r.id = room_id and r.daycare_id = private.current_daycare_id()
      )
    )
  );

create policy "posts_update_staff" on public.posts
  for update to authenticated
  using (private.is_staff())
  with check (private.is_staff());

create policy "posts_delete_staff" on public.posts
  for delete to authenticated
  using (private.is_staff());

-- post_children
create policy "post_children_select_authenticated" on public.post_children
  for select to authenticated using (true);

create policy "post_children_insert_staff" on public.post_children
  for insert to authenticated
  with check (
    private.is_staff()
    and exists (
      select 1
      from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id and r.daycare_id = private.current_daycare_id()
    )
  );

-- post_photos
create policy "post_photos_select_authenticated" on public.post_photos
  for select to authenticated using (true);

create policy "post_photos_insert_staff" on public.post_photos
  for insert to authenticated
  with check (private.is_staff());

-- reactions
create policy "reactions_select_authenticated" on public.reactions
  for select to authenticated using (true);

create policy "reactions_insert_authenticated" on public.reactions
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- comments
create policy "comments_select_authenticated" on public.comments
  for select to authenticated using (true);

create policy "comments_insert_authenticated" on public.comments
  for insert to authenticated
  with check (author_id = (select auth.uid()));
