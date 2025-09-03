-- Clean up the test data with fake user IDs
DELETE FROM posts WHERE author_id IN ('test-user-1', 'test-user-2', 'test-user-3');

-- Optional: Add a single test post that will show with a placeholder user
-- You can replace 'your-clerk-user-id' with your actual Clerk user ID if you want
-- INSERT INTO posts (content, author_id) VALUES 
--   ('🎉 First real post from Supabase!', 'your-clerk-user-id');
