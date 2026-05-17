import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/editor/access-denied";
import { EditorWorkspaceShell } from "@/components/editor/editor-workspace-shell";
import { toEditorProject } from "@/lib/editor-projects";
import {
  findProjectForIdentity,
  getCurrentClerkIdentity,
} from "@/lib/project-access";
import { listEditorProjects } from "@/lib/project-service";

interface EditorWorkspacePageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function EditorWorkspacePage({
  params,
}: EditorWorkspacePageProps) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.isAuthenticated || !identity.userId) {
    redirect("/sign-in");
  }

  const { roomId } = await params;
  const [project, projectLists] = await Promise.all([
    findProjectForIdentity(roomId, identity),
    listEditorProjects(identity.userId, identity.primaryEmail),
  ]);

  if (!project) {
    return <AccessDenied />;
  }

  const projectAccess =
    project.ownerId === identity.userId ? "owner" : "collaborator";

  return (
    <EditorWorkspaceShell
      project={toEditorProject(project, projectAccess)}
      ownedProjects={projectLists.ownedProjects.map((ownedProject) =>
        toEditorProject(ownedProject, "owner")
      )}
      sharedProjects={projectLists.sharedProjects.map((sharedProject) =>
        toEditorProject(sharedProject, "collaborator")
      )}
    />
  );
}
