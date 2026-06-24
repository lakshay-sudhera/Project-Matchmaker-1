import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Notification } from "@/lib/models";

/**
 * PATCH /api/notifications/:id/read
 * Marks a specific notification as read. Validates that the recipient is the logged-in user.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await (context.params as any);
  const notificationId = params.id;

  await connectToDatabase();

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 444 });
  }

  // Ensure security rule: Can only mark own notifications as read
  if (notification.recipient.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden. Access denied." }, { status: 403 });
  }

  notification.isRead = true;
  await notification.save();

  return NextResponse.json({ success: true, notification });
}
