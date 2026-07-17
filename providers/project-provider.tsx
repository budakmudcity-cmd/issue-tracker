"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Project } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";
import { useCompany } from "./company-provider";

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (p: Project | null) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  selectedProject: null,
  setSelectedProject: () => {},
  loading: true,
  refresh: async () => {},
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { selectedCompany } = useCompany();
  const supabase = createClient();

  const refresh = useCallback(async () => {
    if (!profile || !selectedCompany) { setProjects([]); setLoading(false); return; }
    setLoading(true);
    let query = supabase.from("projects").select("*").eq("company_id", selectedCompany.id).order("name");
    if (profile.role !== "admin") {
      const { data: pu } = await supabase.from("project_users").select("project_id").eq("user_id", profile.id);
      const ids = pu?.map((p) => p.project_id) || [];
      query = query.in("id", ids);
    }
    const { data } = await query;
    setProjects(data || []);
    setLoading(false);
  }, [profile, selectedCompany]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <ProjectContext.Provider value={{ projects, selectedProject, setSelectedProject, loading, refresh }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);
