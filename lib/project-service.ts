import prisma from "@/lib/prisma";

const PROJECT_SELECT = {
  id: true,
  ownerId: true,
  name: true,
  description: true,
  status: true,
  canvasJsonPath: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listOwnedProjects(ownerId: string) {
  return prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    select: PROJECT_SELECT,
  });
}

export async function listSharedProjects(email: string | null) {
  if (!email) {
    return [];
  }

  return prisma.project.findMany({
    where: {
      collaborators: {
        some: { email },
      },
    },
    orderBy: { updatedAt: "desc" },
    select: PROJECT_SELECT,
  });
}

export async function listEditorProjects(ownerId: string, email: string | null) {
  const [ownedProjects, sharedProjects] = await Promise.all([
    listOwnedProjects(ownerId),
    listSharedProjects(email),
  ]);

  return { ownedProjects, sharedProjects };
}

export async function createProject(
  ownerId: string,
  name: string,
  projectId?: string
) {
  return prisma.project.create({
    data: {
      id: projectId,
      ownerId,
      name,
    },
    select: PROJECT_SELECT,
  });
}

export async function findProjectOwner(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
    },
  });
}

export async function findAccessibleProject(
  projectId: string,
  ownerId: string,
  email: string | null
) {
  const membershipFilters = email
    ? [
        { ownerId },
        {
          collaborators: {
            some: { email },
          },
        },
      ]
    : [{ ownerId }];

  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: membershipFilters,
    },
    select: PROJECT_SELECT,
  });
}

export async function renameProject(projectId: string, name: string) {
  return prisma.project.update({
    where: { id: projectId },
    data: { name },
    select: PROJECT_SELECT,
  });
}

export async function deleteProject(projectId: string) {
  return prisma.project.delete({
    where: { id: projectId },
    select: PROJECT_SELECT,
  });
}
