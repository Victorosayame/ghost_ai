import { get } from "@vercel/blob";

import {
  createSpecFilename,
  toProjectSpecSummary,
} from "@/lib/api/project-specs";
import prisma from "@/lib/prisma";

interface ProjectForSpecs {
  id: string;
  name: string;
}

export async function listProjectSpecSummaries(project: ProjectForSpecs) {
  const specs = await prisma.project
    .findUnique({
      where: { id: project.id },
      select: {
        specs: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    })
    .then((record) => record?.specs ?? []);

  return specs.map((spec) =>
    toProjectSpecSummary({
      ...spec,
      projectId: project.id,
      projectName: project.name,
    })
  );
}

export async function findProjectSpec({
  projectId,
  specId,
}: {
  projectId: string;
  specId: string;
}) {
  return prisma.project
    .findUnique({
      where: { id: projectId },
      select: {
        specs: {
          where: { id: specId },
          take: 1,
          select: {
            id: true,
            filePath: true,
            createdAt: true,
          },
        },
      },
    })
    .then((record) => record?.specs[0] ?? null);
}

export async function readPrivateSpecMarkdown(filePath: string) {
  const blob = await get(filePath, {
    access: "private",
    useCache: false,
  });

  if (!blob || blob.statusCode === 304 || !blob.stream) {
    return null;
  }

  return {
    contentType: blob.blob.contentType || "text/markdown; charset=utf-8",
    stream: blob.stream,
  };
}

export function specDownloadFilename(projectName: string, createdAt: Date) {
  return createSpecFilename(projectName, createdAt);
}
