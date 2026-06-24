import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ projectId: string }>;
}

/**
 * Redirects dynamic legacy path /hub/[projectId]/expenses to /hub/[projectId]?tab=expenses
 */
export default async function HubExpensesRedirectPage({ params }: Props) {
  const { projectId } = await params;
  redirect(`/hub/${projectId}?tab=expenses`);
}
