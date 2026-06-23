import mongoose, { Schema, Document, model, models, Model } from "mongoose";

export interface ITeamMember extends Document {
  project: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: string;
  joinedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>({
  project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  role: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
});

TeamMemberSchema.index({ project: 1, user: 1 }, { unique: true });

export const TeamMember: Model<ITeamMember> = models.TeamMember || model<ITeamMember>("TeamMember", TeamMemberSchema);
