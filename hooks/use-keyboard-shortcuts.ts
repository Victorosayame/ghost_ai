"use client";

import type { ReactFlowInstance } from "@xyflow/react";
import { useEffect, useEffectEvent } from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

interface UseKeyboardShortcutsOptions {
  reactFlow: ReactFlowInstance<CanvasNode, CanvasEdge>;
  onUndo: () => void;
  onRedo: () => void;
}

export function useKeyboardShortcuts({
  reactFlow,
  onUndo,
  onRedo,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (shouldIgnoreShortcutTarget(event.target)) {
      return;
    }

    const isModifierPressed = event.metaKey || event.ctrlKey;

    if (isModifierPressed && event.key.toLowerCase() === "z") {
      event.preventDefault();

      if (event.shiftKey) {
        onRedo();
        return;
      }

      onUndo();
      return;
    }

    if (isModifierPressed && event.key.toLowerCase() === "y") {
      event.preventDefault();
      onRedo();
      return;
    }

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      void reactFlow.zoomIn({ duration: 180 });
      return;
    }

    if (event.key === "-") {
      event.preventDefault();
      void reactFlow.zoomOut({ duration: 180 });
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}

function shouldIgnoreShortcutTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}
