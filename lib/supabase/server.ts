/**
 * @fileoverview Supabase client factory for server-side operations with RLS bypass capability.
 * 
 * Reasoning:
 * - Server client uses service role key to bypass RLS for admin operations
 * - Only used in API routes, never exposed to frontend
 * - Enables schema provisioning and system-level database operations
 * 
 * Dependencies:
 * - @supabase/supabase-js for database client
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
}

/**
 * Server-side Supabase client with service role key (bypasses RLS)
 * WARNING: Only use in API routes, never expose to frontend
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

/**
 * Get Supabase client for authenticated user (respects RLS)
 * Use this for user-scoped operations
 */
export function getSupabaseClient(accessToken?: string) {
    return createClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        accessToken
            ? {
                global: {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            }
            : undefined
    );
}
