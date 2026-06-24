import mongoose, { Schema, Document, model, models, Model } from "mongoose";

export interface IProject extends Document {
  title: string;
  description: string;
  category: "Hackathon" | "College Project" | "Startup" | "Research" | "Open Source";
  requiredSkills: string[];
  requiredRoles: string[];
  maxTeamSize: number;
  owner: mongoose.Types.ObjectId;
  status: "Recruiting" | "Active" | "Completed" | "Archived";
  githubRepo?: {
    name: string;
    url: string;
    owner: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["Hackathon", "College Project", "Startup", "Research", "Open Source"],
      required: true,
    },
    requiredSkills: [{ type: String }],
    requiredRoles: [{ type: String }],
    maxTeamSize: { type: Number, required: true, default: 4 },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["Recruiting", "Active", "Completed", "Archived"],
      default: "Recruiting",
      index: true,
    },
    githubRepo: {
      name: { type: String },
      url: { type: String },
      owner: { type: String },
      createdAt: { type: Date },
    },
  },
  { timestamps: true }
);

export const Project: Model<IProject> = models.Project || model<IProject>("Project", ProjectSchema);
