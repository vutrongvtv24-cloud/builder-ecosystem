-- =====================================================================
-- BUILDER ECOSYSTEM - COMPLETE DATABASE SETUP
-- Run this ONCE on Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/uoqyotwurkyjdrawqbpe/sql/new
-- =====================================================================

-- ==================== 1. PROFILES TABLE ====================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  level int default 1,
  xp int default 0,
  role text default 'member',
  name_changed boolean default false,
  avatar_changed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add columns if table already exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name_changed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_changed boolean DEFAULT false;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ==================== 2. POSTS TABLE ====================
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  likes_count int default 0,
  comments_count int default 0,
  space_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts are viewable by everyone." ON posts;
CREATE POLICY "Posts are viewable by everyone." ON posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts." ON posts;
CREATE POLICY "Authenticated users can create posts." ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own posts." ON posts;
CREATE POLICY "Users can update their own posts." ON posts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts." ON posts;
CREATE POLICY "Users can delete their own posts." ON posts FOR DELETE USING (auth.uid() = user_id);

-- ==================== 3. LIKES TABLE ====================
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes are viewable by everyone." ON likes;
CREATE POLICY "Likes are viewable by everyone." ON likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can toggle likes." ON likes;
CREATE POLICY "Authenticated users can toggle likes." ON likes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can remove their own likes." ON likes;
CREATE POLICY "Users can remove their own likes." ON likes FOR DELETE USING (auth.uid() = user_id);

-- ==================== 4. COMMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone." ON comments;
CREATE POLICY "Comments are viewable by everyone." ON comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments." ON comments;
CREATE POLICY "Authenticated users can create comments." ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete their own comments." ON comments;
CREATE POLICY "Users can delete their own comments." ON comments FOR DELETE USING (auth.uid() = user_id);

-- ==================== 5. BADGES SYSTEM ====================
CREATE TABLE IF NOT EXISTS public.badges (
  id text primary key,
  name text not null,
  description text,
  icon text not null,
  required_value int default 0
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id text references public.badges(id) on delete cascade not null,
  awarded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, badge_id)
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Badges are viewable by everyone." ON badges;
CREATE POLICY "Badges are viewable by everyone." ON badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "User badges are viewable by everyone." ON user_badges;
CREATE POLICY "User badges are viewable by everyone." ON user_badges FOR SELECT USING (true);

-- Seed badges
INSERT INTO public.badges (id, name, description, icon, required_value) VALUES
('early_adopter', 'Early Adopter', 'Joined during the beta phase', '🌱', 0),
('writer_I', 'Beginner Writer', 'Posted 1 update', '📝', 1),
('writer_II', 'Prolific Writer', 'Posted 5 updates', '✍️', 5),
('influencer_I', 'Rising Star', 'Received 10 likes', '🌟', 10)
ON CONFLICT (id) DO NOTHING;

-- ==================== 6. NOTIFICATIONS ====================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  reference_id uuid,
  message text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications." ON notifications;
CREATE POLICY "Users can view their own notifications." ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications (mark read)." ON notifications;
CREATE POLICY "Users can update their own notifications (mark read)." ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ==================== 7. CHAT SYSTEM ====================
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.max_participants (
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_read boolean default false
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.max_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.max_participants
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view participants" ON max_participants;
CREATE POLICY "Users can view participants"
  ON max_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.max_participants AS mp
      WHERE mp.conversation_id = max_participants.conversation_id
      AND mp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view messages" ON direct_messages;
CREATE POLICY "Users can view messages"
  ON direct_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.max_participants
      WHERE conversation_id = direct_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
CREATE POLICY "Users can send messages"
  ON direct_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.max_participants
      WHERE conversation_id = direct_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- ==================== 8. FUNCTIONS & TRIGGERS ====================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Likes count trigger
CREATE OR REPLACE FUNCTION public.handle_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = new.post_id;
    RETURN new;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = old.post_id;
    RETURN old;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_like_change ON public.likes;
CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_likes_count();

-- Comments count trigger
CREATE OR REPLACE FUNCTION public.handle_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = new.post_id;
    RETURN new;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = old.post_id;
    RETURN old;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE public.handle_comments_count();

-- Chat helper function
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv_id uuid;
BEGIN
  SELECT c.id INTO conv_id
  FROM public.conversations c
  JOIN public.max_participants p1 ON c.id = p1.conversation_id
  JOIN public.max_participants p2 ON c.id = p2.conversation_id
  WHERE p1.user_id = auth.uid()
  AND p2.user_id = other_user_id
  LIMIT 1;

  IF conv_id IS NULL THEN
    INSERT INTO public.conversations (created_at) VALUES (default) RETURNING id INTO conv_id;
    INSERT INTO public.max_participants (conversation_id, user_id)
    VALUES (conv_id, auth.uid()), (conv_id, other_user_id);
  END IF;

  RETURN conv_id;
END;
$$;

-- ==================== 9. STORAGE BUCKETS ====================
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('post_images', 'post_images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public Access images" ON storage.objects;
CREATE POLICY "Public Access images" ON storage.objects FOR SELECT USING (bucket_id IN ('images', 'post_images', 'avatars'));

DROP POLICY IF EXISTS "Authenticated upload images" ON storage.objects;
CREATE POLICY "Authenticated upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('images', 'post_images', 'avatars') AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users update own objects" ON storage.objects;
CREATE POLICY "Users update own objects" ON storage.objects FOR UPDATE USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Users delete own objects" ON storage.objects;
CREATE POLICY "Users delete own objects" ON storage.objects FOR DELETE USING (auth.uid() = owner);

-- ==================== DONE! ====================
-- If you see "Success. No rows returned" - everything worked!
