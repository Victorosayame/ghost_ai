import { put } from "@vercel/blob";

import { readCanvasSnapshot, isCanvasSnapshot } from "@/lib/api/canvas";
import {
  badRequestResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/lib/api/projects";
import {
  findProjectForIdentity,
  getCurrentClerkIdentity,
} from "@/lib/project-access";
import prisma from "@/lib/prisma";

interface CanvasRouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

export async function GET(_request: Request, context: CanvasRouteContext) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.isAuthenticated || !identity.userId) {
    return unauthorizedResponse();
  }

  const { projectId } = await context.params;
  const project = await findProjectForIdentity(projectId, identity);

  if (!project) {
    return notFoundResponse();
  }

  if (!project.canvasJsonPath) {
    return Response.json({ canvas: null });
  }

  const response = await fetch(project.canvasJsonPath, {
    cache: "no-store",
  });

  if (!response.ok) {
    return Response.json(
      { error: "Failed to load saved canvas" },
      { status: 502 }
    );
  }

  const canvas = (await response.json().catch(() => null)) as unknown;

  if (!isCanvasSnapshot(canvas)) {
    return Response.json(
      { error: "Saved canvas payload is invalid" },
      { status: 502 }
    );
  }

  return Response.json({ canvas });
}

export async function PUT(request: Request, context: CanvasRouteContext) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.isAuthenticated || !identity.userId) {
    return unauthorizedResponse();
  }

  const { projectId } = await context.params;
  const project = await findProjectForIdentity(projectId, identity);

  if (!project) {
    return notFoundResponse();
  }

  let canvas;

  try {
    canvas = await readCanvasSnapshot(request);
  } catch {
    return badRequestResponse("Invalid JSON body");
  }

  if (!canvas) {
    return badRequestResponse("Invalid canvas payload");
  }

  const blob = await put(
    `canvas/${projectId}.json`,
    JSON.stringify(canvas),
    {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
    }
  );

  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: blob.url },
    select: { id: true },
  });

  return Response.json({
    canvasJsonPath: blob.url,
    savedAt: new Date().toISOString(),
  });
}
