import {
  notFoundResponse,
  unauthorizedResponse,
} from "@/lib/api/projects";
import {
  findProjectForIdentity,
  getCurrentClerkIdentity,
} from "@/lib/project-access";
import { listProjectSpecSummaries } from "@/lib/project-specs";

interface ProjectSpecsRouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

export async function GET(_request: Request, context: ProjectSpecsRouteContext) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.isAuthenticated || !identity.userId) {
    return unauthorizedResponse();
  }

  const { projectId } = await context.params;
  const project = await findProjectForIdentity(projectId, identity);

  if (!project) {
    return notFoundResponse();
  }

  const specs = await listProjectSpecSummaries(project);

  return Response.json({ specs });
}
