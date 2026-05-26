"use client";

import { LiveObject, type JsonObject } from "@liveblocks/client";
import { useMutation } from "@liveblocks/react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";
import type {
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useRef, useState } from "react";

import type { CanvasNode } from "@/types/canvas";
import { NODE_COLORS, SHAPE_MIN_DIMENSIONS } from "@/types/canvas";
import { CanvasNodeShape, SHAPE_CONTENT_PADDING } from "./canvas-node-shape";

const EMPTY_LABEL_PLACEHOLDER = "Label";

export function CanvasNodeComponent({
  id,
  data,
  selected,
}: NodeProps<CanvasNode>) {
  const [isEditing, setIsEditing] = useState(false);
  const [hoveredSwatchIndex, setHoveredSwatchIndex] = useState<number | null>(null);
  const [draftLabel, setDraftLabel] = useState(data.label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shape = data.shape ?? "rectangle";
  const minDimensions = SHAPE_MIN_DIMENSIONS[shape];
  const activeColor = resolveNodeColorPair(data.color, data.textColor);
  const updateNodeData = useMutation(({ storage }, nodeId: string, patch: Partial<CanvasNode["data"]>) => {
    const flow = storage.get("flow");

    if (!flow) {
      return;
    }

    const node = flow.get("nodes").get(nodeId);

    if (!node) {
      return;
    }

    const currentData = node.get("data");

    if (currentData instanceof LiveObject) {
      const liveData = currentData as LiveObject<JsonObject>;

      for (const [key, value] of Object.entries(patch)) {
        if (value !== undefined) {
          liveData.set(key, value as JsonObject[string]);
        }
      }

      return;
    }

    const nextData: CanvasNode["data"] = {
      ...(currentData as CanvasNode["data"]),
      ...patch,
    };

    node.set(
      "data",
      LiveObject.from(nextData as unknown as JsonObject) as unknown as typeof currentData
    );
  }, []);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const focusTextarea = window.requestAnimationFrame(() => {
      textarea.focus();
      const cursorPosition = textarea.value.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });

    return () => window.cancelAnimationFrame(focusTextarea);
  }, [isEditing]);

  function commitLabel(nextLabel: string) {
    setDraftLabel(nextLabel);
    updateNodeData(id, { label: nextLabel });
  }

  function applyColorPair(fill: string, text: string) {
    updateNodeData(id, {
      color: fill,
      textColor: text,
    });
  }

  function closeEditing() {
    setIsEditing(false);
  }

  function stopCanvasInteraction(event: ReactPointerEvent<HTMLElement>) {
    event.stopPropagation();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeEditing();
      textareaRef.current?.blur();
    }
  }

  function handleStartEditing(event: ReactMouseEvent<HTMLElement>) {
    event.stopPropagation();
    setDraftLabel(data.label);
    setIsEditing(true);
  }

  return (
    <div
      className="group relative h-full w-full overflow-visible"
      onDoubleClick={
        isEditing
          ? undefined
          : (event) => {
              handleStartEditing(event);
            }
      }
    >
      {selected ? (
        <div
          className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[calc(100%+0.5rem)]"
          onPointerDown={stopCanvasInteraction}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-surface-border bg-surface/96 px-2 py-1.5 shadow-lg backdrop-blur-md">
            {NODE_COLORS.map((colorPair, index) => {
              const isActive =
                colorPair.fill === activeColor.fill && colorPair.text === activeColor.text;
              const showGlow = isActive || hoveredSwatchIndex === index;

              return (
                <button
                  key={`${colorPair.fill}-${colorPair.text}`}
                  type="button"
                  className="nodrag nopan flex h-6 w-6 items-center justify-center rounded-full border transition-transform duration-150 hover:scale-105 focus-visible:outline-none"
                  style={{
                    backgroundColor: colorPair.fill,
                    borderColor: isActive ? colorPair.text : "var(--border-subtle)",
                    boxShadow: showGlow ? `0 0 0 2px ${withAlpha(colorPair.text, 0.28)}` : "none",
                  }}
                  onPointerDown={stopCanvasInteraction}
                  onClick={(event) => {
                    event.stopPropagation();
                    applyColorPair(colorPair.fill, colorPair.text);
                  }}
                  onMouseEnter={() => setHoveredSwatchIndex(index)}
                  onMouseLeave={() =>
                    setHoveredSwatchIndex((currentIndex) =>
                      currentIndex === index ? null : currentIndex
                    )
                  }
                  aria-label={`Apply node color ${index + 1}`}
                  aria-pressed={isActive}
                  title={`Node color ${index + 1}`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border"
                    style={{
                      backgroundColor: colorPair.text,
                      borderColor: withAlpha(colorPair.fill, 0.72),
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <NodeResizer
        isVisible={selected}
        minWidth={minDimensions.width}
        minHeight={minDimensions.height}
        handleClassName="!h-3 !w-3 !rounded-full !border !border-[var(--text-primary)] !bg-[var(--bg-elevated)] !shadow-none"
        lineClassName="!border-[var(--border-subtle)] !opacity-80"
        color="var(--border-subtle)"
      />
      <CanvasNodeShape
        label={data.label}
        color={activeColor.fill}
        textColor={activeColor.text}
        shape={shape}
        placeholder={EMPTY_LABEL_PLACEHOLDER}
        selected={selected}
      >
        {isEditing ? (
          <div
            className="absolute inset-0 z-10"
            onPointerDown={stopCanvasInteraction}
            onDoubleClick={(event) => event.stopPropagation()}
          >
            <div
              className={`flex h-full w-full items-center justify-center ${SHAPE_CONTENT_PADDING[shape]}`}
            >
              <textarea
                ref={textareaRef}
                value={draftLabel}
                rows={1}
                placeholder={EMPTY_LABEL_PLACEHOLDER}
                className="nodrag nopan field-sizing-content min-h-0 w-full resize-none overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)]/95 px-3 py-2 text-center text-sm text-copy-primary outline-none placeholder:text-copy-faint focus:border-[var(--accent-primary)]"
                style={{ color: activeColor.text }}
                onChange={(event) => commitLabel(event.target.value)}
                onBlur={closeEditing}
                onKeyDown={handleKeyDown}
                onPointerDown={stopCanvasInteraction}
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
              />
            </div>
          </div>
        ) : null}
      </CanvasNodeShape>
      <NodeHandle id="top" position={Position.Top} />
      <NodeHandle id="right" position={Position.Right} />
      <NodeHandle id="bottom" position={Position.Bottom} />
      <NodeHandle id="left" position={Position.Left} />
    </div>
  );
}

function resolveNodeColorPair(color?: string, textColor?: string) {
  return (
    NODE_COLORS.find(
      (candidate) => candidate.fill === color && candidate.text === textColor
    ) ?? {
      fill: color ?? NODE_COLORS[0].fill,
      text: textColor ?? NODE_COLORS[0].text,
    }
  );
}

function withAlpha(hexColor: string, alpha: number) {
  const normalized = hexColor.replace("#", "");
  const channels =
    normalized.length === 3
      ? normalized.split("").map((channel) => `${channel}${channel}`)
      : [normalized.slice(0, 2), normalized.slice(2, 4), normalized.slice(4, 6)];
  const [red, green, blue] = channels.map((channel) => Number.parseInt(channel, 16));

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function NodeHandle({
  id,
  position,
}: {
  id: string;
  position: Position;
}) {
  return (
    <Handle
      id={id}
      type="source"
      position={position}
      isConnectableStart
      isConnectableEnd
      className="!h-3 !w-3 !border-2 !border-[var(--bg-base)] !bg-[var(--text-primary)] !opacity-0 !transition-opacity group-hover:!opacity-100"
    />
  );
}
