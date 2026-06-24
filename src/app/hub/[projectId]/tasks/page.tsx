import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ projectId: string }>;
}

/**
 * Redirects dynamic legacy path /hub/[projectId]/tasks to /hub/[projectId]?tab=kanban
 */
export default async function HubTasksRedirectPage({ params }: Props) {
  const { projectId } = await params;
  redirect(`/hub/${projectId}?tab=kanban`);
}
