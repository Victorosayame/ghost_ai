import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { metadata, schemaTask } from "@trigger.dev/sdk";
import { put } from "@vercel/blob";
import { generateText } from "ai";
import { randomUUID } from "node:crypto";

import {
  generateSpecPayloadSchema,
  type GenerateSpecPayload,
} from "@/lib/api/spec-generation";
import prisma from "@/lib/prisma";

export const generateSpec = schemaTask({
  id: "generate-spec",
  schema: generateSpecPayloadSchema,
  run: async (payload) => {
    metadata
      .set("status", "starting")
      .set("projectId", payload.projectId)
      .set("roomId", payload.roomId)
      .set("nodeCount", payload.nodes.length)
      .set("edgeCount", payload.edges.length);

    try {
      metadata.set("status", "generating");

      const markdown = await createTechnicalSpec(payload);
      const spec = await persistSpec({
        markdown,
        projectId: payload.projectId,
      });

      metadata
        .set("status", "completed")
        .set("markdownLength", markdown.length)
        .set("specId", spec.id)
        .set("filePath", spec.filePath);

      return {
        markdown,
        specId: spec.id,
        filePath: spec.filePath,
        downloadPath: `/api/projects/${payload.projectId}/specs/${spec.id}/download`,
      };
    } catch (error) {
      metadata.set("status", "failed");
      console.error("Spec generation failed:", describeError(error));
      throw error;
    }
  },
});

async function createTechnicalSpec(payload: GenerateSpecPayload) {
  const apiKey =
    process.env.GOOGLE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing Google AI API key for spec generation.");
  }

  const google = createGoogleGenerativeAI({ apiKey });
  const result = await generateText({
    model: google("gemini-2.5-flash"),
    system: [
      "You are Ghost AI, a senior software architect.",
      "Generate a clear Markdown technical specification from a system design canvas and related chat context.",
      "Return Markdown only. Do not wrap the output in code fences.",
      "Do not invent technologies or requirements that are not supported by the canvas or chat history.",
      "If information is unknown, call it out as an assumption or open question.",
    ].join("\n"),
    prompt: [
      "Create a technical specification for this architecture.",
      "",
      "Use this structure:",
      "# Technical Specification",
      "## Overview",
      "## Goals",
      "## Architecture",
      "## Components",
      "## Data Flow",
      "## Operational Considerations",
      "## Assumptions and Open Questions",
      "",
      "Canvas graph:",
      JSON.stringify(
        {
          nodes: payload.nodes.map((node) => ({
            id: node.id,
            label: node.data?.label || node.id,
            shape: node.data?.shape,
            position: node.position,
          })),
          edges: payload.edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.data?.label,
          })),
        },
        null,
        2
      ),
      "",
      "Relevant chat history:",
      JSON.stringify(
        payload.chatHistory.map((message) => ({
          role: message.role ?? "user",
          sender: message.sender?.name,
          content: message.content,
          timestamp: message.timestamp,
        })),
        null,
        2
      ),
    ].join("\n"),
  });

  const markdown = result.text.trim();

  if (!markdown) {
    throw new Error("Spec generation returned empty Markdown.");
  }

  return markdown;
}

async function persistSpec({
  markdown,
  projectId,
}: {
  markdown: string;
  projectId: string;
}) {
  const specId = randomUUID();

  const blob = await put(`specs/${projectId}/${specId}.md`, markdown, {
    access: "private",
    allowOverwrite: false,
    contentType: "text/markdown; charset=utf-8",
  });

  await prisma.project.update({
    where: { id: projectId },
    data: {
      specs: {
        create: {
          id: specId,
          filePath: blob.url,
        },
      },
    },
    select: { id: true },
  });

  return {
    id: specId,
    filePath: blob.url,
  };
}

function describeError(error: unknown) {
  if (error instanceof Error) {
    return typeof error.toString === "function" ? error.toString() : error.message;
  }

  return String(error);
}
