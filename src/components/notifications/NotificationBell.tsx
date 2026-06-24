"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { pusherClient } from "@/lib/pusherClient";
import NotificationDropdown, { NotificationType } from "./NotificationDropdown";

interface NotificationBellProps {
  currentUserId: string;
}

export default function NotificationBell({ currentUserId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bellAnimated, setBellAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data || []);
          setUnreadCount(data.filter((n: NotificationType) => !n.isRead).length);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    }

    if (currentUserId) {
      fetchNotifications();
    }
  }, [currentUserId]);

  // Subscribe to user-specific real-time Pusher channel
  useEffect(() => {
    if (!currentUserId) return;

    const channelName = `user-${currentUserId}-notifications`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("notification:new", (newNotif: NotificationType) => {
      // Check if user is currently viewing the page associated with the notification
      const currentPathName = window.location.pathname;
      if (currentPathName === newNotif.link) {
        // Auto mark as read immediately without displaying a toast or incrementing unread count
        fetch(`/api/notifications/${newNotif._id}/read`, { method: "PATCH" })
          .then((res) => {
            if (res.ok) {
              setNotifications((prev) => [
                { ...newNotif, isRead: true },
                ...prev.filter((n) => n._id !== newNotif._id),
              ]);
            }
          })
          .catch((err) => console.error("Error auto-marking notification read:", err));
      } else {
        // Prepend notification, update count, and play bell animation + toast
        setNotifications((prev) => [
          newNotif,
          ...prev.filter((n) => n._id !== newNotif._id),
        ]);
        setUnreadCount((c) => c + 1);
        setBellAnimated(true);
        setTimeout(() => setBellAnimated(false), 1000);

        // Display premium toast notification
        toast.info(newNotif.title, {
          description: newNotif.message,
          duration: 5000,
        });
      }
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [currentUserId]);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Mark a single notification as read
  const handleMarkRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
      toast.success("All notifications marked as read.");
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={() => setDropdownOpen((o) => !o)}
        className={`relative inline-flex items-center justify-center p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition cursor-pointer select-none ${
          bellAnimated ? "animate-bounce text-violet-400" : ""
        }`}
        title="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-violet-600 text-[9px] font-black text-white shadow-md shadow-violet-600/30">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {dropdownOpen && (
        <NotificationDropdown
          notifications={notifications}
          onClose={() => setDropdownOpen(false)}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          loading={loading}
        />
      )}
    </div>
  );
}
