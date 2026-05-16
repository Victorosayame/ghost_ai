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
import { useProjectActions } from "@/hooks/use-project-actions";

interface ProjectDialogsProps {
  controls: ReturnType<typeof useProjectActions>;
}

export function ProjectDialogs({ controls }: ProjectDialogsProps) {
  const {
    dialogState,
    errorMessage,
    isLoading,
    projectName,
    slugPreview,
    closeDialog,
    setProjectName,
    submitCreateProject,
    submitDeleteProject,
    submitRenameProject,
    handleProjectNameChange,
  } = controls;

  const isOpen = dialogState.mode !== null;
  const canSubmit =
    dialogState.mode === "delete" || projectName.trim().length > 0;

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
                onChange={(event) => handleProjectNameChange(event.target.value)}
                placeholder="Customer analytics platform"
                autoFocus
                required
                className="border-subtle-border bg-base/50 text-copy-primary placeholder:text-copy-faint"
              />
              <p className="text-xs text-copy-muted">
                Room ID preview:{" "}
                <span className="font-mono text-brand">{slugPreview}</span>
              </p>
              {errorMessage && (
                <p className="text-xs text-state-error">{errorMessage}</p>
              )}
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
              <Button type="submit" disabled={!canSubmit || isLoading}>
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
              {errorMessage && (
                <p className="text-xs text-state-error">{errorMessage}</p>
              )}
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
              <Button type="submit" disabled={!canSubmit || isLoading}>
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
                This will permanently delete {dialogState.project.name}.
              </DialogDescription>
            </DialogHeader>

            {errorMessage && (
              <p className="text-sm text-state-error">{errorMessage}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!canSubmit || isLoading}
              >
                {isLoading ? "Deleting..." : "Delete Project"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
