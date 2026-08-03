# SPEC 12 — Publicar posts de staff con imágenes en Supabase

> **Estado:** Aprobado
> **Depende de:** 06-crear-publicacion-modal, 08-users-table, 09-auth, 10-rooms-children-kids, 11-parent-invitation-and-activation
> **Fecha:** 2026-08-03
> **Objetivo:** Persistir en Supabase las publicaciones de staff (con o sin imágenes) — tablas `posts`, `post_children`, `post_photos`, `reactions`, `comments` y bucket de fotos — y conectar el feed `/` y el modal de publicación a la base de datos real, con publicación exclusiva de staff.

---

## Por qué existe este spec

SPEC 06 implementa el modal "Nueva publicación" íntegramente en memoria: el post y las fotos se pierden al recargar y el feed sigue leyendo `posts` de `mock.ts`. En Supabase ya existen `daycares`, `users`, `rooms`, `children`, `invitations` y `parent_children`, pero **no existe la tabla `posts`** ni las tablas que la acompañan. Este spec crea el modelo de publicaciones del doc `docs` (posts, post_children, post_photos, reactions, comments), lo siembra con los 3 posts del mock y migra el feed y el modal a leer/escribir contra la base de datos real, restringiendo la publicación a staff.

---

## Scope

**In:**

- Migración `create_posts_tables` (vía MCP `apply_migration` + copia local): enum `public.post_type` con **7** valores (`meal`, `nap`, `activity`, `achievement`, `photo`, `announcement`, `mood`), y las tablas `public.posts`, `public.post_children`, `public.post_photos`, `public.reactions`, `public.comments` según el doc `docs` (§7–§11), con índices en todas las columnas FK.
- Migración `add_users_room_id`: columna `users.room_id` (uuid, nullable, FK → `rooms`) + índice `users_room_id_idx`; asignar la sala `Soles` al staff `José`.
- Migración `seed_children_and_posts`: seed de los **8 niños del mock** en la sala `Soles`, seed de **9 usuarios padres** del mock (Lucía, Diego, Ana, María, Carlos, Paula, Laura, Roberto, Claudia) como usuarios demo (auth + `public.users` con `role='parent'`), y seed de los **3 posts** del mock (`post-1`, `post-2`, `post-3`) con sus `post_children`, `reactions` y `comments` para replicar los conteos `3·1`, `5·2`, `8·0`.
- Migración `create_post_photos_bucket`: bucket de Storage `post-photos` (público de lectura, mime `image/*`, límite 10 MB) + policies (lectura pública; insert solo staff).
- RLS: `posts` con SELECT para `authenticated` del mismo daycare y CRUD solo staff; `post_children`/`post_photos` con SELECT para `authenticated` e INSERT solo staff; `reactions`/`comments` con SELECT/INSERT para `authenticated`.
- Feed `/` conectado a la DB con `createBrowserClient`: carga `posts` + children etiquetados + fotos + conteos de reacciones/comentarios, ordenado por `published_at desc`, con estados `loading`/`error`. Los 3 posts del seed aparecen igual que hoy.
- `CreatePostModal` conectado a la DB: la sección PARA lista los niños reales del daycare (de `children`), y "Publicar" persiste: insert en `posts` → upload de fotos a `post-photos/{post_id}/...` → insert en `post_children` y `post_photos`.
- Publicación exclusiva de staff: el prompt "Compartí un momento…" y el modal solo se renderizan si el usuario logueado tiene `role='staff'`.
- Mapeo categoría UI ↔ `post_type`: `food→meal`, `nap→nap`, `activity→activity`, `achievement→achievement`, `mood→mood`, `photo→photo`, `announcement→announcement`.
- Anuncio "toda la sala": `room_id` = sala del staff (de `users.room_id`), `title` = `'Anuncio general'`, sin filas en `post_children`. Post de niño: `room_id` = `null`, una fila en `post_children`.
- `Post.tsx` renderiza la primera foto (`post_photos[0]`) con su URL pública; sin foto mantiene el placeholder actual.
- Verificación: `list_migrations`, `list_tables`, consultas de lectura, `get_advisors` (security y performance) y flujo browser.

