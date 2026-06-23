import mongoose, { Schema, Document, model, models, Model } from "mongoose";

export interface IExpense extends Document {
  project: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  category: "Hosting" | "Domain" | "API" | "Tools" | "Other";
  date: Date;
  addedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ExpenseSchema = new Schema<IExpense>({
  project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    enum: ["Hosting", "Domain", "API", "Tools", "Other"],
    required: true,
  },
  date: { type: Date, default: Date.now },
  addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Expense: Model<IExpense> = models.Expense || model<IExpense>("Expense", ExpenseSchema);
