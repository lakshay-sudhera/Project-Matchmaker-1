import mongoose, { Schema, Document, model, models, Model } from "mongoose";

export interface IResource extends Document {
  project: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  title: string;
  url: string;
  category: "GitHub" | "Figma" | "Docs" | "Presentation" | "Other";
  createdAt: Date;
}

const ResourceSchema = new Schema<IResource>({
  project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  category: {
    type: String,
    enum: ["GitHub", "Figma", "Docs", "Presentation", "Other"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

export const Resource: Model<IResource> = models.Resource || model<IResource>("Resource", ResourceSchema);
