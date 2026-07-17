"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { Company } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";

interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  setSelectedCompany: (c: Company | null) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
  companies: [],
  selectedCompany: null,
  setSelectedCompany: () => {},
  loading: true,
  refresh: async () => {},
});

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const supabase = createClient();

  const refresh = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    if (profile.role === "admin") {
      const { data } = await supabase.from("companies").select("*").order("name");
      setCompanies(data || []);
    } else {
      const { data: pu } = await supabase.from("project_users").select("project_id").eq("user_id", profile.id);
      const ids = pu?.map((p) => p.project_id) || [];
      if (ids.length === 0) { setCompanies([]); setLoading(false); return; }
      const { data: projects } = await supabase.from("projects").select("company:companies(*)").in("id", ids);
      const seen = new Map<string, Company>();
      projects?.forEach((p: any) => { if (p.company) seen.set(p.company.id, p.company); });
      setCompanies(Array.from(seen.values()));
    }
    setLoading(false);
  }, [profile]);

  return (
    <CompanyContext.Provider value={{ companies, selectedCompany, setSelectedCompany, loading, refresh }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
