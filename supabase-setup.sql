-- Run this in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/qulmjpzvwwukyytnhacs/sql

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

-- Create a policy to allow reading posts (adjust as needed)
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

-- Create a policy to allow authenticated users to insert posts (adjust as needed)
CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (true);
