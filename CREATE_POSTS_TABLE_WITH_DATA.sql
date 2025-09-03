-- Create the posts table
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

-- Create a policy to allow reading posts
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

-- Create a policy to allow authenticated users to insert posts  
CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (true);

-- Insert some test data
INSERT INTO posts (content, author_id) VALUES 
  ('🎉 Hello from Supabase!', 'test-user-1'),
  ('🚀 Migration successful!', 'test-user-2'),
  ('🌟 Welcome to the new database!', 'test-user-1');
