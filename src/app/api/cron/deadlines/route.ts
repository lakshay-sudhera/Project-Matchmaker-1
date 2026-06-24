import { NextResponse } from "next/server";
import { checkDeadlineReminders } from "@/lib/notificationService";

/**
 * GET /api/cron/deadlines
 * Cron trigger endpoint to check for approaching task deadlines and notify assignees.
 */
export async function GET() {
  try {
    await checkDeadlineReminders();
    return NextResponse.json({ success: true, message: "Task deadline reminder check finished successfully." });
  } catch (err: any) {
    console.error("Error running deadline reminder cron:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
