import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { task } from "@trigger.dev/sdk";
import { generateObject, jsonSchema } from "ai";

import { getLiveblocksClient } from "@/lib/liveblocks";
import {
  CANVAS_EDGE_TYPE,
  DEFAULT_CANVAS_EDGE_LABEL,
  DEFAULT_CANVAS_EDGE_MARKER,
  NODE_COLORS,
  NODE_SHAPES,
  SHAPE_DEFAULTS,
  SHAPE_MIN_DIMENSIONS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeData,
  type NodeShape,
} from "@/types/canvas";
import {
  AI_STATUS_FEED_ID,
  type AiStatusFeedPayload,
  type AiStatusLevel,
  type AiStatusPhase,
} from "@/types/tasks";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

interface AddNodeAction {
  type: "addNode";
  id?: string;
  label?: string;
  shape?: NodeShape;
  x: number;
  y: number;
  width?: number;
  height?: number;
  colorIndex?: number;
}

interface MoveNodeAction {
  type: "moveNode";
  id: string;
  x: number;
  y: number;
}

interface ResizeNodeAction {
  type: "resizeNode";
  id: string;
  width: number;
  height: number;
}

interface UpdateNodeDataAction {
  type: "updateNodeData";
  id: string;
  label?: string;
  shape?: NodeShape;
  colorIndex?: number;
}

interface DeleteNodeAction {
  type: "deleteNode";
  id: string;
}

interface AddEdgeAction {
  type: "addEdge";
  id?: string;
  source: string;
  target: string;
  label?: string;
}

interface DeleteEdgeAction {
  type: "deleteEdge";
  id: string;
}

type DesignAction =
  | AddNodeAction
  | MoveNodeAction
  | ResizeNodeAction
  | UpdateNodeDataAction
  | DeleteNodeAction
  | AddEdgeAction
  | DeleteEdgeAction;

interface DesignPlan {
  summary: string;
  actions: DesignAction[];
}

const AI_USER_ID = "ghost-ai";
const AI_USER_INFO = {
  name: "Ghost AI",
  avatar: "",
  color: "#8b82ff",
};
const AI_PRESENCE_ACTIVE_TTL_SECONDS = 300;
const AI_PRESENCE_CLEAR_TTL_SECONDS = 2;
const MAX_ACTIONS = 48;
const MAX_LABEL_LENGTH = 48;
const POSITION_LIMIT = 5000;
const AI_LAYOUT_COLUMN_GAP = 300;
const AI_LAYOUT_ROW_GAP = 170;
const AI_LAYOUT_EXISTING_GAP = 280;

const designPlanSchema = jsonSchema<DesignPlan>({
  type: "object",
  additionalProperties: false,
  required: ["summary", "actions"],
  properties: {
    summary: { type: "string" },
    actions: {
      type: "array",
      maxItems: MAX_ACTIONS,
      items: {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "label", "x", "y"],
            properties: {
              type: { const: "addNode" },
              id: { type: "string" },
              label: { type: "string" },
              shape: { enum: [...NODE_SHAPES] },
              x: { type: "number" },
              y: { type: "number" },
              width: { type: "number" },
              height: { type: "number" },
              colorIndex: { type: "number" },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "x", "y"],
            properties: {
              type: { const: "moveNode" },
              id: { type: "string" },
              x: { type: "number" },
              y: { type: "number" },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id", "width", "height"],
            properties: {
              type: { const: "resizeNode" },
              id: { type: "string" },
              width: { type: "number" },
              height: { type: "number" },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id"],
            properties: {
              type: { const: "updateNodeData" },
              id: { type: "string" },
              label: { type: "string" },
              shape: { enum: [...NODE_SHAPES] },
              colorIndex: { type: "number" },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id"],
            properties: {
              type: { const: "deleteNode" },
              id: { type: "string" },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "source", "target", "label"],
            properties: {
              type: { const: "addEdge" },
              id: { type: "string" },
              source: { type: "string" },
              target: { type: "string" },
              label: { type: "string" },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "id"],
            properties: {
              type: { const: "deleteEdge" },
              id: { type: "string" },
            },
          },
        ],
      },
    },
  },
});

