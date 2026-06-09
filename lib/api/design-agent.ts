export interface DesignRequestBody {
  prompt: string;
  projectId: string;
  roomId: string;
}

export interface DesignTokenRequestBody {
  runId: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function parseDesignRequestBody(value: unknown): DesignRequestBody | null {
  if (!isRecord(value)) {
    return null;
  }

  const prompt = nonEmptyString(value.prompt);
  const projectId = nonEmptyString(value.projectId);
  const roomId = nonEmptyString(value.roomId);

  if (!prompt || !projectId || !roomId) {
    return null;
  }

  return { prompt, projectId, roomId };
}

function parseDesignTokenRequestBody(
  value: unknown
): DesignTokenRequestBody | null {
  if (!isRecord(value)) {
    return null;
  }

  const runId = nonEmptyString(value.runId);

  return runId ? { runId } : null;
}

async function readJsonBody(request: Request) {
  const rawBody = await request.text();

  return rawBody.trim() ? JSON.parse(rawBody) : null;
}

export async function readDesignRequestBody(request: Request) {
  return parseDesignRequestBody(await readJsonBody(request));
}

export async function readDesignTokenRequestBody(request: Request) {
  return parseDesignTokenRequestBody(await readJsonBody(request));
}
