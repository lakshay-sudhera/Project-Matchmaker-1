import React from "react";

interface LogoProps {
  className?: string;
  size?: number; // Size of the icon container
  showText?: boolean;
}

export default function Logo({ className = "", size = 36, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 group ${className}`}>
      {/* Icon Container with Gradient */}
      <span
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-violet-500 text-white shadow-lg shadow-violet-500/20 group-hover:scale-105 group-hover:shadow-violet-500/30 transition-all duration-300"
      >
        <svg
          width={size * 0.58}
          height={size * 0.58}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          {/* Connection Lines (Network edges) */}
          <line
            x1="12"
            y1="4.5"
            x2="5.5"
            y2="16.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-40 group-hover:opacity-75 group-hover:stroke-fuchsia-200 transition-all duration-300"
          />
          <line
            x1="12"
            y1="4.5"
            x2="18.5"
            y2="16.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-40 group-hover:opacity-75 group-hover:stroke-fuchsia-200 transition-all duration-300"
          />
          <line
            x1="5.5"
            y1="16.5"
            x2="18.5"
            y2="16.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-40 group-hover:opacity-75 group-hover:stroke-fuchsia-200 transition-all duration-300"
          />

          <line
            x1="12"
            y1="4.5"
            x2="12"
            y2="11.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-80 group-hover:stroke-violet-200 transition-all duration-300"
          />
          <line
            x1="5.5"
            y1="16.5"
            x2="12"
            y2="11.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-80 group-hover:stroke-violet-200 transition-all duration-300"
          />
          <line
            x1="18.5"
            y1="16.5"
            x2="12"
            y2="11.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-80 group-hover:stroke-violet-200 transition-all duration-300"
          />

          {/* Nodes (Network vertices) */}
          {/* Top Node */}
          <circle
            cx="12"
            cy="4.5"
            r="2.5"
            fill="currentColor"
            className="text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]"
          />
          {/* Bottom Left Node */}
          <circle
            cx="5.5"
            cy="16.5"
            r="2.5"
            fill="currentColor"
            className="text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]"
          />
          {/* Bottom Right Node */}
          <circle
            cx="18.5"
            cy="16.5"
            r="2.5"
            fill="currentColor"
            className="text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]"
          />
          {/* Center Hub Node */}
          <circle
            cx="12"
            cy="11.5"
            r="1.75"
            fill="currentColor"
            className="text-zinc-100 group-hover:scale-125 transition-transform duration-300"
          />
        </svg>
      </span>

      {/* Brand Text */}
      {showText && (
        <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
          Matchmaker
        </span>
      )}
    </div>
  );
}
