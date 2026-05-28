"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import { shallow, useOther, useOthersConnectionIds, useOthersMapped } from "@liveblocks/react/suspense";
import { useStore } from "@xyflow/react";
import { UserRound } from "lucide-react";
import { useMemo } from "react";

interface CollaboratorSummary {
  avatar: string;
  color: string;
  name: string;
  userId: string | null;
}

export function CanvasPresence() {
  const { userId } = useAuth();
  const collaborators = useOthersMapped((other) => ({
    avatar: other.info.avatar,
    color: other.info.color,
    name: other.info.name,
    userId: other.id,
  }));
  const visibleCollaborators = useMemo(() => {
    const filtered = collaborators
      .map(([, collaborator]) => collaborator)
      .filter((collaborator) => collaborator.userId && collaborator.userId !== userId)
      .reduce<CollaboratorSummary[]>((uniqueCollaborators, collaborator) => {
        if (
          uniqueCollaborators.some(
            (existingCollaborator) => existingCollaborator.userId === collaborator.userId
          )
        ) {
          return uniqueCollaborators;
        }

        uniqueCollaborators.push(collaborator);
        return uniqueCollaborators;
      }, []);

    return {
      extraCount: Math.max(filtered.length - 5, 0),
      items: filtered.slice(0, 5),
    };
  }, [collaborators, userId]);
  const hasCollaborators = visibleCollaborators.items.length > 0;

  return (
    <>
      <div className="pointer-events-none absolute right-5 top-4 z-20">
        <div className="pointer-events-auto flex items-center rounded-full border border-surface-border bg-surface/92 px-2 py-1.5 shadow-lg backdrop-blur-md">
          {hasCollaborators ? (
            <>
              <div className="flex items-center">
                {visibleCollaborators.items.map((collaborator, index) => (
                  <CollaboratorAvatar
                    key={collaborator.userId ?? `${collaborator.name}-${index}`}
                    collaborator={collaborator}
                    overlapIndex={index}
                  />
                ))}
                {visibleCollaborators.extraCount > 0 ? (
                  <div
                    className="-ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-copy-secondary ring-2 ring-[var(--bg-base)] outline outline-1 outline-[var(--border-subtle)]"
                    aria-hidden="true"
                  >
                    +{visibleCollaborators.extraCount}
                  </div>
                ) : null}
              </div>
              <div className="mx-2 h-6 w-px bg-[var(--border-default)]" />
            </>
          ) : null}
          <UserButton />
        </div>
      </div>
      <CanvasCursors currentUserId={userId} />
    </>
  );
}

function CollaboratorAvatar({
  collaborator,
  overlapIndex,
}: {
  collaborator: CollaboratorSummary;
  overlapIndex: number;
}) {
  const initials = initialsForName(collaborator.name);

  return (
    <div
      className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-subtle text-sm font-semibold text-copy-primary ring-2 ring-[var(--bg-base)] outline outline-1 outline-[var(--border-subtle)] ${
        overlapIndex === 0 ? "" : "-ml-3"
      }`}
      aria-hidden="true"
      style={
        collaborator.avatar
          ? {
              backgroundImage: `url(${collaborator.avatar})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : undefined
      }
      title={collaborator.name}
    >
      {collaborator.avatar ? null : initials || <UserRound className="h-4 w-4 text-copy-muted" />}
    </div>
  );
}

function CanvasCursors({ currentUserId }: { currentUserId: string | null | undefined }) {
  const connectionIds = useOthersConnectionIds();

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {connectionIds.map((connectionId) => (
        <CanvasCursor
          key={connectionId}
          connectionId={connectionId}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}

function CanvasCursor({
  connectionId,
  currentUserId,
}: {
  connectionId: number;
  currentUserId: string | null | undefined;
}) {
  const participant = useOther(
    connectionId,
    (other) => ({
      color: other.info.color,
      cursor: other.presence.cursor,
      name: other.info.name,
      userId: other.id,
    }),
    shallow
  );
  const [panX, panY, zoom] = useStore((state) => state.transform, shallow);

  if (
    !participant ||
    !participant.cursor ||
    !participant.userId ||
    participant.userId === currentUserId
  ) {
    return null;
  }

  return (
    <div
      className="absolute left-0 top-0"
      style={{
        transform: `translate(${participant.cursor.x * zoom + panX}px, ${participant.cursor.y * zoom + panY}px)`,
      }}
    >
      <div className="relative">
        <div
          className="h-4 w-4 rounded-[3px]"
          style={{
            backgroundColor: participant.color,
            clipPath: "polygon(0 0, 82% 56%, 56% 56%, 56% 100%, 0 0)",
          }}
        />
        <div
          className="absolute left-3 top-3 rounded-full px-2 py-1 text-[11px] font-medium leading-none text-white shadow-md"
          style={{ backgroundColor: participant.color }}
        >
          {participant.name}
        </div>
      </div>
    </div>
  );
}

function initialsForName(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "";
  }

  return parts.map((part) => part.slice(0, 1).toUpperCase()).join("");
}
