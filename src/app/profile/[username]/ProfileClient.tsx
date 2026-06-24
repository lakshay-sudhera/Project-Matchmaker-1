"use client";

import React, { useState } from "react";
import { updateProfile } from "@/lib/actions/profileActions";
import SkillBadge from "@/components/SkillBadge";
import ReviewCard from "@/components/ReviewCard";
import { User, Mail, BookOpen, AlertCircle, Edit3, Save, Check, Award, Code, Activity } from "lucide-react";
import { toast } from "sonner";

interface ProfileClientProps {
  user: {
    _id: string;
    name: string;
    username: string;
    email: string;
    image?: string;
    bio?: string;
    githubUrl?: string;
    publicRepos: {
      name: string;
      description?: string;
      htmlUrl: string;
      stars: number;
      language?: string;
    }[];
    languages: string[];
    contributionCount: number;
    skills: string[];
    roles: string[];
    availability: "Available" | "Busy" | "Looking for Team" | "Looking for Projects";
    trustScore: number;
    completedProjects: number;
    ratingCount: number;
  };
  currentUser: {
    id: string;
  } | null;
  reviews: any[];
}

export default function ProfileClient({ user, currentUser, reviews }: ProfileClientProps) {
  const isMe = currentUser?.id === user._id;

  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState(user.bio || "");
  const [availability, setAvailability] = useState(user.availability);
  const [skills, setSkills] = useState(user.skills.join(", "));
  const [roles, setRoles] = useState(user.roles.join(", "));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [localAvailability, setLocalAvailability] = useState(user.availability);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  const handleQuickAvailabilityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextVal = e.target.value as any;
    setLocalAvailability(nextVal);
    setAvailability(nextVal);
    setUpdatingAvailability(true);
    try {
      await updateProfile({
        availability: nextVal,
        skills: user.skills,
        roles: user.roles,
        bio: user.bio,
      });
      toast.success(`Availability updated to "${nextVal}"!`);
    } catch (err: any) {
      console.error("Failed to update availability:", err);
      toast.error(err.message || "Failed to update availability.");
      setLocalAvailability(user.availability);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  // Handle Profile Update
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const parsedSkills = skills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const parsedRoles = roles
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    try {
      const res = await updateProfile({
        bio,
        availability,
        skills: parsedSkills,
        roles: parsedRoles,
      });

      if (res.success) {
        setSuccess(true);
        setEditMode(false);
        toast.success("Profile updated successfully!");
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-emerald-950/40 text-emerald-300 border-emerald-800/40";
      case "Busy":
        return "bg-rose-950/40 text-rose-300 border-rose-800/40";
      case "Looking for Team":
        return "bg-amber-950/40 text-amber-300 border-amber-800/40";
      case "Looking for Projects":
        return "bg-fuchsia-950/40 text-fuchsia-300 border-fuchsia-800/40";
      default:
        return "bg-zinc-900 text-zinc-400";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT COLUMN: Profile Header & Details */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* User Badge Info Box */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/80 p-6 shadow-xl backdrop-blur text-center relative">
          
          {/* Trust Score Radial Header */}
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-violet-950/30 text-violet-400 border border-violet-900/40 rounded-full px-3 py-0.5 text-xs font-bold shadow-sm">
            <Award className="h-4 w-4" />
            <span>{user.trustScore}% Trust</span>
          </div>

          <div className="flex flex-col items-center mt-6">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="h-24 w-24 rounded-full object-cover ring-4 ring-zinc-900 shadow-xl mb-4"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-violet-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl mb-4">
                {user.name[0]}
              </div>
            )}

            <h2 className="text-xl font-extrabold text-zinc-150">{user.name}</h2>
            <p className="text-sm text-zinc-500">@{user.username}</p>

            <div className="mt-4 flex items-center gap-2">
              {isMe ? (
                <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800/80 rounded-full px-3 py-1 text-xs">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Status:</span>
                  <select
                    className={`bg-transparent font-bold cursor-pointer focus:outline-none text-xs rounded transition-all duration-300 ${getAvailabilityColor(localAvailability)}`}
                    value={localAvailability}
                    onChange={handleQuickAvailabilityChange}
                    disabled={updatingAvailability}
                  >
                    <option value="Available" className="bg-zinc-950 text-zinc-100">Available</option>
                    <option value="Busy" className="bg-zinc-950 text-zinc-100">Busy</option>
                    <option value="Looking for Team" className="bg-zinc-950 text-zinc-100">Looking for Team</option>
                    <option value="Looking for Projects" className="bg-zinc-950 text-zinc-100">Looking for Projects</option>
                  </select>
                </div>
              ) : (
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getAvailabilityColor(user.availability)}`}>
                  {user.availability}
                </span>
              )}
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed mt-5 italic">
              "{user.bio || "No bio added yet."}"
            </p>
          </div>

          {/* Stats count */}
          <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-zinc-900 text-center">
            <div>
              <p className="text-xl font-black text-zinc-200">{user.completedProjects}</p>
              <p className="text-[10px] text-zinc-500 uppercase font-semibold">Completed Projects</p>
            </div>
            <div>
              <p className="text-xl font-black text-zinc-200">{user.ratingCount}</p>
              <p className="text-[10px] text-zinc-500 uppercase font-semibold">Teammate Reviews</p>
            </div>
          </div>

          {/* Edit profile Toggle Button */}
          {isMe && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="w-full mt-6 inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-4 py-2.5 text-xs font-bold text-zinc-300"
            >
              <Edit3 className="h-4 w-4" /> Edit Profile
            </button>
          )}

          {success && (
            <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1 justify-center">
              <Check className="h-4 w-4" /> Profile updated successfully!
            </p>
          )}
        </div>

        {/* EDIT PROFILE DIALOG/PANEL */}
        {isMe && editMode && (
          <form onSubmit={handleSave} className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-zinc-200">Edit Developer Profile</h3>
            
            {error && (
              <div className="rounded bg-rose-500/10 border border-rose-500/25 p-2 text-rose-400 text-[10px] flex items-center gap-1.5">
                <AlertCircle className="h-4.5 w-4.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Bio</label>
              <textarea
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Availability Status</label>
              <select
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
                value={availability}
                onChange={(e) => setAvailability(e.target.value as any)}
              >
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
                <option value="Looking for Team">Looking for Team</option>
                <option value="Looking for Projects">Looking for Projects</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Skills (Comma separated)</label>
              <input
                type="text"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Preferred Roles (Comma separated)</label>
              <input
                type="text"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
                value={roles}
                onChange={(e) => setRoles(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-850 text-xs font-semibold text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1.5 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* Roles & Skills Lists */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Preferred Roles</h3>
            <div className="flex flex-wrap gap-1.5">
              {user.roles.map((role, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-350"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Technical Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {user.skills.map((skill, idx) => (
                <SkillBadge key={idx} skill={skill} />
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: GitHub Repositories & Teammate Reviews */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* GitHub Contribution Graph */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <h3 className="text-base font-bold text-zinc-200 flex items-center gap-2">
              <Activity className="h-5 w-5 text-violet-400" />
              GitHub Contribution Graph
            </h3>
            <span className="text-xs bg-violet-950/40 text-violet-300 border border-violet-800/40 rounded-full px-3 py-0.5 font-bold">
              {user.contributionCount} Contributions
            </span>
          </div>
          <div className="overflow-x-auto py-2">
            <img
              src={`https://ghchart.rshah.org/8b5cf6/${user.username}`}
              alt={`${user.name}'s GitHub Contributions`}
              className="min-w-[600px] w-full h-auto bg-zinc-950/30 border border-zinc-900 rounded-xl p-4"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>

        {/* GitHub Repositories */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <h3 className="text-base font-bold text-zinc-200 flex items-center gap-2">
              <Code className="h-5 w-5 text-violet-400" />
              GitHub Repositories
            </h3>
            {user.githubUrl && (
              <a
                href={user.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-violet-400 font-semibold hover:underline"
              >
                View on GitHub
              </a>
            )}
          </div>

          {/* Repos list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.publicRepos.length > 0 ? (
              user.publicRepos.map((repo, idx) => (
                <a
                  key={idx}
                  href={repo.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 transition-all duration-300 hover:border-zinc-800 hover:-translate-y-0.5 flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200 line-clamp-1 hover:text-violet-400 transition-colors">
                      {repo.name}
                    </h4>
                    {repo.description && (
                      <p className="text-xs text-zinc-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {repo.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 text-[10px] text-zinc-400 font-semibold pt-2 border-t border-zinc-900/60">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-violet-500" />
                      {repo.language || "Markdown"}
                    </span>
                    <span>★ {repo.stars}</span>
                  </div>
                </a>
              ))
            ) : (
              <div className="col-span-2 text-xs text-zinc-550 italic text-center p-6 border border-dashed border-zinc-900 rounded-xl">
                No repository data synchronized.
              </div>
            )}
          </div>
        </div>

        {/* Teammate Reviews details */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur space-y-6">
          <h3 className="text-base font-bold text-zinc-200 flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Activity className="h-5 w-5 text-violet-400" />
            Teammate Reviews
          </h3>

          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))
            ) : (
              <div className="text-xs text-zinc-550 italic text-center p-8 border border-dashed border-zinc-900 rounded-xl">
                No teammate reviews logged yet. Join projects and complete builds to receive ratings!
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
