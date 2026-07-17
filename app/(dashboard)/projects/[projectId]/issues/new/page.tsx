import { IssueForm } from "@/components/issues/issue-form";

export default async function NewIssuePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <IssueForm projectId={projectId} />;
}
