const DEFAULT_PROJECT_NAME = "Untitled Project";

interface ProjectBody {
  id?: string;
  name?: string;
}

const PROJECT_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,98}[a-z0-9])?$/;

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

export function notFoundResponse() {
  return Response.json({ error: "Project not found" }, { status: 404 });
}

export function badRequestResponse(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function conflictResponse(message: string) {
  return Response.json({ error: message }, { status: 409 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseProjectBody(value: unknown): ProjectBody | null {
  if (!isRecord(value)) {
    return null;
  }

  const { id, name } = value;

  if (id !== undefined && typeof id !== "string") {
    return null;
  }

  if (name !== undefined && typeof name !== "string") {
    return null;
  }

  return { id, name };
}

export async function readProjectBody(request: Request) {
  const rawBody = await request.text();
  const parsedBody = rawBody.trim() ? JSON.parse(rawBody) : {};

  return parseProjectBody(parsedBody);
}

export function projectNameOrDefault(name: string | undefined) {
  const trimmedName = name?.trim();
  return trimmedName ? trimmedName : DEFAULT_PROJECT_NAME;
}

export function projectNameForRename(name: string | undefined) {
  const trimmedName = name?.trim();
  return trimmedName ? trimmedName : null;
}

export function projectIdForCreate(id: string | undefined) {
  const trimmedId = id?.trim();

  if (!trimmedId) {
    return undefined;
  }

  return PROJECT_ID_PATTERN.test(trimmedId) ? trimmedId : null;
}
