"use client";

import { useState } from "react";

import { EditorCanvasWrapper } from "@/components/editor/editor-canvas-wrapper";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import type { EditorProject } from "@/components/editor/project-types";
import { ShareDialog } from "@/components/editor/share-dialog";
import { useProjectActions } from "@/hooks/use-project-actions";
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
      />

      <main className="flex flex-1 overflow-hidden">
        <div className="relative z-0 flex flex-1 items-stretch overflow-hidden">
          <EditorCanvasWrapper roomId={roomId} />
        </div>

        {aiSidebarOpen && (
          <AiSidebar
            isOpen={aiSidebarOpen}
            onClose={() => setAiSidebarOpen(false)}
            roomId={roomId}
            projectId={project.id}
          />
        )}
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
