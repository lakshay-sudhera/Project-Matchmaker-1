import React from "react";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import SkillBadge from "./SkillBadge";
import { Star, ShieldAlert, Award } from "lucide-react";

interface UserCardProps {
  user: {
    _id: string;
    name: string;
    username: string;
    image?: string;
    bio?: string;
    skills: string[];
    roles: string[];
    availability: string;
    trustScore: number;
    contributionCount?: number;
  };
}

export default function UserCard({ user }: UserCardProps) {
  return (
    <div className="group relative rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-fuchsia-500/50 hover:shadow-fuchsia-500/5 hover:-translate-y-0.5">
      {/* Ambient hover glow */}
      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-fuchsia-600/0 via-fuchsia-600/0 to-fuchsia-600/0 opacity-0 transition-opacity duration-300 group-hover:from-fuchsia-600/5 group-hover:to-violet-600/5 group-hover:opacity-100" />

      <div className="flex flex-col h-full justify-between">
        <div>
          {/* Header Row */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <StatusBadge status={user.availability} />
            <div className="flex items-center gap-1 bg-violet-950/30 text-violet-400 border border-violet-900/40 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm">
              <Award className="h-3.5 w-3.5" />
              <span>{user.trustScore}% Trust</span>
            </div>
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-3 mb-4">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-zinc-850"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-fuchsia-600 flex items-center justify-center text-lg font-bold text-white shadow-md">
                {user.name[0]}
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-zinc-100 group-hover:text-fuchsia-400 transition-colors">
                {user.name}
              </h3>
              <p className="text-xs text-zinc-500 font-medium">@{user.username}</p>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-zinc-400 line-clamp-2 mb-4 leading-relaxed italic">
              "{user.bio}"
            </p>
          )}

          {/* Roles */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Roles</h4>
            <div className="flex flex-wrap gap-1">
              {user.roles.map((role, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {user.skills.slice(0, 5).map((skill, idx) => (
                <SkillBadge key={idx} skill={skill} />
              ))}
              {user.skills.length > 5 && (
                <span className="text-xs text-zinc-500 self-center font-medium pl-1">
                  +{user.skills.length - 5}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
          <div className="text-xs text-zinc-500">
            {user.contributionCount ? (
              <span className="font-semibold text-zinc-400">{user.contributionCount} GitHub contributions</span>
            ) : (
              <span>Active contributor</span>
            )}
          </div>
          <Link
            href={`/profile/${user.username}`}
            className="rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 shadow transition-all duration-300"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
