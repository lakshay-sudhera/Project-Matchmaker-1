"use server";

import { revalidatePath } from "next/cache";
import { auth, signIn } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { User, Review, TeamMember, Project } from "@/lib/models";
import mongoose from "mongoose";

// Update profile availability, skills, roles, bio
export async function updateProfile(data: {
  bio?: string;
  availability: "Available" | "Busy" | "Looking for Team" | "Looking for Projects";
  skills: string[];
  roles: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectToDatabase();

  const user = await User.findById(session.user.id);
  if (!user) throw new Error("User not found");

  if (data.bio !== undefined) user.bio = data.bio;
  user.availability = data.availability;
  user.skills = data.skills;
  user.roles = data.roles;

  await user.save();

  revalidatePath(`/profile/${user.username}`);
  revalidatePath("/dashboard");

  return { success: true };
}

// Recalculate Trust Score of a user
export async function recalculateUserTrustScore(userId: string) {
  await connectToDatabase();

  const reviews = await Review.find({ reviewee: userId });
  
  // Find projects the user was a team member of that are "Completed"
  const memberProjects = await TeamMember.find({ user: userId }).distinct("project");
  const completedProjectsCount = await Project.countDocuments({
    _id: { $in: memberProjects },
    status: "Completed",
  });

  let avgRating = 5; // Start with default maximum
  if (reviews.length > 0) {
    let sum = 0;
    reviews.forEach((r: any) => {
      sum += (r.communication + r.technicalSkills + r.reliability + r.teamwork) / 4;
    });
    avgRating = sum / reviews.length;
  }

  // Weightings:
  // - 80% weight from peer reviews (avgRating out of 5)
  // - 20% weight from completed projects (each completed project gives +4%, max 20% at 5 projects)
  const ratingWeight = (avgRating / 5) * 80;
  const projectWeight = Math.min(completedProjectsCount * 4, 20);

  const trustScore = Math.max(0, Math.min(100, Math.round(ratingWeight + projectWeight)));

  await User.findByIdAndUpdate(userId, {
    trustScore,
    completedProjects: completedProjectsCount,
    ratingCount: reviews.length,
  });
}

// Submit a Peer Review
export async function submitReview(
  projectId: string,
  revieweeId: string,
  ratings: { communication: number; technicalSkills: number; reliability: number; teamwork: number },
  comment: string = ""
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (session.user.id === revieweeId) {
    throw new Error("You cannot review yourself.");
  }

  await connectToDatabase();

  // Validate that the project is Completed
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");
  if (project.status !== "Completed") {
    throw new Error("Reviews can only be submitted for completed projects.");
  }

  // Validate that both reviewer and reviewee were members of the project team
  const reviewerMember = await TeamMember.findOne({ project: projectId, user: session.user.id });
  const revieweeMember = await TeamMember.findOne({ project: projectId, user: revieweeId });
  const isReviewerOwner = project.owner.toString() === session.user.id;
  const isRevieweeOwner = project.owner.toString() === revieweeId;

  if ((!reviewerMember && !isReviewerOwner) || (!revieweeMember && !isRevieweeOwner)) {
    throw new Error("Both the reviewer and the reviewee must be part of the project team.");
  }

  // Check if reviewer has already reviewed this user for this project
  const existingReview = await Review.findOne({
    project: projectId,
    reviewer: session.user.id,
    reviewee: revieweeId,
  });

  if (existingReview) {
    throw new Error("You have already reviewed this teammate for this project.");
  }

  // Save new review
  await Review.create({
    project: new mongoose.Types.ObjectId(projectId),
    reviewer: new mongoose.Types.ObjectId(session.user.id),
    reviewee: new mongoose.Types.ObjectId(revieweeId),
    communication: ratings.communication,
    technicalSkills: ratings.technicalSkills,
    reliability: ratings.reliability,
    teamwork: ratings.teamwork,
    comment,
  });

  // Re-calculate the trust score for the reviewee
  await recalculateUserTrustScore(revieweeId);

  revalidatePath(`/profile/${(await User.findById(revieweeId))?.username}`);
  revalidatePath(`/projects/${projectId}`);

  return { success: true };
}

export async function reconnectGithub() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email });
  const username = user?.username || "me";

  await signIn("github", { redirectTo: `/profile/${username}` });
}
