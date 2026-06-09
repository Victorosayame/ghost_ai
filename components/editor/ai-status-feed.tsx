"use client";

import { Bot, CheckCircle2, Loader2, XCircle } from "lucide-react";

import { useAiStatusFeed } from "@/hooks/use-ai-status-feed";
import { cn } from "@/lib/utils";
import type { AiStatusMessage } from "@/types/tasks";

export function AiStatusFeed() {
  const { latestStatus } = useAiStatusFeed();

  if (!latestStatus) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-5 top-4 z-20 w-[min(22rem,calc(100vw-2.5rem))]">
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border bg-surface/92 px-3.5 py-3 text-sm shadow-lg backdrop-blur-md",
          latestStatus.level === "error"
            ? "border-[var(--state-error)]/45"
            : latestStatus.level === "success"
              ? "border-[var(--state-success)]/45"
              : "border-surface-border"
        )}
      >
        <StatusIcon status={latestStatus} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-normal text-copy-faint">
            Ghost AI
          </p>
          <p className="mt-0.5 text-copy-primary">
            {latestStatus.text || fallbackStatusText(latestStatus)}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: AiStatusMessage }) {
  if (status.level === "error") {
    return <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-state-error" />;
  }

  if (status.level === "success") {
    return (
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-state-success" />
    );
  }

  if (status.phase === "processing") {
    return <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-ai-text" />;
  }

  return <Bot className="mt-0.5 h-4 w-4 shrink-0 text-ai-text" />;
}

function fallbackStatusText(status: AiStatusMessage) {
  if (status.phase === "complete") {
    return "Ghost AI finished updating the canvas.";
  }

  if (status.phase === "error") {
    return "Ghost AI could not finish the current update.";
  }

  return "Ghost AI is working in this room.";
}
