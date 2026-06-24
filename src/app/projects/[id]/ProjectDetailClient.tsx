"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProjectStatus, deleteProject, updateProject } from "@/lib/actions/projectActions";
import { submitReview } from "@/lib/actions/profileActions";
import { applyToProject, respondToApplication, removeTeamMember } from "@/lib/actions/memberActions";
import StatusBadge from "@/components/StatusBadge";
import SkillBadge from "@/components/SkillBadge";
import Link from "next/link";
import { Users, Layout, ShieldAlert, Check, X, FileText, Send, Trash2, LogOut, ArrowRight, Loader2 } from "lucide-react";

interface ProjectDetailClientProps {
  project: {
    _id: string;
    title: string;
    description: string;
    category: string;
    requiredSkills: string[];
    requiredRoles: string[];
    maxTeamSize: number;
    status: "Recruiting" | "Active" | "Completed" | "Archived";
    owner: {
      _id: string;
      name: string;
      username: string;
      image?: string;
    };
  };
  currentUser: {
    id: string;
    name: string;
    username: string;
    image?: string;
  } | null;
  members: {
    user: {
      _id: string;
      name: string;
      username: string;
      image?: string;
      skills: string[];
    };
    role: string;
    joinedAt: string;
  }[];
  applications: {
    _id: string;
    user: {
      _id: string;
      name: string;
      username: string;
      image?: string;
    };
    message: string;
    status: string;
    createdAt: string;
  }[];
  existingApplication: {
    _id: string;
    status: string;
  } | null;
  reviewsWritten?: string[];
}

