import mongoose, { Schema, Document, model, models, Model } from "mongoose";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  type:
    | "PROJECT_INVITATION"
    | "APPLICATION_UPDATE"
    | "APPLICATION_ACCEPTED"
    | "APPLICATION_REJECTED"
    | "CHAT_MESSAGE"
    | "TASK_ASSIGNED"
    | "EXPENSE_ADDED"
    | "DEADLINE_REMINDER"
    | "SYSTEM";
  title: string;
  message: string;
  link: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        "PROJECT_INVITATION",
        "APPLICATION_UPDATE",
        "APPLICATION_ACCEPTED",
        "APPLICATION_REJECTED",
        "CHAT_MESSAGE",
        "TASK_ASSIGNED",
        "EXPENSE_ADDED",
        "DEADLINE_REMINDER",
        "SYSTEM",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, required: true },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "LOW",
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Optimize performance for querying user notifications
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  models.Notification || model<INotification>("Notification", NotificationSchema);
