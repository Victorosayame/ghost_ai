"use client";

import { useEventListener, useFeedMessages } from "@liveblocks/react";
import { useMemo, useState } from "react";

import {
  AI_STATUS_FEED_ID,
  isActiveAiStatusPhase,
  type AiStatusMessage,
  validateAiStatusFeedPayload,
} from "@/types/tasks";

export function useAiStatusFeed() {
  const [broadcastStatus, setBroadcastStatus] = useState<AiStatusMessage | null>(
    null
  );
  const { messages, error, isLoading } = useFeedMessages(AI_STATUS_FEED_ID, {
    limit: 8,
  });

  useEventListener(({ event }) => {
    if (event.type !== "AI_STATUS" || event.feedId !== AI_STATUS_FEED_ID) {
      return;
    }

    const payload = validateAiStatusFeedPayload(event.data);

    if (!payload) {
      return;
    }

    setBroadcastStatus({
      id: event.id,
      createdAt: Date.now(),
      ...payload,
    });
  });

  const latestFeedStatus = useMemo(() => {
    if (!messages) {
      return null;
    }

    return messages
      .map((message) => {
        const payload = validateAiStatusFeedPayload(message.data);

        if (!payload) {
          return null;
        }

        return {
          id: message.id,
          createdAt: message.createdAt,
          ...payload,
        } satisfies AiStatusMessage;
      })
      .filter((message): message is AiStatusMessage => Boolean(message))
      .sort((left, right) => right.createdAt - left.createdAt)[0] ?? null;
  }, [messages]);

  const latestStatus =
    broadcastStatus &&
    (!latestFeedStatus || broadcastStatus.createdAt >= latestFeedStatus.createdAt)
      ? broadcastStatus
      : latestFeedStatus;

  return {
    error,
    isLoading,
    isWorking: latestStatus
      ? isActiveAiStatusPhase(latestStatus.phase)
      : false,
    latestStatus,
  };
}