export const designAgent = task({
  id: "design-agent",
  run: async (payload: DesignAgentPayload) => {
    await setAiPresence(payload.roomId, true);
    await publishStatus(payload.roomId, {
      level: "info",
      message: "Starting architecture design.",
      phase: "start",
    });

    try {
      const snapshot = await readCanvasSnapshot(payload.roomId);

      await publishStatus(payload.roomId, {
        level: "info",
        message: "Interpreting the prompt and current canvas.",
        phase: "processing",
      });

      const plan = await createDesignPlan(payload.prompt, snapshot);
      const applied = await applyDesignPlan(payload.roomId, plan);

      await publishStatus(payload.roomId, {
        level: "success",
        message: `Updated the canvas with ${applied} design change${
          applied === 1 ? "" : "s"
        }.`,
        phase: "complete",
      });

      return {
        roomId: payload.roomId,
        status: "completed",
        applied,
        summary: plan.summary,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ghost AI could not update the canvas.";

      await publishStatus(payload.roomId, {
        level: "error",
        message,
        phase: "error",
      });

      throw error;
    } finally {
      await clearAiPresence(payload.roomId);
    }
  },
});

async function readCanvasSnapshot(roomId: string) {
  const client = getLiveblocksClient();
  let snapshot: { nodes: readonly CanvasNode[]; edges: readonly CanvasEdge[] } =
    { nodes: [], edges: [] };

  await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
    snapshot = flow.toJSON();
  });

  return snapshot;
}

async function createDesignPlan(
  prompt: string,
  snapshot: { nodes: readonly CanvasNode[]; edges: readonly CanvasEdge[] }
): Promise<DesignPlan> {
  const apiKey =
    process.env.GOOGLE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing Google AI API key for the design agent.");
  }

  const google = createGoogleGenerativeAI({ apiKey });
  const result = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: designPlanSchema,
    system: [
      "You are Ghost AI, a system architecture design agent.",
      "Return only canvas actions that improve the existing React Flow architecture graph.",
      "Use allowed node shapes: rectangle, diamond, circle, pill, cylinder, hexagon.",
      "Use colorIndex values from 0 to 7 only.",
      "Prefer readable left-to-right or top-to-bottom layouts with at least 220px horizontal spacing and 140px vertical spacing.",
      "Use concise labels under 48 characters.",
      "Every addEdge action must include a short label describing the traffic, event, query, or data flow.",
      "Do not delete existing nodes unless the user explicitly asks to remove or replace them.",
      "Only connect edges between nodes that exist now or are added in this action list.",
    ].join("\n"),
    prompt: [
      `User prompt: ${prompt}`,
      "",
      "Current canvas snapshot:",
      JSON.stringify(
        {
          nodes: snapshot.nodes.map((node) => ({
            id: node.id,
            label: node.data.label,
            shape: node.data.shape ?? "rectangle",
            position: node.position,
            width: node.width,
            height: node.height,
          })),
          edges: snapshot.edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.data?.label ?? "",
          })),
        },
        null,
        2
      ),
    ].join("\n"),
  });

  return {
    summary: cleanLabel(result.object.summary, 140) || "Updated architecture",
    actions: normalizeDesignActions(
      result.object.actions.slice(0, MAX_ACTIONS),
      snapshot
    ),
  };
}

function normalizeDesignActions(
  actions: DesignAction[],
  snapshot: { nodes: readonly CanvasNode[]; edges: readonly CanvasEdge[] }
) {
  const normalizedActions = actions.map((action) => ({ ...action }));
  const addNodes = normalizedActions.filter(
    (action): action is AddNodeAction => action.type === "addNode"
  );

  if (addNodes.length > 0) {
    normalizeAddedNodeLayout(addNodes, snapshot.nodes);
  }

  const nodeLabels = buildNodeLabelMap(snapshot.nodes, addNodes);

  for (const action of normalizedActions) {
    if (action.type !== "addEdge") {
      continue;
    }

    const label = cleanLabel(action.label, 36);

    if (!label) {
      action.label = inferEdgeLabel(action, nodeLabels);
    }
  }

  return normalizedActions;
}

