import React from "react";
import Link from "next/link";
import { auth, signIn } from "@/auth";
import { Sparkles, Users, Award, Bot, FileCode, CheckCircle2, ArrowRight } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="space-y-24 py-10">

      {/* HERO SECTION */}
      <section className="text-center relative py-12">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] -z-10 rounded-full" />
        <div className="absolute top-1/4 left-1/3 w-[250px] h-[250px] bg-fuchsia-600/10 blur-[90px] -z-10 rounded-full animate-pulse" />

        {/* Feature Announcement Badge */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-950/40 border border-violet-850 px-3.5 py-1.5 text-xs font-bold text-violet-300 mb-6 backdrop-blur shadow-sm">
          <Sparkles className="h-3.5 w-3.5 fill-violet-400" />
          Lets Build Together with MatchMaker
        </span>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]">
          Find the Perfect Teammates for Your{" "}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-300 bg-clip-text text-transparent">
            Next Big Project
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
          Matchmaker connects college students and developers based on skills, GitHub contributions, availability, and verified peer trust scores.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-600/15 hover:shadow-violet-600/25 transition duration-200"
          >
            Explore Projects <ArrowRight className="h-4.5 w-4.5" />
          </Link>
          {!session ? (
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 px-6 py-3.5 text-sm font-bold text-zinc-300 shadow-md transition duration-200"
              >
                Sign In with GitHub
              </button>
            </form>
          ) : (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 px-6 py-3.5 text-sm font-bold text-zinc-300 shadow-md transition duration-200"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </section>

      {/* QUICK SEARCH BAR REDIRECT */}
      <section className="max-w-2xl mx-auto bg-zinc-950 border border-zinc-900 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <form action="/projects" method="GET" className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            name="search"
            placeholder="Search by required skill (e.g. React, Mongoose, Python)..."
            className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-6 py-3 text-sm font-bold shadow transition"
          >
            Find Matches
          </button>
        </form>
      </section>

      {/* FEATURES SECTION */}
      <section className="space-y-16">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100">Designed for Collaborators</h2>
          <p className="text-zinc-500 text-sm">Everything you need to go from idea to team to completed build.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Feature 1 */}
          <div className="group relative rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 shadow-md backdrop-blur transition-all duration-300 hover:border-violet-500/30 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(124,58,237,0.15)] overflow-hidden">
            {/* Hover ambient glow */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-600/0 to-fuchsia-600/0 opacity-0 group-hover:from-violet-600/5 group-hover:to-fuchsia-600/5 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-950/30 text-violet-400 border border-violet-900/40 mb-4 group-hover:scale-110 group-hover:bg-violet-950/50 group-hover:border-violet-500/30 transition-all duration-300">
              <Bot className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-bold text-zinc-200 mb-2 group-hover:text-violet-300 transition-colors">AI Matching Engine</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Gemini-powered recommendation algorithms analyze project requirements against candidate skills, past experience, and GitHub metrics to deliver ranked compatibilities.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group relative rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 shadow-md backdrop-blur transition-all duration-300 hover:border-fuchsia-500/30 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(217,70,239,0.15)] overflow-hidden">
            {/* Hover ambient glow */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-fuchsia-600/0 to-violet-600/0 opacity-0 group-hover:from-fuchsia-600/5 group-hover:to-violet-600/5 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-fuchsia-950/30 text-fuchsia-400 border border-fuchsia-900/40 mb-4 group-hover:scale-110 group-hover:bg-fuchsia-950/50 group-hover:border-fuchsia-500/30 transition-all duration-300">
              <Award className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-bold text-zinc-200 mb-2 group-hover:text-fuchsia-300 transition-colors">Verified Trust Score</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Teammates review each other on completed builds based on technical capability, communication, and reliability. This feeds directly into a global Trust Score.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group relative rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 shadow-md backdrop-blur transition-all duration-300 hover:border-cyan-500/30 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(6,182,212,0.15)] overflow-hidden">
            {/* Hover ambient glow */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-cyan-600/0 to-violet-600/0 opacity-0 group-hover:from-cyan-600/5 group-hover:to-violet-600/5 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-950/30 text-cyan-400 border border-cyan-900/40 mb-4 group-hover:scale-110 group-hover:bg-cyan-950/50 group-hover:border-cyan-500/30 transition-all duration-300">
              <Users className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-bold text-zinc-200 mb-2 group-hover:text-cyan-300 transition-colors">Workspace Team Hub</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Accepting teammates automatically spins up a workspace hub featuring live discussion threads, Kanban task management boards, chat, resource vaults, and expense trackers.
            </p>
          </div>

        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="relative rounded-3xl border border-zinc-900 bg-zinc-950/60 overflow-hidden p-8 sm:p-12 text-center shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-fuchsia-600/5 blur-[90px] -z-10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-600/5 blur-[90px] -z-10 rounded-full" />

        <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 mb-4">Ready to Assemble Your Team?</h2>
        <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
          Log in with GitHub to pull your repositories, showcase your languages and skills, and start applying to active projects today.
        </p>

        {!session ? (
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-600/10 transition"
            >
              Sign In and Get Started
            </button>
          </form>
        ) : (
          <Link
            href="/projects/create"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-600/10 transition"
          >
            Create Your Project Now
          </Link>
        )}
      </section>

    </div>
  );
}
