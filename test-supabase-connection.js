import { createClient } from "../src/utils/supabase/client.js";

async function testSupabaseConnection() {
  try {
    const supabase = createClient();
    console.log("✅ Supabase client created successfully");

    // Test the connection by making a simple query
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .limit(1);

    if (error) {
      console.error("❌ Supabase connection error:", error.message);
    } else {
      console.log("✅ Supabase connection successful!");
      console.log("Database response:", data);
    }
  } catch (error) {
    console.error("❌ Failed to create Supabase client:", error.message);
  }
}

testSupabaseConnection();
