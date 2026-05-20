import type { Database } from "./types";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "http://localhost:54321";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "missing-supabase-publishable-key";

if (
  supabaseUrl === "http://localhost:54321" ||
  supabaseAnonKey === "missing-supabase-publishable-key"
) {
  console.warn("Supabase credentials missing. Some features may not work.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
