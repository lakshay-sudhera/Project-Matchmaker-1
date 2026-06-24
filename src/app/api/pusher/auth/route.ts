import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { TeamMember, Project } from "@/lib/models";
import { pusherServer } from "@/lib/pusherServer";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Parse the request body (supports both JSON and urlencoded form data)
    let socketId: string | null = null;
    let channelName: string | null = null;

    try {
      const text = await req.text();
      try {
        const body = JSON.parse(text);
        socketId = body.socket_id;
        channelName = body.channel_name;
      } catch {
        const params = new URLSearchParams(text);
        socketId = params.get("socket_id");
        channelName = params.get("channel_name");
      }
    } catch (parseError) {
      console.error("Error parsing pusher auth request body:", parseError);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: "socket_id and channel_name are required" },
        { status: 400 }
      );
    }

    // Verify channel format: must be private-chat-[projectId]
    if (!channelName.startsWith("private-chat-")) {
      return NextResponse.json(
        { error: "Unauthorized channel access pattern" },
        { status: 403 }
      );
    }

    const projectId = channelName.replace("private-chat-", "");

    await connectToDatabase();

    // Check project workspace membership or ownership
    const isMember = await TeamMember.findOne({ project: projectId, user: userId });
    const project = await Project.findById(projectId);
    const isOwner = project?.owner.toString() === userId;

    if (!isMember && !isOwner) {
      return NextResponse.json(
        { error: "Access denied. You are not a team member of this project." },
        { status: 403 }
      );
    }

    // Generate the pusher authorization token
    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (error: any) {
    console.error("Pusher authentication error:", error);
    return NextResponse.json(
      { error: error.message || "Pusher authentication failed" },
      { status: 500 }
    );
  }
}