function normalizeAddedNodeLayout(
  addNodes: AddNodeAction[],
  existingNodes: readonly CanvasNode[]
) {
  const startX = getNextLayoutStartX(existingNodes);
  const groups = new Map<number, AddNodeAction[]>();

  for (const node of addNodes) {
    const column = inferNodeColumn(node.label || node.id || "");
    const group = groups.get(column) ?? [];

    group.push(node);
    groups.set(column, group);
  }

  for (const [column, group] of groups) {
    const totalHeight = (group.length - 1) * AI_LAYOUT_ROW_GAP;

    group.forEach((node, index) => {
      node.x = startX + column * AI_LAYOUT_COLUMN_GAP;
      node.y = index * AI_LAYOUT_ROW_GAP - totalHeight / 2;
    });
  }
}

function getNextLayoutStartX(existingNodes: readonly CanvasNode[]) {
  if (existingNodes.length === 0) {
    return 0;
  }

  const rightEdge = Math.max(
    ...existingNodes.map(
      (node) => node.position.x + (node.width ?? SHAPE_DEFAULTS.rectangle.width)
    )
  );

  return rightEdge + AI_LAYOUT_EXISTING_GAP;
}

function inferNodeColumn(label: string) {
  const normalizedLabel = label.toLowerCase();

  if (
    includesAny(normalizedLabel, [
      "client",
      "frontend",
      "web",
      "mobile",
      "load balancer",
      "api gateway",
      "gateway",
      "cdn",
    ])
  ) {
    return 0;
  }

  if (
    includesAny(normalizedLabel, [
      "service",
      "auth",
      "user",
      "catalog",
      "order",
      "payment",
      "checkout",
      "inventory",
      "processing",
    ])
  ) {
    return 1;
  }

  if (
    includesAny(normalizedLabel, [
      "redis",
      "cache",
      "database",
      "db",
      "nosql",
      "sql",
      "queue",
      "message",
      "broker",
      "stream",
      "event",
    ])
  ) {
    return 2;
  }

  return 3;
}

function buildNodeLabelMap(
  existingNodes: readonly CanvasNode[],
  addNodes: readonly AddNodeAction[]
) {
  const labels = new Map<string, string>();

  for (const node of existingNodes) {
    labels.set(node.id, node.data.label || node.id);
  }

  const existingIds = new Set(existingNodes.map((node) => node.id));

  for (const node of addNodes) {
    const label = cleanLabel(node.label, MAX_LABEL_LENGTH) || "Component";
    const id = uniqueId(sanitizeId(node.id || label), existingIds);

    existingIds.add(id);
    labels.set(id, label);

    if (node.id) {
      labels.set(node.id, label);
    }
  }

  return labels;
}

