import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Notification } from "@/lib/models";

/**
 * GET /api/notifications
 * Fetches the currently authenticated user's notifications, sorted by creation date.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const notifications = await Notification.find({ recipient: session.user.id })
    .populate("sender", "name username image")
    .sort({ createdAt: -1 });

  return NextResponse.json(notifications);
}
