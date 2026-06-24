import mongoose from "mongoose";
import { connectToDatabase } from "./db";
import { Notification, Task, User } from "./models";
import { triggerRealtimeNotification } from "./notificationEvents";

interface CreateNotificationParams {
  recipient: string;
  sender?: string;
  type:
    | "PROJECT_INVITATION"
    | "APPLICATION_UPDATE"
    | "APPLICATION_ACCEPTED"
    | "APPLICATION_REJECTED"
    | "CHAT_MESSAGE"
    | "TASK_ASSIGNED"
    | "EXPENSE_ADDED"
    | "DEADLINE_REMINDER"
    | "SYSTEM";
  title: string;
  message: string;
  link: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  metadata?: Record<string, any>;
}

/**
 * Creates and persists a notification in MongoDB, then triggers a real-time Pusher event.
 */
export async function createNotification(params: CreateNotificationParams) {
  await connectToDatabase();

  const notification = await Notification.create({
    recipient: new mongoose.Types.ObjectId(params.recipient),
    sender: params.sender ? new mongoose.Types.ObjectId(params.sender) : undefined,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link,
    priority: params.priority || "LOW",
    metadata: params.metadata || {},
    isRead: false,
  });

  // Populate sender fields so that the client has access to details immediately
  let populatedNotification = notification.toObject();
  if (params.sender) {
    const senderUser = await User.findById(params.sender).select("name username image");
    if (senderUser) {
      populatedNotification.sender = {
        _id: senderUser._id.toString(),
        name: senderUser.name,
        username: senderUser.username,
        image: senderUser.image,
      } as any;
    }
  }

  // Push realtime notification event via Pusher
  await triggerRealtimeNotification(params.recipient, populatedNotification);

  return notification;
}

/**
 * Periodically searches for tasks due in less than 24 hours that are incomplete,
 * notifies the assigned team members, and marks them as reminded to prevent spam.
 */
export async function checkDeadlineReminders() {
  await connectToDatabase();

  const now = new Date();
  const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Find tasks that:
  // - Have a dueDate <= 24 hours from now and >= now (or overdue)
  // - Status is not Completed ("Done")
  // - Has not been marked as completed (completed !== true)
  // - Has an assignee
  // - Has not been reminded already (deadlineReminded !== true)
  const tasks = await Task.find({
    dueDate: { $lte: twentyFourHoursLater, $gte: now },
    status: { $ne: "Done" },
    completed: { $ne: true },
    deadlineReminded: { $ne: true },
    assignee: { $exists: true, $ne: null },
  }).populate("project");

  console.log(`Deadline cron: found ${tasks.length} tasks approaching deadline.`);

  for (const task of tasks) {
    if (!task.assignee) continue;

    const project = task.project as any;
    if (!project) continue;

    const projectId = project._id.toString();
    const projectName = project.title;

    // 1. Mark task as reminded first to ensure we do not create duplicate notifications in race conditions
    task.deadlineReminded = true;
    await task.save();

    // 2. Create and push a high-priority deadline reminder notification
    await createNotification({
      recipient: task.assignee.toString(),
      type: "DEADLINE_REMINDER",
      title: "Task Deadline Approaching",
      message: `Your task "${task.title}" in ${projectName} is due tomorrow`,
      link: `/hub/${projectId}?tab=kanban`,
      priority: "HIGH",
      metadata: {
        projectId,
        taskId: task._id.toString(),
      },
    });

    console.log(`Dispatched deadline reminder to User ${task.assignee} for task "${task.title}"`);
  }
}
