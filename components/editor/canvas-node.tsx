"use client";

import type { NodeProps } from "@xyflow/react";

import type { CanvasNode } from "@/types/canvas";

export function CanvasNodeComponent({ data }: NodeProps<CanvasNode>) {
  const label = data.label.trim();

  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-xl border border-surface-border px-4 py-3 text-center text-sm text-copy-primary shadow-lg"
      style={{
        backgroundColor: data.color ?? "var(--bg-subtle)",
        color: data.textColor ?? "var(--text-primary)",
      }}
    >
      <span className={label ? undefined : "opacity-40"}>{label || "\u00A0"}</span>
    </div>
  );
}
