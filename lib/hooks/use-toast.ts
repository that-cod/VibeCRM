/**
 * @fileoverview Toast Notifications Hook
 *
 * Reasoning:
 * - Consistent toast notifications across the app
 * - Success/error/info/warning variants
 * - Easy to import and use anywhere
 */

"use client";

import { toast } from "sonner";
import { useCallback } from "react";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

export function useToast() {
  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info", options?: ToastOptions) => {
      const { title, description, duration } = options || {};

      switch (variant) {
        case "success":
          toast.success(title || message, {
            description,
            duration: duration || 3000,
          });
          break;
        case "error":
          toast.error(title || message, {
            description,
            duration: duration || 5000,
          });
          break;
        case "warning":
          toast.warning(title || message, {
            description,
            duration: duration || 4000,
          });
          break;
        case "info":
        default:
          toast.info(title || message, {
            description,
            duration: duration || 3000,
          });
          break;
      }
    },
    []
  );

  return {
    success: (message: string, options?: ToastOptions) =>
      showToast(message, "success", options),
    error: (message: string, options?: ToastOptions) =>
      showToast(message, "error", options),
    warning: (message: string, options?: ToastOptions) =>
      showToast(message, "warning", options),
    info: (message: string, options?: ToastOptions) =>
      showToast(message, "info", options),
  };
}

export function useActionFeedback() {
  const { success, error } = useToast();

  return {
    onSuccess: (message: string) => {
      success(message, { title: "Success" });
    },
    onError: (message: string) => {
      error(message, { title: "Error" });
    },
    onPending: (message: string) => {
      toast.loading(message);
    },
  };
}

export { toast };
