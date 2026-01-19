
-- Notifications Table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null, -- Recipient
  actor_id uuid references public.profiles(id) on delete cascade, -- Who triggered it (nullable for system)
  type text not null, -- 'like', 'comment', 'reply', 'badge', 'system'
  reference_id uuid, -- ID of the post/badge/comment
  message text, -- Optional custom message
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications."
  on notifications for select
  using ( auth.uid() = user_id );

create policy "Users can update their own notifications (mark read)."
  on notifications for update
  using ( auth.uid() = user_id );

-- Trigger: Notify on Like
create or replace function public.notify_on_like()
returns trigger
language plpgsql
security definer
as $$
declare
  post_owner_id uuid;
begin
  select user_id into post_owner_id from public.posts where id = new.post_id;

  -- Don't notify if liking own post
  if post_owner_id != new.user_id then
    insert into public.notifications (user_id, actor_id, type, reference_id, message)
    values (post_owner_id, new.user_id, 'like', new.post_id, 'liked your post');
  end if;

  return new;
end;
$$;

create trigger on_like_created_notify
  after insert on public.likes
  for each row execute procedure public.notify_on_like();

-- Trigger: Notify on Comment
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
as $$
declare
  post_owner_id uuid;
begin
  select user_id into post_owner_id from public.posts where id = new.post_id;

  -- Don't notify if commenting on own post
  if post_owner_id != new.user_id then
    insert into public.notifications (user_id, actor_id, type, reference_id, message)
    values (post_owner_id, new.user_id, 'comment', new.post_id, 'commented on your post');
  end if;

  return new;
end;
$$;

create trigger on_comment_created_notify
  after insert on public.comments
  for each row execute procedure public.notify_on_comment();

-- Trigger: Notify on Badge Earned
create or replace function public.notify_on_badge()
returns trigger
language plpgsql
security definer
as $$
declare
  badge_name text;
begin
  select name into badge_name from public.badges where id = new.badge_id;
  
  insert into public.notifications (user_id, type, reference_id, message)
  values (new.user_id, 'badge', new.id, 'You earned the "' || badge_name || '" badge!');

  return new;
end;
$$;

create trigger on_badge_awarded_notify
  after insert on public.user_badges
  for each row execute procedure public.notify_on_badge();
