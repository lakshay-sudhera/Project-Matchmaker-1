"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ChatBox from "@/components/ChatBox";
import KanbanBoard from "@/components/KanbanBoard";
import ExpenseChart from "@/components/ExpenseChart";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { addResource, deleteResource, createDiscussion, createDiscussionReply } from "@/lib/actions/hubActions";
import { Link as LinkIcon, Plus, Trash2, ExternalLink, MessageSquare, PlusCircle, Reply, User, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AlertDialog from "@/components/AlertDialog";

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

interface WorkspaceHubProps {
  projectId: string;
  projectTitle: string;
  projectOwnerId: string;
  currentUserId: string;
  currentUserImage?: string;
  currentUserName?: string;
  members: MemberType[];
  initialTasks: TaskType[];
  initialExpenses: ExpenseType[];
  initialResources: ResourceType[];
  initialDiscussions: DiscussionType[];
  initialTab?: string;
}

export default function WorkspaceHubClient({
  projectId,
  projectTitle,
  projectOwnerId,
  currentUserId,
  currentUserImage,
  currentUserName,
  members,
  initialTasks,
  initialExpenses,
  initialResources,
  initialDiscussions,
  initialTab,
}: WorkspaceHubProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "chat");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // State managers
  const [tasks, setTasks] = useState<TaskType[]>(initialTasks);
  const [expenses, setExpenses] = useState<ExpenseType[]>(initialExpenses);
  const [resources, setResources] = useState<ResourceType[]>(initialResources);
  const [discussions, setDiscussions] = useState<DiscussionType[]>(initialDiscussions);

  // Alert Dialog States
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);

  // Resource form state
  const [resTitle, setResTitle] = useState("");
  const [resUrl, setResUrl] = useState("");
  const [resCat, setResCat] = useState<"GitHub" | "Figma" | "Docs" | "Presentation" | "Other">("Docs");
  const [resLoading, setResLoading] = useState(false);
  const [resShowForm, setResShowForm] = useState(false);

  // Discussion form state
  const [discTitle, setDiscTitle] = useState("");
  const [discContent, setDiscContent] = useState("");
  const [discLoading, setDiscLoading] = useState(false);
  const [discShowForm, setDiscShowForm] = useState(false);

  // Active Discussion Thread detail state
  const [selectedDiscussion, setSelectedDiscussion] = useState<DiscussionType | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // Handle Add Resource
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resUrl.trim()) return;

    setResLoading(true);
    try {
      const res = await addResource(projectId, {
        title: resTitle,
        url: resUrl,
        category: resCat,
      });

      if (res.success) {
        const newRes: ResourceType = {
          _id: res.resourceId,
          title: resTitle,
          url: resUrl,
          category: resCat,
          creator: {
            _id: currentUserId,
            name: "Me",
          },
        };
        setResources((prev) => [newRes, ...prev]);
        setResTitle("");
        setResUrl("");
        setResShowForm(false);
        toast.success("Resource shared successfully!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to share resource link.");
    } finally {
      setResLoading(false);
    }
  };

  // Handle Delete Resource click
  const handleDeleteResourceClick = (resourceId: string) => {
    setResourceToDelete(resourceId);
    setIsAlertOpen(true);
  };

  // Handle Confirm Delete Resource
  const handleConfirmDeleteResource = async () => {
    if (!resourceToDelete) return;
    const resourceId = resourceToDelete;
    try {
      const res = await deleteResource(projectId, resourceId);
      if (res.success) {
        setResources((prev) => prev.filter((r) => r._id !== resourceId));
        toast.success("Resource deleted successfully!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete resource.");
    } finally {
      setResourceToDelete(null);
    }
  };

  // Handle Create Discussion
  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discTitle.trim() || !discContent.trim()) return;

    setDiscLoading(true);
    try {
      const res = await createDiscussion(projectId, {
        title: discTitle,
        content: discContent,
      });

      if (res.success) {
        const newDisc: DiscussionType = {
          _id: res.discussionId,
          title: discTitle,
          content: discContent,
          createdAt: new Date().toISOString(),
          creator: {
            _id: currentUserId,
            name: "Me",
            username: "me",
          },
          replies: [],
        };
        setDiscussions((prev) => [newDisc, ...prev]);
        setDiscTitle("");
        setDiscContent("");
        setDiscShowForm(false);
        toast.success("Discussion topic created!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create discussion topic.");
    } finally {
      setDiscLoading(false);
    }
  };

  // Handle Send Discussion Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedDiscussion) return;

    setReplyLoading(true);
    try {
      const res = await createDiscussionReply(projectId, selectedDiscussion._id, replyContent);
      if (res.success) {
        const newReply: ReplyType = {
          _id: res.replyId,
          content: replyContent,
          createdAt: new Date().toISOString(),
          creator: {
            name: "Me",
            username: "me",
            image: currentUserImage,
          },
        };

        // Update local discussion arrays
        const updatedDiscussions = discussions.map((d) => {
          if (d._id === selectedDiscussion._id) {
            const updated = { ...d, replies: [...d.replies, newReply] };
            setSelectedDiscussion(updated);
            return updated;
          }
          return d;
        });

        setDiscussions(updatedDiscussions);
        setReplyContent("");
        toast.success("Reply posted!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to post reply.");
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8">

      {/* 1. Sidebar Nav */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedDiscussion(null);
        }}
        projectTitle={projectTitle}
        projectId={projectId}
      />

      {/* 2. Main content area based on active module tab */}
      <div className="flex-1 min-h-[550px]">

        {/* TAB A: TEAM CHAT BOX */}
        {activeTab === "chat" && (
          <ChatBox
            projectId={projectId}
            currentUserId={currentUserId}
            currentUserImage={currentUserImage}
            currentUserName={currentUserName}
          />
        )}

        {/* TAB B: KANBAN TASK BOARD */}
        {activeTab === "kanban" && (
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur shadow-xl">
            <KanbanBoard
              projectId={projectId}
              tasks={tasks}
              setTasks={setTasks}
              members={members}
              initialTasks={initialTasks}
            />
          </div>
        )}

        {/* TAB C: DISCUSSIONS FORUM */}
        {activeTab === "discussions" && (
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur shadow-xl space-y-6">

            {/* If looking at replies thread */}
            {selectedDiscussion ? (
              <div className="space-y-6">
                {/* Back Link */}
                <button
                  onClick={() => setSelectedDiscussion(null)}
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Discussion List
                </button>

                {/* Main Thread Card */}
                <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    {selectedDiscussion.creator.image ? (
                      <img src={selectedDiscussion.creator.image} alt={selectedDiscussion.creator.name} className="h-6 w-6 rounded-full" />
                    ) : (
                      <User className="h-5 w-5 text-zinc-500" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-zinc-300">{selectedDiscussion.creator.name}</h4>
                      <p className="text-[9px] text-zinc-550">@{selectedDiscussion.creator.username} • {new Date(selectedDiscussion.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <h3 className="text-base font-extrabold text-zinc-100 mb-2">{selectedDiscussion.title}</h3>
                  <p className="text-sm text-zinc-350 leading-relaxed whitespace-pre-line bg-zinc-950/30 border border-zinc-900 p-3 rounded-lg">
                    {selectedDiscussion.content}
                  </p>
                </div>

                {/* Replies Thread list */}
                <div className="space-y-4 pl-4 border-l border-zinc-900">
                  <h4 className="text-xs font-bold text-zinc-550 uppercase tracking-wider">Replies ({selectedDiscussion.replies.length})</h4>

                  {selectedDiscussion.replies.map((reply) => (
                    <div key={reply._id} className="border border-zinc-900 bg-zinc-900/15 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        {reply.creator.image ? (
                          <img src={reply.creator.image} alt={reply.creator.name} className="h-5.5 w-5.5 rounded-full" />
                        ) : (
                          <User className="h-4.5 w-4.5 text-zinc-650" />
                        )}
                        <span className="text-xs font-bold text-zinc-300">{reply.creator.name}</span>
                        <span className="text-[10px] text-zinc-500">@{reply.creator.username}</span>
                      </div>
                      <p className="text-xs text-zinc-350 leading-relaxed">{reply.content}</p>
                    </div>
                  ))}

                  {/* Reply Input Form */}
                  <form onSubmit={handleSendReply} className="space-y-3 pt-2">
                    <textarea
                      required
                      placeholder="Add a constructive reply..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
                      rows={3}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={replyLoading}
                        className="inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-500 text-white rounded-md px-3.5 py-1.5 text-xs font-semibold shadow disabled:opacity-55"
                      >
                        <Reply className="h-3.5 w-3.5" /> Post Reply
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              // General Discussions Listing
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-300">Discussion Boards</h3>
                    <p className="text-[10px] text-zinc-500">Post details about design schemas, architectures or bug reporting</p>
                  </div>
                  <button
                    onClick={() => setDiscShowForm(!discShowForm)}
                    className="inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-500 text-white rounded-md px-3.5 py-1.5 text-xs font-semibold shadow transition duration-205"
                  >
                    <Plus className="h-4 w-4" /> Start Topic
                  </button>
                </div>

                {/* Form to Create Topic */}
                {discShowForm && (
                  <form onSubmit={handleCreateDiscussion} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
                    <h4 className="text-sm font-bold text-zinc-200">Start a Discussion Topic</h4>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="Database Planning: PostgreSQL vs MongoDB"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
                        value={discTitle}
                        onChange={(e) => setDiscTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Details *</label>
                      <textarea
                        required
                        placeholder="Explain the thoughts and design parameters here..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
                        rows={4}
                        value={discContent}
                        onChange={(e) => setDiscContent(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setDiscShowForm(false)}
                        className="px-3.5 py-1.5 rounded bg-zinc-900 border border-zinc-850 text-xs font-semibold text-zinc-400"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={discLoading}
                        className="px-3.5 py-1.5 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow"
                      >
                        {discLoading ? "Posting..." : "Create"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Topics list */}
                <div className="space-y-4">
                  {discussions.length > 0 ? (
                    discussions.map((disc) => (
                      <div
                        key={disc._id}
                        onClick={() => setSelectedDiscussion(disc)}
                        className="border border-zinc-900 hover:border-zinc-800 bg-zinc-900/10 rounded-xl p-5 cursor-pointer transition flex justify-between items-start gap-4"
                      >
                        <div className="space-y-2">
                          <h4 className="text-sm font-extrabold text-zinc-200 hover:text-violet-400 transition-colors">
                            {disc.title}
                          </h4>
                          <p className="text-xs text-zinc-500 line-clamp-2">{disc.content}</p>
                          <div className="text-[10px] text-zinc-550 flex items-center gap-1.5 font-medium">
                            <span>Posted by {disc.creator.name}</span>
                            <span>•</span>
                            <span>{new Date(disc.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <span className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded px-2.5 py-1 text-xs font-bold shrink-0">
                          <MessageSquare className="h-3.5 w-3.5 text-violet-400" />
                          <span>{disc.replies.length} replies</span>
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center border border-dashed border-zinc-900 rounded-xl p-8 text-center text-xs text-zinc-550 italic">
                      No active topics found. Start a topic to coordinate with your team!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB D: RESOURCE VAULT LIST */}
        {activeTab === "resources" && (
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-6 backdrop-blur shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-zinc-300">Resource Vault</h3>
                <p className="text-[10px] text-zinc-500">Store and access useful design files, Figma, GitHub repositories and documentation</p>
              </div>
              <button
                onClick={() => setResShowForm(!resShowForm)}
                className="inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-500 text-white rounded-md px-3.5 py-1.5 text-xs font-semibold shadow transition duration-200"
              >
                <Plus className="h-4 w-4" /> Share Link
              </button>
            </div>

            {/* Share Link Form */}
            {resShowForm && (
              <form onSubmit={handleAddResource} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
                <h4 className="text-sm font-bold text-zinc-200">Share Resource Link</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="Figma Prototype Mockup"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
                      value={resTitle}
                      onChange={(e) => setResTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                    <select
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-350 focus:outline-none focus:border-violet-500"
                      value={resCat}
                      onChange={(e) => setResCat(e.target.value as any)}
                    >
                      <option value="GitHub">GitHub Repository</option>
                      <option value="Figma">Figma Design</option>
                      <option value="Docs">Documentation</option>
                      <option value="Presentation">Presentation Deck</option>
                      <option value="Other">Other Reference Link</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">URL Link *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://figma.com/file/..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
                    value={resUrl}
                    onChange={(e) => setResUrl(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setResShowForm(false)}
                    className="px-3.5 py-1.5 rounded bg-zinc-900 border border-zinc-850 text-xs font-semibold text-zinc-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resLoading}
                    className="px-3.5 py-1.5 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow"
                  >
                    {resLoading ? "Adding..." : "Add Resource"}
                  </button>
                </div>
              </form>
            )}

            {/* List links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.length > 0 ? (
                resources.map((res) => (
                  <div
                    key={res._id}
                    className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 overflow-hidden">
                      <div className="flex items-center gap-1.5 text-[10px] text-violet-400 font-bold uppercase tracking-wider">
                        <LinkIcon className="h-3 w-3" />
                        <span>{res.category}</span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-200 truncate" title={res.title}>
                        {res.title}
                      </h4>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-zinc-500 hover:text-violet-400 flex items-center gap-1 truncate font-medium mt-1"
                      >
                        {res.url} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>

                    <button
                      onClick={() => handleDeleteResourceClick(res._id)}
                      className="text-zinc-650 hover:text-rose-455 p-2 rounded-md hover:bg-rose-500/5 transition shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center border border-dashed border-zinc-900 rounded-xl p-8 text-center text-xs text-zinc-555 italic">
                  No resources saved. Click Share Link to save tools for your teammates.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB E: EXPENSES CHARTS & LISTS */}
        {activeTab === "expenses" && (
          <ExpenseChart
            projectId={projectId}
            expenses={expenses}
            setExpenses={setExpenses}
            currentUserId={currentUserId}
            projectOwnerId={projectOwnerId}
            initialExpenses={initialExpenses}
          />
        )}

        {/* TAB F: PROJECT ANALYTICS DASHBOARD */}
        {activeTab === "analytics" && (
          <AnalyticsDashboard
            tasks={tasks}
            expenses={expenses}
            members={members}
            resources={resources}
            discussions={discussions}
          />
        )}

      </div>

    </div>

    <AlertDialog
      isOpen={isAlertOpen}
      onClose={() => {
        setIsAlertOpen(false);
        setResourceToDelete(null);
      }}
      onConfirm={handleConfirmDeleteResource}
      title="Delete Workspace Resource"
      description="Are you sure you want to delete this resource link? This will remove the reference link from this project team workspace."
      confirmText="Delete"
      isDestructive={true}
    />
  </>
);
}
