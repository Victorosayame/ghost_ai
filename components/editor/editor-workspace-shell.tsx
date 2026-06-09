"use client";

import { useState } from "react";
import { CloudCheck, LoaderCircle, LayoutTemplate, TriangleAlert } from "lucide-react";

import { EditorCanvasWrapper } from "@/components/editor/editor-canvas-wrapper";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import type { EditorProject } from "@/components/editor/project-types";
import { ShareDialog } from "@/components/editor/share-dialog";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";
import { Button } from "@/components/ui/button";
import { EditorNavbar } from "./editor-navbar";
import { ProjectSidebar } from "./project-sidebar";
import AiSidebar from "./ai-sidebar";

interface EditorWorkspaceShellProps {
  ownedProjects: EditorProject[];
  project: EditorProject;
  sharedProjects: EditorProject[];
  roomId: string;
}

export function EditorWorkspaceShell({
  ownedProjects,
  project,
  sharedProjects,
  roomId,
}: EditorWorkspaceShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [starterTemplatesOpen, setStarterTemplatesOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<CanvasSaveStatus>("saved");
  const actions = useProjectActions({
    activeProjectId: project.id,
  });

  return (
    <div className="flex h-screen flex-col bg-base">
      <EditorNavbar
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((previousState) => !previousState)}
        centerContent={project.name}
        isAiSidebarOpen={aiSidebarOpen}
        onToggleAiSidebar={() =>
          setAiSidebarOpen((previousState) => !previousState)
        }
        onOpenShareDialog={() => setShareDialogOpen(true)}
        actions={
          <>
            <SaveStatusButton status={saveStatus} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setStarterTemplatesOpen(true)}
            >
              <LayoutTemplate className="h-4 w-4" />
              Templates
            </Button>
          </>
        }
      />

      <main className="flex flex-1 overflow-hidden">
        <div className="relative z-0 flex flex-1 items-stretch overflow-hidden">
          <EditorCanvasWrapper
            projectId={project.id}
            roomId={roomId}
            isStarterTemplatesOpen={starterTemplatesOpen}
            onSaveStatusChange={setSaveStatus}
            onStarterTemplatesOpenChange={setStarterTemplatesOpen}
          >
            <AiSidebar
              isOpen={aiSidebarOpen}
              onClose={() => setAiSidebarOpen(false)}
              roomId={roomId}
              projectId={project.id}
            />
          </EditorCanvasWrapper>
        </div>
      </main>

      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onCreateProject={actions.openCreateDialog}
        onRenameProject={actions.openRenameDialog}
        onDeleteProject={actions.openDeleteDialog}
        activeProjectId={project.id}
      />

      <ProjectDialogs controls={actions} />
      <ShareDialog
        access={project.access}
        isOpen={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        projectId={project.id}
        projectName={project.name}
      />
    </div>
  );
}

function SaveStatusButton({ status }: { status: CanvasSaveStatus }) {
  const Icon =
    status === "saving"
      ? LoaderCircle
      : status === "error"
        ? TriangleAlert
        : CloudCheck;
  const label =
    status === "saving"
      ? "Saving"
      : status === "error"
        ? "Save error"
        : "Saved";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      disabled
      title={label}
    >
      <Icon
        className={
          status === "saving" ? "h-4 w-4 animate-spin" : "h-4 w-4"
        }
      />
      {label}
    </Button>
  );
}
