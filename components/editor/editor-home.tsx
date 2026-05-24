"use client";

import { Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import type { EditorProject } from "@/components/editor/project-types";
import { Button } from "@/components/ui/button";
import { useProjectActions } from "@/hooks/use-project-actions";
import { EditorNavbar } from "./editor-navbar";
import { ProjectSidebar } from "./project-sidebar";

interface EditorHomeProps {
  activeProjectId?: string;
  navbarCenterContent?: string;
  navbarActions?: ReactNode;
  ownedProjects: EditorProject[];
  sharedProjects: EditorProject[];
}

export function EditorHome({
  activeProjectId,
  navbarCenterContent = "Untitled architecture",
  navbarActions,
  ownedProjects,
  sharedProjects,
}: EditorHomeProps) {
 const actions = useProjectActions({ activeProjectId });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  

  return (
    <div className="flex h-screen flex-col bg-base">
      <EditorNavbar
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        centerContent={navbarCenterContent}
        actions={navbarActions}
      />

      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeProjectId={activeProjectId}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onCreateProject={actions.openCreateDialog}
        onRenameProject={actions.openRenameDialog}
        onDeleteProject={actions.openDeleteDialog}
      />
      <main className="flex-1 overflow-hidden flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-medium text-copy-primary">
              Create a project or open an existing one
            </h1>
            <p className="text-sm text-copy-muted">
              Start a new architecture workspace, or choose a project from the sidebar.
            </p>
          </div>
          <Button onClick={actions.openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </main>
      <ProjectDialogs controls={actions} />
    </div>
  );
}