async function applyDesignPlan(roomId: string, plan: DesignPlan) {
  const client = getLiveblocksClient();
  let applied = 0;

  await publishStatus(roomId, {
    level: "info",
    message: "Applying architecture updates to the shared canvas.",
    phase: "processing",
  });

  await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
    const nodeIds = new Set(flow.nodes.map((node) => node.id));
    const edgeIds = new Set(flow.edges.map((edge) => edge.id));

    for (const action of plan.actions) {
      if (action.type === "addNode") {
        const node = createNode(action, nodeIds);
        flow.addNode(node);
        nodeIds.add(node.id);
        applied += 1;
        continue;
      }

      if (action.type === "moveNode" && nodeIds.has(action.id)) {
        flow.updateNode(action.id, {
          position: {
            x: clampNumber(action.x, -POSITION_LIMIT, POSITION_LIMIT),
            y: clampNumber(action.y, -POSITION_LIMIT, POSITION_LIMIT),
          },
        });
        applied += 1;
        continue;
      }

      if (action.type === "resizeNode" && nodeIds.has(action.id)) {
        const existingNode = flow.getNode(action.id);
        const shape = existingNode?.data.shape ?? "rectangle";
        const size = sanitizeSize(shape, action.width, action.height);

        flow.updateNode(action.id, size);
        applied += 1;
        continue;
      }

      if (action.type === "updateNodeData" && nodeIds.has(action.id)) {
        const existingNode = flow.getNode(action.id);
        const nextShape = action.shape ?? existingNode?.data.shape ?? "rectangle";
        const color = NODE_COLORS[sanitizeColorIndex(action.colorIndex)];
        const patch: Partial<CanvasNodeData> = {
          color: color.fill,
          textColor: color.text,
          shape: nextShape,
        };

        if (typeof action.label === "string") {
          patch.label = cleanLabel(action.label, MAX_LABEL_LENGTH);
        }

        flow.updateNodeData(action.id, patch);
        applied += 1;
        continue;
      }

      if (action.type === "deleteNode" && nodeIds.has(action.id)) {
        flow.removeNode(action.id);
        nodeIds.delete(action.id);

        for (const edge of flow.edges) {
          if (edge.source === action.id || edge.target === action.id) {
            flow.removeEdge(edge.id);
            edgeIds.delete(edge.id);
          }
        }

        applied += 1;
        continue;
      }

      if (
        action.type === "addEdge" &&
        nodeIds.has(action.source) &&
        nodeIds.has(action.target) &&
        action.source !== action.target
      ) {
        const edge = createEdge(action, edgeIds);
        flow.addEdge(edge);
        edgeIds.add(edge.id);
        applied += 1;
        continue;
      }

      if (action.type === "deleteEdge" && edgeIds.has(action.id)) {
        flow.removeEdge(action.id);
        edgeIds.delete(action.id);
        applied += 1;
      }
    }
  });

  return applied;
}

function createNode(action: AddNodeAction, nodeIds: Set<string>): CanvasNode {
  const shape = action.shape ?? "rectangle";
  const size = sanitizeSize(shape, action.width, action.height);
  const color = NODE_COLORS[sanitizeColorIndex(action.colorIndex)];
  const label = cleanLabel(action.label, MAX_LABEL_LENGTH) || "Component";
  const id = uniqueId(sanitizeId(action.id || label), nodeIds);

  return {
    id,
    type: "canvasNode",
    position: {
      x: clampNumber(action.x, -POSITION_LIMIT, POSITION_LIMIT),
      y: clampNumber(action.y, -POSITION_LIMIT, POSITION_LIMIT),
    },
    ...size,
    data: {
      label,
      color: color.fill,
      textColor: color.text,
      shape,
    },
  };
}

function createEdge(action: AddEdgeAction, edgeIds: Set<string>): CanvasEdge {
  const id = uniqueId(
    sanitizeId(action.id || `edge-${action.source}-${action.target}`),
    edgeIds
  );

  return {
    id,
    type: CANVAS_EDGE_TYPE,
    source: action.source,
    target: action.target,
    markerEnd: DEFAULT_CANVAS_EDGE_MARKER,
    data: {
      label: cleanLabel(action.label, 36) || DEFAULT_CANVAS_EDGE_LABEL,
    },
  };
}

function inferEdgeLabel(
  action: AddEdgeAction,
  nodeLabels: ReadonlyMap<string, string>
) {
  const source = (nodeLabels.get(action.source) || action.source).toLowerCase();
  const target = (nodeLabels.get(action.target) || action.target).toLowerCase();

  if (includesAny(target, ["redis", "cache"])) {
    return "cache lookup";
  }

  if (includesAny(target, ["queue", "message", "broker", "stream", "event"])) {
    return "publish event";
  }

  if (includesAny(target, ["database", "db", "nosql", "sql"])) {
    return "data query";
  }

  if (includesAny(target, ["auth", "user"]) || includesAny(source, ["auth"])) {
    return "auth request";
  }

  if (includesAny(target, ["catalog", "product"])) {
    return "catalog request";
  }

  if (includesAny(target, ["order", "processing", "checkout"])) {
    return "order request";
  }

  if (includesAny(source, ["gateway", "api"])) {
    return "route request";
  }

  return "service call";
}

