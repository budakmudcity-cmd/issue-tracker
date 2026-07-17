"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminCharts } from "@/components/dashboard/admin-charts";
import { Building2, FolderKanban, Bug, AlertCircle, CheckCircle2, ArrowUp } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ companies: 0, projects: 0, issues: 0, open: 0, closed: 0, high: 0 });
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
  const [priorityData, setPriorityData] = useState<{ name: string; value: number }[]>([]);
  const [recentIssues, setRecentIssues] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { count: companies } = await supabase.from("companies").select("*", { count: "exact", head: true });
      const { count: projects } = await supabase.from("projects").select("*", { count: "exact", head: true });
      const { data: issues } = await supabase.from("issues").select("*").order("created_at", { ascending: false });
      const all = issues || [];
      setStats({
        companies: companies || 0,
        projects: projects || 0,
        issues: all.length,
        open: all.filter((i) => i.status === "Open").length,
        closed: all.filter((i) => i.status === "Closed").length,
        high: all.filter((i) => i.priority === "High" || i.priority === "Critical").length,
      });

      const statusCount = ["Open", "In Progress", "Pending", "Testing", "Closed"].map((s) => ({ name: s, value: all.filter((i) => i.status === s).length }));
      setStatusData(statusCount.filter((s) => s.value > 0));

      const priorityCount = ["Low", "Medium", "High", "Critical"].map((p) => ({ name: p, value: all.filter((i) => i.priority === p).length }));
      setPriorityData(priorityCount.filter((p) => p.value > 0));

      setRecentIssues(all.slice(0, 10));
    })();
  }, []);

  const cards = [
    { title: "Total Companies", value: stats.companies, icon: Building2, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Total Projects", value: stats.projects, icon: FolderKanban, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Total Issues", value: stats.issues, icon: Bug, color: "text-slate-600", bg: "bg-slate-100" },
    { title: "Open Issues", value: stats.open, icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-100" },
    { title: "Closed Issues", value: stats.closed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
    { title: "High Priority", value: stats.high, icon: ArrowUp, color: "text-red-600", bg: "bg-red-100" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of the entire system</p>
      </div>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${c.bg} dark:opacity-80`}>
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
      <AdminCharts statusData={statusData} priorityData={priorityData} />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Issues</CardTitle>
        </CardHeader>
        <CardContent>
          {recentIssues.length === 0 ? (
            <p className="text-muted-foreground text-sm">No issues yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Issue</th>
                    <th className="pb-3 font-medium">Project</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIssues.map((issue) => (
                    <tr key={issue.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                      <td className="py-3">
                        <Link href={`/projects/${issue.project_id}/issues/${issue.id}`} className="font-medium hover:text-primary">
                          {issue.description?.length > 50 ? issue.description.slice(0, 50) + "..." : issue.description}
                        </Link>
                      </td>
                      <td className="py-3 text-muted-foreground">{issue.project_id?.slice(0, 8)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          issue.status === "Closed" ? "bg-green-100 text-green-700" :
                          issue.status === "Open" ? "bg-blue-100 text-blue-700" :
                          issue.status === "In Progress" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>{issue.status}</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          issue.priority === "Critical" ? "bg-red-100 text-red-700" :
                          issue.priority === "High" ? "bg-orange-100 text-orange-700" :
                          issue.priority === "Medium" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>{issue.priority}</span>
                      </td>
                      <td className="py-3 text-muted-foreground">{formatDate(issue.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
