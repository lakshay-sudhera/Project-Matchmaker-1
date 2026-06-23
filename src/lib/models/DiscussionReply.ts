import mongoose, { Schema, Document, model, models, Model } from "mongoose";

export interface IDiscussionReply extends Document {
  discussion: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const DiscussionReplySchema = new Schema<IDiscussionReply>(
  {
    discussion: { type: Schema.Types.ObjectId, ref: "Discussion", required: true, index: true },
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export const DiscussionReply: Model<IDiscussionReply> = models.DiscussionReply || model<IDiscussionReply>("DiscussionReply", DiscussionReplySchema);
