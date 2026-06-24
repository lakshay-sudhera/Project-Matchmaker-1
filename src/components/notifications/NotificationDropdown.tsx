"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Mail, Clipboard, Check, X, ShieldAlert, DollarSign, Calendar, Sparkles, MessageSquare, CheckCheck, Loader2 } from "lucide-react";

export interface NotificationType {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
  type: string;
  title: string;
  message: string;
  link: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  metadata?: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  notifications: NotificationType[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  loading: boolean;
}

export default function NotificationDropdown({
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
  loading,
}: NotificationDropdownProps) {
  const router = useRouter();

  const getIcon = (type: string) => {
    switch (type) {
      case "PROJECT_INVITATION":
        return <Mail className="h-4 w-4 text-amber-400" />;
      case "APPLICATION_UPDATE":
        return <Clipboard className="h-4 w-4 text-blue-400" />;
      case "APPLICATION_ACCEPTED":
        return <CheckCheck className="h-4 w-4 text-emerald-400" />;
      case "APPLICATION_REJECTED":
        return <ShieldAlert className="h-4 w-4 text-rose-400" />;
      case "CHAT_MESSAGE":
        return <MessageSquare className="h-4 w-4 text-violet-400" />;
      case "TASK_ASSIGNED":
        return <Clipboard className="h-4 w-4 text-indigo-400" />;
      case "EXPENSE_ADDED":
        return <DollarSign className="h-4 w-4 text-teal-400" />;
      case "DEADLINE_REMINDER":
        return <Calendar className="h-4 w-4 text-pink-400" />;
      default:
        return <Sparkles className="h-4 w-4 text-zinc-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "border-l-4 border-rose-500";
      case "MEDIUM":
        return "border-l-4 border-amber-500";
      default:
        return "border-l-4 border-transparent";
    }
  };

  const handleNotificationClick = async (notif: NotificationType) => {
    onMarkRead(notif._id);
    onClose();
    router.push(notif.link);
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (e) {
      return "";
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-zinc-900 bg-zinc-950/95 shadow-2xl backdrop-blur-md z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-3 bg-zinc-900/40">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">Notifications</h4>
          {unreadCount > 0 && (
            <p className="text-[10px] text-violet-400 font-bold mt-0.5">{unreadCount} unread alerts</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-wider"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-900/60 scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-zinc-500 gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
            <span className="text-xs font-semibold">Updating notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
            <span className="text-3xl mb-2">🔔</span>
            <p className="text-xs font-medium">All caught up! No notifications.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleNotificationClick(notif)}
              className={`flex items-start gap-3 px-4 py-3.5 hover:bg-zinc-900/35 cursor-pointer transition duration-150 relative ${
                notif.isRead ? "opacity-75" : "bg-violet-950/5"
              } ${getPriorityColor(notif.priority)}`}
            >
              {/* Sender Avatar or Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {notif.sender?.image ? (
                  <img
                    src={notif.sender.image}
                    alt={notif.sender.name}
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-zinc-800"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center shadow-inner">
                    {getIcon(notif.type)}
                  </div>
                )}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs truncate font-bold ${notif.isRead ? "text-zinc-400" : "text-zinc-200"}`}>
                    {notif.title}
                  </p>
                  <span className="text-[9px] text-zinc-500 font-semibold whitespace-nowrap">
                    {formatTime(notif.createdAt)}
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed break-words ${notif.isRead ? "text-zinc-500" : "text-zinc-350"}`}>
                  {notif.message}
                </p>
              </div>

              {/* Unread dot indicator */}
              {!notif.isRead && (
                <span className="absolute top-4 right-4 h-1.5 w-1.5 rounded-full bg-violet-500 shadow shadow-violet-500/50" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
