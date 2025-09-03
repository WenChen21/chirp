import { z } from "zod";
import { createTRPCRouter, privateProcedure, publicProcedure } from "npm/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { filterUserForClient } from "../helpers/filterUserForClient";
import { createClient } from "../../../utils/supabase/server";

// Define the Post type to match our Supabase table
type Post = {
  id: string;
  created_at: string;
  content: string;
  author_id: string;
};

const addUserDataToPosts = async (posts: Post[]) => {
  const users = (await clerkClient.users.getUserList({
    userId: posts.map((post) => post.author_id),
    limit: 100,
  })).map(filterUserForClient);
  
  return posts.map((post) => {
    const author = users.find((user) => user.id === post.author_id);
    
    // Handle missing users gracefully (e.g., test data or deleted users)
    if (!author) {
      return {
        post: {
          id: post.id,
          createdAt: new Date(post.created_at),
          content: post.content,
          authorId: post.author_id,
        },
        author: {
          id: post.author_id,
          username: `user-${post.author_id.slice(-4)}`, // Show last 4 chars
          profileImageUrl: "", // Empty string - will fallback to Clerk's default handling
          externalUsername: null,
        },
      };
    }
    
    // Handle users without username
    if (!author.username) {
      return {
        post: {
          id: post.id,
          createdAt: new Date(post.created_at),
          content: post.content,
          authorId: post.author_id,
        },
        author: {
          ...author,
          username: `user-${author.id.slice(-4)}`, // Fallback username
        },
      };
    }
    
    return {
      post: {
        id: post.id,
        createdAt: new Date(post.created_at),
        content: post.content,
        authorId: post.author_id,
      },
      author: {
        ...author,
        username: author.username,
      },
    };
  });
};

// Create a new ratelimiter, that allows 3 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

export const postsRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const supabase = createClient();
      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', input.id)
        .single();

      if (error || !post) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return (await addUserDataToPosts([post as Post]))[0];
    }),

  getAll: publicProcedure.query(async () => {
    const supabase = createClient();
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw new TRPCError({ 
        code: "INTERNAL_SERVER_ERROR", 
        message: `Database error: ${error.message}` 
      });
    }

    return addUserDataToPosts(posts as Post[] || []);
  }),

  getPosts: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const supabase = createClient();
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', input.userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: `Database error: ${error.message}` 
        });
      }

      return addUserDataToPosts(posts as Post[] || []);
    }),

  create: privateProcedure
    .input(
      z.object({
        content: z.string().emoji("Only emojis are allowed").min(1).max(280),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;
      const { success } = await ratelimit.limit(authorId);
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

      const supabase = createClient();
      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: authorId,
          content: input.content,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: `Failed to create post: ${error.message}` 
        });
      }

      return data;
    }),
});
