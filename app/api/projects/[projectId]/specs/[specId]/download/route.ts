import {
  notFoundResponse,
  unauthorizedResponse,
} from "@/lib/api/projects";
import {
  findProjectForIdentity,
  getCurrentClerkIdentity,
} from "@/lib/project-access";
import {
  findProjectSpec,
  readPrivateSpecMarkdown,
  specDownloadFilename,
} from "@/lib/project-specs";

interface SpecDownloadRouteContext {
  params: Promise<{
    projectId: string;
    specId: string;
  }>;
}

export async function GET(
  _request: Request,
  context: SpecDownloadRouteContext
) {
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

  return new Response(blob.stream, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${specDownloadFilename(
        project.name,
        spec.createdAt
      )}"`,
      "Content-Type": blob.contentType,
    },
  });
}