**Out of scope (para futuros specs):**

- Multi-selección de destinatarios (el `post_children` M:N se usa con una sola fila).
- Grid/carrusel con todas las fotos en el feed (solo se muestra la primera).
- Likes y comentarios funcionales (reaccionar/comentar desde la UI); solo se muestran conteos.
- Edición, archivado o borrado de posts (policies de UPDATE/DELETE solo staff; sin UI).
- Filtrado del feed por rol de padre (padres ven posts de sus hijos + anuncios de su sala, según el doc). Por decisión, cualquier `authenticated` del daycare ve todos los posts.
- Lectura de `children` para padres (el nombre del niño embebido en el feed funciona para staff; ver riesgos).
- Detalle de publicación (`detalle-publicacion`).
- Notificaciones push / `daily_summaries`.

---

## Data model

### Migración `create_posts_tables`

Base `docs/opendaycare-database-schema.md` → §7–§11. El enum `post_type` no existe aún en la DB, por lo que se crea **ya con `mood`** incluido (no hace falta `ALTER TYPE`):

```sql
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
```

### Migración `add_users_room_id`

```sql
alter table public.users add column room_id uuid references public.rooms (id);

create index users_room_id_idx on public.users (room_id);

update public.users
set room_id = (select r.id from public.rooms r where r.name = 'Soles' limit 1)
where full_name = 'José' and role = 'staff';
```

### Migración `seed_children_and_posts`

Seed de los 8 niños del mock (todos en `Soles`, resolviendo `room_id` por nombre). Se conservan alergias (`allergy_tags` en inglés, como en SPEC 10) y notas médicas del mock:

```sql
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
```

Seed de 9 usuarios padres demo (auth + `public.users` con `role='parent'`), necesarios como autores de `reactions`/`comments`. Patrón de SPEC 08 (id de `auth.users` compartido, password demo):

```sql
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
```

Seed de los 3 posts del mock. Cada bloque es una sentencia con CTEs encadenados: inserta el post, luego `post_children`, luego `reactions` y `comments`, todo referenciando el mismo `post_id` (sin hardcodear IDs; se resuelven por `full_name`):

```sql
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
```

### Migración `create_post_photos_bucket`

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-photos', 'post-photos', true, 10485760, array['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
on conflict (id) do nothing;

create policy "post_photos_public_read" on storage.objects
  for select to public
  using (bucket_id = 'post-photos');

create policy "post_photos_insert_staff" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-photos' and (select private.is_staff()));
```

### Frontend

```ts
// src/types/post.ts
export type PostType =
  | "meal" | "nap" | "activity" | "achievement"
  | "photo" | "announcement" | "mood";

export interface PostRow {
  id: string;
  author_id: string;
  room_id: string | null;
  type: PostType;
  title: string | null;
  body: string;
  published_at: string;
  post_children?: { child_id: string; children?: { full_name: string } | null }[];
  post_photos?: { url: string; position: number }[];
  reactions?: { count: number }[];
  comments?: { count: number }[];
}

export interface NewPost {
  authorId: string;
  roomId: string | null;      // sala del staff si es anuncio; null si es de niño
  type: PostType;
  title: string | null;       // "Anuncio general" si es anuncio; null si es de niño
  body: string;
  childIds: string[];         // [childId] si es de niño; [] si es anuncio
  photos: File[];
}
```

```ts
// src/lib/postMappers.ts
// postTypeToCategory / categoryToPostType: mapeo bidireccional
// entre PostType (DB) y PostCategory (UI). food↔meal, nap↔nap,
// activity↔activity, achievement↔achievement, mood↔mood,
// photo↔photo, announcement↔announcement.

