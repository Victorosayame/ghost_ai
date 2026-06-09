import type { JsonObject } from "@liveblocks/client";
import { z } from "zod";

export const AI_CHAT_FEED_ID = "ai-chat";
export const AI_STATUS_FEED_ID = "ai-status-feed";

export const AI_STATUS_LEVELS = ["info", "success", "error"] as const;
export const AI_STATUS_PHASES = [
  "start",
  "processing",
  "complete",
  "error",
] as const;

export type AiStatusLevel = (typeof AI_STATUS_LEVELS)[number];
export type AiStatusPhase = (typeof AI_STATUS_PHASES)[number];

export const aiChatMessageSchema = z.object({
  sender: z.object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    avatar: z.string().trim(),
    color: z.string().trim(),
  }),
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
  timestamp: z.string().trim().min(1),
});

export type AiChatFeedPayload = JsonObject &
  z.infer<typeof aiChatMessageSchema>;

export type AiChatFeedMetadata = JsonObject & {
  kind: "ai-chat";
  name: string;
};

export interface AiChatMessage extends z.infer<typeof aiChatMessageSchema> {
  id: string;
  createdAt: number;
}

export type AiStatusFeedPayload = JsonObject & {
  level: AiStatusLevel;
  phase: AiStatusPhase;
  text?: string;
  runId?: string;
  timestamp?: string;
};

export type AiStatusFeedMetadata = JsonObject & {
  kind: "ai-status";
  name: string;
};

export interface AiStatusMessage {
  id: string;
  createdAt: number;
  level: AiStatusLevel;
  phase: AiStatusPhase;
  text?: string;
  runId?: string;
  timestamp?: string;
}

export function validateAiChatFeedPayload(
  value: unknown
): AiChatFeedPayload | null {
  const parsed = aiChatMessageSchema.safeParse(value);

  if (!parsed.success) {
    return null;
  }

  return parsed.data as AiChatFeedPayload;
}

export function isAiStatusLevel(value: unknown): value is AiStatusLevel {
  return (
    typeof value === "string" &&
    AI_STATUS_LEVELS.includes(value as AiStatusLevel)
  );
}

export function isAiStatusPhase(value: unknown): value is AiStatusPhase {
  return (
    typeof value === "string" &&
    AI_STATUS_PHASES.includes(value as AiStatusPhase)
  );
}

export function validateAiStatusFeedPayload(
  value: unknown
): AiStatusFeedPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (!isAiStatusLevel(candidate.level) || !isAiStatusPhase(candidate.phase)) {
    return null;
  }

  const text = optionalString(candidate.text);
  const runId = optionalString(candidate.runId);
  const timestamp = optionalString(candidate.timestamp);

  return {
    level: candidate.level,
    phase: candidate.phase,
    ...(text ? { text } : {}),
    ...(runId ? { runId } : {}),
    ...(timestamp ? { timestamp } : {}),
  };
}

export function isActiveAiStatusPhase(phase: AiStatusPhase) {
  return phase === "start" || phase === "processing";
}

function optionalString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}
