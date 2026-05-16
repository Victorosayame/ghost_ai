import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { EditorHome } from "@/components/editor/editor-home";
import { toEditorProject } from "@/lib/editor-projects";
import {
  findAccessibleProject,
  listEditorProjects,
} from "@/lib/project-service";

interface EditorWorkspacePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function EditorWorkspacePage({
  params,
}: EditorWorkspacePageProps) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    redirect("/sign-in");
  }

  const { projectId } = await params;
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const [project, projectLists] = await Promise.all([
    findAccessibleProject(projectId, userId, email),
    listEditorProjects(userId, email),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <EditorHome
      activeProjectId={project.id}
      navbarCenterContent={project.name}
      ownedProjects={projectLists.ownedProjects.map((ownedProject) =>
        toEditorProject(ownedProject, "owner")
      )}
      sharedProjects={projectLists.sharedProjects.map((sharedProject) =>
        toEditorProject(sharedProject, "collaborator")
      )}
    >
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div className="grid max-w-xl gap-2">
          <h1 className="text-2xl font-semibold tracking-normal text-copy-primary md:text-3xl">
            {project.name}
          </h1>
          <p className="text-sm text-copy-muted md:text-base">
            Workspace route ready for room {project.id}.
          </p>
        </div>
      </div>
    </EditorHome>
  );
}
