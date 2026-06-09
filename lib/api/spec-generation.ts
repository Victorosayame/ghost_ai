import { z } from "zod";

const MAX_CHAT_MESSAGES = 40;
const MAX_NODES = 120;
const MAX_EDGES = 180;

const nonEmptyString = z.string().trim().min(1);

export const specChatMessageSchema = z
  .object({
    role: z.enum(["user", "assistant", "system"]).optional(),
    content: z.string().trim().min(1).max(4000),
    timestamp: z.string().trim().optional(),
    sender: z
      .object({
        id: z.string().trim().optional(),
        name: z.string().trim().optional(),
      })
      .optional(),
  })
  .passthrough();

export const specNodeSchema = z
  .object({
    id: nonEmptyString,
    type: z.string().trim().optional(),
    position: z
      .object({
        x: z.number().finite(),
        y: z.number().finite(),
      })
      .optional(),
    width: z.number().finite().optional(),
    height: z.number().finite().optional(),
    data: z
      .object({
        label: z.string().trim().optional(),
        shape: z.string().trim().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const specEdgeSchema = z
  .object({
    id: nonEmptyString,
    source: nonEmptyString,
    target: nonEmptyString,
    type: z.string().trim().optional(),
    data: z
      .object({
        label: z.string().trim().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const specRequestSchema = z.object({
  roomId: nonEmptyString,
  chatHistory: z.array(specChatMessageSchema).max(MAX_CHAT_MESSAGES),
  nodes: z.array(specNodeSchema).max(MAX_NODES),
  edges: z.array(specEdgeSchema).max(MAX_EDGES),
});

export const generateSpecPayloadSchema = specRequestSchema.extend({
  projectId: nonEmptyString,
});

export const specTokenRequestSchema = z.object({
  runId: nonEmptyString,
});

export type SpecRequestBody = z.infer<typeof specRequestSchema>;
export type GenerateSpecPayload = z.infer<typeof generateSpecPayloadSchema>;
export type SpecTokenRequestBody = z.infer<typeof specTokenRequestSchema>;

async function readJsonBody(request: Request) {
  const rawBody = await request.text();

  return rawBody.trim() ? JSON.parse(rawBody) : null;
}

export async function readSpecRequestBody(request: Request) {
  const parsed = specRequestSchema.safeParse(await readJsonBody(request));

  return parsed.success ? parsed.data : null;
}

export async function readSpecTokenRequestBody(request: Request) {
  const parsed = specTokenRequestSchema.safeParse(await readJsonBody(request));

  return parsed.success ? parsed.data : null;
}