// postRowToPost(row: PostRow): Post (forma del mock)
//  - announcement → childName = title ?? "Anuncio general", childInitial "",
//    childAvatarBg "#CCD8F4", audience "toda la sala".
//  - niño → childName/initial/avatarBg del primer post_children.children
//    (avatarBg desde avatarPalette por índice), audience "familia de {nombre}".
//  - time → published_at local HH:MM.
//  - image → { label: "Foto", src: url } del post_photos[0] (orden por position).
//  - likes → reactions[0]?.count ?? 0; comments → comments[0]?.count ?? 0.
```

Feed query (`createBrowserClient`):

```ts
supabase
  .from("posts")
  .select(
    "id, type, title, body, published_at, room_id, author_id, " +
      "post_children(child_id, children(full_name)), " +
      "post_photos(url, position), reactions(count), comments(count)"
  )
  .order("published_at", { ascending: false });
```

Persistencia del post (`CreatePostModal`):

```ts
// 1. insert post → id
const { data: post } = await supabase
  .from("posts")
  .insert({
    author_id, room_id, type, title, body,
    published_at: new Date().toISOString(),
  })
  .select("id")
  .single();

// 2. por cada foto: upload a "post-photos/{post.id}/{i}-{nombre}" +
//    getPublicUrl → url; insert en post_photos { post_id, url, position: i }

