"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import type { EditorProject } from "@/components/editor/project-types";
import { cn } from "@/lib/utils";

interface EditorLayoutProps {
  children: ReactNode;
  className?: string;
  navbarCenterContent?: ReactNode;
  ownedProjects: EditorProject[];
  sharedProjects: EditorProject[];
  onCreateProject: () => void;
  onRenameProject: (project: EditorProject) => void;
  onDeleteProject: (project: EditorProject) => void;
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
