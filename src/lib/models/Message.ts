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
  text: { type: String, default: "" },
  attachments: [{ type: String }],
  createdAt: { type: Date, default: Date.now, index: true },
});

if (process.env.NODE_ENV !== "production" && mongoose.models.Message) {
  delete (mongoose.models as any).Message;
}

export const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
