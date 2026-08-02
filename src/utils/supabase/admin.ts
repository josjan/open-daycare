import { createClient } from "@supabase/supabase-js";

// SOLO server (route handlers): client con service role que bypassa RLS.
export const adminClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
