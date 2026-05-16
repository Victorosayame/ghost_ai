import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { EditorHome } from "@/components/editor/editor-home";
import { toEditorProject } from "@/lib/editor-projects";
import { listEditorProjects } from "@/lib/project-service";

export default async function EditorPage() {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const { ownedProjects, sharedProjects } = await listEditorProjects(
    userId,
    email
  );

  return (
    <EditorHome
      ownedProjects={ownedProjects.map((project) =>
        toEditorProject(project, "owner")
      )}
      sharedProjects={sharedProjects.map((project) =>
        toEditorProject(project, "collaborator")
      )}
    />
  );
}
