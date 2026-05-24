import { auth, currentUser } from "@clerk/nextjs/server";

import {
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/lib/api/projects";
import {
  findProjectForIdentity,
  getCurrentClerkIdentity,
} from "@/lib/project-access";
import {
  getLiveblocksClient,
  getUserCursorColor,
  LiveblocksConfigurationError,
} from "@/lib/liveblocks";

interface LiveblocksAuthContext {
  params: Promise<{
    projectId: string;
  }>;
}

export async function POST(
  _request: Request,
  context: LiveblocksAuthContext
) {
  // 1. Require Clerk authentication
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return unauthorizedResponse();
  }

  const user = await currentUser();
  if (!user) {
    return unauthorizedResponse();
  }

  // Get the project ID from the route parameter
  const { projectId } = await context.params;

  // 2. Verify project access using the existing access helper
  const identity = await getCurrentClerkIdentity();
  const project = await findProjectForIdentity(projectId, identity);

  if (!project) {
    return notFoundResponse();
  }

  // 3. Verify the user has access (owner or collaborator)
  if (
    project.ownerId !== userId &&
    (!identity.primaryEmail ||
      !(await hasCollaboratorAccess(projectId, identity.primaryEmail)))
  ) {
    return forbiddenResponse();
  }

  let client;

  try {
    client = getLiveblocksClient();
  } catch (error) {
    if (error instanceof LiveblocksConfigurationError) {
      console.error("Liveblocks configuration error:", error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    throw error;
  }

  try {
    // 4. Ensure the Liveblocks room exists (create only if needed)
    await client.createRoom(projectId, {
      defaultAccesses: [],
      metadata: {
        projectId,
        projectName: project.name,
      },
    });
  } catch (error) {
    // Room already exists or other error - continue
    // Liveblocks will return an error if room exists, which is fine
    if (
      !(
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string" &&
        error.message.includes("Room")
      )
    ) {
      console.error("Error creating Liveblocks room:", error);
    }
  }

  // 5. Generate session token with user metadata
  const userDisplayName =
    user.fullName || user.primaryEmailAddress?.emailAddress || "Anonymous";
  const userAvatarUrl = user.imageUrl || "";
  const cursorColor = getUserCursorColor(userId);

  try {
    const session = client.prepareSession(
      userId,
      {
        userInfo: {
          name: userDisplayName,
          avatar: userAvatarUrl,
          color: cursorColor,
        },
      }
    );
    session.allow(projectId, session.FULL_ACCESS);
    const authResponse = await session.authorize();

    return new Response(authResponse.body, {
      status: authResponse.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error generating Liveblocks token:", error);
    return Response.json(
      { error: "Failed to generate authentication token" },
      { status: 500 }
    );
  }
}

/**
 * Helper to check if a user has collaborator access to a project
 */
async function hasCollaboratorAccess(
  projectId: string,
  email: string
): Promise<boolean> {
  const prisma = (await import("@/lib/prisma")).default;

  const collaborator = await prisma.projectCollaborator.findFirst({
    where: {
      projectId,
      email,
    },
  });

  return collaborator !== null;
}
