insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-photos', 'post-photos', true, 10485760, array['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
on conflict (id) do nothing;

create policy "post_photos_public_read" on storage.objects
  for select to public
  using (bucket_id = 'post-photos');

create policy "post_photos_insert_staff" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-photos' and (select private.is_staff()));
