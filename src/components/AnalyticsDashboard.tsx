"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import {
  CheckSquare,
  DollarSign,
  BarChart3,
  Layers,
  MessageSquare,
  FolderOpen,
  Users,
  Award,
  TrendingUp,
  Clock,
} from "lucide-react";

interface MemberType {
  _id: string;
  name: string;
  username: string;
  image?: string;
}

interface TaskType {
  _id: string;
  title: string;
  description?: string;
  status: "Todo" | "In Progress" | "Review" | "Done";
  assignee?: MemberType;
  dueDate?: string;
  completed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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

interface ResourceType {
  _id: string;
  title: string;
  url: string;
  category: "GitHub" | "Figma" | "Docs" | "Presentation" | "Other";
  creator: {
    _id: string;
    name: string;
  };
}

interface ReplyType {
  _id: string;
  content: string;
  createdAt: string;
  creator: {
    name: string;
    username: string;
    image?: string;
  };
}

interface DiscussionType {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  creator: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
  replies: ReplyType[];
}

interface AnalyticsDashboardProps {
  tasks: TaskType[];
  expenses: ExpenseType[];
  members: MemberType[];
  resources: ResourceType[];
  discussions: DiscussionType[];
}

export default function AnalyticsDashboard({
  tasks,
  expenses,
  members,
  resources,
  discussions,
}: AnalyticsDashboardProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // --- 1. KPI Calculations ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Done" || t.completed).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalResources = resources.length;

  const totalDiscussions = discussions.length;
  const totalReplies = discussions.reduce((sum, d) => sum + d.replies.length, 0);
  const totalActivityScore = totalDiscussions + totalReplies + totalResources;

  // --- 2. Chart Data: Task Status Breakdown ---
  const statusCounts = {
    Todo: tasks.filter((t) => t.status === "Todo").length,
    "In Progress": tasks.filter((t) => t.status === "In Progress").length,
    Review: tasks.filter((t) => t.status === "Review").length,
    Done: tasks.filter((t) => t.status === "Done").length,
  };

  const statusChartData = Object.keys(statusCounts).map((status) => ({
    name: status,
    value: statusCounts[status as keyof typeof statusCounts],
  }));

  const STATUS_COLORS: Record<string, string> = {
    Todo: "#71717a",        // Zinc 500
    "In Progress": "#38bdf8", // Sky 400
    Review: "#fbbf24",      // Amber 400
    Done: "#10b981",        // Emerald 500
  };

  // --- 3. Chart Data: Team Task Contributions ---
  const teamContributionData = members.map((m) => {
    const assigned = tasks.filter((t) => t.assignee?._id === m._id).length;
    const completed = tasks.filter((t) => t.assignee?._id === m._id && (t.status === "Done" || t.completed)).length;
    return {
      name: m.name.split(" ")[0] || m.username, // Use first name or username
      Assigned: assigned,
      Completed: completed,
    };
  });

  // Include unassigned task counts if they exist
  const unassignedTasksCount = tasks.filter((t) => !t.assignee).length;
  if (unassignedTasksCount > 0) {
    const unassignedCompleted = tasks.filter((t) => !t.assignee && (t.status === "Done" || t.completed)).length;
    teamContributionData.push({
      name: "Unassigned",
      Assigned: unassignedTasksCount,
      Completed: unassignedCompleted,
    });
  }

  // --- 4. Chart Data: Expense Spending Curve ---
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const expensesByDate: Record<string, number> = {};
  sortedExpenses.forEach((exp) => {
    const dateStr = new Date(exp.date).toLocaleDateString([], { month: "short", day: "numeric" });
    expensesByDate[dateStr] = (expensesByDate[dateStr] || 0) + exp.amount;
  });

  let runningCost = 0;
  const expenseTimelineData = Object.keys(expensesByDate).map((date) => {
    runningCost += expensesByDate[date];
    return {
      date,
      "Daily Spent": Number(expensesByDate[date].toFixed(2)),
      "Total Cost": Number(runningCost.toFixed(2)),
    };
  });

  // Calculate expense categories breakdown
  const categoryExpenses: Record<string, number> = {
    Hosting: 0,
    Domain: 0,
    API: 0,
    Tools: 0,
    Other: 0,
  };
  expenses.forEach((e) => {
    if (categoryExpenses[e.category] !== undefined) {
      categoryExpenses[e.category] += e.amount;
    } else {
      categoryExpenses.Other += e.amount;
    }
  });

  const categoryColors = ["#8b5cf6", "#06b6d4", "#ec4899", "#f59e0b", "#71717a"];

  // --- 5. Chart Data: Task Completion Progress Over Time ---
  const completedTasksList = tasks
    .filter((t) => t.status === "Done" || t.completed)
    .map((t) => ({
      ...t,
      completionDate: t.updatedAt ? new Date(t.updatedAt) : new Date(),
    }))
    .sort((a, b) => a.completionDate.getTime() - b.completionDate.getTime());

  const completionsByDate: Record<string, number> = {};
  completedTasksList.forEach((t) => {
    const dateStr = t.completionDate.toLocaleDateString([], { month: "short", day: "numeric" });
    completionsByDate[dateStr] = (completionsByDate[dateStr] || 0) + 1;
  });

  let runningCompleted = 0;
  const completionTimelineData = Object.keys(completionsByDate).map((date) => {
    runningCompleted += completionsByDate[date];
    return {
      date,
      "Tasks Completed": runningCompleted,
    };
  });

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-zinc-500 text-xs">
        Loading analytics charts...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Task Completion */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 backdrop-blur-md shadow-lg flex flex-col justify-between hover:border-zinc-800/80 transition duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Tasks Complete</p>
              <h3 className="text-2xl font-black text-zinc-150 mt-1">
                {completedTasks} <span className="text-xs font-semibold text-zinc-500">/ {totalTasks}</span>
              </h3>
            </div>
            <span className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <CheckSquare className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-zinc-400 font-bold mb-1">
              <span>Progress</span>
              <span>{taskCompletionRate}%</span>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${taskCompletionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Spending */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 backdrop-blur-md shadow-lg flex flex-col justify-between hover:border-zinc-800/80 transition duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Project Budget spent</p>
              <h3 className="text-2xl font-black text-zinc-150 mt-1">
                ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="p-2 bg-violet-500/10 rounded-lg text-violet-400 border border-violet-500/20">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-zinc-400" />
            <span>Across {expenses.length} financial ledger logs</span>
          </div>
        </div>

        {/* Card 3: Resources Vault */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 backdrop-blur-md shadow-lg flex flex-col justify-between hover:border-zinc-800/80 transition duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Resource Links</p>
              <h3 className="text-2xl font-black text-zinc-150 mt-1">{totalResources}</h3>
            </div>
            <span className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
              <FolderOpen className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 text-[10px] text-zinc-500 font-semibold">
            <span>Figma, GitHub repos, and docs</span>
          </div>
        </div>

        {/* Card 4: Discussion Hub */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 backdrop-blur-md shadow-lg flex flex-col justify-between hover:border-zinc-800/80 transition duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Activity Score</p>
              <h3 className="text-2xl font-black text-zinc-150 mt-1">{totalActivityScore}</h3>
            </div>
            <span className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
              <MessageSquare className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 text-[10px] text-zinc-500 font-semibold flex items-center gap-1.5">
            <span>{totalDiscussions} topics</span>
            <span>•</span>
            <span>{totalReplies} replies</span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart A: Task Status Breakdown (Pie) */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur shadow-xl space-y-4 min-w-0">
          <div>
            <h4 className="text-sm font-bold text-zinc-200">Task Status Breakdown</h4>
            <p className="text-[10px] text-zinc-500">Distribution of Kanban board tasks across statuses</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            {tasks.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={statusChartData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || "#71717a"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      borderColor: "#18181b",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#d4d4d8", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-zinc-650 italic font-medium">No tasks logged yet</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-900 text-xs font-semibold">
            {Object.keys(statusCounts).map((status) => (
              <div key={status} className="flex items-center justify-between px-2 py-1 rounded bg-zinc-900/20 border border-zinc-900/60">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[status] }}
                  />
                  <span className="text-zinc-400 text-[11px]">{status}</span>
                </div>
                <span className="text-zinc-200 text-[11px]">
                  {statusCounts[status as keyof typeof statusCounts]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart B: Team Task Contributions (Bar) */}
        <div className="lg:col-span-7 rounded-xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur shadow-xl space-y-4 min-w-0">
          <div>
            <h4 className="text-sm font-bold text-zinc-200">Team Contributions</h4>
            <p className="text-[10px] text-zinc-500">Tasks assigned versus completed per member</p>
          </div>
          <div className="h-72 w-full">
            {tasks.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={teamContributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      borderColor: "#18181b",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ fontSize: "12px" }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }} />
                  <Bar dataKey="Assigned" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-650 italic font-medium">
                No contribution statistics available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spending Curves & Progress Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart C: Budget Expense Trend (Area Chart) */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur shadow-xl space-y-4 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-bold text-zinc-200">Budget Cumulative Spend</h4>
              <p className="text-[10px] text-zinc-500">Ledger expenditure trend line chart</p>
            </div>
            <div className="text-[10px] text-violet-400 bg-violet-500/5 border border-violet-500/10 px-2 py-0.5 rounded font-extrabold tracking-wider uppercase">
              Financials
            </div>
          </div>
          <div className="h-64 w-full">
            {expenses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={expenseTimelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                  <XAxis dataKey="date" stroke="#52525b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      borderColor: "#18181b",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ fontSize: "11px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Total Cost"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorCost)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-650 italic font-medium">
                No financial expenditures logged
              </div>
            )}
          </div>
          {/* Category Quick list */}
          {expenses.length > 0 && (
            <div className="pt-3 border-t border-zinc-900 grid grid-cols-5 gap-2 text-[10px] font-semibold text-zinc-400">
              {Object.keys(categoryExpenses).map((cat, idx) => {
                const amount = categoryExpenses[cat];
                const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
                return (
                  <div key={cat} className="flex flex-col space-y-1">
                    <span className="truncate text-zinc-550">{cat}</span>
                    <span className="text-zinc-200">${amount.toFixed(0)}</span>
                    <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                      <div
                        className="h-1 rounded-full"
                        style={{
                          backgroundColor: categoryColors[idx % categoryColors.length],
                          width: `${pct}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart D: Project Completion Velocity (Line Chart) */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur shadow-xl space-y-4 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-bold text-zinc-200">Project Velocity</h4>
              <p className="text-[10px] text-zinc-500">Cumulative task completion counts over time</p>
            </div>
            <div className="text-[10px] text-emerald-450 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded font-extrabold tracking-wider uppercase">
              Velocity
            </div>
          </div>
          <div className="h-64 w-full">
            {completedTasksList.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={completionTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                  <XAxis dataKey="date" stroke="#52525b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      borderColor: "#18181b",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ fontSize: "11px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Tasks Completed"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    activeDot={{ r: 6 }}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-650 italic font-medium">
                No completed tasks to map velocity
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-zinc-900 flex justify-between items-center text-[10px] text-zinc-500 font-semibold">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Showing task completions chronologically
            </span>
            <span>Total Tasks Done: {completedTasks}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
