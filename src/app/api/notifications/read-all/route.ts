import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Notification } from "@/lib/models";

/**
 * PATCH /api/notifications/read-all
 * Marks all unread notifications for the currently logged-in user as read.
 */
export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  await Notification.updateMany(
    { recipient: session.user.id, isRead: false },
    { isRead: true }
  );

  return NextResponse.json({ success: true, message: "All notifications marked as read." });
}
