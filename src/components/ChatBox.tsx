"use client";

import React, { useState, useEffect, useRef } from "react";
import { sendMessage } from "@/lib/actions/chatActions";
import { pusherClient } from "@/lib/pusherClient";
import { Send, Image, Loader2, Paperclip, X } from "lucide-react";

interface MessageType {
  _id: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
  text: string;
  attachments: string[];
  createdAt: string;
}

interface ChatBoxProps {
  projectId: string;
  currentUserId: string;
  currentUserImage?: string;
  currentUserName?: string;
}

export default function ChatBox({ 
  projectId, 
  currentUserId, 
  currentUserImage,
  currentUserName 
}: ChatBoxProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time typing indicators mapping: userId -> userName
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({});
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial messages history once
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/chat?projectId=${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Error fetching chat messages:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, [projectId]);

  // Subscribe to Pusher channel for real-time messages & typing notifications
  useEffect(() => {
    const channelName = `private-chat-${projectId}`;
    const channel = pusherClient.subscribe(channelName);

    // Bind message incoming broadcast
    channel.bind("new-message", (data: MessageType) => {
      setMessages((prev) => {
        if (prev.some((msg) => msg._id === data._id)) {
          return prev;
        }
        return [...prev, data];
      });
    });

    // Bind typing broadcast events from other channel members
    channel.bind("client-typing", (data: { userId: string; name: string; typing: boolean }) => {
      if (data.userId === currentUserId) return;

      setTypingUsers((prev) => {
        const updated = { ...prev };
        if (data.typing) {
          updated[data.userId] = data.name;
        } else {
          delete updated[data.userId];
        }
        return updated;
      });
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [projectId, currentUserId]);

  // Clear typing timeouts on component unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // Emit client typing notifications (client events)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    const channelName = `private-chat-${projectId}`;

    // If user clears the text input, stop the typing indicator immediately
    if (val.trim() === "") {
      if (isTypingLocal) {
        setIsTypingLocal(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        try {
          pusherClient.channel(channelName)?.trigger("client-typing", {
            userId: currentUserId,
            name: "",
            typing: false,
          });
        } catch (err) {}
      }
      return;
    }

    // Trigger typing: true once when the user starts typing
    if (!isTypingLocal) {
      setIsTypingLocal(true);
      try {
        pusherClient.channel(channelName)?.trigger("client-typing", {
          userId: currentUserId,
          name: currentUserName || "Someone",
          typing: true,
        });
      } catch (err) {}
    }

    // Reset debounce timer to trigger typing: false after 1.5 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingLocal(false);
      try {
        pusherClient.channel(channelName)?.trigger("client-typing", {
          userId: currentUserId,
          name: "",
          typing: false,
        });
      } catch (err) {}
    }, 1500);
  };

  // Handle Send Message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && attachments.length === 0) return;

    const messageText = text;
    const messageAttachments = [...attachments];

    setText("");
    setAttachments([]);

    // Turn off typing indicator locally & broadcast stopped typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingLocal) {
      setIsTypingLocal(false);
      try {
        pusherClient.channel(`private-chat-${projectId}`)?.trigger("client-typing", {
          userId: currentUserId,
          name: "",
          typing: false,
        });
      } catch (err) {}
    }

    try {
      await sendMessage(projectId, messageText, messageAttachments);
      // Snappy updates are handled by the real-time websocket broadcast now!
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Handle File Upload to Cloudinary
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setAttachments((prev) => [...prev, data.url]);
        }
      } else {
        console.error("Upload failed");
      }
    } catch (err) {
      console.error("Error uploading file:", err);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="flex flex-col h-[550px] rounded-xl border border-zinc-800 bg-zinc-950/80 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-900/60 border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-200">Team Workspace Chat</h3>
          <p className="text-[10px] text-emerald-400 flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live polling synced
          </p>
        </div>
      </div>

      {/* Message History list */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            <span className="text-xs">Loading conversations...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <p className="text-xs">No messages yet. Send the first message to start brainstorming!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender._id === currentUserId;
            return (
              <div key={msg._id} className={`flex items-start gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  msg.sender.image ? (
                    <img
                      src={msg.sender.image}
                      alt={msg.sender.name}
                      className="h-7 w-7 rounded-full object-cover ring-1 ring-zinc-800 mt-1"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-zinc-800 text-xs font-bold text-zinc-300 flex items-center justify-center mt-1">
                      {msg.sender.name[0]}
                    </div>
                  )
                )}

                <div className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] text-zinc-500 font-medium mb-1">
                    {msg.sender.name} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <div
                    className={`rounded-xl px-4 py-2.5 text-sm shadow ${
                      isMe
                        ? "bg-violet-600 text-white rounded-tr-none"
                        : "bg-zinc-900 border border-zinc-850 text-zinc-200 rounded-tl-none"
                    }`}
                  >
                    {msg.text && <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>}

                    {/* Attachments rendering */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {msg.attachments.map((url, idx) => (
                          <a href={url} target="_blank" rel="noreferrer" key={idx} className="block group relative rounded overflow-hidden border border-zinc-800">
                            <img
                              src={url}
                              alt="Attachment"
                              className="max-w-full max-h-48 object-cover rounded cursor-zoom-in transition hover:opacity-90"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Real-Time Typing Indicator Bubble */}
        {Object.keys(typingUsers).length > 0 && (
          <div className="flex items-center gap-2 px-1 text-zinc-400 py-1 transition-all duration-300 animate-fade-in">
            <div className="flex gap-1.5 items-center bg-zinc-905 border border-zinc-800 px-3.5 py-2 rounded-xl rounded-tl-none text-xs shadow-md">
              <span className="font-semibold text-zinc-300">
                {Object.values(typingUsers).join(", ")}
              </span>
              <span className="text-zinc-500">is typing</span>
              <div className="flex gap-0.5 items-center ml-1 mt-0.5">
                <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File Previews */}
      {attachments.length > 0 && (
        <div className="bg-zinc-900/40 border-t border-zinc-800 px-5 py-3 flex flex-wrap gap-2">
          {attachments.map((url, idx) => (
            <div key={idx} className="relative rounded overflow-hidden border border-zinc-800 h-14 w-14 bg-zinc-950">
              <img src={url} alt="Upload preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="absolute top-0.5 right-0.5 rounded-full bg-zinc-950/80 p-0.5 text-zinc-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Form Input Footer */}
      <form onSubmit={handleSend} className="bg-zinc-900/30 border-t border-zinc-800 px-4 py-3.5 flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center justify-center rounded-lg h-9 w-9 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin text-violet-400" /> : <Image className="h-4 w-4" />}
        </button>

        <input
          type="text"
          value={text}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors"
        />

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg h-9 w-9 bg-violet-600 hover:bg-violet-500 text-white shadow transition-all duration-200"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
