"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { MockProject } from "@/components/editor/use-project-dialogs";
import { useState } from "react";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ownedProjects: MockProject[];
  sharedProjects: MockProject[];
  onCreateProject: () => void;
  onRenameProject: (project: MockProject) => void;
  onDeleteProject: (project: MockProject) => void;
  className?: string;
}

function EmptyProjectsState({ label }: { label: string }) {
  return (
    <div className="flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-subtle-border bg-base/40 px-6 text-center">
      <p className="text-sm text-copy-muted">{label}</p>
    </div>
  );
}

function ProjectList({
  emptyLabel,
  projects,
  showActions,
  onRenameProject,
  onDeleteProject,
}: {
  emptyLabel: string;
  projects: MockProject[];
  showActions: boolean;
  onRenameProject: (project: MockProject) => void;
  onDeleteProject: (project: MockProject) => void;
}) {
  if (projects.length === 0) {
    return <EmptyProjectsState label={emptyLabel} />;
  }

  return (
    <div className="grid gap-2">
      {projects.map((project) => (
        <div
          key={project.id}
          className="group flex min-h-16 items-center gap-3 rounded-2xl border border-surface-border bg-base/40 px-3 py-2"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-copy-primary">
              {project.name}
            </p>
            <p className="truncate font-mono text-xs text-copy-muted">
              {project.slug}
            </p>
            <p className="mt-1 text-xs text-copy-faint">
              {project.updatedAtLabel}
            </p>
          </div>

          {showActions && (
            <div className="flex shrink-0 items-center gap-1 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:group-focus-within:opacity-100">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onRenameProject(project)}
                aria-label={`Rename ${project.name}`}
                className="text-copy-muted hover:bg-subtle hover:text-copy-primary"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onDeleteProject(project)}
                aria-label={`Delete ${project.name}`}
                className="text-copy-muted hover:bg-subtle hover:text-state-error"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  className,
}: ProjectSidebarProps) {
  const [activeTab, setActiveTab] = useState("my-projects");
  return (
    <>
      <button
        type="button"
        aria-label="Close project sidebar"
        className={cn(
          "fixed inset-0 z-[35] bg-base/70 backdrop-blur-sm transition-opacity md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        aria-hidden={!isOpen}
        className={cn(
          "fixed left-0 top-0 z-40 flex h-[calc(100vh-3.5rem)] w-[min(22rem,calc(100vw-2rem))] flex-col rounded-2xl border border-surface-border bg-surface/95 p-4 shadow-2xl backdrop-blur transition-transform duration-200 ease-out",
          isOpen
            ? "translate-x-0"
            : "pointer-events-none invisible -translate-x-full",
          className,
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border px-4">
          <span className="text-sm font-semibold text-copy-primary">
            Projects
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close project sidebar"
            className="text-copy-secondary hover:bg-subtle hover:text-copy-primary"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden p-3">
          <Tabs
            defaultValue="my-projects"
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-1 flex-col"
          >
            <TabsList className="w-full">
              <TabsTrigger
                value="my-projects"
                className={cn(
                  "flex-1 rounded-lg transition-colors",
                  activeTab === "my-projects"
                    ? "bg-base text-copy-primary shadow-sm"
                    : "text-copy-muted hover:bg-base/40",
                )}
              >
                My Projects
              </TabsTrigger>
              <TabsTrigger
                value="shared"
                className={cn(
                  "flex-1 rounded-lg transition-colors",
                  activeTab === "shared"
                    ? "bg-base text-copy-primary shadow-sm"
                    : "text-copy-muted hover:bg-base/40",
                )}
              >
                Shared
              </TabsTrigger>
            </TabsList>
            <TabsContent value="my-projects" className="mt-4 overflow-y-auto">
              <ProjectList
                emptyLabel="No projects yet."
                projects={ownedProjects}
                showActions
                onRenameProject={onRenameProject}
                onDeleteProject={onDeleteProject}
              />
            </TabsContent>
            <TabsContent value="shared" className="mt-4 overflow-y-auto">
              <ProjectList
                emptyLabel="No shared projects yet."
                projects={sharedProjects}
                showActions={false}
                onRenameProject={onRenameProject}
                onDeleteProject={onDeleteProject}
              />
            </TabsContent>
          </Tabs>
        </div>

        <Button type="button" className="mt-4 w-full" onClick={onCreateProject}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </aside>
    </>
  );
}
