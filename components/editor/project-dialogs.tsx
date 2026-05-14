"use client";

import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { useProjectDialogs } from "@/components/editor/use-project-dialogs";

interface ProjectDialogsProps {
  controls: ReturnType<typeof useProjectDialogs>;
}

export function ProjectDialogs({ controls }: ProjectDialogsProps) {
  const {
    dialogState,
    isLoading,
    projectName,
    slugPreview,
    closeDialog,
    setProjectName,
    submitCreateProject,
    submitDeleteProject,
    submitRenameProject,
  } = controls;

  const isOpen = dialogState.mode !== null;
  const canSubmit = projectName.trim().length > 0 && !isLoading;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (dialogState.mode === "create") {
      submitCreateProject();
    }

    if (dialogState.mode === "rename") {
      submitRenameProject();
    }

    if (dialogState.mode === "delete") {
      submitDeleteProject();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="rounded-3xl border border-surface-border bg-elevated p-6 text-copy-primary shadow-2xl sm:max-w-md">
        {dialogState.mode === "create" && (
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg">Create Project</DialogTitle>
              <DialogDescription className="text-copy-muted">
                Name the workspace before the canvas comes online.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <label
                htmlFor="project-name"
                className="text-sm font-medium text-copy-secondary"
              >
                Project name
              </label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Customer analytics platform"
                autoFocus
                required
                className="border-subtle-border bg-base/50 text-copy-primary placeholder:text-copy-faint"
              />
              <p className="text-xs text-copy-muted">
                Slug preview:{" "}
                <span className="font-mono text-brand">{slugPreview}</span>
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {isLoading ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        )}

        {dialogState.mode === "rename" && dialogState.project && (
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg">Rename Project</DialogTitle>
              <DialogDescription className="text-copy-muted">
                Current project: {dialogState.project.name}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <label
                htmlFor="rename-project-name"
                className="text-sm font-medium text-copy-secondary"
              >
                Project name
              </label>
              <Input
                id="rename-project-name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                autoFocus
                required
                className="border-subtle-border bg-base/50 text-copy-primary"
              />
              <p className="text-xs text-copy-muted">
                Slug preview:{" "}
                <span className="font-mono text-brand">{slugPreview}</span>
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {isLoading ? "Renaming..." : "Rename Project"}
              </Button>
            </div>
          </form>
        )}

        {dialogState.mode === "delete" && dialogState.project && (
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg">Delete Project</DialogTitle>
              <DialogDescription className="text-copy-muted">
                This will remove {dialogState.project.name} from the mock project
                list.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isLoading}>
                {isLoading ? "Deleting..." : "Delete Project"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
