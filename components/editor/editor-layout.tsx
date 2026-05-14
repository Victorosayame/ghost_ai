"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import type { MockProject } from "@/components/editor/use-project-dialogs";
import { cn } from "@/lib/utils";

interface EditorLayoutProps {
  children: ReactNode;
  className?: string;
  navbarCenterContent?: ReactNode;
  ownedProjects: MockProject[];
  sharedProjects: MockProject[];
  onCreateProject: () => void;
  onRenameProject: (project: MockProject) => void;
  onDeleteProject: (project: MockProject) => void;
}

export function EditorLayout({
  children,
  className,
  navbarCenterContent,
  ownedProjects,
  sharedProjects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: EditorLayoutProps) {
  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col overflow-hidden bg-base",
        className
      )}
    >
      <EditorNavbar
        isSidebarOpen={isProjectSidebarOpen}
        onToggleSidebar={() => setIsProjectSidebarOpen((isOpen) => !isOpen)}
        centerContent={navbarCenterContent}
      />
      <ProjectSidebar
        isOpen={isProjectSidebarOpen}
        onClose={() => setIsProjectSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onCreateProject={onCreateProject}
        onRenameProject={onRenameProject}
        onDeleteProject={onDeleteProject}
      />
      <main className="relative min-h-0 flex-1 bg-base">{children}</main>
    </div>
  );
}
