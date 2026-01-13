/**
 * @fileoverview Vibe Replay Timeline Component
 *
 * Reasoning:
 * - Visualizes AI decision history as an interactive timeline
 * - Shows intent → action → outcome flow
 * - Includes schema diff viewer and rollback functionality
 */

"use client";

import { useState } from "react";
import { useVibeReplay, DecisionTrace } from "@/lib/hooks/use-vibe-replay";
import { useRollback } from "@/lib/hooks/use-rollback";
import { SchemaDiff } from "@/components/schema-diff";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  RotateCcw,
  AlertTriangle,
  GitCompare,
  CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface VibeReplayTimelineProps {
  projectId: string | null;
  projectName: string;
}

export function VibeReplayTimeline({ projectId, projectName }: VibeReplayTimelineProps) {
  const { data, isLoading, error, refetch } = useVibeReplay(projectId);
  const { rollback, isLoading: isRollingBack } = useRollback(projectId);
  const [expandedTraces, setExpandedTraces] = useState<Set<string>>(new Set());
  const [selectedTrace, setSelectedTrace] = useState<DecisionTrace | null>(null);
  const [rollbackVersion, setRollbackVersion] = useState<string | null>(null);
  const [rollbackReason, setRollbackReason] = useState("");
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);

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

  const handleRollback = async () => {
    if (!rollbackVersion) return;

    const result = await rollback(rollbackVersion, rollbackReason);

    if (result) {
      toast.success(`Rolled back to v${rollbackVersion}`, {
        description: `New version: v${result.new_version}`,
      });
      setShowRollbackConfirm(false);
      setRollbackReason("");
      refetch();
    } else {
      toast.error("Rollback failed");
    }
  };

  const currentVersion = data.schema_versions.find((v) => v.is_active)?.schema_version;

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

                            {(trace.schema_before || trace.schema_after) && (
                              <div className="mb-4">
                                <h5 className="text-xs font-medium mb-2 text-muted-foreground flex items-center gap-1">
                                  <GitCompare className="h-3 w-3" />
                                  Schema Changes
                                </h5>
                                <SchemaDiff
                                  schemaBefore={trace.schema_before as any}
                                  schemaAfter={trace.schema_after as any}
                                />
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTrace(trace)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Full Schema
                              </Button>

                              {currentVersion && trace.version !== currentVersion && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setRollbackVersion(trace.version);
                                    setShowRollbackConfirm(true);
                                  }}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Rollback to v{trace.version}
                                </Button>
                              )}
                            </div>
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
                    <span className="text-xs text-primary font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
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

      {showRollbackConfirm && rollbackVersion && (
        <RollbackConfirmModal
          version={rollbackVersion}
          currentVersion={currentVersion || ""}
          reason={rollbackReason}
          onReasonChange={setRollbackReason}
          onConfirm={handleRollback}
          onCancel={() => {
            setShowRollbackConfirm(false);
            setRollbackReason("");
          }}
          isLoading={isRollingBack}
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

function RollbackConfirmModal({
  version,
  currentVersion,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
  isLoading,
}: {
  version: string;
  currentVersion: string;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onCancel}
    >
      <Card
        className="w-full max-w-md m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Confirm Rollback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p>
              You are about to rollback from <strong>v{currentVersion}</strong> to{" "}
              <strong>v{version}</strong>.
            </p>
            <p className="text-muted-foreground">
              A new version will be created with the schema from v{version}.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for rollback (optional)</label>
            <Input
              placeholder="Why are you rolling back?"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Rolling back...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Confirm Rollback
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
