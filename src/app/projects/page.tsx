import React from "react";
import { connectToDatabase } from "@/lib/db";
import { Project, TeamMember } from "@/lib/models";
import ProjectCard from "@/components/ProjectCard";
import Link from "next/link";
import { Search, Compass, Plus, SlidersHorizontal } from "lucide-react";

interface SearchParams {
  search?: string;
  category?: string;
  skill?: string;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  await connectToDatabase();

  // Build DB query
  const query: any = {};
  
  if (params.search) {
    query.$or = [
      { title: { $regex: params.search, $options: "i" } },
      { description: { $regex: params.search, $options: "i" } },
      { requiredSkills: { $regex: params.search, $options: "i" } },
    ];
  }

  if (params.category && params.category !== "All") {
    query.category = params.category;
  }

  if (params.skill) {
    query.requiredSkills = { $regex: params.skill, $options: "i" };
  }

  // Fetch projects with populated owner
  const projects = await Project.find(query)
    .populate("owner", "name username image")
    .sort({ createdAt: -1 });

  // Get member counts
  const projectsWithCounts = await Promise.all(
    projects.map(async (project: any) => {
      const memberCount = await TeamMember.countDocuments({ project: project._id });
      const doc = project.toObject() as any;
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

  const categories = ["All", "Hackathon", "College Project", "Startup", "Research", "Open Source"];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-100 flex items-center gap-2">
            <Compass className="h-7 w-7 text-violet-400" />
            Discover Projects
          </h1>
          <p className="text-sm text-zinc-400">Explore active collaborations and find your next team.</p>
        </div>
        <Link
          href="/projects/create"
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-xs font-bold text-white shadow"
        >
          <Plus className="h-4 w-4" /> Create Project
        </Link>
      </div>

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar Filters */}
        <div className="lg:col-span-1 rounded-xl border border-zinc-900 bg-zinc-950/60 p-5 space-y-6 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-200 border-b border-zinc-900 pb-3">
            <SlidersHorizontal className="h-4 w-4 text-violet-400" />
            <span>Refine Search</span>
          </div>

          {/* Search Input (Fall-back standard GET request) */}
          <form action="/projects" method="GET" className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Keywords</label>
            <div className="relative">
              <input
                type="text"
                name="search"
                defaultValue={params.search || ""}
                placeholder="React, AI, Rust..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            </div>
            {params.category && <input type="hidden" name="category" value={params.category} />}
            <button type="submit" className="hidden" />
          </form>

          {/* Category Filter list */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Categories</label>
            <div className="flex flex-col gap-1">
              {categories.map((cat) => {
                const isSelected = params.category === cat || (!params.category && cat === "All");
                const href = `/projects?${new URLSearchParams({
                  ...(params.search && { search: params.search }),
                  category: cat,
                }).toString()}`;

                return (
                  <Link
                    key={cat}
                    href={href}
                    className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                      isSelected
                        ? "bg-violet-600/10 text-violet-400 border border-violet-500/25"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent"
                    }`}
                  >
                    {cat}
                  </Link>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Content Listings */}
        <div className="lg:col-span-3">
          {projectsWithCounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projectsWithCounts.map((project: any) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border border-dashed border-zinc-900 rounded-2xl p-16 text-center">
              <Compass className="h-10 w-10 text-zinc-650 mb-3" />
              <h3 className="text-base font-bold text-zinc-300">No projects found</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                Try adjusting your search keywords, categories, or check back later for new listings.
              </p>
              <Link
                href="/projects"
                className="mt-4 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 transition"
              >
                Clear Filters
              </Link>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
