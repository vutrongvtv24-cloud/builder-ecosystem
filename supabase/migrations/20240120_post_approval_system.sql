-- Create table for tracking approval votes
CREATE TABLE IF NOT EXISTS post_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Function to check approval status
CREATE OR REPLACE FUNCTION check_post_approval()
RETURNS TRIGGER AS $$
DECLARE
  vote_count INTEGER;
  total_users INTEGER;
BEGIN
  -- Count total approval votes for the post
  SELECT count(*) INTO vote_count
  FROM post_approvals
  WHERE post_id = NEW.post_id;

  -- Count total active users (simplified: all profiles)
  SELECT count(*) INTO total_users
  FROM profiles;

  -- If votes > 50% of users, approve the post
  IF vote_count > (total_users / 2) THEN
    UPDATE posts
    SET status = 'approved'
    WHERE id = NEW.post_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on new approval vote
DROP TRIGGER IF EXISTS on_approval_vote ON post_approvals;
CREATE TRIGGER on_approval_vote
AFTER INSERT ON post_approvals
FOR EACH ROW
EXECUTE FUNCTION check_post_approval();
