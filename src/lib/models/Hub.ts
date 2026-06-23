import mongoose, { Schema, Document, model, models, Model } from "mongoose";

export interface IHub extends Document {
  project: mongoose.Types.ObjectId;
  createdAt: Date;
}

const HubSchema = new Schema<IHub>({
  project: { type: Schema.Types.ObjectId, ref: "Project", required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

export const Hub: Model<IHub> = models.Hub || model<IHub>("Hub", HubSchema);
