import { auth } from "@clerk/nextjs/server";

import {
  collaboratorEmailForInvite,
  readCollaboratorBody,
} from "@/lib/api/collaborators";
import {
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/lib/api/projects";
import { listEnrichedProjectCollaborators } from "@/lib/project-collaborators";
import {
  findProjectForIdentity,
  getCurrentClerkIdentity,
} from "@/lib/project-access";
import { findProjectOwner } from "@/lib/project-service";
import { inviteProjectCollaborator } from "@/lib/project-collaborators";

interface CollaboratorsRouteContext {
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

export async function GET(
  _request: Request,
  context: CollaboratorsRouteContext
) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.isAuthenticated || !identity.userId) {
    return unauthorizedResponse();
  }

  const { projectId } = await context.params;
  const project = await findProjectForIdentity(projectId, identity);

  if (!project) {
    return notFoundResponse();
  }

  const collaborators = await listEnrichedProjectCollaborators(projectId);
  const access = project.ownerId === identity.userId ? "owner" : "collaborator";

  return Response.json({ access, collaborators });
}

export async function POST(
  request: Request,
  context: CollaboratorsRouteContext
) {
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
    body = await readCollaboratorBody(request);
  } catch {
    return badRequestResponse("Invalid JSON body");
  }

  if (!body) {
    return badRequestResponse("Invalid collaborator payload");
  }

  const email = collaboratorEmailForInvite(body.email);

  if (!email) {
    return badRequestResponse("A valid collaborator email is required");
  }

  try {
    const collaborator = await inviteProjectCollaborator(projectId, email);

    return Response.json({ collaborator }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return conflictResponse("This collaborator is already invited");
    }

    throw error;
  }
}
