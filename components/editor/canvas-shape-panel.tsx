"use client";

import type { DragEvent, SVGProps } from "react";

import {
  NODE_SHAPES,
  SHAPE_DEFAULTS,
  SHAPE_PANEL_DRAG_TYPE,
  type NodeShape,
  type ShapeDragPayload,
} from "@/types/canvas";

const SHAPE_LABELS: Record<NodeShape, string> = {
  rectangle: "Rectangle",
  diamond: "Diamond",
  circle: "Circle",
  pill: "Pill",
  cylinder: "Cylinder",
  hexagon: "Hexagon",
};

interface CanvasShapePanelProps {
  onDragStateChange?: (isDragging: boolean) => void;
}

export function CanvasShapePanel({
  onDragStateChange,
}: CanvasShapePanelProps) {
  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    shape: NodeShape
  ) {
    const payload: ShapeDragPayload = {
      shape,
      ...SHAPE_DEFAULTS[shape],
    };
    const serializedPayload = JSON.stringify(payload);

    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(SHAPE_PANEL_DRAG_TYPE, serializedPayload);
    event.dataTransfer.setData("text/plain", serializedPayload);
    onDragStateChange?.(true);
  }

  function handleDragEnd() {
    onDragStateChange?.(false);
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-surface-border bg-surface/90 p-2 shadow-lg backdrop-blur-md">
        {NODE_SHAPES.map((shape) => (
          <button
            key={shape}
            type="button"
            draggable
            onDragStart={(event) => handleDragStart(event, shape)}
            onDragEnd={handleDragEnd}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-transparent bg-elevated text-copy-secondary transition-colors hover:border-subtle-border hover:bg-subtle hover:text-copy-primary"
            aria-label={`Drag ${SHAPE_LABELS[shape]} shape onto canvas`}
            title={SHAPE_LABELS[shape]}
          >
            <ShapeGlyph shape={shape} className="h-5 w-5" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ShapeGlyph({
  className,
  shape,
  ...props
}: SVGProps<SVGSVGElement> & { shape: NodeShape }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {shape === "rectangle" ? (
        <rect x="4" y="7" width="16" height="10" rx="2" />
      ) : null}
      {shape === "diamond" ? <path d="M12 4 20 12 12 20 4 12 12 4Z" /> : null}
      {shape === "circle" ? <circle cx="12" cy="12" r="7" /> : null}
      {shape === "pill" ? <rect x="3" y="7" width="18" height="10" rx="5" /> : null}
      {shape === "cylinder" ? (
        <>
          <ellipse cx="12" cy="7" rx="6" ry="3" />
          <path d="M6 7v8c0 1.7 2.7 3 6 3s6-1.3 6-3V7" />
          <path d="M6 15c0 1.7 2.7 3 6 3s6-1.3 6-3" />
        </>
      ) : null}
      {shape === "hexagon" ? (
        <path d="M8 5h8l4 7-4 7H8l-4-7 4-7Z" />
      ) : null}
    </svg>
  );
}
