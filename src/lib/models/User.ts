import mongoose, { Schema, Document, model, models, Model } from "mongoose";

export interface IRepo {
  name: string;
  description?: string;
  htmlUrl: string;
  stars: number;
  language?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  username: string;
  bio?: string;
  githubUrl?: string;
  githubAccessToken?: string;
  publicRepos: IRepo[];
  languages: string[];
  contributionCount: number;
  skills: string[];
  roles: string[];
  availability: "Available" | "Busy" | "Looking for Team" | "Looking for Projects";
  trustScore: number;
  ratingCount: number;
  completedProjects: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    image: { type: String },
    username: { type: String, required: true, unique: true, index: true },
    bio: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    githubAccessToken: { type: String, select: false },
    publicRepos: [
      {
        name: { type: String, required: true },
        description: { type: String },
        htmlUrl: { type: String, required: true },
        stars: { type: Number, default: 0 },
        language: { type: String },
      },
    ],
    languages: [{ type: String }],
    contributionCount: { type: Number, default: 0 },
    skills: [{ type: String }],
    roles: [{ type: String }],
    availability: {
      type: String,
      enum: ["Available", "Busy", "Looking for Team", "Looking for Projects"],
      default: "Available",
    },
    trustScore: { type: Number, default: 100, min: 0, max: 100 },
    ratingCount: { type: Number, default: 0 },
    completedProjects: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);
