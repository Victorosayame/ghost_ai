import type {
  EditorProject,
  ProjectAccess,
} from "@/components/editor/project-types";

interface ProjectRecord {
  id: string;
  name: string;
  updatedAt: Date;
}

function formatUpdatedAtLabel(updatedAt: Date) {
  const now = new Date();
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfUpdatedDay = new Date(
    updatedAt.getFullYear(),
    updatedAt.getMonth(),
    updatedAt.getDate()
  );
  const dayDifference = Math.round(
    (startOfToday.getTime() - startOfUpdatedDay.getTime()) /
      millisecondsPerDay
  );

  if (dayDifference === 0) {
    return "Updated today";
  }

  if (dayDifference === 1) {
    return "Updated yesterday";
  }

  return `Updated ${updatedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function toEditorProject(
  project: ProjectRecord,
  access: ProjectAccess
): EditorProject {
  return {
    id: project.id,
    name: project.name,
    access,
    updatedAtLabel: formatUpdatedAtLabel(project.updatedAt),
  };
}
