import mongoose, { Schema, Document, model, models, Model } from "mongoose";

export interface IApplication extends Document {
  project: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  message: string;
  status: "Pending" | "Accepted" | "Rejected";
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
      index: true,
    },
  },
  { timestamps: true }
);

ApplicationSchema.index({ project: 1, user: 1 }, { unique: true });

export const Application: Model<IApplication> = models.Application || model<IApplication>("Application", ApplicationSchema);
