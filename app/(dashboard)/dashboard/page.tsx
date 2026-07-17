"use client";

import { useAuth } from "@/providers/auth-provider";
import { useProject } from "@/providers/project-provider";
import { useCompany } from "@/providers/company-provider";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, AlertCircle, CheckCircle2, Clock, ArrowUp } from "lucide-react";
import type { Issue } from "@/types";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function UserDashboard() {
  const { profile } = useAuth();
  const { selectedProject } = useProject();
  const { selectedCompany } = useCompany();
  const [issues, setIssues] = useState<Issue[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!selectedProject) return;
    supabase.from("issues").select("*").eq("project_id", selectedProject.id).order("created_at", { ascending: false }).then(({ data }) => setIssues(data || []));
  }, [selectedProject]);

  const total = issues.length;
  const open = issues.filter((i) => i.status === "Open").length;
  const inProgress = issues.filter((i) => i.status === "In Progress").length;
  const closed = issues.filter((i) => i.status === "Closed").length;
  const high = issues.filter((i) => i.priority === "High" || i.priority === "Critical").length;
  const recent = issues.slice(0, 5);

  const cards = [
    { title: "Total Issues", value: total, icon: Bug, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900" },
    { title: "Open", value: open, icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900" },
    { title: "In Progress", value: inProgress, icon: Clock, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900" },
    { title: "Closed", value: closed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900" },
    { title: "High Priority", value: high, icon: ArrowUp, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {selectedCompany?.name} / {selectedProject?.name || "No project selected"}
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${c.bg}`}>
                    <Icon className={`h-5 w-5 ${c.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{c.value}</p>
                    <p className="text-xs text-muted-foreground">{c.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Issues</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedProject ? (
            <p className="text-muted-foreground text-sm">Select a company and project to view issues.</p>
          ) : recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">No issues yet.</p>
          ) : (
            <div className="space-y-3">
              {recent.map((issue) => (
                <Link key={issue.id} href={`/projects/${selectedProject.id}/issues/${issue.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{issue.description}</p>
                    <p className="text-xs text-muted-foreground">{issue.module} · {issue.type}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      issue.priority === "Critical" ? "bg-red-100 text-red-700" :
                      issue.priority === "High" ? "bg-orange-100 text-orange-700" :
                      issue.priority === "Medium" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>{issue.priority}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      issue.status === "Closed" ? "bg-green-100 text-green-700" :
                      issue.status === "Open" ? "bg-blue-100 text-blue-700" :
                      issue.status === "In Progress" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>{issue.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
