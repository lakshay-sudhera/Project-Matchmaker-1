"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { TeamMember, Project, Message } from "@/lib/models";
import mongoose from "mongoose";

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

  revalidatePath(`/hub/${projectId}`);

  return { 
    success: true, 
    messageId: message._id.toString()
  };
}
