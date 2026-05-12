"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { cn } from "@/lib/utils";

interface EditorLayoutProps {
  children: ReactNode;
  className?: string;
  navbarCenterContent?: ReactNode;
}

export function EditorLayout({
  children,
  className,
  navbarCenterContent,
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
        isClose={() => setIsProjectSidebarOpen(false)}
      />
      <main className="relative min-h-0 flex-1 bg-base">{children}</main>
    </div>
  );
}
