import { auth, currentUser } from "@clerk/nextjs/server";

import prisma from "@/lib/prisma";

export interface ClerkIdentity {
  isAuthenticated: boolean;
  primaryEmail: string | null;
  userId: string | null;
}

const ACCESSIBLE_PROJECT_SELECT = {
  id: true,
  ownerId: true,
  name: true,
  description: true,
  status: true,
  canvasJsonPath: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getCurrentClerkIdentity(): Promise<ClerkIdentity> {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return {
      isAuthenticated: false,
      primaryEmail: null,
      userId: null,
    };
  }

  const user = await currentUser();

  return {
    isAuthenticated: true,
    primaryEmail: user?.primaryEmailAddress?.emailAddress ?? null,
    userId,
  };
}

export async function findProjectForIdentity(
  projectId: string,
  identity: ClerkIdentity
) {
  if (!identity.userId) {
    return null;
  }

  const accessFilters = identity.primaryEmail
    ? [
        { ownerId: identity.userId },
        {
          collaborators: {
            some: { email: identity.primaryEmail },
          },
        },
      ]
    : [{ ownerId: identity.userId }];

  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: accessFilters,
    },
    select: ACCESSIBLE_PROJECT_SELECT,
  });
}
