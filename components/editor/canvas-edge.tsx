"use client";

import { LiveObject, type JsonObject } from "@liveblocks/client";
import { useMutation } from "@liveblocks/react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import type {
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useRef, useState } from "react";

import type { CanvasEdge } from "@/types/canvas";

const EMPTY_EDGE_LABEL_HINT = "Add label";

export function CanvasEdgeComponent({
  id,
  data,
  markerEnd,
  selected,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  style,
}: EdgeProps<CanvasEdge>) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(data?.label ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 14,
    offset: 24,
  });
  const isActive = selected || isHovered || isEditing;
  const savedLabel = data?.label?.trim() ?? "";
  const showHint = isActive && !isEditing && savedLabel.length === 0;
  const labelText = isEditing ? draftLabel : savedLabel;
  const updateEdgeData = useMutation(
    (
      { storage },
      edgeId: string,
      patch: Partial<NonNullable<CanvasEdge["data"]>>
    ) => {
      const flow = storage.get("flow");

      if (!flow) {
        return;
      }

      const edge = flow.get("edges").get(edgeId);

      if (!edge) {
        return;
      }

      const currentData = edge.get("data");

      if (currentData instanceof LiveObject) {
        const liveData = currentData as LiveObject<JsonObject>;
        const safePatch = patch ?? {};

        for (const [key, value] of Object.entries(safePatch)) {
          if (value !== undefined) {
            liveData.set(key, value as JsonObject[string]);
          }
        }

        return;
      }

      const nextData: CanvasEdge["data"] = {
        ...(currentData as CanvasEdge["data"] | undefined),
        ...patch,
      };

      edge.set(
        "data",
        LiveObject.from(nextData as unknown as JsonObject) as unknown as typeof currentData
      );
    },
    []
  );

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const input = inputRef.current;

    if (!input) {
      return;
    }

    const focusInput = window.requestAnimationFrame(() => {
      input.focus();
      const cursorPosition = input.value.length;
      input.setSelectionRange(cursorPosition, cursorPosition);
    });

    return () => window.cancelAnimationFrame(focusInput);
  }, [isEditing]);

  function saveLabel(nextLabel: string) {
    setDraftLabel(nextLabel);
    updateEdgeData(id, { label: nextLabel });
  }

  function startEditing(event: ReactMouseEvent<SVGPathElement | HTMLDivElement>) {
    event.stopPropagation();
    setDraftLabel(data?.label ?? "");
    setIsEditing(true);
  }

  function stopCanvasInteraction(event: ReactPointerEvent<HTMLElement>) {
    event.stopPropagation();
  }

  function closeEditing() {
    setIsEditing(false);
  }

  function commitDraft() {
    saveLabel(draftLabel);
    closeEditing();
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      commitDraft();
      return;
    }
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={0}
        style={{
          ...style,
          stroke: isActive ? "rgba(237, 237, 237, 0.88)" : "rgba(237, 237, 237, 0.4)",
          strokeWidth: 2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          transition: "stroke 150ms ease",
        }}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={26}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="react-flow__edge-interaction"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={startEditing}
      />
      <EdgeLabelRenderer>
        <div
          className="pointer-events-none absolute left-0 top-0"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={draftLabel}
              size={Math.max(draftLabel.length, 1)}
              placeholder={EMPTY_EDGE_LABEL_HINT}
              className="nodrag nopan pointer-events-auto min-w-16 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)]/96 px-3 py-1 text-center text-xs text-copy-primary outline-none placeholder:text-copy-faint focus:border-[var(--accent-primary)]"
              onChange={(event) => setDraftLabel(event.target.value)}
              onBlur={commitDraft}
              onKeyDown={handleInputKeyDown}
              onPointerDown={stopCanvasInteraction}
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={(event) => event.stopPropagation()}
            />
          ) : labelText.length > 0 ? (
            <div
              className="nodrag nopan pointer-events-auto rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/94 px-2.5 py-1 text-[11px] font-medium text-copy-secondary shadow-sm backdrop-blur-sm"
              onPointerDown={stopCanvasInteraction}
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={startEditing}
            >
              {labelText}
            </div>
          ) : showHint ? (
            <div
              className="nodrag nopan pointer-events-auto rounded-full border border-dashed border-[var(--border-subtle)] bg-[var(--bg-base)]/84 px-2.5 py-1 text-[11px] text-copy-faint backdrop-blur-sm"
              onPointerDown={stopCanvasInteraction}
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={startEditing}
            >
              {EMPTY_EDGE_LABEL_HINT}
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
