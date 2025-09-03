import { z } from "zod";
import { createTRPCRouter, privateProcedure, publicProcedure } from "npm/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { filterUserForClient } from "../helpers/filterUserForClient";
import type { Post } from "@prisma/client";
import { createClient } from "~/utils/supabase/server";

const addUserDataToPosts = async (posts: Post[]) => {
  const users = (await clerkClient.users.getUserList({
    userId: posts.map((post) => post.authorId),
    limit: 100,
  })).map(filterUserForClient);
  
  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);
    if (!author || !author.username) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Author for post not found",
      });
    }
    
    return {
      post,
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
    .query(async ({ ctx, input }) => {
      // Try Supabase first, fallback to Prisma
      try {
        const supabase = createClient();
        const { data: post, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', input.id)
          .single();

        if (error || !post) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Convert Supabase response to Prisma format
        const prismaPost: Post = {
          id: post.id,
          createdAt: new Date(post.created_at),
          content: post.content,
          authorId: post.author_id,
        };

        return (await addUserDataToPosts([prismaPost]))[0];
      } catch (error) {
        // Fallback to Prisma if Supabase fails
        const post = await ctx.prisma.post.findUnique({ where: { id: input.id } });
        if (!post) throw new TRPCError({ code: "NOT_FOUND" });
        return (await addUserDataToPosts([post]))[0];
      }
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    // Try Supabase first, fallback to Prisma
    try {
      const supabase = createClient();
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      // Convert Supabase response to Prisma format
      const prismaPosts: Post[] = (posts || []).map(post => ({
        id: post.id,
        createdAt: new Date(post.created_at),
        content: post.content,
        authorId: post.author_id,
      }));

      return addUserDataToPosts(prismaPosts);
    } catch (error) {
      // Fallback to Prisma if Supabase fails
      const posts = await ctx.prisma.post.findMany({
        take: 100,
        orderBy: [{ createdAt: "desc" }],
      });
      return addUserDataToPosts(posts);
    }
  }),

  getPosts: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Try Supabase first, fallback to Prisma
      try {
        const supabase = createClient();
        const { data: posts, error } = await supabase
          .from('posts')
          .select('*')
          .eq('author_id', input.userId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          throw error;
        }

        // Convert Supabase response to Prisma format
        const prismaPosts: Post[] = (posts || []).map(post => ({
          id: post.id,
          createdAt: new Date(post.created_at),
          content: post.content,
          authorId: post.author_id,
        }));

        return addUserDataToPosts(prismaPosts);
      } catch (error) {
        // Fallback to Prisma
        const posts = await ctx.prisma.post.findMany({
          where: { authorId: input.userId },
          take: 100,
          orderBy: [{ createdAt: "desc" }],
        });
        return addUserDataToPosts(posts);
      }
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

      // Try Supabase first, fallback to Prisma
      try {
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
          throw error;
        }

        return data;
      } catch (error) {
        // Fallback to Prisma
        await ctx.prisma.post.create({
          data: {
            authorId,
            content: input.content,
          },
        });
      }
    }),
});
