import { tasks } from "@trigger.dev/sdk";

import { readSpecRequestBody } from "@/lib/api/spec-generation";
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
import type { generateSpec } from "@/trigger/generate-spec";

export async function POST(request: Request) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.isAuthenticated || !identity.userId) {
    return unauthorizedResponse();
  }

  let body;

  try {
    body = await readSpecRequestBody(request);
  } catch {
    return badRequestResponse("Invalid JSON body");
  }

  if (!body) {
    return badRequestResponse("Invalid spec generation request payload");
  }

  const project = await findProjectForIdentity(body.roomId, identity);

  if (!project) {
    return notFoundResponse();
  }

  const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
    projectId: project.id,
    roomId: body.roomId,
    chatHistory: body.chatHistory,
    nodes: body.nodes,
    edges: body.edges,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: project.id,
      userId: identity.userId,
    },
    select: { id: true },
  });

  return Response.json({ runId: handle.id }, { status: 202 });
}
