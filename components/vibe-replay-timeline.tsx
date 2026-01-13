/**
 * @fileoverview Vibe Replay Timeline Component
 *
 * Reasoning:
 * - Visualizes AI decision history as an interactive timeline
 * - Shows intent → action → outcome flow
 * - Allows viewing schema state at any point in time
 */

"use client";

import { useState } from "react";
import { useVibeReplay, DecisionTrace } from "@/lib/hooks/use-vibe-replay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  GitBranch,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Database,
  Table2,
  Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VibeReplayTimelineProps {
  projectId: string | null;
  projectName: string;
}

export function VibeReplayTimeline({ projectId, projectName }: VibeReplayTimelineProps) {
  const { data, isLoading, error, refetch } = useVibeReplay(projectId);
  const [expandedTraces, setExpandedTraces] = useState<Set<string>>(new Set());
  const [selectedTrace, setSelectedTrace] = useState<DecisionTrace | null>(null);

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Vibe Replay...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Error loading Vibe Replay: {error}</p>
          <Button onClick={refetch} className="mt-4" variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.traces.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Vibe Replay
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">No Decision History Yet</h3>
          <p className="text-muted-foreground text-sm">
            Your Vibe Replay will track every AI decision as you build your CRM.
          </p>
        </CardContent>
      </Card>
    );
  }

  const toggleTrace = (traceId: string) => {
    const newExpanded = new Set(expandedTraces);
    if (newExpanded.has(traceId)) {
      newExpanded.delete(traceId);
    } else {
      newExpanded.add(traceId);
    }
    setExpandedTraces(newExpanded);
  };

  const getActionIcon = (action: string) => {
    if (action.includes("table") || action.includes("schema")) {
      return <Table2 className="h-4 w-4" />;
    }
    if (action.includes("resource") || action.includes("generate")) {
      return <Database className="h-4 w-4" />;
    }
    return <Sparkles className="h-4 w-4" />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <Card className="lg:col-span-2 h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Vibe Replay: {projectName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.traces.length} decision{data.traces.length !== 1 ? "s" : ""} tracked
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative h-[500px] overflow-y-auto pr-4">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-6">
                {data.traces.map((trace, index) => (
                  <div key={trace.id} className="relative pl-10">
                    <div
                      className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 ${
                        index === 0
                          ? "bg-primary border-primary"
                          : "bg-background border-muted-foreground"
                      }`}
                    />

                    <Card
                      className={`transition-all ${
                        expandedTraces.has(trace.id) || index === 0
                          ? "ring-1 ring-primary/20"
                          : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="gap-1">
                                {getActionIcon(trace.action)}
                                <span>v{trace.version}</span>
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(trace.timestamp), { addSuffix: true })}
                              </span>
                            </div>

                            <h4 className="font-medium text-sm mb-1 line-clamp-2">
                              {trace.intent}
                            </h4>

                            <p className="text-xs text-muted-foreground">
                              {trace.action}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTrace(trace.id)}
                          >
                            {expandedTraces.has(trace.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {(expandedTraces.has(trace.id) || index === 0) && (
                          <div className="mt-4 pt-4 border-t">
                            {trace.precedent && (
                              <div className="mb-4">
                                <h5 className="text-xs font-medium mb-1 text-muted-foreground">
                                  Reasoning
                                </h5>
                                <p className="text-sm">{trace.precedent}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {trace.schema_before && (
                                <div>
                                  <h5 className="text-xs font-medium mb-1 text-muted-foreground">
                                    Before
                                  </h5>
                                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                    {JSON.stringify(trace.schema_before, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {trace.schema_after && (
                                <div>
                                  <h5 className="text-xs font-medium mb-1 text-muted-foreground">
                                    After
                                  </h5>
                                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                    {JSON.stringify(trace.schema_after, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4"
                              onClick={() => setSelectedTrace(trace)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Schema State
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Schema Versions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[450px] overflow-y-auto pr-4 space-y-3">
            {data.schema_versions.map((version) => (
              <div
                key={version.schema_version}
                className={`p-3 rounded-lg border ${
                  version.is_active
                    ? "bg-primary/5 border-primary/20"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant={version.is_active ? "default" : "secondary"}>
                    v{version.schema_version}
                  </Badge>
                  {version.is_active && (
                    <span className="text-xs text-primary font-medium">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(version.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTrace && (
        <SchemaDetailModal
          trace={selectedTrace}
          open={!!selectedTrace}
          onClose={() => setSelectedTrace(null)}
        />
      )}
    </div>
  );
}

function SchemaDetailModal({
  trace,
  open,
  onClose,
}: {
  trace: DecisionTrace;
  open: boolean;
  onClose: () => void;
}) {
  const schema = trace.schema_after || trace.schema_before;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm ${
        open ? "block" : "hidden"
      }`}
      onClick={onClose}
    >
      <Card
        className="w-full max-w-2xl max-h-[80vh] m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Schema State: v{trace.version}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(trace.timestamp), { addSuffix: true })}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] overflow-y-auto pr-4">
            {schema ? (
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(schema, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Schema data not available for this decision
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
