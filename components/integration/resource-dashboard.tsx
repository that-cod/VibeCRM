/**
 * @fileoverview Resource Dashboard Component
 * 
 * Reasoning:
 * - Shows all registered resources
 * - Displays schema status
 * - Provides quick links to each resource
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, ExternalLink, Database, Code, LayoutGrid, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { resourceRegistry, getRegistrationStats } from "@/lib/resources/registry";
import type { Resource } from "@/lib/code-generator/schemas";

interface ResourceDashboardProps {
  userId?: string;
  onRefresh?: () => void;
}

export function ResourceDashboard({ userId, onRefresh }: ResourceDashboardProps) {
  const [stats, setStats] = useState<{
    total_resources: number;
    total_fields: number;
    resources: Array<{ name: string; fields: number; plural: string }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    setIsLoading(true);
    try {
      const registrationStats = getRegistrationStats();
      setStats(registrationStats);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadStats();
    onRefresh?.();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading resources...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total_resources === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Resources Yet</CardTitle>
          <CardDescription>
            Generate a CRM schema to create your first resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Link href="/demo/code-generate">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Generate Your First CRM
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <LayoutGrid className="h-8 w-8 text-primary" />
              {stats.total_resources}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Fields
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Code className="h-8 w-8 text-primary" />
              {stats.total_fields}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-3xl font-bold">Active</div>
                <div className="text-xs text-muted-foreground">Tables ready</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resources List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Resources</CardTitle>
              <CardDescription>
                Click on a resource to manage its data
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.resources.map((resource, index) => (
              <div key={resource.name}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{resource.plural}</h3>
                      <p className="text-sm text-muted-foreground">
                        {resource.fields} fields
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dynamic/${resource.plural}`}>
                      <Button variant="outline" size="sm">
                        View
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                    <Link href={`/dynamic/${resource.plural}/create`}>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <Link href="/demo/code-generate">
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Generate New Resources
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
