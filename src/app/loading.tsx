import React from "react";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      {/* Premium Logo Container */}
      <Logo showText={false} size={64} className="animate-pulse" />
      
      {/* Brand Label */}
      <h3 className="text-sm font-extrabold tracking-widest uppercase bg-gradient-to-r from-violet-400 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
        Matchmaker
      </h3>
      
      {/* Spinner and Helper text */}
      <div className="flex items-center gap-2 mt-2 bg-zinc-900/40 border border-zinc-900 px-3.5 py-1.5 rounded-full backdrop-blur-sm">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          Connecting to Workspace...
        </span>
      </div>
    </div>
  );
}
