
-- Existing Tables (Keep profiles and posts)

-- Likes Table (to preventing double liking)
create table public.likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id) -- Prevent duplicate likes
);

alter table public.likes enable row level security;

create policy "Likes are viewable by everyone."
  on likes for select
  using ( true );

create policy "Authenticated users can toggle likes."
  on likes for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can remove their own likes."
  on likes for delete
  using ( auth.uid() = user_id );

-- Comments Table
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone."
  on comments for select
  using ( true );

create policy "Authenticated users can create comments."
  on comments for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can delete their own comments."
  on comments for delete
  using ( auth.uid() = user_id );

-- Function to update posts.likes_count automatically
create or replace function public.handle_likes_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.posts
    set likes_count = likes_count + 1
    where id = new.post_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.posts
    set likes_count = likes_count - 1
    where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_like_change
  after insert or delete on public.likes
  for each row execute procedure public.handle_likes_count();

-- Function to update posts.comments_count automatically
create or replace function public.handle_comments_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.posts
    set comments_count = comments_count + 1
    where id = new.post_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.posts
    set comments_count = comments_count - 1
    where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute procedure public.handle_comments_count();
