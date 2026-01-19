
-- Create a storage bucket for 'post_images'
insert into storage.buckets (id, name, public)
values ('post_images', 'post_images', true)
on conflict (id) do nothing;

-- Set up security policies for the bucket

-- 1. Allow public access to view images
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'post_images' );

-- 2. Allow authenticated users to upload images
drop policy if exists "Authenticated Users can Upload" on storage.objects;
create policy "Authenticated Users can Upload"
on storage.objects for insert
with check (
  bucket_id = 'post_images'
  and auth.role() = 'authenticated'
);

-- 3. Allow users to update/delete their own images
drop policy if exists "Users can update own images" on storage.objects;
create policy "Users can update own images"
on storage.objects for update
using ( auth.uid() = owner )
with check ( bucket_id = 'post_images' );

drop policy if exists "Users can delete own images" on storage.objects;
create policy "Users can delete own images"
on storage.objects for delete
using ( auth.uid() = owner and bucket_id = 'post_images' );
