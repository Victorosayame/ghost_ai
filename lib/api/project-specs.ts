export interface ProjectSpecSummary {
  id: string;
  createdAt: string;
  filename: string;
  downloadPath: string;
}

export function createSpecFilename(projectName: string, createdAt: Date) {
  const safeProjectName = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const date = createdAt.toISOString().slice(0, 10);
  const prefix = safeProjectName || "ghost-ai-spec";

  return `${prefix}-${date}.md`;
}

export function toProjectSpecSummary({
  createdAt,
  id,
  projectId,
  projectName,
}: {
  createdAt: Date;
  id: string;
  projectId: string;
  projectName: string;
}): ProjectSpecSummary {
  return {
    id,
    createdAt: createdAt.toISOString(),
    filename: createSpecFilename(projectName, createdAt),
    downloadPath: `/api/projects/${projectId}/specs/${id}/download`,
  };
}