function sanitizeSize(shape: NodeShape, width?: number, height?: number) {
  const defaults = SHAPE_DEFAULTS[shape];
  const minimum = SHAPE_MIN_DIMENSIONS[shape];

  return {
    width: clampNumber(width ?? defaults.width, minimum.width, 420),
    height: clampNumber(height ?? defaults.height, minimum.height, 260),
  };
}

function sanitizeColorIndex(index: number | undefined) {
  if (typeof index !== "number" || !Number.isFinite(index)) {
    return 0;
  }

  return Math.min(Math.max(Math.trunc(index), 0), NODE_COLORS.length - 1);
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function cleanLabel(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeId(value: unknown) {
  if (typeof value !== "string") {
    return "node";
  }

  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);

  return sanitized || "node";
}

function uniqueId(baseId: string, existingIds: Set<string>) {
  let id = baseId;
  let index = 1;

  while (existingIds.has(id)) {
    index += 1;
    id = `${baseId}-${index}`;
  }

  return id;
}

function includesAny(value: string, needles: readonly string[]) {
  return needles.some((needle) => value.includes(needle));
}

async function publishStatus(
  roomId: string,
  status: {
    level: AiStatusLevel;
    message: string;
    phase: AiStatusPhase;
  }
) {
  const client = getLiveblocksClient();
  const id = `ai-status-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = new Date().toISOString();
  const data: AiStatusFeedPayload = {
    level: status.level,
    phase: status.phase,
    text: status.message,
    timestamp,
  };

  await ensureAiStatusFeed(roomId);
  await client.createFeedMessage<AiStatusFeedPayload>({
    roomId,
    feedId: AI_STATUS_FEED_ID,
    id,
    data,
    createdAt: Date.now(),
  });

  await client.broadcastEvent(roomId, {
    type: "AI_STATUS",
    feedId: AI_STATUS_FEED_ID,
    id,
    data,
  });
}

async function ensureAiStatusFeed(roomId: string) {
  const client = getLiveblocksClient();

  try {
    await client.getFeed({
      roomId,
      feedId: AI_STATUS_FEED_ID,
    });
    return;
  } catch {
    // Missing feeds are created lazily so every room can reuse the same feed ID.
  }

  try {
    await client.createFeed({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      metadata: {
        kind: "ai-status",
        name: "AI status feed",
      },
    });
  } catch {
    // Another client or retry may have created it between getFeed and createFeed.
  }
}

async function setAiPresence(roomId: string, thinking: boolean) {
  const client = getLiveblocksClient();

  await ensureAiRoomAccess(roomId);

  await client.setPresence(roomId, {
    userId: AI_USER_ID,
    userInfo: AI_USER_INFO,
    data: {
      cursor: thinking ? { x: 120, y: 80 } : null,
      thinking,
    },
    ttl: thinking
      ? AI_PRESENCE_ACTIVE_TTL_SECONDS
      : AI_PRESENCE_CLEAR_TTL_SECONDS,
  });
}

async function clearAiPresence(roomId: string) {
  try {
    await setAiPresence(roomId, false);
  } catch (error) {
    console.error("Failed to clear Ghost AI presence:", describeError(error));
  }
}

async function ensureAiRoomAccess(roomId: string) {
  const client = getLiveblocksClient();

  await client.getOrCreateRoom(roomId, {
    defaultAccesses: [],
    metadata: {
      projectId: roomId,
    },
  });

  await client.updateRoom(roomId, {
    usersAccesses: {
      [AI_USER_ID]: ["room:write"],
    },
  });
}

function describeError(error: unknown) {
  if (error instanceof Error) {
    return typeof error.toString === "function" ? error.toString() : error.message;
  }

  return String(error);
}