export default function ProjectDetailClient({
  project,
  currentUser,
  members,
  applications,
  existingApplication,
  reviewsWritten = [],
}: ProjectDetailClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(project.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Apply State
  const [applyMessage, setApplyMessage] = useState("");
  const [applied, setApplied] = useState(!!existingApplication);
  const [appStatus, setAppStatus] = useState(existingApplication?.status || "");
  const [applyError, setApplyError] = useState("");

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(project.title);
  const [editDescription, setEditDescription] = useState(project.description);
  const [editCategory, setEditCategory] = useState<any>(project.category);
  const [editSkills, setEditSkills] = useState(project.requiredSkills.join(", "));
  const [editRoles, setEditRoles] = useState(project.requiredRoles.join(", "));
  const [editMaxTeamSize, setEditMaxTeamSize] = useState(project.maxTeamSize);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDescription.trim()) {
      setEditError("Please fill out all required fields.");
      return;
    }

    setEditLoading(true);
    setEditError("");

    const requiredSkills = editSkills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const requiredRoles = editRoles
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    try {
      const res = await updateProject(project._id, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        requiredSkills,
        requiredRoles: requiredRoles.length > 0 ? requiredRoles : ["Contributor"],
        maxTeamSize: Number(editMaxTeamSize),
      });

      if (res.success) {
        setShowEditModal(false);
        router.refresh();
      }
    } catch (err: any) {
      setEditError(err.message || "Failed to update project.");
    } finally {
      setEditLoading(false);
    }
  };

  // Review State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTeammate, setSelectedTeammate] = useState<{ _id: string; name: string } | null>(null);
  const [ratingComm, setRatingComm] = useState(5);
  const [ratingTech, setRatingTech] = useState(5);
  const [ratingRel, setRatingRel] = useState(5);
  const [ratingTeam, setRatingTeam] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeammate) return;

    setReviewLoading(true);
    setReviewError("");

    try {
      const res = await submitReview(project._id, selectedTeammate._id, {
        communication: Number(ratingComm),
        technicalSkills: Number(ratingTech),
        reliability: Number(ratingRel),
        teamwork: Number(ratingTeam),
      }, reviewComment);

      if (res.success) {
        setShowReviewModal(false);
        setReviewComment("");
        setRatingComm(5);
        setRatingTech(5);
        setRatingRel(5);
        setRatingTeam(5);
        router.refresh();
      }
    } catch (err: any) {
      setReviewError(err.message || "Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

  const isOwner = currentUser?.id === project.owner._id;
  const isMember = members.some((m) => m.user._id === currentUser?.id);

  // Handle Project Status Update
  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value as any;
    setUpdatingStatus(true);
    try {
      const res = await updateProjectStatus(project._id, nextStatus);
      if (res.success) {
        setStatus(nextStatus);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Delete Project
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This will permanently wipe all discussions, chats, tasks and resources.")) return;
    setDeleting(true);
    try {
      const res = await deleteProject(project._id);
      if (res.success) {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  // Handle Application Submit
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyMessage.trim()) return;

    setActionLoading("apply");
    setApplyError("");
    try {
      const res = await applyToProject(project._id, applyMessage);
      if (res.success) {
        setApplied(true);
        setAppStatus("Pending");
      }
    } catch (err: any) {
      setApplyError(err.message || "Failed to apply.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Manage Application (Accept / Reject)
  const handleRespondToApp = async (appId: string, decision: "Accepted" | "Rejected") => {
    setActionLoading(appId);
    try {
      const res = await respondToApplication(appId, decision);
      if (res.success) {
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || "Failed to manage application.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Leave Team
  const handleLeaveTeam = async () => {
    if (!confirm("Are you sure you want to leave this project team?")) return;
    setActionLoading("leave");
    try {
      const res = await removeTeamMember(project._id, currentUser!.id);
      if (res.success) {
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || "Failed to leave team.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Kick Member
  const handleKickMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this team?`)) return;
    setActionLoading(memberId);
    try {
      const res = await removeTeamMember(project._id, memberId);
      if (res.success) {
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || "Failed to remove member.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT COLUMN: Project Details & Applicant Submissions */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Project Description Box */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur">
          <h2 className="text-lg font-bold text-zinc-200 mb-4">Project Description</h2>
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">{project.description}</p>
        </div>

        {/* OWNER PANEL: Manage Applications */}
        {isOwner && (
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur space-y-6">
            <h2 className="text-lg font-bold text-zinc-200">Pending Applications ({applications.length})</h2>
            
            <div className="space-y-4">
              {applications.length > 0 ? (
                applications.map((app) => (
                  <div key={app._id} className="border border-zinc-900 bg-zinc-900/20 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {app.user.image ? (
                          <img src={app.user.image} alt={app.user.name} className="h-6 w-6 rounded-full" />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                            {app.user.name[0]}
                          </div>
                        )}
                        <div>
                          <Link href={`/profile/${app.user.username}`} className="text-xs font-bold text-zinc-200 hover:text-violet-400">
                            {app.user.name}
                          </Link>
                          <span className="text-[10px] text-zinc-500 font-medium ml-1">@{app.user.username}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 italic bg-zinc-950/40 rounded p-2 border border-zinc-900">
                        "{app.message}"
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 self-end md:self-center">
                      <button
                        onClick={() => handleRespondToApp(app._id, "Rejected")}
                        disabled={actionLoading === app._id}
                        className="inline-flex items-center gap-1 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:text-rose-400 px-3 py-1.5 text-[11px] font-semibold text-zinc-400"
                      >
                        <X className="h-3 w-3" /> Decline
                      </button>
                      <button
                        onClick={() => handleRespondToApp(app._id, "Accepted")}
                        disabled={actionLoading === app._id}
                        className="inline-flex items-center gap-1 rounded bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-[11px] font-semibold text-white"
                      >
                        <Check className="h-3 w-3" /> Accept
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-zinc-500 italic text-center p-4 border border-dashed border-zinc-900 rounded-xl">
                  No pending applications at the moment.
                </div>
              )}
            </div>
          </div>
        )}

        {/* LOGGED IN NON-MEMBER PANEL: Apply Section */}
        {currentUser && !isOwner && !isMember && (
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur">
            <h2 className="text-lg font-bold text-zinc-200 mb-4">Apply to Join</h2>
            
            {applied ? (
              <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-200">Application Submitted</p>
                  <p className="text-xs text-zinc-500">Your request is currently being reviewed by the owner.</p>
                </div>
                <div className="text-xs">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full font-bold border ${
                    appStatus === "Accepted"
                      ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40"
                      : appStatus === "Rejected"
                      ? "bg-rose-950/40 text-rose-300 border-rose-800/40"
                      : "bg-amber-950/40 text-amber-300 border-amber-800/40"
                  }`}>
                    {appStatus}
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                {applyError && (
                  <div className="rounded bg-rose-500/10 border border-rose-500/25 p-2 text-rose-400 text-xs flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4" />
                    <span>{applyError}</span>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Introduction Message</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your relevant skills, past project experience, and why you are interested in joining this project..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading === "apply"}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-xs font-bold text-white shadow disabled:opacity-50"
                >
                  {actionLoading === "apply" ? "Sending..." : "Submit Application"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* VISITOR PANEL */}
        {!currentUser && (
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur text-center space-y-4">
            <h2 className="text-lg font-bold text-zinc-200">Want to join this project?</h2>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">Log in with your GitHub account to submit applications, get recommendations, and access team hubs.</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-bold text-white shadow"
            >
              Sign In to Apply
            </Link>
          </div>
        )}

      </div>

      {/* RIGHT COLUMN: Project Info Sidebar */}
      <div className="space-y-8">
        
        {/* Info panel */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur space-y-6">
          
          {/* Category & Status */}
          <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Project Status</span>
              <div className="mt-1">
                <StatusBadge status={status} />
              </div>
            </div>
            {isOwner ? (
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Change Status</span>
                <select
                  className="block mt-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
                  value={status}
                  onChange={handleStatusChange}
                  disabled={updatingStatus}
                >
                  <option value="Recruiting">Recruiting</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            ) : null}
          </div>

          {/* Workspace access if Member */}
          {(isMember || isOwner) && (
            <div className="border-b border-zinc-900 pb-4">
              {members.length >= 2 ? (
                <Link
                  href={`/hub/${project._id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-xs font-bold text-white shadow hover:scale-[1.01] transition-all"
                >
                  <Layout className="h-4 w-4" /> Go to Workspace Hub
                </Link>
              ) : (
                <div className="bg-zinc-900/40 rounded-xl p-3 border border-zinc-900 text-[10px] text-zinc-500 leading-relaxed">
                  Workspace Hub is locked. It will automatically unlock as soon as at least 2 accepted members are on the team.
                </div>
              )}
            </div>
          )}

          {/* Owner details */}
          <div className="border-b border-zinc-900 pb-4">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">Project Owner</span>
            <div className="flex items-center gap-2.5">
              {project.owner.image ? (
                <img src={project.owner.image} alt={project.owner.name} className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">
                  {project.owner.name[0]}
                </div>
              )}
              <div>
                <Link href={`/profile/${project.owner.username}`} className="text-xs font-bold text-zinc-200 hover:text-violet-400">
                  {project.owner.name}
                </Link>
                <p className="text-[10px] text-zinc-500">@{project.owner.username}</p>
              </div>
            </div>
          </div>

          {/* Team capacity info */}
          <div className="border-b border-zinc-900 pb-4">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">Team Capacity</span>
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-semibold">
              <Users className="h-4 w-4 text-zinc-500" />
              <span>{members.length} / {project.maxTeamSize} Members</span>
            </div>
          </div>

          {/* Skills Required */}
          <div className="border-b border-zinc-900 pb-4">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">Skills Required</span>
            <div className="flex flex-wrap gap-1.5">
              {project.requiredSkills.map((skill, index) => (
                <SkillBadge key={index} skill={skill} />
              ))}
            </div>
          </div>

          {/* Actions panel */}
          {currentUser && (isOwner || isMember) ? (
            <div className="pt-2">
              {isOwner ? (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-xs font-bold text-white shadow transition-all duration-200"
                  >
                    Edit Project Details
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-rose-400 px-4 py-2.5 text-xs font-semibold transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Project
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLeaveTeam}
                  disabled={actionLoading === "leave"}
                  className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-rose-400 px-4 py-2.5 text-xs font-semibold"
                >
                  <LogOut className="h-4 w-4" /> Leave Project Team
                </button>
              )}
            </div>
          ) : null}

        </div>

        {/* Team Members List */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur space-y-4">
          <h3 className="text-sm font-bold text-zinc-300">Team Members ({members.length})</h3>
          
          <div className="space-y-3">
            {members.map((member) => {
              const isMemOwner = member.user._id === project.owner._id;
              return (
                <div key={member.user._id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    {member.user.image ? (
                      <img src={member.user.image} alt={member.user.name} className="h-6.5 w-6.5 rounded-full object-cover" />
                    ) : (
                      <div className="h-6.5 w-6.5 bg-zinc-800 text-[10px] font-bold text-zinc-400 rounded-full flex items-center justify-center">
                        {member.user.name[0]}
                      </div>
                    )}
                    <div>
                      <Link href={`/profile/${member.user.username}`} className="font-bold text-zinc-350 hover:text-violet-400">
                        {member.user.name}
                      </Link>
                      <p className="text-[9px] text-zinc-500 font-semibold">{member.role}</p>
                    </div>
                  </div>

                  {status === "Completed" && currentUser && (isOwner || isMember) && member.user._id !== currentUser.id ? (
                    reviewsWritten.includes(member.user._id) ? (
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded">
                        Reviewed
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedTeammate({ _id: member.user._id, name: member.user.name });
                          setShowReviewModal(true);
                        }}
                        className="text-[10px] font-bold text-violet-400 bg-violet-950/20 border border-violet-900/40 hover:bg-violet-600 hover:text-white px-2.5 py-1 rounded transition-all duration-200"
                      >
                        Review
                      </button>
                    )
                  ) : (
                    <>
                      {isOwner && !isMemOwner ? (
                        <button
                          onClick={() => handleKickMember(member.user._id, member.user.name)}
                          disabled={actionLoading === member.user._id}
                          className="text-[9px] font-bold text-zinc-500 hover:text-rose-400 border border-transparent hover:border-rose-500/20 hover:bg-rose-500/5 px-2 py-0.5 rounded transition"
                        >
                          Kick
                        </button>
                      ) : isMemOwner ? (
                        <span className="text-[9px] font-bold text-violet-400 bg-violet-950/30 border border-violet-900/30 rounded px-1.5 py-0.2">PM</span>
                      ) : null}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* EDIT PROJECT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-base font-bold text-zinc-150">Edit Project Details</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-zinc-500 hover:text-zinc-300 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="rounded bg-rose-500/10 border border-rose-500/25 p-3 text-rose-400 text-xs flex items-center gap-1.5">
                <ShieldAlert className="h-4.5 w-4.5 animate-pulse" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Project Title *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Description *</label>
                <textarea
                  required
                  rows={4}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                  <select
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="College Project">College Project</option>
                    <option value="Startup">Startup Idea</option>
                    <option value="Research">Research Collaboration</option>
                    <option value="Open Source">Open-Source Contribution</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Max Team Size</label>
                  <input
                    type="number"
                    min={2}
                    max={12}
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
                    value={editMaxTeamSize}
                    onChange={(e) => setEditMaxTeamSize(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Open Roles (Comma separated)</label>
                <input
                  type="text"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
                  value={editRoles}
                  onChange={(e) => setEditRoles(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-850 text-xs font-semibold text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {editLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW TEAMMATE MODAL */}
      {showReviewModal && selectedTeammate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-base font-bold text-zinc-150">Review Teammate: {selectedTeammate.name}</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-zinc-500 hover:text-zinc-300 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reviewError && (
              <div className="rounded bg-rose-500/10 border border-rose-500/25 p-3 text-rose-400 text-xs flex items-center gap-1.5">
                <ShieldAlert className="h-4.5 w-4.5 animate-pulse" />
                <span>{reviewError}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <p className="text-xs text-zinc-500">Provide teammate feedback from 1 (poor) to 5 (excellent). This recalculates their global Trust Score.</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 font-medium">Communication</span>
                  <select
                    className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
                    value={ratingComm}
                    onChange={(e) => setRatingComm(Number(e.target.value))}
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Fair</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 font-medium">Technical Capability</span>
                  <select
                    className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
                    value={ratingTech}
                    onChange={(e) => setRatingTech(Number(e.target.value))}
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Fair</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 font-medium">Reliability & Execution</span>
                  <select
                    className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
                    value={ratingRel}
                    onChange={(e) => setRatingRel(Number(e.target.value))}
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Fair</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 font-medium">Teamwork & Collaboration</span>
                  <select
                    className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
                    value={ratingTeam}
                    onChange={(e) => setRatingTeam(Number(e.target.value))}
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Fair</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Written Teammate Endorsement</label>
                <textarea
                  placeholder="e.g. John was extremely helpful, responsive, and completed the backend routing on schedule..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-850 text-xs font-semibold text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {reviewLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
