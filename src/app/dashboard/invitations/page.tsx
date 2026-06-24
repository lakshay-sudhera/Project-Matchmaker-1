import { redirect } from "next/navigation";

/**
 * Redirects dynamic legacy path /dashboard/invitations to /dashboard
 */
export default async function DashboardInvitationsRedirectPage() {
  redirect("/dashboard");
}