// 3. si es de niño: insert en post_children { post_id, child_id }
```

Convenciones:

- Los posts de niño llevan `room_id = null`; los anuncios llevan `room_id` = sala del staff (`users.room_id`).
- La categoría elegida en el modal (pill) define `type`, independiente de si hay fotos.
- Se suben hasta 4 fotos (límite del modal, SPEC 06); el feed muestra solo la primera.
- IDs de seed con `gen_random_uuid()`; referencias resueltas por `full_name`/`name` (regla del skill: no hardcodear IDs).
- Índices en todas las columnas FK: Postgres no indexa FKs automáticamente y el advisor las reporta.

---

## Implementation plan

1. **Aplicar `create_posts_tables`** vía MCP `apply_migration` con el SQL del data model (enum, 5 tablas, índices, RLS + 13 policies, sin seed). Verificar: `list_migrations` muestra `create_posts_tables`; `list_tables` muestra las 5 tablas; `get_advisors` (security y performance).
2. **Aplicar `add_users_room_id`** — columna `room_id`, índice y asignación de `Soles` a `José`. Verificar: `execute_sql` sobre `public.users` de `José` devuelve `room_id` de la sala `Soles`.
3. **Aplicar `seed_children_and_posts`** — 8 niños, 9 padres, 3 posts + children/reactions/comments. Verificar: `select count(*) from public.children` = 8 (todos `room_id` de Soles); `select count(*) from public.users where role='parent'` = 9; por cada post, los conteos de `reactions`/`comments` son `3·1`, `5·2`, `8·0`.
4. **Aplicar `create_post_photos_bucket`** — bucket + 2 policies de storage. Verificar: bucket existe y es público; policies presentes.
5. **Copias locales** — crear `supabase/migrations/<version>_<nombre>.sql` para las 4 migraciones con el mismo `version` y el mismo SQL del remoto. Verificar: los 4 archivos existen y coinciden.
6. **Tipos y helpers** — crear `src/types/post.ts` y `src/lib/postMappers.ts`. Verificar: `npx tsc --noEmit` pasa.
7. **Refactor feed `/` (lectura)** — reemplazar `useState(posts)` de mock por carga en `useEffect` con `createBrowserClient` (query del data model), mapear con `postRowToPost` y renderizar. Estados `loading`/`error`. Verificar: `/` muestra los 3 posts del seed con sus conteos y badges.
8. **Conectar `CreatePostModal` (escritura)** — la sección PARA lista los niños reales del daycare (fetch de `children` + `childToKid` de SPEC 10); al publicar, insert post → upload fotos → insert `post_children`/`post_photos`, y en éxito el feed recarga desde la DB. En error, mensaje inline sin cerrar. Verificar: publicar un post con/sin foto lo muestra tras recargar.
9. **Gate de staff + sala** — cargar el perfil `users` del usuario (`id`, `role`, `room_id`); renderizar el prompt y el modal solo si `role='staff'`; usar `room_id` del staff para anuncios. Verificar: con Jose se ve el prompt; sin sesión `/login`; (padre demo no ve el prompt).
10. **Verificación final** — `npm run lint`, `npx tsc --noEmit`, `npm run build` limpios. Browser: login Jose → feed con 3 posts seed, publicar post con 1–4 fotos y sin fotos, recargar y verlos persistidos, anuncio con megáfono "Anuncio general".

---

## Acceptance criteria

- [ ] `list_migrations` incluye las migraciones `create_posts_tables`, `add_users_room_id`, `seed_children_and_posts` y `create_post_photos_bucket` aplicadas.
- [ ] `public.post_type` existe con exactamente `meal`, `nap`, `activity`, `achievement`, `photo`, `announcement`, `mood`.
- [ ] Existen las tablas `posts`, `post_children`, `post_photos`, `reactions`, `comments` con las columnas del data model y RLS habilitado.
- [ ] Existen los índices `posts_author_id_idx`, `posts_room_id_idx`, `post_children_post_id_idx`, `post_children_child_id_idx`, `post_photos_post_id_idx`, `reactions_post_id_idx`, `reactions_user_id_idx`, `comments_post_id_idx`, `comments_author_id_idx`, `users_room_id_idx`.
- [ ] `users.room_id` existe (FK → `rooms`, nullable) y `José` (staff) tiene la sala `Soles`.
- [ ] `SELECT count(*) FROM public.children` = 8, todos en la sala `Soles`.
- [ ] `SELECT count(*) FROM public.users WHERE role = 'parent'` = 9 (Lucía, Diego, Ana, María, Carlos, Paula, Laura, Roberto, Claudia), con email confirmado en `auth.users`.
- [ ] Existen 3 posts de `José` (staff); por cada uno, `reactions`/`comments` dan los conteos `3·1`, `5·2`, `8·0`.
- [ ] El bucket `post-photos` existe (público), con policies de lectura pública e insert solo staff.
- [ ] `get_advisors` (security y performance) no reporta issues nuevos introducidos por estas migraciones.
- [ ] Los 4 archivos `supabase/migrations/<version>_<nombre>.sql` existen y coinciden con las migraciones remotas.
- [ ] `/` carga los posts de la DB: se ven los 3 posts del seed con badge, hora, audiencia (`familia de Mateo` / `toda la sala`) y conteos correctos; sin sesión redirige a `/login`.
- [ ] El prompt "Compartí un momento…" se muestra con Jose (staff) y NO se muestra con un usuario padre.
- [ ] El modal PARA lista los niños reales de la DB (8 del seed) + "Toda la sala".
- [ ] Publicar un post de niño inserta 1 fila en `posts` (room_id null), 1 en `post_children` y aparece en el feed tras recargar.
- [ ] Publicar "Toda la sala" inserta 1 post con `type='announcement'`, `title='Anuncio general'`, `room_id` = sala del staff, sin `post_children`, y se ve con ícono de megáfono.
- [ ] Publicar con fotos sube cada foto a `post-photos/{post_id}/...`, inserta las filas en `post_photos` y el feed muestra la primera imagen real.
- [ ] Publicar sin fotos inserta el post sin `post_photos` y el feed muestra el placeholder.
- [ ] Un error en el insert o el upload muestra un mensaje inline en el modal y no lo cierra.
- [ ] Los posts del feed con `mood` se renderizan con el badge ÁNIMO (en la UI, al publicar esa categoría).
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` pasa sin errores.

---

## Decisions

