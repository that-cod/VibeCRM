import { NextRequest, NextResponse } from "next/server";
import { createProject, getProject, getUserProjects, updateProject, deleteProject, getProjectStats } from "@/lib/projects/project-manager";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const isDev = process.env.NODE_ENV === "development";
    
    if (!authHeader && !isDev) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: string;
    if (isDev) {
      userId = "00000000-0000-0000-0000-000000000000";
    } else {
      const token = authHeader!.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      userId = user.id;
    }
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");
    const statsOnly = searchParams.get("stats") === "true";

    if (projectId) {
      const project = await getProject(projectId);
      if (!project || project.user_id !== userId) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, project });
    }

    if (statsOnly) {
      const stats = await getProjectStats(userId);
      return NextResponse.json({ success: true, stats });
    }

    const projects = await getUserProjects(userId);
    return NextResponse.json({ success: true, projects });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const isDev = process.env.NODE_ENV === "development";
    
    if (!authHeader && !isDev) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: string;
    if (isDev) {
      userId = "00000000-0000-0000-0000-000000000000";
    } else {
      const token = authHeader!.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      userId = user.id;
    }
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const project = await createProject({ userId, name, description });
    if (!project) {
      return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }

    return NextResponse.json({ success: true, project }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const isDev = process.env.NODE_ENV === "development";
    
    if (!authHeader && !isDev) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: string;
    if (isDev) {
      userId = "00000000-0000-0000-0000-000000000000";
    } else {
      const token = authHeader!.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      userId = user.id;
    }
    const body = await request.json();
    const { project_id, name, description, is_active } = body;

    if (!project_id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const existing = await getProject(project_id);
    if (!existing || existing.user_id !== userId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const success = await updateProject(project_id, { name, description, is_active });
    if (!success) {
      return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const isDev = process.env.NODE_ENV === "development";
    
    if (!authHeader && !isDev) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: string;
    if (isDev) {
      userId = "00000000-0000-0000-0000-000000000000";
    } else {
      const token = authHeader!.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      userId = user.id;
    }
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const existing = await getProject(projectId);
    if (!existing || existing.user_id !== userId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const success = await deleteProject(projectId);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
