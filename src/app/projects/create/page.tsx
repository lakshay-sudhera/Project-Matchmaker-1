"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/actions/projectActions";
import { FolderPlus, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function CreateProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"Hackathon" | "College Project" | "Startup" | "Research" | "Open Source">("Hackathon");
  const [skillsInput, setSkillsInput] = useState("");
  const [rolesInput, setRolesInput] = useState("");
  const [maxTeamSize, setMaxTeamSize] = useState(4);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    // Process comma separated lists to arrays
    const requiredSkills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const requiredRoles = rolesInput
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    try {
      const res = await createProject({
        title,
        description,
        category,
        requiredSkills,
        requiredRoles: requiredRoles.length > 0 ? requiredRoles : ["Contributor"],
        maxTeamSize: Number(maxTeamSize),
      });

      if (res.success) {
        toast.success("Project created successfully!");
        router.push(`/projects/${res.projectId}`);
      }
    } catch (e: any) {
      setError(e.message || "Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      
      <div className="flex items-center gap-3 mb-8">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-950/30 text-violet-400 border border-violet-900/40">
          <FolderPlus className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-black text-zinc-105 tracking-tight flex items-center gap-2">
            Create Project
          </h1>
          <p className="text-xs text-zinc-500">Provide details about your project to recruit matched teammates.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md">
        
        {error && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/25 p-3 flex items-center gap-2 text-rose-400 text-xs font-semibold">
            <AlertCircle className="h-4.5 w-4.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Project Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Project Matchmaker SaaS"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Description *</label>
          <textarea
            required
            rows={5}
            placeholder="Outline your project scope, targets, technology stack, and what you aim to achieve..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Category</label>
            <select
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-violet-500 transition"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
            >
              <option value="Hackathon">Hackathon</option>
              <option value="College Project">College Project</option>
              <option value="Startup">Startup Idea</option>
              <option value="Research">Research Collaboration</option>
              <option value="Open Source">Open-Source Contribution</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Maximum Team Size</label>
            <input
              type="number"
              min={2}
              max={12}
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition"
              value={maxTeamSize}
              onChange={(e) => setMaxTeamSize(Number(e.target.value))}
            />
          </div>

        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Required Skills (Comma separated)</label>
          <input
            type="text"
            placeholder="React, Next.js, Mongoose, Tailwind, Python"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
          />
          <p className="text-[10px] text-zinc-500">Provide comma-separated tags for Gemini AI matching algorithms.</p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Open Roles (Comma separated)</label>
          <input
            type="text"
            placeholder="Frontend Developer, Backend Engineer, UI/UX Designer, Project Manager"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition"
            value={rolesInput}
            onChange={(e) => setRolesInput(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-850 text-xs font-semibold text-zinc-400 hover:text-zinc-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-extrabold text-white shadow disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Provisioning...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 fill-current" /> Create Project
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
