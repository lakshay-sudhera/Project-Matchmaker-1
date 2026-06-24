"use client";

import React, { useState } from "react";
import { addExpense, deleteExpense } from "@/lib/actions/hubActions";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, Plus, Trash2, Calendar, Folder, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExpenseType {
  _id: string;
  title: string;
  amount: number;
  category: "Hosting" | "Domain" | "API" | "Tools" | "Other";
  date: string;
  addedBy: {
    name: string;
    username: string;
  };
}

interface ExpenseChartProps {
  projectId: string;
  initialExpenses: ExpenseType[];
  currentUserId: string;
  projectOwnerId: string;
  expenses?: ExpenseType[];
  setExpenses?: React.Dispatch<React.SetStateAction<ExpenseType[]>>;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#ec4899", "#f59e0b", "#71717a"];

export default function ExpenseChart({
  projectId,
  initialExpenses,
  currentUserId,
  projectOwnerId,
  expenses: propsExpenses,
  setExpenses: propsSetExpenses,
}: ExpenseChartProps) {
  const [localExpenses, setLocalExpenses] = useState<ExpenseType[]>(initialExpenses);
  const expenses = propsExpenses !== undefined ? propsExpenses : localExpenses;
  const setExpenses = propsSetExpenses !== undefined ? propsSetExpenses : setLocalExpenses;
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<"Hosting" | "Domain" | "API" | "Tools" | "Other">("API");
  const [date, setDate] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Compute Total
  const totalSpending = expenses.reduce((sum, item) => sum + item.amount, 0);

  // Compute Category Data for Chart
  const categoryMap: Record<string, number> = {
    Hosting: 0,
    Domain: 0,
    API: 0,
    Tools: 0,
    Other: 0,
  };

  expenses.forEach((item) => {
    categoryMap[item.category] = (categoryMap[item.category] || 0) + item.amount;
  });

  const chartData = Object.keys(categoryMap)
    .map((name) => ({
      name,
      value: categoryMap[name],
    }))
    .filter((d) => d.value > 0);

  // Handle Add Expense
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    setLoading(true);
    try {
      const res = await addExpense(projectId, {
        title,
        amount: parseFloat(amount),
        category,
        date: date || undefined,
      });

      if (res.success) {
        // Construct mock local item to update UI
        const newExpenseItem: ExpenseType = {
          _id: res.expenseId,
          title,
          amount: parseFloat(amount),
          category,
          date: date || new Date().toISOString(),
          addedBy: {
            name: "Me",
            username: "me",
          },
        };

        setExpenses((prev) => [newExpenseItem, ...prev]);
        setTitle("");
        setAmount("");
        setDate("");
        setShowAddForm(false);
        toast.success("Expense logged successfully!");
      }
    } catch (err: any) {
      console.error("Failed to add expense:", err);
      toast.error(err.message || "Failed to log expense.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Expense
  const handleDelete = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    setDeletingId(expenseId);
    try {
      const res = await deleteExpense(projectId, expenseId);
      if (res.success) {
        setExpenses((prev) => prev.filter((e) => e._id !== expenseId));
        toast.success("Expense deleted successfully!");
      }
    } catch (err: any) {
      console.error("Failed to delete expense:", err);
      toast.error(err.message || "Failed to delete expense.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual Analytics Column */}
      <div className="lg:col-span-1 flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 backdrop-blur-sm">
        <div>
          <h3 className="text-sm font-bold text-zinc-300 mb-2">Total Expenses</h3>
          <div className="flex items-center gap-1.5 text-3xl font-extrabold text-zinc-100 mb-4 bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-3">
            <DollarSign className="h-7 w-7 text-violet-400" />
            <span>{totalSpending.toLocaleString()}</span>
          </div>

          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">Category Breakdown</h4>
          <div className="h-44 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "8px" }}
                    itemStyle={{ color: "#d4d4d8", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-600 font-medium italic border border-dashed border-zinc-900 rounded-lg">
                No expenses logged
              </div>
            )}
          </div>
        </div>

        {/* Chart Legend info */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-zinc-400 font-medium pt-3 border-t border-zinc-900">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="truncate">{item.name}: ${item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logging & History Columns */}
      <div className="lg:col-span-2 space-y-6">
        {/* Toggle form button */}
        <div className="flex justify-between items-center bg-zinc-900/20 px-5 py-4 border border-zinc-800/80 rounded-xl">
          <div>
            <h3 className="text-sm font-bold text-zinc-300">Expense Logs</h3>
            <p className="text-[10px] text-zinc-500">Track and analyze project resources cost history</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-md px-3.5 py-1.5 text-xs font-semibold shadow transition duration-200"
          >
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>

        {/* Add Expense Form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-zinc-200">Log New Expense</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Expense Item *</label>
                <input
                  type="text"
                  required
                  placeholder="AWS hosting server costs"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Amount ($ USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="29.99"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Category</label>
                <select
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-violet-500"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                >
                  <option value="API">API (AI, Gemini, etc.)</option>
                  <option value="Hosting">Hosting (Vercel, AWS, etc.)</option>
                  <option value="Domain">Domain Registration</option>
                  <option value="Tools">SaaS Tools (Figma, GitHub Pro)</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-violet-500"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-xs font-semibold text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3.5 py-1.5 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow disabled:opacity-50"
              >
                {loading ? "Logging..." : "Log Cost"}
              </button>
            </div>
          </form>
        )}

        {/* Expenses List */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-lg max-h-[350px] overflow-y-auto space-y-3">
          {expenses.length > 0 ? (
            expenses.map((expense) => {
              const isAddedByMe = expense.addedBy.username === "me";
              const canDelete = isAddedByMe || currentUserId === projectOwnerId;

              return (
                <div
                  key={expense._id}
                  className="flex items-center justify-between border-b border-zinc-900 pb-3 last:border-0 last:pb-0 gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center">
                      <Folder className="h-4 w-4 text-violet-400" />
                    </span>
                    <div>
                      <h5 className="text-sm font-bold text-zinc-200 line-clamp-1">{expense.title}</h5>
                      <div className="flex gap-2 items-center text-[10px] text-zinc-500 font-semibold mt-0.5">
                        <span className="text-zinc-400 bg-zinc-900 rounded px-1.5 py-0.2 border border-zinc-800">{expense.category}</span>
                        <span>•</span>
                        <span>{new Date(expense.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-zinc-200">${expense.amount.toFixed(2)}</span>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(expense._id)}
                        disabled={deletingId === expense._id}
                        className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-md hover:bg-rose-500/10 transition"
                      >
                        {deletingId === expense._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-zinc-500 text-xs italic font-medium">
              No expenses registered for this project workspace yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
