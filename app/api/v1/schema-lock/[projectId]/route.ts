/**
 * @fileoverview API Route: POST/DELETE /api/v1/schema-lock/[projectId]
 * 
 * Purpose: Manage schema modification locks to prevent concurrent edits
 * 
 * Reasoning:
 * - Prevents race conditions when multiple users modify same schema
 * - 5-minute TTL ensures locks don't block indefinitely
 * - Automatic cleanup of expired locks
 * 
 * Dependencies:
 * - lib/validators/schema for request validation
 * - lib/supabase/server for database operations
 */

import { NextRequest, NextResponse } from "next/server";
import { AcquireLockSchema } from "@/lib/validators/schema";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST - Acquire schema lock
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) {
    try {
        // 1. Get authenticated user
        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const { projectId } = await context.params;

        // 2. Verify project ownership
        const { data: project, error: projectError } = await supabaseAdmin
            .from("projects")
            .select("id")
            .eq("id", projectId)
            .eq("user_id", user.id)
            .single();

        if (projectError || !project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        // 3. Parse and validate request
        const body = await request.json().catch(() => ({}));
        const validation = AcquireLockSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid request", details: validation.error.issues },
                { status: 400 }
            );
        }

        const { duration_minutes } = validation.data;

        // 4. Cleanup expired locks first
        await supabaseAdmin.rpc("cleanup_expired_locks");

        // 5. Check for existing lock
        const { data: existingLock, error: lockCheckError } = await supabaseAdmin
            .from("schema_locks")
            .select("*")
            .eq("project_id", projectId)
            .gt("expires_at", new Date().toISOString())
            .single();

        if (existingLock) {
            // Lock already exists and not expired
            if (existingLock.user_id === user.id) {
                // User already holds the lock - extend it
                const newExpiresAt = new Date(Date.now() + duration_minutes * 60 * 1000);

                const { data: updatedLock, error: updateError } = await supabaseAdmin
                    .from("schema_locks")
                    .update({ expires_at: newExpiresAt.toISOString() })
                    .eq("id", existingLock.id)
                    .select()
                    .single();

                if (updateError) {
                    throw new Error("Failed to extend lock");
                }

                return NextResponse.json({
                    lock_acquired: true,
                    lock_extended: true,
                    lock_id: updatedLock.id,
                    expires_at: updatedLock.expires_at,
                    locked_by: user.id,
                });
            } else {
                // Another user holds the lock
                return NextResponse.json(
                    {
                        lock_acquired: false,
                        message: "Schema is currently locked by another user",
                        locked_by: existingLock.user_id,
                        expires_at: existingLock.expires_at,
                    },
                    { status: 409 } // Conflict
                );
            }
        }

        // 6. Acquire new lock
        const expiresAt = new Date(Date.now() + duration_minutes * 60 * 1000);

        const { data: newLock, error: createError } = await supabaseAdmin
            .from("schema_locks")
            .insert({
                project_id: projectId,
                user_id: user.id,
                expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

        if (createError) {
            console.error("Failed to create lock:", createError);
            return NextResponse.json(
                { error: "Failed to acquire lock" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            lock_acquired: true,
            lock_id: newLock.id,
            expires_at: newLock.expires_at,
            locked_by: user.id,
        });

    } catch (error: any) {
        console.error("Schema lock error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: error.message || "Failed to acquire schema lock",
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Release schema lock
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) {
    try {
        // 1. Get authenticated user
        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const { projectId } = await context.params;

        // 2. Delete lock (RLS ensures only user's own lock can be deleted)
        const { error: deleteError } = await supabaseAdmin
            .from("schema_locks")
            .delete()
            .eq("project_id", projectId)
            .eq("user_id", user.id);

        if (deleteError) {
            console.error("Failed to release lock:", deleteError);
            return NextResponse.json(
                { error: "Failed to release lock" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Lock released successfully",
        });

    } catch (error: any) {
        console.error("Release lock error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: error.message || "Failed to release schema lock",
            },
            { status: 500 }
        );
    }
}

/**
 * GET - Check lock status
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) {
    try {
        // 1. Get authenticated user
        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const { projectId } = await context.params;

        // 2. Cleanup expired locks
        await supabaseAdmin.rpc("cleanup_expired_locks");

        // 3. Check for active lock
        const { data: lock, error: lockError } = await supabaseAdmin
            .from("schema_locks")
            .select("*")
            .eq("project_id", projectId)
            .gt("expires_at", new Date().toISOString())
            .single();

        if (lockError && lockError.code !== "PGRST116") { // PGRST116 = no rows
            console.error("Failed to check lock:", lockError);
            return NextResponse.json(
                { error: "Failed to check lock status" },
                { status: 500 }
            );
        }

        if (!lock) {
            return NextResponse.json({
                is_locked: false,
                message: "Schema is available for editing",
            });
        }

        return NextResponse.json({
            is_locked: true,
            locked_by: lock.user_id,
            is_own_lock: lock.user_id === user.id,
            expires_at: lock.expires_at,
            locked_at: lock.locked_at,
        });

    } catch (error: any) {
        console.error("Check lock error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: error.message || "Failed to check lock status",
            },
            { status: 500 }
        );
    }
}
