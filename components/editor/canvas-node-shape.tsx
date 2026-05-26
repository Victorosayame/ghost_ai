"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { NodeShape } from "@/types/canvas";

interface CanvasNodeShapeProps {
  children?: ReactNode;
  color?: string;
  isGhost?: boolean;
  label: string;
  placeholder?: string;
  selected?: boolean;
  shape?: NodeShape;
  textColor?: string;
}

export const SHAPE_CONTENT_PADDING: Record<NodeShape, string> = {
  rectangle: "px-4 py-3",
  diamond: "px-[22%] py-[18%]",
  circle: "px-[18%] py-[18%]",
  pill: "px-5 py-3",
  cylinder: "px-5 py-4",
  hexagon: "px-[18%] py-[16%]",
};

export function CanvasNodeShape({
  children,
  color,
  isGhost = false,
  label,
  placeholder = "",
  selected = false,
  shape = "rectangle",
  textColor,
}: CanvasNodeShapeProps) {
  const resolvedFill = color ?? "var(--bg-subtle)";
  const resolvedTextColor = textColor ?? "var(--text-primary)";
  const strokeColor = selected
    ? resolvedTextColor
    : "var(--border-subtle)";

  return (
    <div
      className={cn(
        "relative h-full w-full",
        isGhost ? "opacity-80 drop-shadow-[0_18px_42px_rgba(0,0,0,0.32)]" : ""
      )}
      style={
        {
          color: resolvedTextColor,
          "--shape-fill": resolvedFill,
          "--shape-stroke": strokeColor,
        } as CSSProperties
      }
    >
      <ShapeSurface shape={shape} />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center text-center text-sm",
          SHAPE_CONTENT_PADDING[shape]
        )}
        style={
          {
            color: resolvedTextColor,
          } as CSSProperties
        }
      >
        <span className={label || placeholder ? undefined : "opacity-40"}>
          {label || placeholder || "\u00A0"}
        </span>
      </div>
      {children}
    </div>
  );
}

function ShapeSurface({ shape }: { shape: NodeShape }) {
  if (shape === "rectangle") {
    return (
      <div className="h-full w-full rounded-xl border border-[color:var(--shape-stroke)] bg-[color:var(--shape-fill)]" />
    );
  }

  if (shape === "pill") {
    return (
      <div className="h-full w-full rounded-full border border-[color:var(--shape-stroke)] bg-[color:var(--shape-fill)]" />
    );
  }

  if (shape === "circle") {
    return (
      <div className="h-full w-full rounded-full border border-[color:var(--shape-stroke)] bg-[color:var(--shape-fill)]" />
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="h-full w-full overflow-visible"
      aria-hidden="true"
    >
      {shape === "diamond" ? (
        <polygon
          points="50,2 98,50 50,98 2,50"
          fill="var(--shape-fill)"
          stroke="var(--shape-stroke)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {shape === "hexagon" ? (
        <polygon
          points="24,4 76,4 98,50 76,96 24,96 2,50"
          fill="var(--shape-fill)"
          stroke="var(--shape-stroke)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {shape === "cylinder" ? (
        <>
          <path
            d="M15 18V78C15 86 85 86 85 78V18Z"
            fill="var(--shape-fill)"
          />
          <ellipse
            cx="50"
            cy="18"
            rx="35"
            ry="12"
            fill="var(--shape-fill)"
            stroke="var(--shape-stroke)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M15 18V78"
            fill="none"
            stroke="var(--shape-stroke)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M85 18V78"
            fill="none"
            stroke="var(--shape-stroke)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M15 78C15 86 85 86 85 78"
            fill="none"
            stroke="var(--shape-stroke)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </>
      ) : null}
    </svg>
  );
}
