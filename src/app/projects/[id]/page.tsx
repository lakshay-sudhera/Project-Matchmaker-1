import React from "react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Project, TeamMember, Application, Review } from "@/lib/models";
import ProjectDetailClient from "./ProjectDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  
  await connectToDatabase();

  // Find the project and populate owner
  const project: any = await Project.findById(id).populate("owner", "name username image");
  if (!project) {
    notFound();
  }

  // Fetch current members
  const rawMembers = await TeamMember.find({ project: id })
    .populate("user", "name username image skills");

  const members = rawMembers.map((m: any) => ({
    user: {
      _id: m.user._id.toString(),
      name: m.user.name,
      username: m.user.username,
      image: m.user.image,
      skills: m.user.skills || [],
    },
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
  }));

  // Check if owner
  const isOwner = session?.user?.id === project.owner._id.toString();

  // Fetch pending applications if owner
  let applications: any[] = [];
  if (isOwner) {
    const rawApps = await Application.find({ project: id, status: "Pending" })
      .populate("user", "name username image");

    applications = rawApps.map((a: any) => ({
      _id: a._id.toString(),
      user: {
        _id: a.user._id.toString(),
        name: a.user.name,
        username: a.user.username,
        image: a.user.image,
      },
      message: a.message,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  // Fetch existing application if regular logged in user
  let existingApplication = null;
  if (session?.user?.id && !isOwner) {
    const app = await Application.findOne({ project: id, user: session.user.id });
    if (app) {
      existingApplication = {
        _id: app._id.toString(),
        status: app.status,
      };
    }
  }

  // Fetch reviews written by the active user for this project
  let reviewsWritten: string[] = [];
  if (session?.user?.id && project.status === "Completed") {
    const written = await Review.find({
      project: id,
      reviewer: session.user.id,
    }).select("reviewee");
    reviewsWritten = written.map((r: any) => r.reviewee.toString());
  }

  // Format project payload for client
  const formattedProject = {
    _id: project._id.toString(),
    title: project.title,
    description: project.description,
    category: project.category,
    requiredSkills: project.requiredSkills,
    requiredRoles: project.requiredRoles,
    maxTeamSize: project.maxTeamSize,
    status: project.status,
    owner: {
      _id: project.owner._id.toString(),
      name: project.owner.name,
      username: project.owner.username,
      image: project.owner.image,
    },
  };

  const currentUser = session?.user
    ? {
        id: session.user.id!,
        name: session.user.name || "",
        username: (session.user as any).username || "",
        image: session.user.image || undefined,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Detail header */}
      <div className="border-b border-zinc-900 pb-5">
        <h1 className="text-3xl font-black tracking-tight text-zinc-150 mb-2">{formattedProject.title}</h1>
        <p className="text-xs text-zinc-500">
          Category: <span className="text-zinc-400 font-semibold">{formattedProject.category}</span>
        </p>
      </div>

      <ProjectDetailClient
        project={formattedProject as any}
        currentUser={currentUser}
        members={members}
        applications={applications}
        existingApplication={existingApplication}
        reviewsWritten={reviewsWritten}
      />
    </div>
  );
}
