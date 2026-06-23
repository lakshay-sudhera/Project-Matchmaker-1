"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Project, TeamMember, Hub } from "@/lib/models";
import mongoose from "mongoose";

// Create Project
export async function createProject(formData: {
  title: string;
  description: string;
  category: "Hackathon" | "College Project" | "Startup" | "Research" | "Open Source";
  requiredSkills: string[];
  requiredRoles: string[];
  maxTeamSize: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in to create a project.");
  }

  await connectToDatabase();

  const project = await Project.create({
    title: formData.title,
    description: formData.description,
    category: formData.category,
    requiredSkills: formData.requiredSkills,
    requiredRoles: formData.requiredRoles,
    maxTeamSize: formData.maxTeamSize,
    owner: new mongoose.Types.ObjectId(session.user.id),
    status: "Recruiting",
  });

  // Automatically add owner as the first team member
  await TeamMember.create({
    project: project._id,
    user: new mongoose.Types.ObjectId(session.user.id),
    role: "Owner / Project Manager",
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");

  return { success: true, projectId: project._id.toString() };
}

// Update Project Details
export async function updateProject(
  projectId: string,
  formData: {
    title: string;
    description: string;
    category: "Hackathon" | "College Project" | "Startup" | "Research" | "Open Source";
    requiredSkills: string[];
    requiredRoles: string[];
    maxTeamSize: number;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in to edit a project.");
  }

  await connectToDatabase();

  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found.");
  }

  if (project.owner.toString() !== session.user.id) {
    throw new Error("You do not have permission to edit this project.");
  }

  project.title = formData.title;
  project.description = formData.description;
  project.category = formData.category;
  project.requiredSkills = formData.requiredSkills;
  project.requiredRoles = formData.requiredRoles;
  project.maxTeamSize = formData.maxTeamSize;

  await project.save();

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

// Update Project Status
export async function updateProjectStatus(
  projectId: string,
  status: "Recruiting" | "Active" | "Completed" | "Archived"
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in to update status.");
  }

  await connectToDatabase();

  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found.");
  }

  if (project.owner.toString() !== session.user.id) {
    throw new Error("You do not have permission to update this project status.");
  }

  project.status = status;
  await project.save();

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/hub/${projectId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

// Delete Project
export async function deleteProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in to delete a project.");
  }

  await connectToDatabase();

  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found.");
  }

  if (project.owner.toString() !== session.user.id) {
    throw new Error("You do not have permission to delete this project.");
  }

  // Perform cascade deletes
  await TeamMember.deleteMany({ project: projectId });
  await Hub.deleteOne({ project: projectId });
  await Project.findByIdAndDelete(projectId);

  revalidatePath("/projects");
  revalidatePath("/dashboard");

  return { success: true };
}
