import { appRouter } from "npm/server/api/root";
// import { createProxySSGHelpers } from '@trpc/react-query/ssg';
import { prisma } from "npm/server/db";
import superjson from "superjson";
import { createServerSideHelpers } from '@trpc/react-query/server';


export const generateSSGHelper = () => createServerSideHelpers({
  router: appRouter,
  ctx: { prisma, userId: null },
  transformer: superjson,
});

