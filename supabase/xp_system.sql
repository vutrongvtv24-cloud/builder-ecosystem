-- =============================================
-- ENHANCED XP SYSTEM WITH DATABASE TRIGGERS
-- Run this on Supabase SQL Editor
-- =============================================

-- XP Values Configuration (as comments for reference)
-- Post created: +10 XP
-- Like given: +2 XP  
-- Like received: +5 XP
-- Comment created: +3 XP
-- Comment received: +5 XP
-- Follow given: +2 XP
-- Follow received: +10 XP

-- ========== CORE XP FUNCTION ==========

-- Function to add XP and handle level up
CREATE OR REPLACE FUNCTION public.add_xp(target_user_id uuid, amount int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_xp int;
  current_level int;
  xp_needed int;
  new_xp int;
  new_level int;
BEGIN
  -- Get current values
  SELECT xp, level INTO current_xp, current_level
  FROM public.profiles
  WHERE id = target_user_id;

  IF current_xp IS NULL THEN
    RETURN;
  END IF;

  new_xp := current_xp + amount;
  new_level := current_level;
  
  -- XP needed for next level = current_level * 100
  xp_needed := current_level * 100;

  -- Level up loop (handles multiple level ups if huge XP gain)
  WHILE new_xp >= xp_needed LOOP
    new_xp := new_xp - xp_needed;
    new_level := new_level + 1;
    xp_needed := new_level * 100;
    
    -- Create level up notification
    INSERT INTO public.notifications (user_id, type, message)
    VALUES (target_user_id, 'level_up', 'You reached Level ' || new_level || '! 🎉');
  END LOOP;

  -- Update profile
  UPDATE public.profiles
  SET xp = new_xp, level = new_level, updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- ========== POST XP TRIGGER ==========

-- When user creates a post: +10 XP
CREATE OR REPLACE FUNCTION public.xp_on_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.add_xp(new.user_id, 10);
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_post_xp ON public.posts;
CREATE TRIGGER on_post_xp
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE public.xp_on_post();

-- ========== LIKE XP TRIGGERS ==========

-- When user likes: +2 XP for liker, +5 XP for post owner
CREATE OR REPLACE FUNCTION public.xp_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_owner_id uuid;
BEGIN
  -- XP for the person who liked
  PERFORM public.add_xp(new.user_id, 2);
  
  -- Get post owner
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = new.post_id;
  
  -- XP for post owner (only if not self-like)
  IF post_owner_id != new.user_id THEN
    PERFORM public.add_xp(post_owner_id, 5);
  END IF;
  
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_like_xp ON public.likes;
CREATE TRIGGER on_like_xp
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE PROCEDURE public.xp_on_like();

-- ========== COMMENT XP TRIGGERS ==========

-- When user comments: +3 XP for commenter, +5 XP for post owner
CREATE OR REPLACE FUNCTION public.xp_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_owner_id uuid;
BEGIN
  -- XP for the commenter
  PERFORM public.add_xp(new.user_id, 3);
  
  -- Get post owner
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = new.post_id;
  
  -- XP for post owner (only if not self-comment)
  IF post_owner_id != new.user_id THEN
    PERFORM public.add_xp(post_owner_id, 5);
  END IF;
  
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_xp ON public.comments;
CREATE TRIGGER on_comment_xp
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE public.xp_on_comment();

-- ========== FOLLOW XP TRIGGERS ==========

-- When user follows: +2 XP for follower, +10 XP for followed
CREATE OR REPLACE FUNCTION public.xp_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- XP for the follower
  PERFORM public.add_xp(new.follower_id, 2);
  
  -- XP for the person being followed
  PERFORM public.add_xp(new.following_id, 10);
  
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_xp ON public.follows;
CREATE TRIGGER on_follow_xp
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE PROCEDURE public.xp_on_follow();

-- ========== DONE ==========
-- XP System with auto level-up is now active!
