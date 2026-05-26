import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas"
import {
  CANVAS_EDGE_TYPE,
  DEFAULT_CANVAS_EDGE_LABEL,
  DEFAULT_CANVAS_EDGE_MARKER,
  NODE_COLORS,
  SHAPE_DEFAULTS,
} from "@/types/canvas"

export interface CanvasTemplate {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

export interface CanvasTemplateBounds {
  height: number
  maxX: number
  maxY: number
  minX: number
  minY: number
  width: number
}

const C = NODE_COLORS

function n(
  id: string,
  label: string,
  colorIdx: number,
  shape: NodeShape,
  x: number,
  y: number,
  w?: number,
  h?: number
): CanvasNode {
  const def = SHAPE_DEFAULTS[shape]
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: { label, color: C[colorIdx].fill, textColor: C[colorIdx].text, shape },
    width: w ?? def.width,
    height: h ?? def.height,
  }
}

function e(id: string, source: string, target: string): CanvasEdge {
  return {
    id,
    type: CANVAS_EDGE_TYPE,
    source,
    target,
    data: { label: DEFAULT_CANVAS_EDGE_LABEL },
    markerEnd: DEFAULT_CANVAS_EDGE_MARKER,
  }
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description: "API Gateway routes traffic to isolated services, each backed by a dedicated database and connected via a shared message bus.",
    nodes: [
      n("ms-gw",    "API Gateway",       1, "rectangle", 240,   0),
      n("ms-auth",  "Auth Service",      2, "pill",        0, 160),
      n("ms-users", "User Service",      7, "rectangle",  200, 160),
      n("ms-orders","Order Service",     3, "rectangle",  380, 160),
      n("ms-pay",   "Payment Service",   5, "rectangle",  560, 160),
      n("ms-udb",   "User DB",           0, "cylinder",   200, 320),
      n("ms-odb",   "Order DB",          0, "cylinder",   380, 320),
    ],
    edges: [
      e("ms-e1", "ms-gw",    "ms-auth"),
      e("ms-e2", "ms-gw",    "ms-users"),
      e("ms-e3", "ms-gw",    "ms-orders"),
      e("ms-e4", "ms-gw",    "ms-pay"),
      e("ms-e5", "ms-users", "ms-udb"),
      e("ms-e6", "ms-orders","ms-odb"),
    ],
  },
  {
    id: "cicd-pipeline",
    name: "CI/CD Pipeline",
    description: "End-to-end delivery from source commit through build, test, containerisation, and staged deployment to production.",
    nodes: [
      n("ci-src",   "Source Code",          1, "rectangle",    0, 60),
      n("ci-build", "Build",                3, "rectangle",  220, 60),
      n("ci-test",  "Test Suite",           6, "diamond",    440, 30),
      n("ci-pkg",   "Package",              1, "rectangle",  680, 60),
      n("ci-stg",   "Deploy Staging",       3, "rectangle",  900, 60),
      n("ci-int",   "Integration Tests",    2, "diamond",   1120, 30),
      n("ci-prod",  "Deploy Production",    7, "rectangle", 1360, 60),
    ],
    edges: [
      e("ci-e1", "ci-src",   "ci-build"),
      e("ci-e2", "ci-build", "ci-test"),
      e("ci-e3", "ci-test",  "ci-pkg"),
      e("ci-e4", "ci-pkg",   "ci-stg"),
      e("ci-e5", "ci-stg",   "ci-int"),
      e("ci-e6", "ci-int",   "ci-prod"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description: "Producers publish events to a central bus. Independent consumers handle emails, push notifications, analytics, and error queues.",
    nodes: [
      n("ev-p1",     "Producer A",        1, "rectangle",   0, 100),
      n("ev-p2",     "Producer B",        1, "rectangle",   0, 240),
      n("ev-broker", "Message Broker",    3, "hexagon",   260, 130),
      n("ev-c1",     "Consumer A",        6, "rectangle", 540,  60),
      n("ev-c2",     "Consumer B",        7, "rectangle", 540, 220),
      n("ev-store",  "Event Store",       0, "cylinder",  260, 360),
      n("ev-dlq",    "Dead Letter Queue", 4, "rectangle", 540, 380),
    ],
    edges: [
      e("ev-e1", "ev-p1",     "ev-broker"),
      e("ev-e2", "ev-p2",     "ev-broker"),
      e("ev-e3", "ev-broker", "ev-c1"),
      e("ev-e4", "ev-broker", "ev-c2"),
      e("ev-e5", "ev-broker", "ev-store"),
      e("ev-e6", "ev-c1",     "ev-dlq"),
      e("ev-e7", "ev-c2",     "ev-dlq"),
    ],
  },
]

export function cloneCanvasTemplate(template: CanvasTemplate): CanvasTemplate {
  return {
    ...template,
    nodes: template.nodes.map((node) => ({
      ...node,
      position: { ...node.position },
      data: { ...node.data },
    })),
    edges: template.edges.map((edge) => ({
      ...edge,
      data: edge.data ? { ...edge.data } : edge.data,
      markerEnd: edge.markerEnd,
    })),
  }
}

export function getTemplateBounds(nodes: CanvasNode[]): CanvasTemplateBounds {
  if (nodes.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 1,
      maxY: 1,
      width: 1,
      height: 1,
    }
  }

  const [firstNode, ...restNodes] = nodes
  const firstShape = firstNode.data.shape ?? "rectangle"
  const firstWidth = firstNode.width ?? SHAPE_DEFAULTS[firstShape].width
  const firstHeight = firstNode.height ?? SHAPE_DEFAULTS[firstShape].height

  let minX = firstNode.position.x
  let minY = firstNode.position.y
  let maxX = firstNode.position.x + firstWidth
  let maxY = firstNode.position.y + firstHeight

  for (const node of restNodes) {
    const shape = node.data.shape ?? "rectangle"
    const width = node.width ?? SHAPE_DEFAULTS[shape].width
    const height = node.height ?? SHAPE_DEFAULTS[shape].height
    const nodeMinX = node.position.x
    const nodeMinY = node.position.y
    const nodeMaxX = node.position.x + width
    const nodeMaxY = node.position.y + height

    minX = Math.min(minX, nodeMinX)
    minY = Math.min(minY, nodeMinY)
    maxX = Math.max(maxX, nodeMaxX)
    maxY = Math.max(maxY, nodeMaxY)
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  }
}
