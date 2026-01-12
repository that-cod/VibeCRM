import { useState, useCallback } from "react";
import type { Project } from "@/lib/projects/project-manager";

interface UseProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  createProject: (name: string, description?: string) => Promise<Project | null>;
  updateProject: (id: string, data: Partial<Project>) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  refreshProjects: () => Promise<void>;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/projects");
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects || []);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(async (name: string, description?: string): Promise<Project | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchProjects();
        return data.project;
      } else {
        setError(data.error);
        return null;
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProjects]);

  const updateProject = useCallback(async (id: string, data: Partial<Project>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: id, ...data }),
      });
      const result = await response.json();
      if (result.success) {
        await fetchProjects();
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProjects]);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/projects?project_id=${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        await fetchProjects();
        return true;
      } else {
        setError(data.error);
        return false;
      }
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProjects]);

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects: fetchProjects,
  };
}
