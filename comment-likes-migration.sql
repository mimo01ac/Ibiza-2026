-- Comment likes table (shared for event + wildcard comments)
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Allow all reads (public)
CREATE POLICY "comment_likes_select" ON comment_likes
  FOR SELECT USING (true);

-- Allow authenticated inserts/deletes via service role (API routes handle auth)
CREATE POLICY "comment_likes_insert" ON comment_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "comment_likes_delete" ON comment_likes
  FOR DELETE USING (true);
