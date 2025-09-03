-- Create the posts table for Chirp app
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  content VARCHAR(255) NOT NULL,
  author_id TEXT NOT NULL
);

-- Create an index on author_id for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);

-- Enable Row Level Security (RLS)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow reading posts (everyone can read)
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

-- Create a policy to allow authenticated users to insert posts
CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (true);

-- Create a policy to allow users to update their own posts
CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (true);

-- Create a policy to allow users to delete their own posts
CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (true);

-- Insert some test data to verify everything works
INSERT INTO posts (content, author_id) VALUES 
  ('🎉 Hello from Supabase!', 'test-user-1'),
  ('🚀 Migration successful!', 'test-user-2'),
  ('🌟 Welcome to the new database!', 'test-user-1'),
  ('✨ Chirp is now powered by Supabase!', 'test-user-3');
