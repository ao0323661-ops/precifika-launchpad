// Server-side Supabase client with service role key - bypasses RLS.
// Use this for admin operations in server functions and server routes only.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function createSupabaseAdminClient(): SupabaseClient<Database> {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "[Supabase] Missing server-side environment variables. Admin client will not function.",
    );
    // Return a proxy that throws on any access
    return new Proxy({} as SupabaseClient<Database>, {
      get() {
        throw new Error("Supabase Admin client accessed but environment variables are missing.");
      },
    });
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseAdmin: SupabaseClient<Database> | undefined;

export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
