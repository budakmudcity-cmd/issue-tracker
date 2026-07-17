import { createClient } from "@/lib/supabase/server";
import { IssueForm } from "@/components/issues/issue-form";
import { notFound } from "next/navigation";

export default async function EditIssuePage({ params }: { params: Promise<{ projectId: string; issueId: string }> }) {
  const { projectId, issueId } = await params;
  const supabase = await createClient();
  const { data: issue } = await supabase.from("issues").select("*").eq("id", issueId).single();
  if (!issue) notFound();
  return <IssueForm projectId={projectId} issue={issue} />;
}
