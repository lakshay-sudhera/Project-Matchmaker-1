"use client";

import React from "react";
import { MessageSquare, Users, Kanban, DollarSign, FolderOpen, ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  projectTitle: string;
  projectId: string;
}

export default function Sidebar({ activeTab, setActiveTab, projectTitle, projectId }: SidebarProps) {
  const menuItems = [
    { id: "chat", label: "Team Chat", icon: MessageSquare },
    { id: "kanban", label: "Kanban Board", icon: Kanban },
    { id: "discussions", label: "Discussions", icon: Users },
    { id: "resources", label: "Resource Vault", icon: FolderOpen },
    { id: "expenses", label: "Expense Tracker", icon: DollarSign },
    { id: "analytics", label: "Analytics Dashboard", icon: BarChart3 },
  ];

  return (
    <aside className="w-full lg:w-64 flex flex-col rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 shadow-xl backdrop-blur-md">
      {/* Back to Project Detail Link */}
      <Link
        href={`/projects/${projectId}`}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 font-semibold mb-6 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Project Details
      </Link>

      {/* Project Brand */}
      <div className="mb-6 px-2">
        <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Active Workspace</span>
        <h2 className="text-base font-extrabold text-zinc-200 line-clamp-1 mt-0.5" title={projectTitle}>
          {projectTitle}
        </h2>
      </div>

      {/* Navigation Options */}
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition duration-200 text-left ${
                isActive
                  ? "bg-violet-600/10 border border-violet-500/25 text-violet-400 shadow-sm shadow-violet-500/5"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
