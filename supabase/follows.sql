-- =============================================
-- FOLLOW SYSTEM SCHEMA
-- =============================================

-- Follows Table
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, following_id), -- Prevent duplicate follows
  constraint no_self_follow check (follower_id != following_id) -- Can't follow yourself
);

-- Add follower/following counts to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count int DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count int DEFAULT 0;

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON follows;
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can follow" ON follows;
CREATE POLICY "Authenticated users can follow"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Trigger: Update follower/following counts
CREATE OR REPLACE FUNCTION public.handle_follow_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Increment following_count for follower
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE id = new.follower_id;
    
    -- Increment followers_count for followed user
    UPDATE public.profiles 
    SET followers_count = followers_count + 1 
    WHERE id = new.following_id;
    
    RETURN new;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrement following_count for follower
    UPDATE public.profiles 
    SET following_count = following_count - 1 
    WHERE id = old.follower_id;
    
    -- Decrement followers_count for followed user
    UPDATE public.profiles 
    SET followers_count = followers_count - 1 
    WHERE id = old.following_id;
    
    RETURN old;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_change ON public.follows;
CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE PROCEDURE public.handle_follow_counts();

-- Trigger: Notify when someone follows you
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type, reference_id, message)
  VALUES (new.following_id, new.follower_id, 'follow', new.id, 'started following you');
  
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_notify ON public.follows;
CREATE TRIGGER on_follow_notify
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE PROCEDURE public.notify_on_follow();

-- =============================================
-- RUN THIS ON SUPABASE SQL EDITOR
-- =============================================