- **Sí:** Persistencia real en Supabase (DB + Storage) en lugar de estado en memoria. Decisión del usuario; SPEC 06 queda obsoleto en su parte de persistencia.
- **Sí:** `post_type` se crea con 7 valores incluyendo `mood`. El enum aún no existía en la DB, así que no hace falta `ALTER TYPE`; la UI conserva la categoría Ánimo.
- **Sí:** Feed `/` lee de la DB (`published_at desc`) con seed de los 3 posts del mock. Decisión del usuario; el post publicado persiste al recargar.
- **Sí:** Se suben todas las fotos (máx. 4) a Storage y se guardan en `post_photos`; el feed muestra solo la primera. Decisión del usuario.
- **Sí:** Selección única de destinatario: un niño (`post_children` con 1 fila) o "toda la sala" (`room_id` del staff + `title='Anuncio general'`). Decisión del usuario.
- **Sí:** `users.room_id` (nullable FK → `rooms`) para conocer la sala del staff; `José` → `Soles`. Decisión del usuario; el mock ya asocia a Caro con "Soles".
- **Sí:** Tablas `reactions` y `comments` creadas y sembradas para que los conteos del feed sean reales (3·1, 5·2, 8·0). Decisión del usuario.
- **Sí:** Seed de los 8 niños del mock en `Soles` + 9 usuarios padres demo (autores de reacciones/comentarios). Efecto colateral esperado: `/kids` deja de estar vacío y muestra los 8 niños.
- **Sí:** Bucket `post-photos` público de lectura. Fotos con `photo_consent=true`; decisión del usuario (más simple que signed URLs).
- **Sí:** Prompt y modal solo para `role='staff'` (ocultos para padres). Decisión del usuario.
- **Sí:** RLS — SELECT de `posts`/`post_children`/`post_photos` para cualquier `authenticated` del daycare; INSERT/UPDATE/DELETE solo staff vía `private.is_staff()` y `private.current_daycare_id()` (helpers ya existentes).
- **Sí:** Categoría del post = pill elegida (independiente de si hay fotos); `type` se mapea 1:1 con la categoría UI.
- **Sí:** Postgres policies con reacciones/comentarios para INSERT `authenticated` (solo autoral), sin UI de reaccionar/comentar aún.
- **Sí:** Índice `comments_author_id_idx` añadido (migración `add_comments_author_id_index`): el advisor reportó `comments_author_id_fkey` sin índice, y el scope exige índices en todas las columnas FK.
- **No:** Multi-selección de niños, carrusel de fotos, edición/borrado de posts en UI, filtrado del feed por rol de padre, detalle de publicación.
- **No:** signed URLs para fotos. Bucket público elegido.
- **No:** Cambios al doc `docs`. El modelo §7–§11 se respeta; `room_id` en `users` es una adición al §2 sin contradicción.

---

## Risks

| Riesgo | Mitigación |
|---|---|
| El nombre del niño embebido en el feed depende de leer `children`, y su RLS es solo staff (SPEC 10). Un padre vería los posts sin el nombre del niño. | Hoy el único usuario activo es staff (José); los padres sembrados no entran al feed. El filtrado por rol de padre y la apertura de `children` para padres vinculados quedan para un spec futuro. |
| Falla parcial al publicar (post insertado pero foto o `post_children` no). | Orden secuencial: insert post → fotos → children; en error se muestra mensaje inline y el post parcial queda huérfano (se puede limpiar a mano; sin transacción cross-service). |
| `URL.createObjectURL` de SPEC 06 genera memoria sin liberar. | Se mantiene la revocación al quitar una foto y al cerrar el modal (ya implementado). |
| `/kids` pasa de vacío a mostrar 8 niños del seed. | Comportamiento esperado y documentado (decisión de seed); es consistente con el mock original. |
| Los usuarios padres sembrados tienen credenciales de demo (`Abc123456@`). | Usuarios de prueba de desarrollo, igual que `jose@gmail.com` (SPEC 08); documentado en este spec. |
| Re-ejecutar una migración duplicaría seeds. | `apply_migration` es versionado: cada una se ejecuta una sola vez. |
| Copia local desincronizada del historial remoto. | Mismas `version` y SQL en ambos lados; cualquier cambio se refleja en ambos. |

---

## What is **not** in this spec

- Multi-selección de destinatarios (varios niños por post desde la UI).
- Grid/carrusel con todas las fotos del post en el feed.
- Reaccionar y comentar desde la UI (solo conteos).
- Edición, archivado o borrado de posts.
- Filtrado del feed por rol de padre (padres ven posts de sus hijos + anuncios de su sala).
- Apertura de lectura de `children` para padres vinculados.
- Detalle de publicación (`detalle-publicacion`).
- Notificaciones push / `daily_summaries`.

Cada uno de esos, si llega, va en su propio spec.
