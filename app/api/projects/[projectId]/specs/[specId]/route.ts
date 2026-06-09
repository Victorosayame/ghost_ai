import {
  notFoundResponse,
  unauthorizedResponse,
} from "@/lib/api/projects";
import { toProjectSpecSummary } from "@/lib/api/project-specs";
import {
  findProjectForIdentity,
  getCurrentClerkIdentity,
} from "@/lib/project-access";
import { findProjectSpec, readPrivateSpecMarkdown } from "@/lib/project-specs";

interface ProjectSpecRouteContext {
  params: Promise<{
    projectId: string;
    specId: string;
  }>;
}

export async function GET(_request: Request, context: ProjectSpecRouteContext) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.isAuthenticated || !identity.userId) {
    return unauthorizedResponse();
  }

  const { projectId, specId } = await context.params;
  const project = await findProjectForIdentity(projectId, identity);

  if (!project) {
    return notFoundResponse();
  }

  const spec = await findProjectSpec({ projectId, specId });

  if (!spec) {
    return Response.json({ error: "Spec not found" }, { status: 404 });
  }

  const blob = await readPrivateSpecMarkdown(spec.filePath);

  if (!blob) {
    return Response.json({ error: "Spec file not found" }, { status: 404 });
  }

  const content = await new Response(blob.stream).text();

  return Response.json({
    spec: {
      ...toProjectSpecSummary({
        id: spec.id,
        createdAt: spec.createdAt,
        projectId,
        projectName: project.name,
      }),
      content,
    },
  });
}
