import { clerkClient } from "@clerk/nextjs/server";
import type { User } from "@clerk/backend";

import prisma from "@/lib/prisma";

const COLLABORATOR_SELECT = {
  id: true,
  email: true,
  createdAt: true,
} as const;

export interface EnrichedCollaborator {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

function displayNameForUser(user: User) {
  return user.fullName ?? user.username ?? user.primaryEmailAddress?.emailAddress ?? null;
}

function buildUserEmailMap(users: User[]) {
  const userByEmail = new Map<string, User>();

  for (const user of users) {
    for (const emailAddress of user.emailAddresses) {
      userByEmail.set(emailAddress.emailAddress.toLowerCase(), user);
    }
  }

  return userByEmail;
}

async function getClerkUsersByEmail(emails: string[]) {
  if (emails.length === 0) {
    return new Map<string, User>();
  }

  try {
    const client = await clerkClient();
    const users = await client.users.getUserList({
      emailAddress: emails,
      limit: Math.min(emails.length, 100),
    });

    return buildUserEmailMap(users.data);
  } catch {
    return new Map<string, User>();
  }
}

export async function listProjectCollaborators(projectId: string) {
  return prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: COLLABORATOR_SELECT,
  });
}

export async function listEnrichedProjectCollaborators(projectId: string) {
  const collaborators = await listProjectCollaborators(projectId);
  const usersByEmail = await getClerkUsersByEmail(
    collaborators.map((collaborator) => collaborator.email)
  );

  return collaborators.map<EnrichedCollaborator>((collaborator) => {
    const user = usersByEmail.get(collaborator.email.toLowerCase());

    return {
      id: collaborator.id,
      email: collaborator.email,
      displayName: user ? displayNameForUser(user) : null,
      avatarUrl: user?.imageUrl ?? null,
      createdAt: collaborator.createdAt.toISOString(),
    };
  });
}

export async function inviteProjectCollaborator(
  projectId: string,
  email: string
) {
  return prisma.projectCollaborator.create({
    data: {
      projectId,
      email,
    },
    select: COLLABORATOR_SELECT,
  });
}

export async function removeProjectCollaborator(
  projectId: string,
  collaboratorId: string
) {
  return prisma.projectCollaborator.deleteMany({
    where: {
      id: collaboratorId,
      projectId,
    },
  });
}
