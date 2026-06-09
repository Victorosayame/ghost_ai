import { auth as triggerAuth, tasks } from "@trigger.dev/sdk";

import { readDesignRequestBody } from "@/lib/api/design-agent";
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
import type { designAgent } from "@/trigger/design-agent";

export async function POST(request: Request) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.isAuthenticated || !identity.userId) {
    return unauthorizedResponse();
  }

  let body;

  try {
    body = await readDesignRequestBody(request);
  } catch {
    return badRequestResponse("Invalid JSON body");
  }

  if (!body) {
    return badRequestResponse("Invalid design request payload");
  }

  if (body.roomId !== body.projectId) {
    return badRequestResponse("Room ID must match the project ID");
  }

  const project = await findProjectForIdentity(body.projectId, identity);

  if (!project) {
    return notFoundResponse();
  }

  const handle = await tasks.trigger<typeof designAgent>("design-agent", {
    prompt: body.prompt,
    roomId: body.roomId,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: project.id,
      userId: identity.userId,
    },
    select: { id: true },
  });

  const publicToken = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: handle.id,
      },
    },
    expirationTime: "1h",
  });

  return Response.json({ publicToken, runId: handle.id }, { status: 202 });
}
