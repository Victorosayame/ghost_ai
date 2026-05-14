"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  isClose: () => void;
  className?: string;
}

function EmptyProjectsState({ label }: { label: string }) {
  return (
    <div className="flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-subtle-border bg-base/40 px-6 text-center">
      <p className="text-sm text-copy-muted">{label}</p>
    </div>
  );
}

export function ProjectSidebar({
  isOpen,
  isClose,
  className,
}: ProjectSidebarProps) {
  return (
    <aside
      aria-hidden={!isOpen}
      className={cn(
        "fixed left-0 top-0 z-40 flex h-[calc(100vh-3.5rem)] w-[min(22rem,calc(100vw-2rem))] flex-col rounded-2xl border border-surface-border bg-surface/95 p-4 shadow-2xl backdrop-blur transition-transform duration-200 ease-out",
        isOpen
          ? "translate-x-0"
          : "pointer-events-none invisible -translate-x-full",
        className
      )}
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border px-4">
        <span className="text-sm font-semibold text-copy-primary">Projects</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={isClose}
          aria-label="Close project sidebar"
          className="text-copy-secondary hover:bg-subtle hover:text-copy-primary"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>

     <div className="flex-1 flex flex-col overflow-hidden p-3">
      <Tabs defaultValue="my-projects" className="flex-1 flex flex-col">
        <TabsList className="w-full">
          <TabsTrigger value="my-projects">My Projects</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>
        <TabsContent value="my-projects" className="mt-4">
          <EmptyProjectsState label="No projects yet." />
        </TabsContent>
        <TabsContent value="shared" className="mt-4">
          <EmptyProjectsState label="No shared projects yet." />
        </TabsContent>
      </Tabs>
      </div>

      <Button type="button" className="mt-4 w-full">
        <Plus className="h-4 w-4" />
        New Project
      </Button>
    </aside>
  );
}
