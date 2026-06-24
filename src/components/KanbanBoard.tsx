"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { addTask, updateTaskStatus, toggleTaskCompletion } from "@/lib/actions/hubActions";
import { Plus, ArrowRight, ArrowLeft, Calendar, User, Clock, Loader2, CheckCircle } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
}

interface KanbanBoardProps {
  projectId: string;
  initialTasks: TaskType[];
  members: MemberType[];
  tasks?: TaskType[];
  setTasks?: React.Dispatch<React.SetStateAction<TaskType[]>>;
}

// Column wrapper supporting Droppable behavior
function ColumnContainer({
  col,
  children,
}: {
  col: { id: string; label: string; border: string; bg: string };
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: col.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border ${col.border} ${col.bg} p-4 flex flex-col min-h-[400px] transition-colors duration-200`}
    >
      {children}
    </div>
  );
}

// Individual Sortable Task Card
function SortableTaskCard({
  task,
  updatingTaskId,
  colId,
  handleToggleComplete,
  moveTask,
  isOverlay = false,
}: {
  task: TaskType;
  updatingTaskId: string | null;
  colId: string;
  handleToggleComplete: (taskId: string, currentCompleted: boolean) => void;
  moveTask: (taskId: string, currentStatus: TaskType["status"], direction: "left" | "right") => void;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.35 : undefined,
  };

  const isUrgent = task.dueDate
    ? (new Date(task.dueDate).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000
    : false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-4 shadow-md transition hover:border-zinc-700/80 cursor-grab active:cursor-grabbing ${
        isOverlay ? "ring-2 ring-violet-500 scale-[1.02] rotate-[2deg] shadow-2xl bg-zinc-900 border-zinc-700" : ""
      }`}
    >
      {updatingTaskId === task._id && (
        <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        </div>
      )}

      {(isUrgent || task.completed) && (
        <div className="mb-2 flex flex-wrap gap-1.5 items-center">
          {isUrgent && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider uppercase border bg-rose-500/10 text-rose-400 border-rose-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              Urgent
            </span>
          )}
          {task.completed && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Completed
            </span>
          )}
        </div>
      )}

      <h5 className="text-sm font-bold text-zinc-200 mb-1 pointer-events-none select-none">{task.title}</h5>
      {task.description && (
        <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed pointer-events-none select-none">
          {task.description}
        </p>
      )}

      {/* Metadata Assignee and Date */}
      <div className="flex flex-wrap gap-2 justify-between items-center text-[10px] text-zinc-500 pt-2 border-t border-zinc-900 pointer-events-none select-none">
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            {task.assignee.image ? (
              <img
                src={task.assignee.image}
                alt={task.assignee.name}
                className="h-4.5 w-4.5 rounded-full object-cover ring-1 ring-zinc-800 pointer-events-none"
              />
            ) : (
              <User className="h-3.5 w-3.5" />
            )}
            <span className="font-medium text-zinc-400 truncate max-w-[80px]">
              {task.assignee.name}
            </span>
          </div>
        ) : (
          <span className="italic text-zinc-600">Unassigned</span>
        )}

        {task.dueDate && (
          <div className="flex items-center gap-1 font-medium text-amber-500/80">
            <Clock className="h-3 w-3" />
            <span>{new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
          </div>
        )}
      </div>

      {/* Navigation status controls */}
      <div className="flex items-center justify-between gap-1 mt-3 pt-2 border-t border-zinc-900/50">
        <div>
          {colId === "Done" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleComplete(task._id, task.completed || false);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                task.completed
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-pointer"
                  : "bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 cursor-pointer"
              }`}
            >
              <CheckCircle className={`h-3.5 w-3.5 ${task.completed ? "fill-emerald-400/20" : ""}`} />
              {task.completed ? "Completed" : "Mark Completed"}
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {colId !== "Todo" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                moveTask(task._id, task.status, "left");
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 transition hover:text-zinc-200 cursor-pointer"
              title="Move left"
            >
              <ArrowLeft className="h-3 w-3" />
            </button>
          )}
          {colId !== "Done" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                moveTask(task._id, task.status, "right");
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 transition hover:text-zinc-200 cursor-pointer"
              title="Move right"
            >
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KanbanBoard({
  projectId,
  initialTasks,
  members,
  tasks: propsTasks,
  setTasks: propsSetTasks,
}: KanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState<TaskType[]>(initialTasks);
  const tasks = propsTasks !== undefined ? propsTasks : localTasks;
  const setTasks = propsSetTasks !== undefined ? propsSetTasks : setLocalTasks;
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<TaskType | null>(null);

  const columns: { id: "Todo" | "In Progress" | "Review" | "Done"; label: string; border: string; bg: string }[] = [
    { id: "Todo", label: "To Do", border: "border-zinc-800", bg: "bg-zinc-950/20" },
    { id: "In Progress", label: "In Progress", border: "border-sky-950/40", bg: "bg-sky-950/5" },
    { id: "Review", label: "Review", border: "border-amber-950/40", bg: "bg-amber-950/5" },
    { id: "Done", label: "Done", border: "border-emerald-950/40", bg: "bg-emerald-950/5" },
  ];

  // Move task left or right
  const moveTask = async (taskId: string, currentStatus: "Todo" | "In Progress" | "Review" | "Done", direction: "left" | "right") => {
    const statuses: ("Todo" | "In Progress" | "Review" | "Done")[] = ["Todo", "In Progress", "Review", "Done"];
    const currentIndex = statuses.indexOf(currentStatus);
    let nextIndex = direction === "right" ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex < 0 || nextIndex >= statuses.length) return;
    const nextStatus = statuses[nextIndex];

    setUpdatingTaskId(taskId);
    try {
      const res = await updateTaskStatus(projectId, taskId, nextStatus);
      if (res.success) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? { ...t, status: nextStatus } : t))
        );
      }
    } catch (err) {
      console.error("Failed to update task status:", err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Toggle task completion
  const handleToggleComplete = async (taskId: string, currentCompleted: boolean) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await toggleTaskCompletion(projectId, taskId, !currentCompleted);
      if (res.success) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? { ...t, completed: !currentCompleted } : t))
        );
      }
    } catch (err) {
      console.error("Failed to toggle task completion:", err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Add Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setAddingTask(true);
    try {
      const res = await addTask(projectId, {
        title: newTaskTitle,
        description: newTaskDesc,
        assigneeId: newTaskAssignee || undefined,
        dueDate: newTaskDueDate || undefined,
      });

      if (res.success) {
        // Refresh local task state (fetch or construct payload)
        const newAssigneeObj = members.find((m) => m._id === newTaskAssignee);
        const newTaskItem: TaskType = {
          _id: res.taskId,
          title: newTaskTitle,
          description: newTaskDesc,
          status: "Todo",
          assignee: newAssigneeObj,
          dueDate: newTaskDueDate || undefined,
        };

        setTasks((prev) => [...prev, newTaskItem]);
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskAssignee("");
        setNewTaskDueDate("");
        setShowAddForm(false);
      }
    } catch (err) {
      console.error("Failed to add task:", err);
    } finally {
      setAddingTask(false);
    }
  };

  // Configure PointerSensor with activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const task = tasks.find((t) => t._id === activeId);
    if (!task) return;

    // Over can be a column ID ("Todo", "In Progress", "Review", "Done") or another task ID.
    let targetStatus: TaskType["status"] | null = null;

    if (["Todo", "In Progress", "Review", "Done"].includes(overId)) {
      targetStatus = overId as TaskType["status"];
    } else {
      const overTask = tasks.find((t) => t._id === overId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (targetStatus && targetStatus !== task.status) {
      setUpdatingTaskId(activeId);
      try {
        const res = await updateTaskStatus(projectId, activeId, targetStatus);
        if (res.success) {
          setTasks((prev) =>
            prev.map((t) => (t._id === activeId ? { ...t, status: targetStatus! } : t))
          );
        }
      } catch (err) {
        console.error("Failed to update task status:", err);
      } finally {
        setUpdatingTaskId(null);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Board Header Actions */}
        <div className="flex items-center justify-between select-none">
          <h3 className="text-sm font-bold text-zinc-300">Kanban Board</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-500 text-white rounded-md px-3.5 py-1.5 text-xs font-semibold shadow transition duration-200 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Create Task
          </button>
        </div>

        {/* Add Task Modal/Form */}
        {showAddForm && (
          <form onSubmit={handleAddTask} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 max-w-md space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-zinc-200">Create New Task</h4>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Title *</label>
              <input
                type="text"
                required
                placeholder="Design database schemas"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Description</label>
              <textarea
                placeholder="Outline User, Project and TeamMember models"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
                rows={2}
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Assignee</label>
                <select
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-violet-500"
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} (@{m.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Due Date</label>
                <input
                  type="date"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-305 focus:outline-none focus:border-violet-500"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-xs font-semibold text-zinc-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingTask}
                className="px-3.5 py-1.5 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow disabled:opacity-50 cursor-pointer"
              >
                {addingTask ? "Adding..." : "Add Task"}
              </button>
            </div>
          </form>
        )}

        {/* Grid Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            const colTaskIds = colTasks.map((t) => t._id);

            return (
              <ColumnContainer key={col.id} col={col}>
                {/* Column Title */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800/60 select-none">
                  <span className="text-sm font-bold text-zinc-200">{col.label}</span>
                  <span className="bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] font-bold rounded-full px-2 py-0.5">
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks List */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  <SortableContext items={colTaskIds} strategy={verticalListSortingStrategy}>
                    {colTasks.map((task) => (
                      <SortableTaskCard
                        key={task._id}
                        task={task}
                        updatingTaskId={updatingTaskId}
                        colId={col.id}
                        handleToggleComplete={handleToggleComplete}
                        moveTask={moveTask}
                      />
                    ))}
                  </SortableContext>

                  {colTasks.length === 0 && (
                    <div className="flex items-center justify-center border border-dashed border-zinc-800 rounded-lg p-5 text-[10px] text-zinc-600 font-medium select-none">
                      No tasks in {col.label}
                    </div>
                  )}
                </div>
              </ColumnContainer>
            );
          })}
        </div>
      </div>

      {activeTask && typeof document !== "undefined"
        ? createPortal(
            <DragOverlay dropAnimation={null}>
              <SortableTaskCard
                task={activeTask}
                updatingTaskId={null}
                colId={activeTask.status}
                handleToggleComplete={handleToggleComplete}
                moveTask={moveTask}
                isOverlay={true}
              />
            </DragOverlay>,
            document.body
          )
        : null}
    </DndContext>
  );
}
