import mongoose, { Schema, Document, model, models, Model } from "mongoose";

export interface IMessage extends Document {
  project: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text: string;
  attachments: string[];
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  attachments: [{ type: String }],
  createdAt: { type: Date, default: Date.now, index: true },
});

export const Message: Model<IMessage> = models.Message || model<IMessage>("Message", MessageSchema);
