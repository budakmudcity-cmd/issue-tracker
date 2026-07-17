import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Issue } from "@/types";

export function useIssues(projectId: string | null) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    if (!projectId) { setIssues([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("issues")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    setIssues(data || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { issues, loading, refresh };
}
