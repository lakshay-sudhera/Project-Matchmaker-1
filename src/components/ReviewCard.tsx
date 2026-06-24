import React from "react";
import { Star } from "lucide-react";

interface ReviewCardProps {
  review: {
    communication: number;
    technicalSkills: number;
    reliability: number;
    teamwork: number;
    comment?: string;
    createdAt: Date;
    reviewer: {
      name: string;
      username: string;
      image?: string;
    };
    project?: {
      title: string;
    };
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const averageRating = (
    (review.communication + review.technicalSkills + review.reliability + review.teamwork) /
    4
  ).toFixed(1);

  const ratingsList = [
    { label: "Communication", value: review.communication },
    { label: "Tech Skills", value: review.technicalSkills },
    { label: "Reliability", value: review.reliability },
    { label: "Teamwork", value: review.teamwork },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 shadow-lg backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        {/* Reviewer Information */}
        <div className="flex items-center gap-2.5">
          {review.reviewer.image ? (
            <img
              src={review.reviewer.image}
              alt={review.reviewer.name}
              className="h-9 w-9 rounded-full object-cover ring-1 ring-zinc-800"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-300">
              {review.reviewer.name[0]}
            </div>
          )}
          <div>
            <h4 className="text-sm font-bold text-zinc-200">{review.reviewer.name}</h4>
            <p className="text-xs text-zinc-500">@{review.reviewer.username}</p>
          </div>
        </div>

        {/* Average Rating Badge */}
        <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-md px-2 py-1 text-sm font-bold">
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          <span>{averageRating}</span>
        </div>
      </div>

      {/* Ratings Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 bg-zinc-900/40 border border-zinc-900 rounded-lg p-3">
        {ratingsList.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs">
            <span className="text-zinc-500 font-medium">{item.label}</span>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < item.value ? "fill-yellow-500 text-yellow-500" : "text-zinc-700"
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-zinc-300 leading-relaxed italic bg-zinc-950/20 rounded p-1">
          "{review.comment}"
        </p>
      )}

      {/* Project context if available */}
      {review.project && (
        <div className="mt-4 pt-3 border-t border-zinc-900 text-right">
          <span className="text-xs text-zinc-500">
            For project <span className="font-semibold text-zinc-400">{review.project.title}</span>
          </span>
        </div>
      )}
    </div>
  );
}
