import React from "react";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Project, TeamMember, Task, Expense, Resource, Discussion, DiscussionReply, Hub } from "@/lib/models";
import WorkspaceHubClient from "./WorkspaceHubClient";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function HubPage({ params }: Props) {
  const { projectId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const userId = session.user.id;
  await connectToDatabase();

  // Validate Project exists
  const project = await Project.findById(projectId);
  if (!project) {
    notFound();
  }

  // Validate private workspace authorization
  const isMember = await TeamMember.findOne({ project: projectId, user: userId });
  const isOwner = project.owner.toString() === userId;

  if (!isMember && !isOwner) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-8 text-center max-w-md mx-auto my-12 space-y-4">
        <h2 className="text-lg font-bold text-rose-400">Access Denied</h2>
        <p className="text-xs text-zinc-400">
          This workspace is private. Only accepted team members of the project <span className="font-semibold text-zinc-200">"{project.title}"</span> are allowed access.
        </p>
      </div>
    );
  }

  // Fetch Team Members
  const rawMembers = await TeamMember.find({ project: projectId }).populate("user", "name username image");
  
  const members = rawMembers.map((m: any) => ({
    _id: m.user._id.toString(),
    name: m.user.name,
    username: m.user.username,
    image: m.user.image || undefined,
  }));

  // Fetch Kanban Tasks
  const rawTasks = await Task.find({ project: projectId })
    .populate("assignee", "name username image")
    .sort({ createdAt: -1 });

  const initialTasks = rawTasks.map((t: any) => ({
    _id: t._id.toString(),
    title: t.title,
    description: t.description || "",
    status: t.status,
    assignee: t.assignee
      ? {
          _id: t.assignee._id.toString(),
          name: t.assignee.name,
          username: t.assignee.username,
          image: t.assignee.image || undefined,
        }
      : undefined,
    dueDate: t.dueDate ? t.dueDate.toISOString() : undefined,
    completed: t.completed || false,
  }));

  // Fetch Expenses
  const rawExpenses = await Expense.find({ project: projectId })
    .populate("addedBy", "name username")
    .sort({ date: -1 });

  const initialExpenses = rawExpenses.map((e: any) => ({
    _id: e._id.toString(),
    title: e.title,
    amount: e.amount,
    category: e.category,
    date: e.date.toISOString(),
    addedBy: {
      name: e.addedBy.name,
      username: e.addedBy.username,
    },
  }));

  // Fetch Resources
  const rawResources = await Resource.find({ project: projectId })
    .populate("creator", "name")
    .sort({ createdAt: -1 });

  const initialResources = rawResources.map((r: any) => ({
    _id: r._id.toString(),
    title: r.title,
    url: r.url,
    category: r.category,
    creator: {
      _id: r.creator._id.toString(),
      name: r.creator.name,
    },
  }));

  // Fetch Discussions
  const rawDiscussions = await Discussion.find({ project: projectId })
    .populate("creator", "name username image")
    .sort({ createdAt: -1 });

  const initialDiscussions = await Promise.all(
    rawDiscussions.map(async (d: any) => {
      // Fetch replies for this discussion thread
      const rawReplies = await DiscussionReply.find({ discussion: d._id })
        .populate("creator", "name username image")
        .sort({ createdAt: 1 });

      const replies = rawReplies.map((r: any) => ({
        _id: r._id.toString(),
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        creator: {
          name: r.creator.name,
          username: r.creator.username,
          image: r.creator.image || undefined,
        },
      }));

      return {
        _id: d._id.toString(),
        title: d.title,
        content: d.content,
        createdAt: d.createdAt.toISOString(),
        creator: {
          _id: d.creator._id.toString(),
          name: d.creator.name,
          username: d.creator.username,
          image: d.creator.image || undefined,
        },
        replies,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-900 pb-5">
        <h1 className="text-3xl font-black tracking-tight text-zinc-150 mb-2">Team Hub Workspace</h1>
        <p className="text-xs text-zinc-500">
          Manage tasks, discuss topics, track shared budgets, share reference links, and chat in real-time.
        </p>
      </div>

      <WorkspaceHubClient
        projectId={projectId}
        projectTitle={project.title}
        projectOwnerId={project.owner.toString()}
        currentUserId={userId}
        currentUserImage={session.user.image || undefined}
        currentUserName={session.user.name || undefined}
        members={members}
        initialTasks={initialTasks as any}
        initialExpenses={initialExpenses as any}
        initialResources={initialResources as any}
        initialDiscussions={initialDiscussions}
      />
    </div>
  );
}
