"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Project, TeamMember, Task, Expense, Resource, Discussion, DiscussionReply } from "@/lib/models";
import mongoose from "mongoose";

// Check if user is a member of the project team
async function checkTeamAccess(projectId: string, userId: string) {
  const isMember = await TeamMember.findOne({ project: projectId, user: userId });
  if (isMember) return true;

  const project = await Project.findById(projectId);
  if (project && project.owner.toString() === userId) return true;

  return false;
}

// KANBAN TASKS ACTIONS

export async function addTask(
  projectId: string,
  data: { title: string; description?: string; assigneeId?: string; dueDate?: string }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();
  const hasAccess = await checkTeamAccess(projectId, session.user.id);
  if (!hasAccess) throw new Error("Access denied to team workspace.");

  const task = await Task.create({
    project: new mongoose.Types.ObjectId(projectId),
    title: data.title,
    description: data.description || "",
    status: "Todo",
    assignee: data.assigneeId ? new mongoose.Types.ObjectId(data.assigneeId) : undefined,
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
  });

  revalidatePath(`/hub/${projectId}`);
  return { success: true, taskId: task._id.toString() };
}

export async function updateTaskStatus(
  projectId: string,
  taskId: string,
  status: "Todo" | "In Progress" | "Review" | "Done"
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();
  const hasAccess = await checkTeamAccess(projectId, session.user.id);
  if (!hasAccess) throw new Error("Access denied.");

  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) throw new Error("Task not found.");

  task.status = status;
  await task.save();

  revalidatePath(`/hub/${projectId}`);
  return { success: true };
}

export async function toggleTaskCompletion(
  projectId: string,
  taskId: string,
  completed: boolean
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();
  const hasAccess = await checkTeamAccess(projectId, session.user.id);
  if (!hasAccess) throw new Error("Access denied.");

  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) throw new Error("Task not found.");

  task.completed = completed;
  await task.save();

  revalidatePath(`/hub/${projectId}`);
  return { success: true };
}


// DISCUSSION BOARDS ACTIONS

export async function createDiscussion(
  projectId: string,
  data: { title: string; content: string }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();
  const hasAccess = await checkTeamAccess(projectId, session.user.id);
  if (!hasAccess) throw new Error("Access denied.");

  const discussion = await Discussion.create({
    project: new mongoose.Types.ObjectId(projectId),
    creator: new mongoose.Types.ObjectId(session.user.id),
    title: data.title,
    content: data.content,
  });

  revalidatePath(`/hub/${projectId}`);
  return { success: true, discussionId: discussion._id.toString() };
}

export async function createDiscussionReply(
  projectId: string,
  discussionId: string,
  content: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();
  const hasAccess = await checkTeamAccess(projectId, session.user.id);
  if (!hasAccess) throw new Error("Access denied.");

  const discussion = await Discussion.findOne({ _id: discussionId, project: projectId });
  if (!discussion) throw new Error("Discussion thread not found.");

  const reply = await DiscussionReply.create({
    discussion: new mongoose.Types.ObjectId(discussionId),
    creator: new mongoose.Types.ObjectId(session.user.id),
    content: content,
  });

  revalidatePath(`/hub/${projectId}`);
  return { success: true, replyId: reply._id.toString() };
}

// RESOURCE VAULT ACTIONS

export async function addResource(
  projectId: string,
  data: { title: string; url: string; category: "GitHub" | "Figma" | "Docs" | "Presentation" | "Other" }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();
  const hasAccess = await checkTeamAccess(projectId, session.user.id);
  if (!hasAccess) throw new Error("Access denied.");

  const resource = await Resource.create({
    project: new mongoose.Types.ObjectId(projectId),
    creator: new mongoose.Types.ObjectId(session.user.id),
    title: data.title,
    url: data.url,
    category: data.category,
  });

  revalidatePath(`/hub/${projectId}`);
  return { success: true, resourceId: resource._id.toString() };
}

export async function deleteResource(projectId: string, resourceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();
  const hasAccess = await checkTeamAccess(projectId, session.user.id);
  if (!hasAccess) throw new Error("Access denied.");

  const resource = await Resource.findOne({ _id: resourceId, project: projectId });
  if (!resource) throw new Error("Resource not found.");

  // Only project owner or resource creator can delete resource
  const project = await Project.findById(projectId);
  const isOwner = project?.owner.toString() === session.user.id;
  const isCreator = resource.creator.toString() === session.user.id;

  if (!isOwner && !isCreator) {
    throw new Error("You are not authorized to delete this resource.");
  }

  await Resource.findByIdAndDelete(resourceId);

  revalidatePath(`/hub/${projectId}`);
  return { success: true };
}

// EXPENSE TRACKER ACTIONS

export async function addExpense(
  projectId: string,
  data: { title: string; amount: number; category: "Hosting" | "Domain" | "API" | "Tools" | "Other"; date?: string }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();
  const hasAccess = await checkTeamAccess(projectId, session.user.id);
  if (!hasAccess) throw new Error("Access denied.");

  const expense = await Expense.create({
    project: new mongoose.Types.ObjectId(projectId),
    title: data.title,
    amount: data.amount,
    category: data.category,
    date: data.date ? new Date(data.date) : new Date(),
    addedBy: new mongoose.Types.ObjectId(session.user.id),
  });

  revalidatePath(`/hub/${projectId}`);
  return { success: true, expenseId: expense._id.toString() };
}

export async function deleteExpense(projectId: string, expenseId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();
  const hasAccess = await checkTeamAccess(projectId, session.user.id);
  if (!hasAccess) throw new Error("Access denied.");

  const expense = await Expense.findOne({ _id: expenseId, project: projectId });
  if (!expense) throw new Error("Expense record not found.");

  // Only project owner or expense adder can delete it
  const project = await Project.findById(projectId);
  const isOwner = project?.owner.toString() === session.user.id;
  const isCreator = expense.addedBy.toString() === session.user.id;

  if (!isOwner && !isCreator) {
    throw new Error("You are not authorized to delete this expense.");
  }

  await Expense.findByIdAndDelete(expenseId);

  revalidatePath(`/hub/${projectId}`);
  return { success: true };
}
