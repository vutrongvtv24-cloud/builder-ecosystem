-- =============================================
-- COMMUNITY & MODERATION SYSTEM MIGRATION
-- =============================================

-- 1. Create Communities Table
CREATE TABLE IF NOT EXISTS public.communities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    icon text,
    cover_image text,
    required_level int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Create Community Members Table
-- Roles: 'admin', 'moderator', 'member'
-- Status: 'pending' (waiting for approval), 'approved' (joined), 'rejected'
CREATE TABLE IF NOT EXISTS public.community_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    joined_at timestamptz DEFAULT now(),
    UNIQUE(community_id, user_id)
);

-- 3. Update Posts Table
-- Add community_id to link posts to a class
-- Add status for moderation ('pending', 'approved', 'rejected')
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing posts to be approved
UPDATE public.posts SET status = 'approved' WHERE status IS NULL;

-- 4. Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Communities: Everyone can read
CREATE POLICY "Communities are viewable by everyone" 
ON public.communities FOR SELECT 
USING (true);

-- Members: 
-- Admins/Mods can see all requests
-- Users can see their own membership
-- Public can see 'approved' members (optional, maybe restricted to members)
CREATE POLICY "Members viewable by admins and self" 
ON public.community_members FOR SELECT 
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.community_members 
        WHERE community_id = community_members.community_id 
        AND user_id = auth.uid() 
        AND role IN ('admin', 'moderator')
    )
);

-- Join Request: Users can insert 'pending' for themself
CREATE POLICY "Users can request to join" 
ON public.community_members FOR INSERT 
WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Admin Manage: Admins can update status/role
CREATE POLICY "Admins manage members" 
ON public.community_members FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.community_members 
        WHERE community_id = public.community_members.community_id 
        AND user_id = auth.uid() 
        AND role IN ('admin', 'moderator')
        AND status = 'approved'
    )
);

-- Posts Visibility:
-- 1. If global post (community_id is NULL) -> Approved only (or all if own)
-- 2. If community post -> Approved only, UNLESS you are admin/mod OR author
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Public/Community Post Visibility" 
ON public.posts FOR SELECT 
USING (
    (auth.uid() = user_id) OR -- Author sees all
    (
        status = 'approved' AND (
            community_id IS NULL OR -- Global public post
            EXISTS ( -- Or Approved Member of community
                SELECT 1 FROM public.community_members 
                WHERE community_id = posts.community_id 
                AND user_id = auth.uid() 
                AND status = 'approved'
            )
        )
    ) OR
    ( -- Admins see pending posts
        community_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.community_members 
            WHERE community_id = posts.community_id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    )
);

-- Post Creation Policy Update
DROP POLICY IF EXISTS "Authenticated users can insert posts" ON public.posts;
CREATE POLICY "Authenticated users can insert posts" ON public.posts FOR INSERT 
WITH CHECK (
    auth.uid() = user_id 
    -- Logic for status will be handled by default value or client, 
    -- simpler to allow insert and rely on 'status' column default.
    -- Ideally, we enforce status='pending' via trigger if community_id is set and user is not admin.
);

-- Post Update Policy (for Admins approving)
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users update own and Admins approve" 
ON public.posts FOR UPDATE 
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.community_members 
        WHERE community_id = posts.community_id 
        AND user_id = auth.uid() 
        AND role IN ('admin', 'moderator')
    )
);

-- Post Delete Policy
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users delete own and Admins delete" 
ON public.posts FOR DELETE 
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.community_members 
        WHERE community_id = posts.community_id 
        AND user_id = auth.uid() 
        AND role IN ('admin', 'moderator')
    )
);

-- 6. Trigger to Auto-Approve Admin Posts & Enforce Pending for others
CREATE OR REPLACE FUNCTION public.handle_post_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- If global post, auto approve
  IF new.community_id IS NULL THEN
    new.status := 'approved';
    RETURN new;
  END IF;

  -- Check if user is admin/mod of the community
  SELECT EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = new.community_id 
    AND user_id = new.user_id 
    AND role IN ('admin', 'moderator')
    AND status = 'approved'
  ) INTO is_admin;

  IF is_admin THEN
    new.status := 'approved';
  ELSE
    new.status := 'pending';
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS tr_post_status ON public.posts;
CREATE TRIGGER tr_post_status
  BEFORE INSERT ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_post_status();

-- 7. Seed Data: "Youtube Creators" Class
INSERT INTO public.communities (slug, name, description, icon, required_level)
VALUES (
    'youtube-creators', 
    'Youtube Creators', 
    'Cộng đồng dành cho những nhà sáng tạo nội dung Youtube. Chia sẻ kinh nghiệm, kỹ thuật và cùng nhau phát triển kênh.', 
    'Youtube', 
    0
) ON CONFLICT (slug) DO NOTHING;

-- 8. Helper Function to Make User Admin (User needs to run this manually or we call it)
-- We need to know who vutrongvtv24@gmail.com is. 
-- This block attempts to find the user and make them admin of the 'youtube-creators' community.
DO $$
DECLARE
  target_user_id uuid;
  community_uuid uuid;
BEGIN
  -- Find user by email (This relies on auth.users mapping to public.profiles if email is synced, 
  -- but usually email is in auth.users. public.profiles might store it too if we added it.
  -- Assuming public.profiles has 'email' column from previous check)
  SELECT id INTO target_user_id FROM public.profiles WHERE email = 'vutrongvtv24@gmail.com';
  
  -- Get Community ID
  SELECT id INTO community_uuid FROM public.communities WHERE slug = 'youtube-creators';

  IF target_user_id IS NOT NULL AND community_uuid IS NOT NULL THEN
    -- Insert or Update to Admin
    INSERT INTO public.community_members (community_id, user_id, role, status)
    VALUES (community_uuid, target_user_id, 'admin', 'approved')
    ON CONFLICT (community_id, user_id) 
    DO UPDATE SET role = 'admin', status = 'approved';
  END IF;
END $$;
