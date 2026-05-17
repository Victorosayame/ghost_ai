"use client";

import { Check, Copy, Link2, Loader2, Mail, Trash2, UserRound } from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ProjectAccess } from "@/components/editor/project-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ShareDialogProps {
  access: ProjectAccess;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  projectId: string;
  projectName: string;
}

interface Collaborator {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

interface CollaboratorsResponse {
  access: ProjectAccess;
  collaborators: Collaborator[];
}

const COPIED_TIMEOUT_MS = 1800;

function initialsForCollaborator(collaborator: Collaborator) {
  const label = collaborator.displayName ?? collaborator.email;
  return label.slice(0, 1).toUpperCase();
}

export function ShareDialog({
  access,
  isOpen,
  onOpenChange,
  projectId,
  projectName,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[] | null>(
    null
  );
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [removingCollaboratorId, setRemovingCollaboratorId] = useState<
    string | null
  >(null);

  const isOwner = access === "owner";
  const isLoading = isOpen && collaborators === null && !errorMessage;
  const projectLink = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/editor/${projectId}`;
  }, [projectId]);

  const loadCollaborators = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        signal,
      });

      if (!response.ok) {
        throw new Error("Unable to load collaborators");
      }

      const data = (await response.json()) as CollaboratorsResponse;
      setCollaborators(data.collaborators);
      setErrorMessage(null);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setErrorMessage("Unable to load collaborators.");
    }
  }, [projectId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const abortController = new AbortController();
    void Promise.resolve().then(() =>
      loadCollaborators(abortController.signal)
    );

    return () => abortController.abort();
  }, [isOpen, loadCollaborators]);

  useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => setIsCopied(false),
      COPIED_TIMEOUT_MS
    );

    return () => window.clearTimeout(timeoutId);
  }, [isCopied]);

  async function inviteCollaborator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isOwner || !email.trim()) {
      return;
    }

    setIsInviting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to invite collaborator");
      }

      setEmail("");
      await loadCollaborators();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to invite collaborator."
      );
    } finally {
      setIsInviting(false);
    }
  }

  async function removeCollaborator(collaboratorId: string) {
    if (!isOwner) {
      return;
    }

    setRemovingCollaboratorId(collaboratorId);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators/${collaboratorId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Unable to remove collaborator");
      }

      setCollaborators((currentCollaborators) =>
        (currentCollaborators ?? []).filter(
          (collaborator) => collaborator.id !== collaboratorId
        )
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to remove collaborator."
      );
    } finally {
      setRemovingCollaboratorId(null);
    }
  }

  async function copyProjectLink() {
    if (!projectLink || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(projectLink);
    setIsCopied(true);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden rounded-3xl border border-surface-border bg-elevated p-0 text-copy-primary shadow-2xl sm:max-w-lg">
        <div className="grid max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)]">
          <DialogHeader className="border-b border-surface-border p-6">
            <DialogTitle className="text-lg">Share Project</DialogTitle>
            <DialogDescription className="text-copy-muted">
              {projectName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 gap-5 overflow-y-auto p-6">
            {isOwner && (
              <div className="grid gap-3">
                <form className="flex gap-2" onSubmit={inviteCollaborator}>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="teammate@example.com"
                    className="min-w-0 border-subtle-border bg-base/50 text-copy-primary placeholder:text-copy-faint"
                    disabled={isInviting}
                    required
                  />
                  <Button
                    type="submit"
                    disabled={isInviting || email.trim().length === 0}
                  >
                    {isInviting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    Invite
                  </Button>
                </form>

                <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-base/50 p-2">
                  <Link2 className="h-4 w-4 text-copy-muted" />
                  <p className="min-w-0 flex-1 truncate font-mono text-xs text-copy-muted">
                    {projectLink}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copyProjectLink}
                    className={cn(
                      "text-copy-secondary hover:bg-subtle hover:text-copy-primary",
                      isCopied && "text-state-success"
                    )}
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {isCopied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
            )}

            {errorMessage && (
              <p className="rounded-xl border border-surface-border bg-base/50 px-3 py-2 text-sm text-state-error">
                {errorMessage}
              </p>
            )}

            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-copy-primary">
                  Collaborators
                </h3>
                {isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-copy-muted" />
                )}
              </div>

              {!isLoading && collaborators?.length === 0 && (
                <div className="rounded-2xl border border-surface-border bg-base/50 px-4 py-6 text-center">
                  <p className="text-sm text-copy-muted">
                    No collaborators have been invited yet.
                  </p>
                </div>
              )}

              <div className="grid gap-2">
                {collaborators?.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center gap-3 rounded-2xl border border-surface-border bg-base/50 p-3"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-subtle-border bg-subtle text-sm font-semibold text-copy-secondary"
                      style={
                        collaborator.avatarUrl
                          ? {
                              backgroundImage: `url(${collaborator.avatarUrl})`,
                              backgroundPosition: "center",
                              backgroundSize: "cover",
                            }
                          : undefined
                      }
                    >
                      {!collaborator.avatarUrl &&
                        (initialsForCollaborator(collaborator) || (
                          <UserRound className="h-4 w-4" />
                        ))}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-copy-primary">
                        {collaborator.displayName ?? collaborator.email}
                      </p>
                      {collaborator.displayName && (
                        <p className="truncate text-xs text-copy-muted">
                          {collaborator.email}
                        </p>
                      )}
                    </div>

                    {isOwner && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeCollaborator(collaborator.id)}
                        disabled={removingCollaboratorId === collaborator.id}
                        aria-label={`Remove ${collaborator.email}`}
                        className="text-copy-muted hover:bg-subtle hover:text-state-error"
                      >
                        {removingCollaboratorId === collaborator.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
