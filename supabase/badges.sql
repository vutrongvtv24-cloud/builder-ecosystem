
-- Badges Definitions
create table public.badges (
  id text primary key, -- e.g., 'starter', 'writer', 'influencer'
  name text not null,
  description text,
  icon text not null, -- Emoji or URL
  required_value int default 0 -- e.g., 10 posts
);

-- User Badges (Many-to-Many)
create table public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id text references public.badges(id) on delete cascade not null,
  awarded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, badge_id)
);

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

create policy "Badges are viewable by everyone." on badges for select using ( true );
create policy "User badges are viewable by everyone." on user_badges for select using ( true );

-- Seed Initial Badges
insert into public.badges (id, name, description, icon, required_value) values
('early_adopter', 'Early Adopter', 'Joined during the beta phase', '🌱', 0),
('writer_I', 'Beginner Writer', 'Posted 1 update', '📝', 1),
('writer_II', 'Prolific Writer', 'Posted 5 updates', '✍️', 5),
('influencer_I', 'Rising Star', 'Received 10 likes', '🌟', 10);


-- Logic: Auto-award badges based on actions
-- 1. Trigger for Post Counts (Writer Badges)
create or replace function public.check_post_achievements()
returns trigger
language plpgsql
security definer
as $$
declare
  post_count int;
begin
  select count(*) into post_count from public.posts where user_id = new.user_id;

  -- Badge: Writer I (1 Post)
  if post_count >= 1 then
    insert into public.user_badges (user_id, badge_id)
    values (new.user_id, 'writer_I')
    on conflict do nothing;
  end if;

  -- Badge: Writer II (5 Posts)
  if post_count >= 5 then
    insert into public.user_badges (user_id, badge_id)
    values (new.user_id, 'writer_II')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_post_created_check_badges
  after insert on public.posts
  for each row execute procedure public.check_post_achievements();

-- 2. Trigger for Like Counts (Influencer Badges)
-- Note: This is slightly more complex as it aggregates likes on posts
create or replace function public.check_like_achievements()
returns trigger
language plpgsql
security definer
as $$
declare
  total_likes int;
  target_user_id uuid;
begin
  -- Get the owner of the post that was liked
  select user_id into target_user_id from public.posts where id = new.post_id;
  
  -- Calculate total received likes
  select sum(likes_count) into total_likes from public.posts where user_id = target_user_id;

  if total_likes >= 10 then
    insert into public.user_badges (user_id, badge_id)
    values (target_user_id, 'influencer_I')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_like_received_check_badges
  after insert on public.likes
  for each row execute procedure public.check_like_achievements();

-- Grant Early Adopter to all current users (One-off)
insert into public.user_badges (user_id, badge_id)
select id, 'early_adopter' from public.profiles
on conflict do nothing;

-- Auto-grant Early Adopter logic for new users
create or replace function public.grant_signup_badges()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_badges (user_id, badge_id)
  values (new.id, 'early_adopter')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_profile_created_grant_badge
  after insert on public.profiles
  for each row execute procedure public.grant_signup_badges();
