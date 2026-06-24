import React from "react";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import SkillBadge from "./SkillBadge";
import { Folder, Users, Star } from "lucide-react";

interface ProjectCardProps {
  project: {
    _id: string;
    title: string;
    description: string;
    category: string;
    requiredSkills: string[];
    requiredRoles: string[];
    maxTeamSize: number;
    status: string;
    owner: {
      name: string;
      username: string;
      image?: string;
    };
    memberCount?: number;
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const memberCount = project.memberCount ?? 1;

  return (
    <div className="group relative rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-violet-500/50 hover:shadow-violet-500/5 hover:-translate-y-0.5">
      {/* Background ambient glow on hover */}
      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-violet-600/0 via-violet-600/0 to-violet-600/0 opacity-0 transition-opacity duration-300 group-hover:from-violet-600/5 group-hover:to-fuchsia-600/5 group-hover:opacity-100" />

      <div className="flex flex-col h-full justify-between">
        <div>
          {/* Header row */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-400 border border-zinc-800">
              <Folder className="h-3.5 w-3.5 text-violet-400" />
              {project.category}
            </span>
            <StatusBadge status={project.status} />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-zinc-100 mb-2 line-clamp-1 group-hover:text-violet-400 transition-colors">
            {project.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-zinc-400 line-clamp-3 mb-5 leading-relaxed">
            {project.description}
          </p>

          {/* Skills Required */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Required Skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {project.requiredSkills.slice(0, 4).map((skill, index) => (
                <SkillBadge key={index} skill={skill} />
              ))}
              {project.requiredSkills.length > 4 && (
                <span className="text-xs text-zinc-500 self-center font-medium pl-1">
                  +{project.requiredSkills.length - 4} more
                </span>
              )}
            </div>
          </div>

          {/* Roles Required */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Open Roles</h4>
            <div className="flex flex-wrap gap-1">
              {project.requiredRoles.map((role, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
          {/* Owner details */}
          <div className="flex items-center gap-2">
            {project.owner.image ? (
              <img
                src={project.owner.image}
                alt={project.owner.name}
                className="h-7 w-7 rounded-full object-cover ring-1 ring-zinc-800"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">
                {project.owner.name[0]}
              </div>
            )}
            <div className="text-xs">
              <p className="font-semibold text-zinc-300 line-clamp-1">{project.owner.name}</p>
              <p className="text-zinc-500">@{project.owner.username}</p>
            </div>
          </div>

          {/* Member tracker & Link */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1 text-zinc-400">
              <Users className="h-4 w-4 text-zinc-500" />
              <span>
                {memberCount}/{project.maxTeamSize}
              </span>
            </span>
            <Link
              href={`/projects/${project._id}`}
              className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-violet-500 transition-all duration-300"
            >
              View Project
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
