import mongoose, { Schema, Document, model, models, Model } from "mongoose";

export interface IReview extends Document {
  project: mongoose.Types.ObjectId;
  reviewer: mongoose.Types.ObjectId;
  reviewee: mongoose.Types.ObjectId;
  communication: number;
  technicalSkills: number;
  reliability: number;
  teamwork: number;
  comment?: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  reviewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reviewee: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  communication: { type: Number, required: true, min: 1, max: 5 },
  technicalSkills: { type: Number, required: true, min: 1, max: 5 },
  reliability: { type: Number, required: true, min: 1, max: 5 },
  teamwork: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export const Review: Model<IReview> = models.Review || model<IReview>("Review", ReviewSchema);
