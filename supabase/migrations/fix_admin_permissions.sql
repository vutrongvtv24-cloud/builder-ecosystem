-- =============================================
-- ADMIN PERMISSIONS FIX
-- Fix admin delete post & block user functionality
-- =============================================

-- 1. Add 'status' column to profiles for user blocking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'suspended'));

-- 2. Ensure global admin can delete ANY post (recreate policy to be sure)
DROP POLICY IF EXISTS "Posts delete with global admin" ON public.posts;
CREATE POLICY "Posts delete with global admin"
ON public.posts FOR DELETE
USING (
    -- Global admin can delete ANY post
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND email = 'vutrongvtv24@gmail.com'
    )
    -- Or post owner can delete own posts
    OR auth.uid() = user_id 
    -- Or community admin/mod can delete community posts
    OR (community_id IS NOT NULL AND public.is_community_admin_or_mod(community_id))
);

-- 3. Ensure global admin can update profiles (for blocking)
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
CREATE POLICY "Admin can update any profile"
ON public.profiles FOR UPDATE
USING (
    -- User can update own profile
    auth.uid() = id
    -- Global admin can update any profile
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND email = 'vutrongvtv24@gmail.com'
    )
);

-- 4. Ensure global admin can delete community memberships
DROP POLICY IF EXISTS "Delete members with global admin" ON public.community_members;
CREATE POLICY "Delete members with global admin"
ON public.community_members FOR DELETE
USING (
    -- Global admin can remove ANY member
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND email = 'vutrongvtv24@gmail.com'
    )
    -- Or community admin/mod can manage their community
    OR public.is_community_admin_or_mod(community_id)
    -- Or user can leave a community (delete own membership)
    OR user_id = auth.uid()
);

-- 5. Block blocked users from logging in (via a trigger or check in app)
-- Note: Supabase doesn't block auth directly, but we can check in app layer
-- This is handled in frontend/middleware

-- Verification query
SELECT 
    'profiles status column' as check_type,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'status';

-- Show updated policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('posts', 'profiles', 'community_members')
ORDER BY tablename, policyname;
