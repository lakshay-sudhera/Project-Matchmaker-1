"use client";

import React, { useState } from "react";
import Link from "next/link";
import SkillBadge from "./SkillBadge";
import { Sparkles, Send, Check } from "lucide-react";
import { sendInvitation } from "@/lib/actions/memberActions";

interface RecommendationCardProps {
  projectId: string;
  recommendation: {
    userId: string;
    matchScore: number;
    reasons: string[];
  };
  candidate: {
    _id: string;
    name: string;
    username: string;
    image?: string;
    skills: string[];
    roles: string[];
  };
}

export default function RecommendationCard({
  projectId,
  recommendation,
  candidate,
}: RecommendationCardProps) {
  const [invited, setInvited] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(`Hi ${candidate.name}, I saw you are a great match for my project. Let's build together!`);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [error, setError] = useState("");

  const handleInvite = async () => {
    setSending(true);
    setError("");
    try {
      const res = await sendInvitation(projectId, candidate._id, message);
      if (res.success) {
        setInvited(true);
        setShowInviteForm(false);
      }
    } catch (e: any) {
      setError(e.message || "Failed to send invitation.");
    } finally {
      setSending(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 border-emerald-500/30 bg-emerald-950/20";
    if (score >= 70) return "text-violet-400 border-violet-500/30 bg-violet-950/20";
    return "text-zinc-400 border-zinc-700 bg-zinc-900/35";
  };

  return (
    <div className="relative rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-violet-500/30">
      {/* Top Header Match Rating */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          {candidate.image ? (
            <img
              src={candidate.image}
              alt={candidate.name}
              className="h-10 w-10 rounded-full object-cover ring-1 ring-zinc-800"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold text-white">
              {candidate.name[0]}
            </div>
          )}
          <div>
            <Link
              href={`/profile/${candidate.username}`}
              className="text-sm font-bold text-zinc-200 hover:text-violet-400 transition-colors"
            >
              {candidate.name}
            </Link>
            <p className="text-xs text-zinc-500">@{candidate.username}</p>
          </div>
        </div>

        {/* Score Badge */}
        <div className={`flex items-center gap-1 border rounded-lg px-2.5 py-1 text-xs font-bold ${getScoreColor(recommendation.matchScore)}`}>
          <Sparkles className="h-3.5 w-3.5 fill-current" />
          <span>{recommendation.matchScore}% Match</span>
        </div>
      </div>

      {/* AI Reasons Column */}
      <div className="mb-4 bg-zinc-900/30 border border-zinc-900 rounded-lg p-3">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-violet-400 mb-2 flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Gemini AI Match Reason
        </h4>
        <ul className="space-y-1.5">
          {recommendation.reasons.map((reason, idx) => (
            <li key={idx} className="text-xs text-zinc-300 flex items-start gap-1.5">
              <span className="text-violet-400">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Skills list */}
      <div className="mb-5">
        <div className="flex flex-wrap gap-1">
          {candidate.skills.slice(0, 4).map((skill, idx) => (
            <SkillBadge key={idx} skill={skill} />
          ))}
          {candidate.skills.length > 4 && (
            <span className="text-[10px] text-zinc-500 font-semibold pl-1 self-center">
              +{candidate.skills.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Interactive Actions Footer */}
      <div className="pt-3 border-t border-zinc-900 flex justify-end">
        {invited ? (
          <span className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-emerald-400">
            <Check className="h-3.5 w-3.5" /> Invited
          </span>
        ) : showInviteForm ? (
          <div className="w-full space-y-2 mt-2">
            <textarea
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {error && <p className="text-[10px] text-rose-400">{error}</p>}
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => setShowInviteForm(false)}
                className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-xs font-medium text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={sending}
                className="inline-flex items-center gap-1 rounded bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-55"
              >
                {sending ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowInviteForm(true)}
            className="inline-flex items-center gap-1.5 rounded bg-violet-600 hover:bg-violet-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-all shadow duration-200"
          >
            <Send className="h-3 w-3" /> Invite to Team
          </button>
        )}
      </div>
    </div>
  );
}
