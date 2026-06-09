import { auth as triggerAuth } from "@trigger.dev/sdk";

import { readDesignTokenRequestBody } from "@/lib/api/design-agent";
import {
  badRequestResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/lib/api/projects";
import { getCurrentClerkIdentity } from "@/lib/project-access";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.isAuthenticated || !identity.userId) {
    return unauthorizedResponse();
  }

  let body;

  try {
    body = await readDesignTokenRequestBody(request);
  } catch {
    return badRequestResponse("Invalid JSON body");
  }

  if (!body) {
    return badRequestResponse("Invalid design token payload");
  }

  const taskRun = await prisma.taskRun.findFirst({
    where: {
      runId: body.runId,
      userId: identity.userId,
    },
    select: { runId: true },
  });

  if (!taskRun) {
    return notFoundResponse();
  }

  const token = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: taskRun.runId,
      },
    },
    expirationTime: "1h",
  });

  return Response.json({ token, runId: taskRun.runId });
}
