"use client";

import { LiveMap, LiveObject, type JsonObject } from "@liveblocks/client";
import { useMutation } from "@liveblocks/react";
import type {
  LiveblocksEdge,
  LiveblocksNode,
} from "@liveblocks/react-flow";
import { useEffect, useRef, useState } from "react";

import type { CanvasEdge, CanvasNode, CanvasSnapshot } from "@/types/canvas";

export type CanvasSaveStatus = "saving" | "saved" | "error";

const AUTOSAVE_DEBOUNCE_MS = 900;

function toCanvasSnapshot(
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): CanvasSnapshot {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      width: node.width,
      height: node.height,
      data: node.data,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type,
      markerEnd: edge.markerEnd,
      data: edge.data,
    })),
  };
}

function serializeSnapshot(snapshot: CanvasSnapshot) {
  return JSON.stringify(snapshot);
}

export function useCanvasAutosave(
  projectId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[]
) {
  const [status, setStatus] = useState<CanvasSaveStatus>("saved");
  const [loadAttempted, setLoadAttempted] = useState(false);
  const [hasSavedCanvas, setHasSavedCanvas] = useState(false);
  const latestNodeCountRef = useRef(0);
  const latestEdgeCountRef = useRef(0);
  const latestSnapshotRef = useRef(serializeSnapshot(toCanvasSnapshot([], [])));
  const lastSavedSnapshotRef = useRef<string | null>(null);

  const loadCanvasIntoEmptyRoom = useMutation(
    ({ storage }, snapshot: CanvasSnapshot) => {
      const flow = storage.get("flow");

      if (!flow) {
        return false;
      }

      const roomNodes = flow.get("nodes");
      const roomEdges = flow.get("edges");

      if (roomNodes.size > 0 || roomEdges.size > 0) {
        return false;
      }

      flow.set("nodes", new LiveMap() as never);
      flow.set("edges", new LiveMap() as never);

      const nextNodes = flow.get("nodes");
      const nextEdges = flow.get("edges");

      if (!nextNodes || !nextEdges) {
        return false;
      }

      for (const node of snapshot.nodes) {
        nextNodes.set(
          node.id,
          LiveObject.from(node as unknown as JsonObject) as unknown as LiveblocksNode<CanvasNode>
        );
      }

      for (const edge of snapshot.edges) {
        nextEdges.set(
          edge.id,
          LiveObject.from(edge as unknown as JsonObject) as unknown as LiveblocksEdge<CanvasEdge>
        );
      }

      return true;
    },
    []
  );

  useEffect(() => {
    latestNodeCountRef.current = nodes.length;
    latestEdgeCountRef.current = edges.length;
  }, [edges.length, nodes.length]);

  useEffect(() => {
    latestSnapshotRef.current = serializeSnapshot(toCanvasSnapshot(nodes, edges));
  }, [edges, nodes]);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedCanvas() {
      if (loadAttempted) {
        return;
      }

      if (nodes.length > 0 || edges.length > 0) {
        setLoadAttempted(true);
        return;
      }

      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load saved canvas");
        }

        const payload = (await response.json()) as {
          canvas: CanvasSnapshot | null;
        };

        if (cancelled) {
          return;
        }

        if (!payload.canvas) {
          setLoadAttempted(true);
          return;
        }

        setHasSavedCanvas(true);

        if (
          latestNodeCountRef.current > 0 ||
          latestEdgeCountRef.current > 0
        ) {
          setLoadAttempted(true);
          return;
        }

        const snapshot = toCanvasSnapshot(
          payload.canvas.nodes,
          payload.canvas.edges
        );
        const loaded = loadCanvasIntoEmptyRoom(snapshot);

        lastSavedSnapshotRef.current = loaded
          ? serializeSnapshot(snapshot)
          : latestSnapshotRef.current;
        setStatus("saved");
        setLoadAttempted(true);
      } catch {
        if (!cancelled) {
          setStatus("error");
          setLoadAttempted(true);
        }
      }
    }

    void loadSavedCanvas();

    return () => {
      cancelled = true;
    };
  }, [
    edges.length,
    loadAttempted,
    loadCanvasIntoEmptyRoom,
    nodes.length,
    projectId,
  ]);

  useEffect(() => {
    if (!loadAttempted) {
      return;
    }

    const snapshot = toCanvasSnapshot(nodes, edges);
    const serializedSnapshot = serializeSnapshot(snapshot);

    if (lastSavedSnapshotRef.current === serializedSnapshot) {
      return;
    }

    if (!hasSavedCanvas && nodes.length === 0 && edges.length === 0) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      async function saveCanvas() {
        setStatus("saving");

        try {
          const response = await fetch(`/api/projects/${projectId}/canvas`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: serializedSnapshot,
          });

          if (!response.ok) {
            throw new Error("Failed to save canvas");
          }

          if (!cancelled) {
            lastSavedSnapshotRef.current = serializedSnapshot;
            setHasSavedCanvas(true);
            setStatus("saved");
          }
        } catch {
          if (!cancelled) {
            setStatus("error");
          }
        }
      }

      void saveCanvas();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [edges, hasSavedCanvas, loadAttempted, nodes, projectId]);

  return status;
}
