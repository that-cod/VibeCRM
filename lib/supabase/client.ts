/**
 * @fileoverview Browser-side Supabase client for client components.
 * 
 * Reasoning:
 * - Uses NEXT_PUBLIC_SUPABASE_ANON_KEY (safe to expose in browser)
 * - RLS policies automatically filter data by authenticated user
 * - Auth state changes trigger component re-renders
 * 
 * Dependencies:
 * - @supabase/ssr for Next.js App Router compatibility
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
