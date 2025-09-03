import { env } from "../env.mjs";

// This file was used for Prisma but is now kept for legacy compatibility
// Database operations are now handled through Supabase in:
// - ~/utils/supabase/server.ts
// - ~/utils/supabase/client.ts

// You can delete this file if no longer needed
console.log("Supabase URL configured:", env.NEXT_PUBLIC_SUPABASE_URL);
