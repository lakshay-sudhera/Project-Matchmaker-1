import mongoose, { Schema, Document, model, models, Model } from "mongoose";

export interface ITask extends Document {
  project: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: "Todo" | "In Progress" | "Review" | "Done";
  assignee?: mongoose.Types.ObjectId;
  dueDate?: Date;
  completed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Todo", "In Progress", "Review", "Done"],
      default: "Todo",
      index: true,
    },
    assignee: { type: Schema.Types.ObjectId, ref: "User" },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Task: Model<ITask> = models.Task || model<ITask>("Task", TaskSchema);
