import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { IssueRemark } from "@/types";

export function useRemarks(issueId: string | null) {
  const [remarks, setRemarks] = useState<IssueRemark[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    if (!issueId) { setRemarks([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("issue_remarks")
      .select("*, profiles!inner(*)")
      .eq("issue_id", issueId)
      .order("created_at", { ascending: true });
    setRemarks(data || []);
    setLoading(false);
  }, [issueId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { remarks, loading, refresh };
}
