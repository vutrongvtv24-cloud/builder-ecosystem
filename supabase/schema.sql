
-- Create a table for public profiles using Supabase Auth (or just linking by email if using NextAuth separately, but RLS works best with Supabase Auth)
-- For now, let's assume we map 'id' to auth.users.id if we switch to Supabase Auth, or just generate UUIDs.
-- Given we want a robust ecosystem, I recommend triggering profile creation on auth.

create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  level int default 1,
  xp int default 0,
  role text default 'member', -- 'admin', 'moderator', 'member'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Posts Table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  likes_count int default 0,
  comments_count int default 0,
  space_id text, -- e.g. 'news', 'vibe-coding'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Posts
alter table public.posts enable row level security;

create policy "Posts are viewable by everyone."
  on posts for select
  using ( true );

create policy "Authenticated users can create posts."
  on posts for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can update their own posts."
  on posts for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own posts."
  on posts for delete
  using ( auth.uid() = user_id );

-- Function to handle new user signup (if using Supabase Auth)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Trigger to call the function
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage Bucket for Avatars/Post Images
insert into storage.buckets (id, name, public) values ('images', 'images', true);

create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'images' );

create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check ( bucket_id = 'images' and auth.role() = 'authenticated' );
