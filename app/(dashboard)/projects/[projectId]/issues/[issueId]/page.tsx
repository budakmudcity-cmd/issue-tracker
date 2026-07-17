"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import type { Issue, IssueRemark } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare, Trash2, Edit } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const issueId = params.issueId as string;
  const [issue, setIssue] = useState<Issue | null>(null);
  const [remarks, setRemarks] = useState<IssueRemark[]>([]);
  const [newRemark, setNewRemark] = useState("");
  const [sending, setSending] = useState(false);
  const { profile } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    supabase.from("issues").select("*").eq("id", issueId).single().then(({ data }) => setIssue(data));
    supabase.from("issue_remarks").select("*, profiles!inner(*)").eq("issue_id", issueId).order("created_at", { ascending: true }).then(({ data }) => setRemarks(data || []));
  }, [issueId]);

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;
    setSending(true);
    const { error } = await supabase.from("issue_remarks").insert({
      issue_id: issueId,
      user_id: profile?.id,
      message: newRemark.trim(),
    });
    if (error) { toast.error(error.message); } else {
      setNewRemark("");
      const { data } = await supabase.from("issue_remarks").select("*, profiles!inner(*)").eq("issue_id", issueId).order("created_at", { ascending: true });
      setRemarks(data || []);
    }
    setSending(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this issue?")) return;
    await supabase.from("issues").delete().eq("id", issueId);
    toast.success("Issue deleted");
    router.push(`/projects/${projectId}`);
  };

  if (!issue) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading...</p></div>;

  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid grid-cols-3 py-2 border-b last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="col-span-2 text-sm">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push(`/projects/${projectId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Issues
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${projectId}/issues/${issueId}/edit`)}>
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          {profile?.role === "admin" && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{issue.description}</CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge>{issue.type}</Badge>
            <Badge className={issue.priority === "Critical" ? "bg-red-100 text-red-700" : issue.priority === "High" ? "bg-orange-100 text-orange-700" : issue.priority === "Medium" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}>{issue.priority}</Badge>
            <Badge className={issue.status === "Closed" ? "bg-green-100 text-green-700" : issue.status === "Open" ? "bg-blue-100 text-blue-700" : issue.status === "In Progress" ? "bg-yellow-100 text-yellow-700" : issue.status === "Testing" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}>{issue.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DetailRow label="Module" value={issue.module} />
          <DetailRow label="Issue By" value={issue.issue_by} />
          <DetailRow label="Issue Date" value={issue.issue_date ? formatDate(issue.issue_date) : "-"} />
          <DetailRow label="Base" value={issue.base} />
          <DetailRow label="Verified" value={issue.verified ? "Yes" : "No"} />
          {issue.verified_by && <DetailRow label="Verified By" value={issue.verified_by} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Remarks ({remarks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {remarks.length === 0 && <p className="text-sm text-muted-foreground">No remarks yet.</p>}
            {remarks.map((r) => (
              <div key={r.id} className="flex gap-3">
                <Avatar className="h-8 w-8 mt-0.5">
                  <AvatarFallback className="text-xs">{r.profiles?.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{r.profiles?.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</p>
                  </div>
                  <p className="text-sm mt-1">{r.message}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t">
            <Textarea placeholder="Add a remark..." value={newRemark} onChange={(e) => setNewRemark(e.target.value)} className="min-h-[60px]" />
            <Button onClick={handleAddRemark} disabled={sending || !newRemark.trim()} className="self-end">
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
