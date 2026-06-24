"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { TeamMember, Project, Message, User } from "@/lib/models";
import { pusherServer } from "@/lib/pusherServer";
import mongoose from "mongoose";
import { createNotification } from "@/lib/notificationService";

export async function sendMessage(projectId: string, text: string, attachments: string[] = []) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();

  // Validate authorization
  const isMember = await TeamMember.findOne({ project: projectId, user: session.user.id });
  const project = await Project.findById(projectId);
  const isOwner = project?.owner.toString() === session.user.id;

  if (!isMember && !isOwner) {
    throw new Error("Access denied. You must be a member of this project team to participate in the chat.");
  }

  if (!text.trim() && attachments.length === 0) {
    throw new Error("Cannot send empty message.");
  }

  const message = await Message.create({
    project: new mongoose.Types.ObjectId(projectId),
    sender: new mongoose.Types.ObjectId(session.user.id),
    text: text.trim(),
    attachments: attachments,
  });

  // Trigger CHAT_MESSAGE notifications for all team members (except the sender)
  try {
    const allMembers = await TeamMember.find({ project: projectId });
    for (const member of allMembers) {
      if (member.user.toString() === session.user.id) continue;

      await createNotification({
        recipient: member.user.toString(),
        sender: session.user.id,
        type: "CHAT_MESSAGE",
        title: "New Team Message",
        message: `${session.user.name || "A teammate"} sent a message in "${project?.title || "project chat"}"`,
        link: `/hub/${projectId}?tab=chat`,
        priority: "LOW",
        metadata: {
          projectId,
          messageId: message._id.toString(),
        },
      });
    }
  } catch (err) {
    console.error("Failed to create chat notifications:", err);
  }

  // Broadcast via Pusher in real-time
  try {
    const senderInfo = {
      _id: session.user.id,
      name: session.user.name || "",
      username: (session.user as any).username || "",
      image: session.user.image || undefined,
    };

    // Fallback/enrichment from DB if session info is incomplete
    if (!senderInfo.name || !senderInfo.username) {
      const dbUser = await User.findById(session.user.id).select("name username image");
      if (dbUser) {
        senderInfo.name = dbUser.name || senderInfo.name;
        senderInfo.username = dbUser.username || senderInfo.username;
        senderInfo.image = dbUser.image || senderInfo.image;
      }
    }

    const pusherPayload = {
      _id: message._id.toString(),
      sender: senderInfo,
      text: message.text,
      attachments: message.attachments,
      createdAt: message.createdAt.toISOString(),
    };

    await pusherServer.trigger(
      `private-chat-${projectId}`,
      "new-message",
      pusherPayload
    );
  } catch (pusherError) {
    console.error("Error sending message to Pusher:", pusherError);
  }

  revalidatePath(`/hub/${projectId}`);

  return { 
    success: true, 
    messageId: message._id.toString()
  };
}
