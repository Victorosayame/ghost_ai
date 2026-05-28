"use client";

import { LiveMap, LiveObject } from "@liveblocks/client";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react";
import { Component, type ReactNode } from "react";

import { ReactFlowCanvas } from "./react-flow-canvas";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";

interface EditorCanvasWrapperProps {
  isStarterTemplatesOpen: boolean;
  onSaveStatusChange?: (status: CanvasSaveStatus) => void;
  onStarterTemplatesOpenChange: (open: boolean) => void;
  projectId: string;
  roomId: string;
}

export function EditorCanvasWrapper({
  isStarterTemplatesOpen,
  onSaveStatusChange,
  onStarterTemplatesOpenChange,
  projectId,
  roomId,
}: EditorCanvasWrapperProps) {
  return (
    <LiveblocksProvider
      authEndpoint={async () => {
        const response = await fetch(`/api/liveblocks-auth/${roomId}`, {
          method: "POST",
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;

          throw new Error(
            payload?.error || "Failed to authenticate with Liveblocks"
          );
        }

        return response.json();
      }}
    >
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
        initialStorage={{
          flow: new LiveObject({
            nodes: new LiveMap(),
            edges: new LiveMap(),
          }),
        }}
      >
        <CanvasErrorBoundary>
          <ClientSideSuspense fallback={<CanvasLoadingFallback />}>
            <div className="flex h-full w-full flex-1 min-h-0 min-w-0 bg-base">
              <ReactFlowCanvas
                isStarterTemplatesOpen={isStarterTemplatesOpen}
                onSaveStatusChange={onSaveStatusChange}
                onStarterTemplatesOpenChange={onStarterTemplatesOpenChange}
                projectId={projectId}
              />
            </div>
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

interface CanvasErrorBoundaryProps {
  children: ReactNode;
}

interface CanvasErrorBoundaryState {
  error: Error | null;
}

class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): CanvasErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <CanvasErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function CanvasLoadingFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base">
      <div className="text-sm text-copy-muted">Loading canvas...</div>
    </div>
  );
}

function CanvasErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base">
      <div className="max-w-sm rounded-3xl border border-surface-border bg-surface px-5 py-4 text-center shadow-2xl">
        <div className="mb-2 text-sm text-state-error">
          Failed to connect to canvas
        </div>
        <div className="text-xs text-copy-muted">{error.message}</div>
      </div>
    </div>
  );
}
