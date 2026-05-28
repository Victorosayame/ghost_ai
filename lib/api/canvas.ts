import type { CanvasSnapshot } from "@/types/canvas";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isCanvasSnapshot(value: unknown): value is CanvasSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return Array.isArray(value.nodes) && Array.isArray(value.edges);
}

export async function readCanvasSnapshot(request: Request) {
  const rawBody = await request.text();
  const parsedBody = rawBody.trim() ? JSON.parse(rawBody) : null;

  return isCanvasSnapshot(parsedBody) ? parsedBody : null;
}
