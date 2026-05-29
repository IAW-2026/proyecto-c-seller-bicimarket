import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const PRODUCT_IMAGES_BUCKET = "product-images";

// Lazy singleton — created on first request, not at module load time,
// so the build doesn't fail when env vars aren't present.
let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — add them to .env.local"
    );
  }

  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}
