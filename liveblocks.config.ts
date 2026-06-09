import type { LiveblocksFlow } from "@liveblocks/react-flow";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import type {
  AiChatFeedMetadata,
  AiChatFeedPayload,
  AiStatusFeedMetadata,
  AiStatusFeedPayload,
} from "@/types/tasks";

// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      flow: LiveblocksFlow<CanvasNode, CanvasEdge>;
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent:
      | {
          type: "AI_STATUS";
          feedId: "ai-status-feed";
          id: string;
          data: AiStatusFeedPayload;
        };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: Record<string, unknown>;

    FeedMetadata: AiStatusFeedMetadata | AiChatFeedMetadata;

    FeedMessageData: AiStatusFeedPayload | AiChatFeedPayload;

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: Record<string, unknown>;
  }
}

export {};
