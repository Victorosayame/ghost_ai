"use client";

import { LiveObject, type LsonObject } from "@liveblocks/client";
import { useMutation } from "@liveblocks/react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  type FitViewOptions,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import { type LiveblocksNode, useLiveblocksFlow } from "@liveblocks/react-flow";
import type { DragEvent } from "react";
import { useRef, useState } from "react";
import "@xyflow/react/dist/style.css";

import { CanvasNodeComponent } from "./canvas-node";
import { CanvasShapePanel } from "./canvas-shape-panel";
import {
  CanvasEdge,
  CanvasNode,
  NODE_COLORS,
  SHAPE_PANEL_DRAG_TYPE,
  type ShapeDragPayload,
  isNodeShape,
} from "@/types/canvas";

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
};

const nodeTypes = {
  canvasNode: CanvasNodeComponent,
};

export function ReactFlowCanvas() {
  return (
    <ReactFlowProvider>
      <ReactFlowCanvasInner />
    </ReactFlowProvider>
  );
}

function ReactFlowCanvasInner() {
  const [isShapeDragging, setIsShapeDragging] = useState(false);
  const nodeCounterRef = useRef(0);
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
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
        new LiveObject(
          node as unknown as LsonObject
        ) as unknown as LiveblocksNode<CanvasNode>
      );
  }, []);

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

    setIsShapeDragging(false);

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

  return (
    <div className="relative flex h-full w-full flex-1 min-h-0 min-w-0 overflow-hidden bg-base">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={fitViewOptions}
        nodeTypes={nodeTypes}
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
        <MiniMap
          position="bottom-left"
          bgColor="rgba(17, 17, 20, 0.9)"
          maskColor="rgba(8, 8, 9, 0.8)"
          maskStrokeColor="var(--border-subtle)"
          nodeColor="var(--bg-subtle)"
          nodeStrokeColor="var(--border-subtle)"
          className="!mb-4 !ml-4 !rounded-2xl !border !border-[var(--border-default)]"
        />
      </ReactFlow>
      <CanvasShapePanel onDragStateChange={setIsShapeDragging} />
      {isShapeDragging ? (
        <div className="pointer-events-none absolute inset-0 border border-brand/40 bg-accent-dim/80" />
      ) : null}
    </div>
  );
}
