"use client";

import { LiveMap, LiveObject, type JsonObject } from "@liveblocks/client";
import { useCanRedo, useCanUndo, useMutation, useRedo, useUndo } from "@liveblocks/react";
import {
  Background,
  BackgroundVariant,
  type Connection,
  ConnectionMode,
  type FitViewOptions,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import {
  type LiveblocksEdge,
  type LiveblocksNode,
  useLiveblocksFlow,
} from "@liveblocks/react-flow";
import { Redo2, Search, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import type { DragEvent } from "react";
import { useEffect, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";

import { CanvasNodeComponent } from "./canvas-node";
import { CanvasEdgeComponent } from "./canvas-edge";
import { CanvasNodeShape } from "./canvas-node-shape";
import { CanvasShapePanel } from "./canvas-shape-panel";
import { StarterTemplatesModal } from "./starter-templates-modal";
import type { CanvasTemplate } from "./starter-templates";
import {
  CANVAS_EDGE_TYPE,
  CanvasEdge,
  CanvasNode,
  DEFAULT_CANVAS_EDGE_LABEL,
  DEFAULT_CANVAS_EDGE_MARKER,
  NODE_COLORS,
  SHAPE_PANEL_DRAG_TYPE,
  type ShapeDragPayload,
  isNodeShape,
} from "@/types/canvas";
import { Button } from "@/components/ui/button";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
};

const nodeTypes = {
  canvasNode: CanvasNodeComponent,
};

const edgeTypes = {
  [CANVAS_EDGE_TYPE]: CanvasEdgeComponent,
};

interface ReactFlowCanvasProps {
  isStarterTemplatesOpen: boolean;
  onStarterTemplatesOpenChange: (open: boolean) => void;
}

export function ReactFlowCanvas({
  isStarterTemplatesOpen,
  onStarterTemplatesOpenChange,
}: ReactFlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <ReactFlowCanvasInner
        isStarterTemplatesOpen={isStarterTemplatesOpen}
        onStarterTemplatesOpenChange={onStarterTemplatesOpenChange}
      />
    </ReactFlowProvider>
  );
}

function ReactFlowCanvasInner({
  isStarterTemplatesOpen,
  onStarterTemplatesOpenChange,
}: ReactFlowCanvasProps) {
  const [dragPreviewPayload, setDragPreviewPayload] =
    useState<ShapeDragPayload | null>(null);
  const [dragCursor, setDragCursor] = useState<{ x: number; y: number } | null>(
    null
  );
  const [pendingTemplateFitId, setPendingTemplateFitId] = useState<string | null>(
    null
  );
  const nodeCounterRef = useRef(0);
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      nodes: {
        initial: [],
      },
      edges: {
        initial: [],
      },
      suspense: true,
    });
  const addNode = useMutation(({ storage }, node: CanvasNode) => {
    const flow = storage.get("flow");

    if (!flow) {
      return;
    }

    flow
      .get("nodes")
      .set(
        node.id,
        LiveObject.from(node as unknown as JsonObject) as unknown as LiveblocksNode<CanvasNode>
      );
  }, []);
  const replaceCanvasWithTemplate = useMutation(
    ({ storage }, template: CanvasTemplate) => {
      const flow = storage.get("flow");

      if (!flow) {
        return;
      }

      flow.set("nodes", new LiveMap() as never);
      flow.set("edges", new LiveMap() as never);

      const nodes = flow.get("nodes");
      const edges = flow.get("edges");

      if (!nodes || !edges) {
        return;
      }

      for (const node of template.nodes) {
        nodes.set(
          node.id,
          LiveObject.from(node as unknown as JsonObject) as unknown as LiveblocksNode<CanvasNode>
        );
      }

      for (const edge of template.edges) {
        edges.set(
          edge.id,
          LiveObject.from(edge as unknown as JsonObject) as unknown as LiveblocksEdge<CanvasEdge>
        );
      }
    },
    []
  );
  const upgradeEdge = useMutation(({ storage }, edgeId: string) => {
    const flow = storage.get("flow");

    if (!flow) {
      return;
    }

    const edge = flow.get("edges").get(edgeId);

    if (!edge) {
      return;
    }

    if (edge.get("type") !== CANVAS_EDGE_TYPE) {
      edge.set("type", CANVAS_EDGE_TYPE);
    }

    if (!edge.get("markerEnd")) {
      edge.set("markerEnd", DEFAULT_CANVAS_EDGE_MARKER as never);
    }

    const currentData = edge.get("data");
    const currentLabel =
      typeof (currentData as CanvasEdge["data"] | undefined)?.label === "string"
        ? (currentData as CanvasEdge["data"] | undefined)?.label
        : undefined;

    if (currentData instanceof LiveObject) {
      if (typeof currentData.get("label") !== "string") {
        currentData.set("label", DEFAULT_CANVAS_EDGE_LABEL);
      }

      return;
    }

    edge.set(
      "data",
      LiveObject.from({
        label: currentLabel ?? DEFAULT_CANVAS_EDGE_LABEL,
      } as JsonObject) as unknown as typeof currentData
    );
  }, []);

  useEffect(() => {
    if (!dragPreviewPayload) {
      return;
    }

    function handleWindowDragOver(event: globalThis.DragEvent) {
      const dragTypes = Array.from(event.dataTransfer?.types ?? []);

      if (
        !dragTypes.includes(SHAPE_PANEL_DRAG_TYPE) &&
        !dragTypes.includes("text/plain")
      ) {
        return;
      }

      setDragCursor({
        x: event.clientX,
        y: event.clientY,
      });
    }

    function clearDragPreview() {
      setDragPreviewPayload(null);
      setDragCursor(null);
    }

    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", clearDragPreview);

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", clearDragPreview);
    };
  }, [dragPreviewPayload]);

  useEffect(() => {
    if (!pendingTemplateFitId || nodes.length === 0) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      void reactFlow.fitView({ ...fitViewOptions, duration: 220 });
      setPendingTemplateFitId(null);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [nodes, pendingTemplateFitId, reactFlow]);

  useEffect(() => {
    for (const edge of edges) {
      if (
        edge.type !== CANVAS_EDGE_TYPE ||
        !edge.markerEnd ||
        typeof edge.data?.label !== "string"
      ) {
        upgradeEdge(edge.id);
      }
    }
  }, [edges, upgradeEdge]);

  useKeyboardShortcuts({
    reactFlow,
    onUndo: undo,
    onRedo: redo,
  });

  function handleConnect(connection: Connection) {
    const nextConnection = {
      ...connection,
      type: CANVAS_EDGE_TYPE,
      data: {
        label: DEFAULT_CANVAS_EDGE_LABEL,
      },
      markerEnd: DEFAULT_CANVAS_EDGE_MARKER,
    } as Connection & Partial<CanvasEdge>;

    onConnect(nextConnection);
  }

  function hasShapeDragPayload(event: DragEvent<HTMLDivElement>) {
    const dragTypes = Array.from(event.dataTransfer.types);

    return (
      dragTypes.includes(SHAPE_PANEL_DRAG_TYPE) || dragTypes.includes("text/plain")
    );
  }

  function parseShapePayload(event: DragEvent<HTMLDivElement>) {
    const rawPayload =
      event.dataTransfer.getData(SHAPE_PANEL_DRAG_TYPE) ||
      event.dataTransfer.getData("text/plain");

    if (!rawPayload) {
      return null;
    }

    let payload: ShapeDragPayload;

    try {
      payload = JSON.parse(rawPayload) as ShapeDragPayload;
    } catch {
      return null;
    }

    if (
      !isNodeShape(payload.shape) ||
      typeof payload.width !== "number" ||
      typeof payload.height !== "number"
    ) {
      return null;
    }

    return payload;
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasShapeDragPayload(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    const payload = parseShapePayload(event);

    setDragPreviewPayload(null);
    setDragCursor(null);

    if (!payload) {
      return;
    }

    event.preventDefault();

    nodeCounterRef.current += 1;

    const position = reactFlow.screenToFlowPosition({
      x: event.clientX - payload.width / 2,
      y: event.clientY - payload.height / 2,
    });
    const defaultColor = NODE_COLORS[0];
    const nodeId = `${payload.shape}-${Date.now()}-${nodeCounterRef.current}`;

    addNode({
      id: nodeId,
      type: "canvasNode",
      position,
      width: payload.width,
      height: payload.height,
      data: {
        label: "",
        color: defaultColor.fill,
        textColor: defaultColor.text,
        shape: payload.shape,
      },
    });
  }

  function handleImportTemplate(template: CanvasTemplate) {
    replaceCanvasWithTemplate(template);
    setPendingTemplateFitId(template.id);
  }

  return (
    <div className="relative flex h-full w-full flex-1 min-h-0 min-w-0 overflow-hidden bg-base">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onDelete={onDelete}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={fitViewOptions}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: CANVAS_EDGE_TYPE,
          markerEnd: DEFAULT_CANVAS_EDGE_MARKER,
          data: {
            label: DEFAULT_CANVAS_EDGE_LABEL,
          },
        }}
        className="h-full w-full bg-base"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          bgColor="var(--bg-base)"
          color="var(--border-subtle)"
          gap={24}
          size={1.2}
          variant={BackgroundVariant.Dots}
        />
      </ReactFlow>
      <div className="pointer-events-none absolute bottom-24 left-5 z-10 flex">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-surface-border bg-surface/90 p-2 shadow-lg backdrop-blur-md">
          <CanvasControlButton
            ariaLabel="Zoom out"
            icon={<ZoomOut className="h-4 w-4" />}
            onClick={() => void reactFlow.zoomOut({ duration: 180 })}
          />
          <CanvasControlButton
            ariaLabel="Fit view"
            icon={<Search className="h-4 w-4" />}
            onClick={() => void reactFlow.fitView({ ...fitViewOptions, duration: 220 })}
          />
          <CanvasControlButton
            ariaLabel="Zoom in"
            icon={<ZoomIn className="h-4 w-4" />}
            onClick={() => void reactFlow.zoomIn({ duration: 180 })}
          />
          <div className="mx-1 h-7 w-px bg-[var(--border-default)]" />
          <CanvasControlButton
            ariaLabel="Undo"
            disabled={!canUndo}
            icon={<Undo2 className="h-4 w-4" />}
            onClick={undo}
          />
          <CanvasControlButton
            ariaLabel="Redo"
            disabled={!canRedo}
            icon={<Redo2 className="h-4 w-4" />}
            onClick={redo}
          />
        </div>
      </div>
      <CanvasShapePanel
        onDragStateChange={(payload) => {
          setDragPreviewPayload(payload);

          if (!payload) {
            setDragCursor(null);
          }
        }}
      />
      {dragPreviewPayload && dragCursor ? (
        <div
          className="pointer-events-none fixed z-50"
          style={{
            width: dragPreviewPayload.width,
            height: dragPreviewPayload.height,
            left: dragCursor.x - dragPreviewPayload.width / 2,
            top: dragCursor.y - dragPreviewPayload.height / 2,
          }}
        >
          <CanvasNodeShape
            label=""
            color={NODE_COLORS[0].fill}
            textColor={NODE_COLORS[0].text}
            shape={dragPreviewPayload.shape}
            isGhost
          />
        </div>
      ) : null}
      <StarterTemplatesModal
        isOpen={isStarterTemplatesOpen}
        onOpenChange={onStarterTemplatesOpenChange}
        onImport={handleImportTemplate}
      />
    </div>
  );
}

interface CanvasControlButtonProps {
  ariaLabel: string;
  disabled?: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}

function CanvasControlButton({
  ariaLabel,
  disabled = false,
  icon,
  onClick,
}: CanvasControlButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="rounded-full border border-transparent bg-transparent text-copy-secondary hover:border-subtle-border hover:bg-subtle hover:text-copy-primary disabled:border-transparent disabled:bg-transparent disabled:text-copy-faint"
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
    </Button>
  );
}
