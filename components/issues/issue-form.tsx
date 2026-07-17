"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import type { Issue, IssueType, IssuePriority, IssueStatus } from "@/types";

interface IssueFormProps {
  projectId: string;
  issue?: Issue | null;
}

export function IssueForm({ projectId, issue }: IssueFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    module: issue?.module || "",
    description: issue?.description || "",
    type: issue?.type || "Task",
    priority: issue?.priority || "Medium",
    status: issue?.status || "Open",
    issue_by: issue?.issue_by || profile?.name || "",
    issue_date: issue?.issue_date || new Date().toISOString().split("T")[0],
    base: issue?.base || "",
    verified: issue?.verified || false,
    verified_by: issue?.verified_by || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (issue) {
      const { error } = await supabase.from("issues").update(form).eq("id", issue.id);
      if (error) { toast.error(error.message); } else { toast.success("Issue updated"); router.push(`/projects/${projectId}`); }
    } else {
      const { error } = await supabase.from("issues").insert({ ...form, project_id: projectId });
      if (error) { toast.error(error.message); } else { toast.success("Issue created"); router.push(`/projects/${projectId}`); }
    }
    setLoading(false);
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{issue ? "Edit Issue" : "New Issue"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Module</Label>
              <Input value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} placeholder="e.g. Login, Reports" />
            </div>
            <div className="space-y-2">
              <Label>Issue By</Label>
              <Input value={form.issue_by} onChange={(e) => setForm({ ...form, issue_by: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as IssueType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Bug", "Enhancement", "Feature Request", "Task"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as IssuePriority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Low", "Medium", "High", "Critical"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as IssueStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Open", "In Progress", "Pending", "Testing", "Closed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Base</Label>
              <Input value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} placeholder="e.g. Sprint 1" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.verified} onCheckedChange={(v) => setForm({ ...form, verified: v })} />
              <Label>Verified</Label>
            </div>
            {form.verified && (
              <div className="flex-1">
                <Input value={form.verified_by} onChange={(e) => setForm({ ...form, verified_by: e.target.value })} placeholder="Verified by" />
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : issue ? "Update Issue" : "Create Issue"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
