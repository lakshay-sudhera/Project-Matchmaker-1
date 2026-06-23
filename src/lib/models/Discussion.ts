import mongoose, { Schema, Document, model, models, Model } from "mongoose";

export interface IDiscussion extends Document {
  project: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const DiscussionSchema = new Schema<IDiscussion>(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export const Discussion: Model<IDiscussion> = models.Discussion || model<IDiscussion>("Discussion", DiscussionSchema);
