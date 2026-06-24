import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Project, TeamMember, Application, Invitation, User } from "@/lib/models";
import { getRecommendations } from "@/lib/aiconfig";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  await connectToDatabase();

  const userId = session.user.id;

  // 1. Fetch Owned Projects
  const ownedDocs = await Project.find({ owner: userId }).sort({ createdAt: -1 });
  
  const ownedProjects = await Promise.all(
    ownedDocs.map(async (p: any) => {
      const memberCount = await TeamMember.countDocuments({ project: p._id });
      const doc = p.toObject() as any;
      return {
        ...doc,
        _id: doc._id.toString(),
        owner: {
          name: session?.user?.name || "",
          username: (session?.user as any)?.username || "",
          image: session?.user?.image,
        },
        memberCount,
      };
    })
  );

  // 2. Fetch Collaborative Projects (Where user is a member, but not owner)
  const memberRecords = await TeamMember.find({ user: userId }).populate({
    path: "project",
    populate: { path: "owner", select: "name username image" },
  });

  const memberProjectsFiltered = memberRecords.filter((m: any) => m.project && m.project.owner._id.toString() !== userId);
  
  const memberProjects = await Promise.all(
    memberProjectsFiltered.map(async (m: any) => {
      const p = m.project;
      const memberCount = await TeamMember.countDocuments({ project: p._id });
      const doc = p.toObject() as any;
      return {
        ...doc,
        _id: doc._id.toString(),
        owner: {
          name: doc.owner.name,
          username: doc.owner.username,
          image: doc.owner.image,
        },
        memberCount,
      };
    })
  );

  // 3. Fetch Sent Applications
  const appDocs = await Application.find({ user: userId })
    .populate("project", "title category status")
    .sort({ createdAt: -1 });

  const myApplications = appDocs
    .filter((a: any) => a.project)
    .map((a: any) => ({
      _id: a._id.toString(),
      message: a.message,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
      project: {
        _id: a.project._id.toString(),
        title: a.project.title,
        category: a.project.category,
        status: a.project.status,
      },
    }));

  // 4. Fetch Received Invitations
  const inviteDocs = await Invitation.find({ receiver: userId, status: "Pending" })
    .populate("project", "title")
    .populate("sender", "name username");

  const myInvitations = inviteDocs
    .filter((i: any) => i.project && i.sender)
    .map((i: any) => ({
      _id: i._id.toString(),
      message: i.message,
      createdAt: i.createdAt.toISOString(),
      project: {
        _id: i.project._id.toString(),
        title: i.project.title,
      },
      sender: {
        name: i.sender.name,
        username: i.sender.username,
      },
    }));

  // 5. Fetch AI Recommendations for Recruiting projects
  const recruitingProjects = ownedProjects.filter((p: any) => p.status === "Recruiting");
  
  const aiRecommendations = await Promise.all(
    recruitingProjects.map(async (project: any) => {
      try {
        const recommendations = await getRecommendations(project._id);
        
        // Map scores to candidate profile details (limit to 3 recommendations per project)
        const populatedRecommendations = await Promise.all(
          recommendations.slice(0, 3).map(async (rec) => {
            const candidateDoc = await User.findById(rec.userId).select("name username image skills roles");
            if (!candidateDoc) return null;
            return {
              recommendation: rec,
              candidate: {
                _id: candidateDoc._id.toString(),
                name: candidateDoc.name,
                username: candidateDoc.username,
                image: candidateDoc.image || undefined,
                skills: candidateDoc.skills,
                roles: candidateDoc.roles,
              },
            };
          })
        );

        return {
          projectId: project._id,
          projectTitle: project.title,
          recommendations: populatedRecommendations.filter((r) => r !== null) as any[],
        };
      } catch (err) {
        console.error(`AI match scoring error for project ${project._id}:`, err);
        return {
          projectId: project._id,
          projectTitle: project.title,
          recommendations: [],
        };
      }
    })
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-900 pb-5">
        <h1 className="text-3xl font-black tracking-tight text-zinc-150 mb-2">My Workspace Dashboard</h1>
        <p className="text-xs text-zinc-500">
          Monitor your projects, applications, received invitations, and view AI developer recommendations.
        </p>
      </div>

      <DashboardClient
        ownedProjects={ownedProjects}
        memberProjects={memberProjects}
        myApplications={myApplications}
        myInvitations={myInvitations}
        aiRecommendations={aiRecommendations}
      />
    </div>
  );
}
