"use client";

import { Plus } from "lucide-react";
import type { ReactNode } from "react";

import { EditorLayout } from "@/components/editor/editor-layout";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import type { EditorProject } from "@/components/editor/project-types";
import { Button } from "@/components/ui/button";
import { useProjectActions } from "@/hooks/use-project-actions";

interface EditorHomeProps {
  activeProjectId?: string;
  children?: ReactNode;
  navbarCenterContent?: string;
  navbarActions?: ReactNode;
  ownedProjects: EditorProject[];
  sharedProjects: EditorProject[];
}

export function EditorHome({
  activeProjectId,
  children,
  navbarCenterContent = "Untitled architecture",
  navbarActions,
  ownedProjects,
  sharedProjects,
}: EditorHomeProps) {
  const projectDialogControls = useProjectActions({ activeProjectId });

  return (
    <EditorLayout
      activeProjectId={activeProjectId}
      navbarCenterContent={navbarCenterContent}
      navbarActions={navbarActions}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
      onCreateProject={projectDialogControls.openCreateDialog}
      onRenameProject={projectDialogControls.openRenameDialog}
      onDeleteProject={projectDialogControls.openDeleteDialog}
    >
      {children ?? (
        <div className="flex h-full items-center justify-center px-6 text-center">
          <div className="flex max-w-xl flex-col items-center gap-4">
            <div className="grid gap-2">
              <h1 className="text-2xl font-semibold tracking-normal text-copy-primary md:text-3xl">
                Create a project or open an existing one
              </h1>
              <p className="text-sm text-copy-muted md:text-base">
                Start a new architecture workspace, or choose a project from the
                sidebar.
              </p>
            </div>

            <Button
              type="button"
              onClick={projectDialogControls.openCreateDialog}
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      )}

      <ProjectDialogs controls={projectDialogControls} />
    </EditorLayout>
  );
}
