interface CollaboratorBody {
  email?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCollaboratorBody(value: unknown): CollaboratorBody | null {
  if (!isRecord(value)) {
    return null;
  }

  const { email } = value;

  if (email !== undefined && typeof email !== "string") {
    return null;
  }

  return { email };
}

export async function readCollaboratorBody(request: Request) {
  const rawBody = await request.text();
  const parsedBody = rawBody.trim() ? JSON.parse(rawBody) : {};

  return parseCollaboratorBody(parsedBody);
}

export function collaboratorEmailForInvite(email: string | undefined) {
  const trimmedEmail = email?.trim().toLowerCase();

  if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
    return null;
  }

  return trimmedEmail;
}
