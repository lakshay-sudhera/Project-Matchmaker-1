import mongoose, { Schema, Document, model, models, Model } from "mongoose";

export interface IInvitation extends Document {
  project: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  message: string;
  status: "Pending" | "Accepted" | "Declined";
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Declined"],
      default: "Pending",
      index: true,
    },
  },
  { timestamps: true }
);

InvitationSchema.index({ project: 1, receiver: 1 }, { unique: true });

export const Invitation: Model<IInvitation> = models.Invitation || model<IInvitation>("Invitation", InvitationSchema);
