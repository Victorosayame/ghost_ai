"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { EditorProject } from "@/components/editor/project-types";

type ProjectDialogMode = "create" | "rename" | "delete";

interface ProjectDialogState {
  mode: ProjectDialogMode | null;
  project: EditorProject | null;
}

interface ProjectMutationResponse {
  project?: {
    id: string;
    name: string;
  };
  error?: string;
}

interface UseProjectActionsOptions {
  activeProjectId?: string;
}

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

function createShortSuffix() {
  const randomValue = new Uint32Array(1);
  crypto.getRandomValues(randomValue);

  return randomValue[0].toString(36).slice(0, 6).padStart(6, "0");
}

async function parseProjectResponse(response: Response) {
  const body = (await response.json()) as ProjectMutationResponse;

  if (!response.ok || !body.project) {
    throw new Error(body.error ?? "Project request failed");
  }

  return body.project;
}

export function useProjectActions(options: UseProjectActionsOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [dialogState, setDialogState] = useState<ProjectDialogState>({
    mode: null,
    project: null,
  });
  const [projectName, setProjectName] = useState("");
  const [createSuffix, setCreateSuffix] = useState(createShortSuffix);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const slugPreview = useMemo(
    () => `${slugifyProjectName(projectName)}-${createSuffix}`,
    [createSuffix, projectName]
  );

  function openCreateDialog() {
    setProjectName("");
    setCreateSuffix(createShortSuffix());
    setErrorMessage(null);
    setDialogState({ mode: "create", project: null });
  }

  function openRenameDialog(project: EditorProject) {
    setProjectName(project.name);
    setErrorMessage(null);
    setDialogState({ mode: "rename", project });
  }

  function openDeleteDialog(project: EditorProject) {
    setProjectName("");
    setErrorMessage(null);
    setDialogState({ mode: "delete", project });
  }

  function closeDialog() {
    if (isLoading) {
      return;
    }

    resetDialog();
  }

  function resetDialog() {
    setDialogState({ mode: null, project: null });
    setProjectName("");
    setErrorMessage(null);
  }

  function handleProjectNameChange(value: string) {
    setProjectName(value.replace(/[^\w\s-]/g, ""));
  }

  async function submitCreateProject() {
    const trimmedName = projectName.trim();

    if (!trimmedName) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const project = await parseProjectResponse(
        await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: slugPreview,
            name: trimmedName,
          }),
        })
      );

      resetDialog();
      router.push(`/editor/${project.id}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create project"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function submitRenameProject() {
    const trimmedName = projectName.trim();
    const project = dialogState.project;

    if (!trimmedName || !project) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await parseProjectResponse(
        await fetch(`/api/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        })
      );

      resetDialog();
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to rename project"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function submitDeleteProject() {
    const project = dialogState.project;

    if (!project) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await parseProjectResponse(
        await fetch(`/api/projects/${project.id}`, {
          method: "DELETE",
        })
      );

      resetDialog();

      if (
        options.activeProjectId === project.id ||
        pathname === `/editor/${project.id}`
      ) {
        router.replace("/editor");
        return;
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete project"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return {
    dialogState,
    errorMessage,
    isLoading,
    projectName,
    slugPreview,
    closeDialog,
    handleProjectNameChange,
    openCreateDialog,
    openDeleteDialog,
    openRenameDialog,
    setProjectName,
    submitCreateProject,
    submitDeleteProject,
    submitRenameProject,
  };
}
