"use client";

import React, { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Continue",
  cancelText = "Cancel",
  isDestructive = false,
}: AlertDialogProps) {
  // Prevent scrolling behind modal when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with fade-in */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Dialog content with scale-in */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-900 bg-zinc-950 p-6 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 ease-out-back">
        <div className="flex items-start gap-3.5">
          {isDestructive && (
            <div className="flex-shrink-0 mt-0.5 rounded-lg bg-rose-500/10 p-2 text-rose-500 border border-rose-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1 space-y-1.5">
            <h3 className="text-sm font-black text-zinc-100 tracking-tight leading-none">{title}</h3>
            <p className="text-xs text-zinc-450 leading-relaxed font-medium">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-850 bg-zinc-900/40 hover:bg-zinc-900 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors shadow-inner"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-xl px-4 py-2.5 text-xs font-black text-white shadow-lg transition-all active:scale-[0.98] ${
              isDestructive
                ? "bg-rose-600 hover:bg-rose-500 hover:shadow-rose-600/15"
                : "bg-violet-600 hover:bg-violet-500 hover:shadow-violet-600/15"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
