import React from "react";
import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { Sparkles, LayoutDashboard, PlusCircle, LogIn, LogOut, Compass, User as UserIcon } from "lucide-react";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="h-5 w-5 fill-current" />
            </span>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
              Matchmaker
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-zinc-400">
            <Link href="/projects" className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors">
              <Compass className="h-4 w-4" /> Discover
            </Link>
            {user && (
              <>
                <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link href="/projects/create" className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors">
                  <PlusCircle className="h-4 w-4" /> Create Project
                </Link>
              </>
            )}
          </nav>

          {/* User Auth Profile section */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Profile Link */}
                <Link
                  href={`/profile/${(user as any).username || "me"}`}
                  className="flex items-center gap-2 group hover:opacity-90 transition"
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-zinc-800 group-hover:ring-violet-500 transition-all duration-300"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-violet-600 text-xs font-bold text-white flex items-center justify-center">
                      {user.name?.[0] || "U"}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm font-medium text-zinc-300 group-hover:text-zinc-200">
                    {user.name}
                  </span>
                </Link>

                {/* Log out form */}
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 transition"
                    title="Log Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: "/dashboard" });
                }}
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-600/10 transition duration-200"
                >
                  <LogIn className="h-4 w-4" /> Login with GitHub
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
