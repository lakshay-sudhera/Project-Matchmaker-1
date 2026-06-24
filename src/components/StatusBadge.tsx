import React from "react";

export default function StatusBadge({ status }: { status: string }) {
  let colors = "bg-zinc-900 text-zinc-300 border-zinc-700";

  switch (status) {
    // Project States
    case "Recruiting":
      colors = "bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/60 hover:text-emerald-200";
      break;
    case "Active":
      colors = "bg-sky-950/40 text-sky-300 border-sky-800/40 hover:bg-sky-900/60 hover:text-sky-200";
      break;
    case "Completed":
      colors = "bg-violet-950/40 text-violet-300 border-violet-800/40 hover:bg-violet-900/60 hover:text-violet-200";
      break;
    case "Archived":
      colors = "bg-zinc-950/40 text-zinc-400 border-zinc-800/40 hover:bg-zinc-900/50";
      break;

    // Availability States
    case "Available":
      colors = "bg-emerald-950/40 text-emerald-300 border-emerald-800/40";
      break;
    case "Busy":
      colors = "bg-rose-950/40 text-rose-300 border-rose-800/40";
      break;
    case "Looking for Team":
      colors = "bg-amber-950/40 text-amber-300 border-amber-800/40";
      break;
    case "Looking for Projects":
      colors = "bg-fuchsia-950/40 text-fuchsia-300 border-fuchsia-800/40";
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md shadow-sm transition-all duration-300 ${colors}`}>
      {status}
    </span>
  );
}
