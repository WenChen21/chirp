import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { filterUserForClient } from "~/server/api/helpers/filterUserForClient";
import { createClient } from "~/utils/supabase/server";

// Define the Post type to match our Supabase table
type Post = {
  id: string;
  created_at: string;
  content: string;
  author_id: string;
};

const addUserDataToPosts = async (posts: Post[]) => {
  const usersResponse = await clerkClient().users.getUserList({
    userId: posts.map((post) => post.author_id),
    limit: 100,
  });
  const users = usersResponse.data?.map(filterUserForClient) ?? [];
  
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
          username: "Unknown User",
          profileImageUrl: "", // Empty string - will fallback to Clerk's default handling
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
// Only if Redis is configured and accessible
const createRateLimiter = () => {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.log("Attempting to create Redis rate limiter...");
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      
      const rateLimiter = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(3, "1 m"),
        analytics: true,
      });
      
      console.log("Redis rate limiter created successfully");
      return rateLimiter;
    } else {
      console.log("Redis environment variables not configured - rate limiting disabled");
    }
    return null;
  } catch (error) {
    console.warn("Failed to initialize Redis rate limiter (continuing without rate limiting):", error);
    return null;
  }
};

const ratelimit = createRateLimiter();

export const postsRouter = createTRPCRouter({
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const supabase = createClient();
    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", input.id)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch post",
      });
    }

    return (await addUserDataToPosts([post]))[0];
  }),

  getAll: publicProcedure.query(async () => {
    const supabase = createClient();
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Supabase error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch posts",
      });
    }

    return addUserDataToPosts(posts || []);
  }),

  getPosts: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const supabase = createClient();
      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", input.userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Supabase error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user posts",
        });
      }

      return addUserDataToPosts(posts || []);
    }),

  create: publicProcedure
    .input(z.object({ 
      content: z.string().emoji().min(1).max(280),
      authorId: z.string().min(1), // Client passes the Clerk user ID
    }))
    .mutation(async ({ input }) => {
      const authorId = input.authorId;
      
      // Apply rate limiting only if Redis is configured and accessible
      if (ratelimit) {
        try {
          const { success } = await ratelimit.limit(authorId);
          if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
        } catch (rateLimitError) {
          console.warn("Rate limit check failed (continuing without rate limiting):", String(rateLimitError));
          // Continue without rate limiting if Redis fails
        }
      }

      const supabase = createClient();
      
      const { data: post, error } = await supabase
        .from("posts")
        .insert({
          content: input.content,
          author_id: authorId,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create post: ${error.message}`,
        });
      }

      return (await addUserDataToPosts([post]))[0];
    }),
});
