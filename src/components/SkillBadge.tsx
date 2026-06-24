import React from "react";

export default function SkillBadge({ skill }: { skill: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-950/40 text-violet-300 border border-violet-800/40 backdrop-blur-md shadow-sm transition-all duration-300 hover:bg-violet-900/60 hover:text-violet-200">
      {skill}
    </span>
  );
}
