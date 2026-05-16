import { auth } from "@clerk/nextjs/server";

import {
  badRequestResponse,
  conflictResponse,
  projectIdForCreate,
  projectNameOrDefault,
  readProjectBody,
  unauthorizedResponse,
} from "@/lib/api/projects";
import { createProject, listOwnedProjects } from "@/lib/project-service";

export async function GET() {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return unauthorizedResponse();
  }

  const projects = await listOwnedProjects(userId);

  return Response.json({ projects });
}

export async function POST(request: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return unauthorizedResponse();
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

  const projectId = projectIdForCreate(body.id);

  if (projectId === null) {
    return badRequestResponse("Project ID must be a slug-style room ID");
  }

  try {
    const project = await createProject(
      userId,
      projectNameOrDefault(body.name),
      projectId
    );

    return Response.json({ project }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return conflictResponse("A project with this room ID already exists");
    }

    throw error;
  }
}
