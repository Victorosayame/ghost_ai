import { auth } from "@clerk/nextjs/server";

import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  projectNameForRename,
  readProjectBody,
  unauthorizedResponse,
} from "@/lib/api/projects";
import {
  deleteProject,
  findProjectOwner,
  renameProject,
} from "@/lib/project-service";

interface ProjectRouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

async function requireProjectOwner(projectId: string, userId: string) {
  const project = await findProjectOwner(projectId);

  if (!project) {
    return notFoundResponse();
  }

  if (project.ownerId !== userId) {
    return forbiddenResponse();
  }

  return null;
}

export async function PATCH(request: Request, context: ProjectRouteContext) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return unauthorizedResponse();
  }

  const { projectId } = await context.params;
  const ownerError = await requireProjectOwner(projectId, userId);

  if (ownerError) {
    return ownerError;
  }

  let body;

  try {
    body = await readProjectBody(request);
  } catch {
    return badRequestResponse("Invalid JSON body");
  }

  if (!body) {
    return badRequestResponse("Invalid project payload");
  }

  const name = projectNameForRename(body.name);

  if (!name) {
    return badRequestResponse("Project name is required");
  }

  const project = await renameProject(projectId, name);

  return Response.json({ project });
}

export async function DELETE(_request: Request, context: ProjectRouteContext) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return unauthorizedResponse();
  }

  const { projectId } = await context.params;
  const ownerError = await requireProjectOwner(projectId, userId);

  if (ownerError) {
    return ownerError;
  }

  const project = await deleteProject(projectId);

  return Response.json({ project });
}
