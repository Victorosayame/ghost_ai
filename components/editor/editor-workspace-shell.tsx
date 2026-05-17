"use client";

import { Bot, PanelRightClose, PanelRightOpen, Share2 } from "lucide-react";
import { useState } from "react";

import { EditorLayout } from "@/components/editor/editor-layout";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import type { EditorProject } from "@/components/editor/project-types";
import { ShareDialog } from "@/components/editor/share-dialog";
import { Button } from "@/components/ui/button";
import { useProjectActions } from "@/hooks/use-project-actions";
import { cn } from "@/lib/utils";

interface EditorWorkspaceShellProps {
  ownedProjects: EditorProject[];
  project: EditorProject;
  sharedProjects: EditorProject[];
}

export function EditorWorkspaceShell({
  ownedProjects,
  project,
  sharedProjects,
}: EditorWorkspaceShellProps) {
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const projectDialogControls = useProjectActions({
    activeProjectId: project.id,
  });
  const AiSidebarIcon = isAiSidebarOpen ? PanelRightClose : PanelRightOpen;

  return (
    <EditorLayout
      activeProjectId={project.id}
      navbarCenterContent={project.name}
      navbarActions={
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsShareDialogOpen(true)}
            className="text-copy-secondary hover:bg-subtle hover:text-copy-primary"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsAiSidebarOpen((isOpen) => !isOpen)}
            aria-label={isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"}
            aria-pressed={isAiSidebarOpen}
            className="text-copy-secondary hover:bg-subtle hover:text-copy-primary"
          >
            <AiSidebarIcon className="h-5 w-5" />
          </Button>
        </>
      }
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
      onCreateProject={projectDialogControls.openCreateDialog}
      onRenameProject={projectDialogControls.openRenameDialog}
      onDeleteProject={projectDialogControls.openDeleteDialog}
    >
      <div
        className={cn(
          "grid h-full min-h-0 grid-cols-1",
          isAiSidebarOpen && "lg:grid-cols-[minmax(0,1fr)_20rem]"
        )}
      >
        <section className="relative flex min-h-0 items-center justify-center overflow-hidden bg-base px-6 text-center">
          <div className="grid max-w-xl gap-2">
            <h1 className="text-2xl font-semibold tracking-normal text-copy-primary md:text-3xl">
              Canvas workspace
            </h1>
            <p className="text-sm text-copy-muted md:text-base">
              Canvas for {project.name} will appear here.
            </p>
          </div>
        </section>

        <aside
          className={cn(
            "min-h-0 border-t border-surface-border bg-surface/80 backdrop-blur lg:border-l lg:border-t-0",
            isAiSidebarOpen ? "block" : "hidden"
          )}
        >
          <div className="flex h-full min-h-56 flex-col p-5">
            <div className="flex items-center gap-2 border-b border-surface-border pb-4">
              <Bot className="h-5 w-5 text-ai" />
              <h2 className="text-sm font-semibold text-copy-primary">
                AI assistant
              </h2>
            </div>
            <div className="flex flex-1 items-center justify-center px-4 text-center">
              <p className="text-sm text-copy-muted">
                AI chat will be available in a later step.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <ProjectDialogs controls={projectDialogControls} />
      <ShareDialog
        access={project.access}
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        projectId={project.id}
        projectName={project.name}
      />
    </EditorLayout>
  );
}
