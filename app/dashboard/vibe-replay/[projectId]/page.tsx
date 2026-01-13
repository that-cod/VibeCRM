/**
 * @fileoverview Vibe Replay Dashboard Page
 *
 * Reasoning:
 * - Main page for viewing AI decision history and schema evolution
 * - Accessible from main dashboard
 * - Shows timeline of all schema changes
 */

import { getProject } from "@/lib/api/client";
import { VibeReplayTimeline } from "@/components/vibe-replay-timeline";
import { Suspense } from "react";

export default async function VibeReplayPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  let project;
  try {
    const result = await getProject(projectId);
    project = result.project;
  } catch {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
        <p>The requested project could not be found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Vibe Replay</h1>
        <p className="text-muted-foreground">
          Track how your CRM evolved from a single prompt to a complete system
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-[600px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <VibeReplayTimeline projectId={projectId} projectName={project.name} />
      </Suspense>
    </div>
  );
}
