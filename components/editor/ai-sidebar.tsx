"use client";

import { Bot, Loader2, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  projectId: string;
}

const AiSidebar = ({ isOpen, onClose, roomId, projectId }: AiSidebarProps) => {
  const [isLoading] = useState(false);

  return (
    <aside
      aria-hidden={!isOpen}
      className={cn(
        "fixed right-4 top-16 z-40 flex h-[calc(100vh-4.5rem)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-surface-border bg-surface/92 shadow-xl backdrop-blur-md transition-all duration-200 ease-out",
        isOpen
          ? "translate-x-0 opacity-100"
          : "pointer-events-none invisible translate-x-[calc(100%+1rem)] opacity-0"
      )}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-surface-border px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-ai/15">
          <Bot className="h-4 w-4 text-accent-ai-text" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-copy-primary">AI Workspace</p>
          <p className="text-xs text-copy-muted">
            Collaborate with Ghost AI
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-1 rounded-full bg-accent-ai/15 px-2 py-0.5 text-[10px] text-accent-ai-text">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            <span>Working</span>
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-copy-muted transition-colors hover:bg-subtle hover:text-copy-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 px-5 py-4">
        <p className="text-sm text-copy-faint">
          AI tools will be wired into this workspace in a later feature.
        </p>
        <div className="mt-3 rounded-xl border border-surface-border bg-base/50 px-3 py-2 font-mono text-xs text-copy-faint">
          Room: {roomId}
        </div>
        <div className="mt-2 rounded-xl border border-surface-border bg-base/50 px-3 py-2 font-mono text-xs text-copy-faint">
          Project: {projectId}
        </div>
      </div>
    </aside>
  );
};

export default AiSidebar;
