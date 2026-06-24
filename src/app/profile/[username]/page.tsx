import React from "react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { User, Review } from "@/lib/models";
import ProfileClient from "./ProfileClient";
import { fetchGithubContributions } from "@/lib/github";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const session = await auth();

  await connectToDatabase();

  // Find User by username (case-insensitive search)
  const userDoc = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, "i") } }).select("+githubAccessToken");
  if (!userDoc) {
    notFound();
  }

  // Fetch the fresh contributions count from GitHub and update DB if changed
  try {
    const freshContributions = await fetchGithubContributions(userDoc.username);
    if (freshContributions > 0 && freshContributions !== userDoc.contributionCount) {
      userDoc.contributionCount = freshContributions;
      await userDoc.save();
    }
  } catch (err) {
    console.error("Failed to sync contributions on profile load:", err);
  }

  // Fetch reviews for this user, populate reviewer profile and project details
  const rawReviews = await Review.find({ reviewee: userDoc._id })
    .populate("reviewer", "name username image")
    .populate("project", "title")
    .sort({ createdAt: -1 });

  const reviews = rawReviews.map((r: any) => ({
    _id: r._id.toString(),
    communication: r.communication,
    technicalSkills: r.technicalSkills,
    reliability: r.reliability,
    teamwork: r.teamwork,
    comment: r.comment || "",
    createdAt: r.createdAt,
    reviewer: {
      name: r.reviewer.name,
      username: r.reviewer.username,
      image: r.reviewer.image,
    },
    project: r.project
      ? {
          title: r.project.title,
        }
      : undefined,
  }));

  const formattedUser = {
    _id: userDoc._id.toString(),
    name: userDoc.name,
    username: userDoc.username,
    email: userDoc.email,
    image: userDoc.image,
    bio: userDoc.bio || "",
    githubUrl: userDoc.githubUrl || "",
    hasGithubAccessToken: !!userDoc.githubAccessToken,
    publicRepos: userDoc.publicRepos.map((repo: any) => ({
      name: repo.name,
      description: repo.description || "",
      htmlUrl: repo.htmlUrl,
      stars: repo.stars || 0,
      language: repo.language || "",
    })),
    languages: userDoc.languages || [],
    contributionCount: userDoc.contributionCount || 0,
    skills: userDoc.skills || [],
    roles: userDoc.roles || [],
    availability: userDoc.availability,
    trustScore: userDoc.trustScore,
    completedProjects: userDoc.completedProjects,
    ratingCount: userDoc.ratingCount,
  };

  const currentUser = session?.user
    ? {
        id: session.user.id!,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-900 pb-5">
        <h1 className="text-3xl font-black tracking-tight text-zinc-150 mb-2">Developer Profile</h1>
        <p className="text-xs text-zinc-500">
          Showing profile overview and teammate endorsements for <span className="text-zinc-400 font-semibold">@{formattedUser.username}</span>
        </p>
      </div>

      <ProfileClient
        user={formattedUser as any}
        currentUser={currentUser}
        reviews={reviews}
      />
    </div>
  );
}
