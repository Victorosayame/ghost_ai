import { auth } from "@clerk/nextjs/server";

import {
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/lib/api/projects";
import { removeProjectCollaborator } from "@/lib/project-collaborators";
import { findProjectOwner } from "@/lib/project-service";

interface CollaboratorRouteContext {
  params: Promise<{
    collaboratorId: string;
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

export async function DELETE(
  _request: Request,
  context: CollaboratorRouteContext
) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return unauthorizedResponse();
  }

  const { collaboratorId, projectId } = await context.params;
  const ownerError = await requireProjectOwner(projectId, userId);

  if (ownerError) {
    return ownerError;
  }

  const result = await removeProjectCollaborator(projectId, collaboratorId);

  if (result.count === 0) {
    return notFoundResponse();
  }

  return Response.json({ collaboratorId });
}
