import React from "react";
import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sparkles, ShieldCheck } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-violet-600/5 blur-[90px] -z-10 rounded-full" />

      <div className="w-full max-w-md bg-zinc-950/80 border border-zinc-900 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        
        {/* Logo and Icon Header */}
        <div className="text-center mb-8">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg mb-4">
            <Sparkles className="h-6 w-6 fill-current" />
          </span>
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Welcome to Matchmaker</h2>
          <p className="text-sm text-zinc-500 mt-1">Connect and build teams with GitHub verification</p>
        </div>

        {/* Info list */}
        <div className="space-y-4 mb-8 text-xs text-zinc-400">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
            <p><strong>GitHub Sync:</strong> Repositories, contribution activity, and primary languages are synced to populate your developer profile card.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
            <p><strong>AI Teammate Recommendations:</strong> Powered by Gemini API to suggest candidates with the highest matching scores.</p>
          </div>
        </div>

        {/* GitHub Sign in trigger */}
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-150 py-3.5 px-4 text-sm font-extrabold text-zinc-950 shadow-md hover:shadow-lg transition duration-200 cursor-pointer"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.478-10-10-10z"
              />
            </svg>
            Continue with GitHub
          </button>
        </form>

      </div>
    </div>
  );
}
