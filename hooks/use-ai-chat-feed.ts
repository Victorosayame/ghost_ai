"use client";

import {
  useCreateFeed,
  useCreateFeedMessage,
  useFeedMessages,
  useSelf,
} from "@liveblocks/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AI_CHAT_FEED_ID,
  type AiChatFeedPayload,
  type AiChatMessage,
  validateAiChatFeedPayload,
} from "@/types/tasks";

interface SendAiChatMessageInput {
  content: string;
}

interface SendAssistantChatMessageInput {
  content: string;
}

const ASSISTANT_SENDER = {
  id: "ghost-ai",
  name: "Ghost AI",
  avatar: "",
  color: "#8b82ff",
} as const;

export function useAiChatFeed() {
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();
  const self = useSelf();
  const [feedError, setFeedError] = useState<string | null>(null);
  const { messages, error, isLoading } = useFeedMessages(AI_CHAT_FEED_ID, {
    limit: 50,
  });

  const ensureChatFeed = useCallback(async () => {
    try {
      await createFeed(AI_CHAT_FEED_ID, {
        metadata: {
          kind: "ai-chat",
          name: "AI chat feed",
        },
      });
    } catch (error) {
      if (!isFeedAlreadyExistsError(error)) {
        throw error;
      }
    }
  }, [createFeed]);

  useEffect(() => {
    void ensureChatFeed().catch((error) => {
      setFeedError(readErrorMessage(error, "Failed to create chat feed."));
    });
  }, [ensureChatFeed]);

  const chatMessages = useMemo(() => {
    if (!messages) {
      return [];
    }

    return messages
      .map((message) => {
        const payload = validateAiChatFeedPayload(message.data);

        if (!payload) {
          return null;
        }

        return {
          id: message.id,
          createdAt: message.createdAt,
          ...payload,
        } satisfies AiChatMessage;
      })
      .filter((message): message is AiChatMessage => Boolean(message))
      .sort((left, right) => left.createdAt - right.createdAt);
  }, [messages]);

  const sendMessage = useCallback(
    async ({ content }: SendAiChatMessageInput) => {
      const trimmedContent = content.trim();

      if (!trimmedContent) {
        return;
      }

      if (!self) {
        throw new Error("Chat is still connecting. Try again in a moment.");
      }

      setFeedError(null);

      const timestamp = new Date().toISOString();
      const payload = {
        sender: {
          id: self.id,
          name: self.info.name,
          avatar: self.info.avatar,
          color: self.info.color,
        },
        role: "user",
        content: trimmedContent,
        timestamp,
      } satisfies AiChatFeedPayload;

      try {
        try {
          await createFeedMessage(AI_CHAT_FEED_ID, payload, {
            id: createChatMessageId(self.id),
            createdAt: Date.now(),
          });
        } catch (error) {
          if (!isFeedNotFoundError(error)) {
            throw error;
          }

          await ensureChatFeed();
          await createFeedMessage(AI_CHAT_FEED_ID, payload, {
            id: createChatMessageId(self.id),
            createdAt: Date.now(),
          });
        }
      } catch (error) {
        setFeedError(readErrorMessage(error, "Failed to send message."));
        throw error;
      }
    },
    [createFeedMessage, ensureChatFeed, self]
  );

  const sendAssistantMessage = useCallback(
    async ({ content }: SendAssistantChatMessageInput) => {
      const trimmedContent = content.trim();

      if (!trimmedContent) {
        return;
      }

      setFeedError(null);

      const timestamp = new Date().toISOString();
      const payload = {
        sender: ASSISTANT_SENDER,
        role: "assistant",
        content: trimmedContent,
        timestamp,
      } satisfies AiChatFeedPayload;

      try {
        try {
          await createFeedMessage(AI_CHAT_FEED_ID, payload, {
            id: createChatMessageId(ASSISTANT_SENDER.id),
            createdAt: Date.now(),
          });
        } catch (error) {
          if (!isFeedNotFoundError(error)) {
            throw error;
          }

          await ensureChatFeed();
          await createFeedMessage(AI_CHAT_FEED_ID, payload, {
            id: createChatMessageId(ASSISTANT_SENDER.id),
            createdAt: Date.now(),
          });
        }
      } catch (error) {
        setFeedError(readErrorMessage(error, "Failed to send message."));
        throw error;
      }
    },
    [createFeedMessage, ensureChatFeed]
  );

  return {
    chatMessages,
    error: feedError || readErrorMessage(error, ""),
    isLoading,
    sendAssistantMessage,
    sendMessage,
  };
}

function createChatMessageId(senderId: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `chat-${senderId}-${randomId}`;
}

function isFeedAlreadyExistsError(error: unknown) {
  const message = readErrorMessage(error, "").toLowerCase();

  return (
    message.includes("feed_already_exists") ||
    message.includes("already exists")
  );
}

function isFeedNotFoundError(error: unknown) {
  const message = readErrorMessage(error, "").toLowerCase();

  return message.includes("feed_not_found") || message.includes("not found");
}

function readErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}
