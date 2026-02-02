/**
 * Supabase Admin Client
 * Service role client for privileged operations like dynamic table creation
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
}

/**
 * Admin client with service role permissions
 * WARNING: Only use server-side, never expose to client
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

/**
 * Execute dynamic SQL via database function
 */
export async function executeDynamicSQL(sql: string): Promise<void> {
    const { data, error } = await supabaseAdmin.rpc('execute_dynamic_sql', {
        sql_command: sql,
    });

    if (error) {
        throw new Error(`Failed to execute SQL: ${error.message}`);
    }

    return data;
}
