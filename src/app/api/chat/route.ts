import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { TeamMember, Project, Message } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "ProjectId is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Verify membership authorization
    const isMember = await TeamMember.findOne({ project: projectId, user: session.user.id });
    const project = await Project.findById(projectId);
    const isOwner = project?.owner.toString() === session.user.id;

    if (!isMember && !isOwner) {
      return NextResponse.json({ error: "Access denied to chat history." }, { status: 403 });
    }

    const messages = await Message.find({ project: projectId })
      .populate("sender", "name username image")
      .sort({ createdAt: 1 })
      .limit(100); // Return last 100 messages

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error("Chat GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
