import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

let client = null;
const getSupabase = () => {
  if (!client) {
    console.log("Initializing Supabase...");
    console.log("URL exists:", !!process.env.SUPABASE_URL);
    console.log("Key exists:", !!process.env.SUPABASE_SERVICE_KEY);
    client = createClient(
      (process.env.SUPABASE_URL || "").trim(),
      (process.env.SUPABASE_SERVICE_KEY || "").trim()
    );
  }
  return client;
};

export const supabase = new Proxy({}, {
  get(target, prop) {
    return getSupabase()[prop];
  }
});