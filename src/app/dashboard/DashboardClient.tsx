"use client";

import React, { useState } from "react";
import { respondToInvitation } from "@/lib/actions/memberActions";
import RecommendationCard from "@/components/RecommendationCard";
import ProjectCard from "@/components/ProjectCard";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { Folder, Users, Star, Sparkles, Inbox, Send, Layout, Check, X, ArrowRight, Loader2, Award } from "lucide-react";

interface DashboardClientProps {
  ownedProjects: any[];
  memberProjects: any[];
  myApplications: any[];
  myInvitations: any[];
  aiRecommendations: {
    projectId: string;
    projectTitle: string;
    recommendations: {
      recommendation: {
        userId: string;
        matchScore: number;
        reasons: string[];
      };
      candidate: {
        _id: string;
        name: string;
        username: string;
        image?: string;
        skills: string[];
        roles: string[];
      };
    }[];
  }[];
}

export default function DashboardClient({
  ownedProjects,
  memberProjects,
  myApplications,
  myInvitations: initialInvitations,
  aiRecommendations,
}: DashboardClientProps) {
  const [invitations, setInvitations] = useState(initialInvitations);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"projects" | "applications" | "recommendations">("projects");

  // Handle Respond to Invitation (Accept / Decline)
  const handleRespondToInvite = async (inviteId: string, decision: "Accepted" | "Declined") => {
    setActionLoading(inviteId);
    try {
      const res = await respondToInvitation(inviteId, decision);
      if (res.success) {
        setInvitations((prev) => prev.filter((i) => i._id !== inviteId));
      }
    } catch (e: any) {
      alert(e.message || "Failed to respond to invitation.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-10">
      
      {/* 1. TOP STATS & RECEIVED INVITATIONS BANNER */}
      {invitations.length > 0 && (
        <section className="rounded-2xl border border-violet-500/20 bg-violet-950/10 p-6 backdrop-blur space-y-4">
          <h2 className="text-sm font-bold text-violet-400 flex items-center gap-1.5">
            <Inbox className="h-4.5 w-4.5" /> Pending Team Invitations ({invitations.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invitations.map((invite) => (
              <div
                key={invite._id}
                className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Project Invitation</span>
                  <h3 className="text-sm font-bold text-zinc-200">{invite.project.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span>Sent by:</span>
                    <span className="font-semibold text-zinc-350">{invite.sender.name}</span>
                    <span className="text-zinc-500">(@{invite.sender.username})</span>
                  </div>
                  <p className="text-xs text-zinc-450 italic bg-zinc-900/40 p-2.5 rounded border border-zinc-900 mt-1">
                    "{invite.message}"
                  </p>
                </div>

                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleRespondToInvite(invite._id, "Declined")}
                    disabled={actionLoading === invite._id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-rose-400 px-3 py-1.5 text-[11px] font-semibold transition"
                  >
                    <X className="h-3.5 w-3.5" /> Decline
                  </button>
                  <button
                    onClick={() => handleRespondToInvite(invite._id, "Accepted")}
                    disabled={actionLoading === invite._id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white px-3.5 py-1.5 text-[11px] font-semibold shadow transition"
                  >
                    <Check className="h-3.5 w-3.5" /> Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. NAVIGATION TABS */}
      <div className="border-b border-zinc-900 pb-1 flex gap-2">
        {(["projects", "applications", "recommendations"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab)}
            className={`px-4 py-2.5 text-xs font-bold capitalize transition border-b-2 -mb-[3px] ${
              activeSection === tab
                ? "border-violet-500 text-violet-400"
                : "border-transparent text-zinc-550 hover:text-zinc-300"
            }`}
          >
            {tab === "projects" && "My Projects"}
            {tab === "applications" && "Sent Applications"}
            {tab === "recommendations" && "AI Candidate Recs"}
          </button>
        ))}
      </div>

      {/* 3. GRID CONTENT SECTIONS */}
      <div>
        
        {/* TAB A: MY PROJECTS */}
        {activeSection === "projects" && (
          <div className="space-y-10">
            {/* Owned Projects */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-extrabold text-zinc-200">Projects Owned ({ownedProjects.length})</h2>
                <Link
                  href="/projects/create"
                  className="text-xs text-violet-400 font-semibold hover:underline"
                >
                  + Create New Project
                </Link>
              </div>

              {ownedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ownedProjects.map((p) => (
                    <ProjectCard key={p._id} project={p} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-900 p-8 text-center text-xs text-zinc-550 italic">
                  You don't own any projects yet. Create a project to start matching!
                </div>
              )}
            </div>

            {/* Member Projects */}
            <div className="space-y-4 pt-6 border-t border-zinc-900/60">
              <h2 className="text-base font-extrabold text-zinc-200">Collaborating On ({memberProjects.length})</h2>

              {memberProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {memberProjects.map((p) => (
                    <ProjectCard key={p._id} project={p} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-900 p-8 text-center text-xs text-zinc-550 italic">
                  You are not collaborating on other projects yet. Explore the discovery page to apply!
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB B: SENT APPLICATIONS */}
        {activeSection === "applications" && (
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-zinc-200">My Project Applications ({myApplications.length})</h2>

            {myApplications.length > 0 ? (
              <div className="space-y-4">
                {myApplications.map((app) => (
                  <div
                    key={app._id}
                    className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        {app.project.category}
                      </span>
                      <h3 className="text-sm font-bold text-zinc-200 mt-0.5">
                        <Link href={`/projects/${app.project._id}`} className="hover:text-violet-400 transition-colors">
                          {app.project.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed bg-zinc-900/35 p-2 rounded border border-zinc-900 max-w-lg">
                        "{app.message}"
                      </p>
                    </div>

                    <div className="self-end sm:self-center flex flex-col items-end gap-1.5">
                      <span className="text-[10px] text-zinc-550 font-medium">
                        Sent on {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-900 p-12 text-center text-xs text-zinc-550 italic">
                You haven't submitted any applications. Discover projects and apply to start collaborating!
              </div>
            )}
          </div>
        )}

        {/* TAB C: AI RECOMMENDATIONS */}
        {activeSection === "recommendations" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-base font-extrabold text-zinc-200">AI Matches for Your Projects</h2>
              <p className="text-xs text-zinc-500">Gemini analyzes available users against your project's skills and roles parameters.</p>
            </div>

            {aiRecommendations.length > 0 ? (
              <div className="space-y-10">
                {aiRecommendations.map((projectGroup) => (
                  <div key={projectGroup.projectId} className="space-y-4 pb-8 border-b border-zinc-900/60 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-zinc-350 flex items-center gap-1.5">
                        <Sparkles className="h-4.5 w-4.5 text-violet-400 fill-violet-400/20" />
                        AI Matches for: <span className="text-zinc-150 font-black">"{projectGroup.projectTitle}"</span>
                      </h3>
                    </div>

                    {projectGroup.recommendations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projectGroup.recommendations.map((rec) => (
                          <RecommendationCard
                            key={rec.candidate._id}
                            projectId={projectGroup.projectId}
                            recommendation={rec.recommendation}
                            candidate={rec.candidate}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-zinc-900 p-6 text-center text-xs text-zinc-550 italic">
                        No active candidates matching this project's requirements were found. Keep updating project skills!
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-900 p-12 text-center text-xs text-zinc-550 italic">
                You do not own any active recruiting projects. Create one to unlock AI matching recommendations!
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
