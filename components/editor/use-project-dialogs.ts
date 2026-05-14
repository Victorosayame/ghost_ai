"use client";

import { useMemo, useState } from "react";

export type ProjectAccess = "owner" | "collaborator";

export interface MockProject {
  id: string;
  name: string;
  slug: string;
  access: ProjectAccess;
  updatedAtLabel: string;
}

type ProjectDialogMode = "create" | "rename" | "delete";

interface ProjectDialogState {
  mode: ProjectDialogMode | null;
  project: MockProject | null;
}

const INITIAL_PROJECTS: MockProject[] = [
  {
    id: "payments-platform",
    name: "Payments Platform",
    slug: "payments-platform",
    access: "owner",
    updatedAtLabel: "Updated today",
  },
  {
    id: "realtime-support",
    name: "Realtime Support",
    slug: "realtime-support",
    access: "owner",
    updatedAtLabel: "Updated yesterday",
  },
  {
    id: "shared-data-pipeline",
    name: "Shared Data Pipeline",
    slug: "shared-data-pipeline",
    access: "collaborator",
    updatedAtLabel: "Shared with you",
  },
];

function slugifyProjectName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/-+/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "untitled-project";
}

export function useProjectDialogs() {
  const [projects, setProjects] = useState<MockProject[]>(INITIAL_PROJECTS);
  const [dialogState, setDialogState] = useState<ProjectDialogState>({
    mode: null,
    project: null,
  });
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const slugPreview = useMemo(
    () => slugifyProjectName(projectName),
    [projectName]
  );

  const ownedProjects = useMemo(
    () => projects.filter((project) => project.access === "owner"),
    [projects]
  );

  const sharedProjects = useMemo(
    () => projects.filter((project) => project.access === "collaborator"),
    [projects]
  );

  function openCreateDialog() {
    setProjectName("");
    setDialogState({ mode: "create", project: null });
  }

  function openRenameDialog(project: MockProject) {
    setProjectName(project.name);
    setDialogState({ mode: "rename", project });
  }

  function openDeleteDialog(project: MockProject) {
    setProjectName("");
    setDialogState({ mode: "delete", project });
  }

  function closeDialog() {
    if (isLoading) {
      return;
    }

    setDialogState({ mode: null, project: null });
    setProjectName("");
  }

  function submitCreateProject() {
    const trimmedName = projectName.trim();

    if (!trimmedName) {
      return;
    }

    setIsLoading(true);
    setProjects((currentProjects) => [
      {
        id: `${slugPreview}-${Date.now()}`,
        name: trimmedName,
        slug: slugPreview,
        access: "owner",
        updatedAtLabel: "Just now",
      },
      ...currentProjects,
    ]);
    setIsLoading(false);
    closeDialog();
  }

  function submitRenameProject() {
    const trimmedName = projectName.trim();
    const project = dialogState.project;

    if (!trimmedName || !project) {
      return;
    }

    setIsLoading(true);
    setProjects((currentProjects) =>
      currentProjects.map((currentProject) =>
        currentProject.id === project.id
          ? {
              ...currentProject,
              name: trimmedName,
              slug: slugPreview,
              updatedAtLabel: "Just now",
            }
          : currentProject
      )
    );
    setIsLoading(false);
    closeDialog();
  }

  function submitDeleteProject() {
    const project = dialogState.project;

    if (!project) {
      return;
    }

    setIsLoading(true);
    setProjects((currentProjects) =>
      currentProjects.filter((currentProject) => currentProject.id !== project.id)
    );
    setIsLoading(false);
    closeDialog();
  }

  function handleProjectNameChange(value: string) {
  const cleaned = value.replace(/[^\w\s-]/g, "");
  setProjectName(cleaned);
}

  return {
    dialogState,
    isLoading,
    ownedProjects,
    projectName,
    projects,
    sharedProjects,
    slugPreview,
    closeDialog,
    openCreateDialog,
    openDeleteDialog,
    openRenameDialog,
    setProjectName,
    submitCreateProject,
    submitDeleteProject,
    submitRenameProject,
    handleProjectNameChange,
  };
}
