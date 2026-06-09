"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useMutation } from "@liveblocks/react";
import { Download, FileText, Loader2, RefreshCw, WandSparkles } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { generateSpec } from "@/trigger/generate-spec";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import type { AiChatMessage } from "@/types/tasks";

interface SpecsPanelProps {
  chatMessages: AiChatMessage[];
  projectId: string;
  roomId: string;
}

interface SpecSummary {
  id: string;
  createdAt: string;
  filename: string;
  downloadPath: string;
}

interface SpecWithContent extends SpecSummary {
  content: string;
}

interface SpecsResponseBody {
  specs?: unknown;
  error?: unknown;
}

interface SpecResponseBody {
  spec?: unknown;
  error?: unknown;
}

interface SpecGenerationResponseBody {
  runId?: unknown;
  token?: unknown;
  publicToken?: unknown;
  error?: unknown;
}

interface ActiveSpecRun {
  runId: string;
  publicToken: string;
}

interface CanvasSpecSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export function SpecsPanel({
  chatMessages,
  projectId,
  roomId,
}: SpecsPanelProps) {
  const [specs, setSpecs] = useState<SpecSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [isStartingGeneration, setIsStartingGeneration] = useState(false);
  const [activeSpecRun, setActiveSpecRun] = useState<ActiveSpecRun | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<SpecSummary | null>(null);
  const [previewSpec, setPreviewSpec] = useState<SpecWithContent | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const isGeneratingSpec = isStartingGeneration || Boolean(activeSpecRun);
  const readCanvasSpecSnapshot = useMutation(({ storage }) => {
    const flow = storage.get("flow");

    if (!flow) {
      return { nodes: [], edges: [] };
    }

    const nodes = Array.from(flow.get("nodes").values())
      .map((node) => readJsonSnapshot(node))
      .filter(isCanvasNode);
    const edges = Array.from(flow.get("edges").values())
      .map((edge) => readJsonSnapshot(edge))
      .filter(isCanvasEdge);

    return { nodes, edges } satisfies CanvasSpecSnapshot;
  }, []);

  const { error: realtimeError } = useRealtimeRun<typeof generateSpec>(
    activeSpecRun?.runId,
    {
      accessToken: activeSpecRun?.publicToken,
      enabled: Boolean(activeSpecRun?.runId && activeSpecRun.publicToken),
      onComplete: () => {
        setActiveSpecRun(null);
        void loadSpecs();
      },
    }
  );

  const loadSpecs = useCallback(async () => {
    setIsLoadingList(true);
    setListError("");

    try {
      const response = await fetch(`/api/projects/${projectId}/specs`, {
        credentials: "same-origin",
      });
      const data = (await response.json().catch(() => null)) as
        | SpecsResponseBody
        | null;

      if (!response.ok) {
        throw new Error(readError(data, "Could not load specs."));
      }

      setSpecs(readSpecSummaries(data?.specs));
    } catch (error) {
      setListError(readUnknownError(error, "Could not load specs."));
    } finally {
      setIsLoadingList(false);
    }
  }, [projectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSpecs();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSpecs]);

  useEffect(() => {
    if (!selectedSpec) {
      return;
    }

    let isActive = true;
    const specToPreview = selectedSpec;

    async function loadPreview() {
      setIsLoadingPreview(true);
      setPreviewError("");

      try {
        const response = await fetch(
          `/api/projects/${projectId}/specs/${specToPreview.id}`,
          { credentials: "same-origin" }
        );
        const data = (await response.json().catch(() => null)) as
          | SpecResponseBody
          | null;

        if (!response.ok) {
          throw new Error(readError(data, "Could not load spec preview."));
        }

        const spec = readSpecWithContent(data?.spec);

        if (!spec) {
          throw new Error("Spec preview response was invalid.");
        }

        if (isActive) {
          setPreviewSpec(spec);
        }
      } catch (error) {
        if (isActive) {
          setPreviewError(readUnknownError(error, "Could not load spec preview."));
        }
      } finally {
        if (isActive) {
          setIsLoadingPreview(false);
        }
      }
    }

    void loadPreview();

    return () => {
      isActive = false;
    };
  }, [projectId, selectedSpec]);

  const openPreview = (spec: SpecSummary) => {
    setPreviewSpec(null);
    setPreviewError("");
    setIsLoadingPreview(false);
    setSelectedSpec(spec);
  };

  const closePreview = () => {
    setSelectedSpec(null);
    setPreviewSpec(null);
    setPreviewError("");
    setIsLoadingPreview(false);
  };

  const generateProjectSpec = async () => {
    if (isGeneratingSpec) {
      return;
    }

    setIsStartingGeneration(true);
    setGenerationError("");

    try {
      const snapshot = readCanvasSpecSnapshot();
      const run = await startSpecRun({
        chatMessages,
        edges: snapshot.edges,
        nodes: snapshot.nodes,
        roomId,
      });

      setActiveSpecRun(run);
    } catch (error) {
      setGenerationError(readUnknownError(error, "Could not start spec generation."));
    } finally {
      setIsStartingGeneration(false);
    }
  };

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-copy-primary">
            Technical Specs
          </p>
          <p className="text-xs text-copy-muted">
            Review and download generated project documentation.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            onClick={() => void generateProjectSpec()}
            disabled={isGeneratingSpec}
            className="gap-2 bg-ai text-white hover:bg-ai/85 disabled:bg-subtle disabled:text-copy-faint"
          >
            {isGeneratingSpec ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <WandSparkles className="h-4 w-4" />
            )}
            Generate
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => void loadSpecs()}
            disabled={isLoadingList}
            aria-label="Refresh specs"
            className="text-copy-muted hover:bg-subtle hover:text-copy-primary"
          >
            {isLoadingList ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {generationError || realtimeError ? (
        <p className="mt-3 rounded-xl border border-state-error/35 bg-base px-3 py-2 text-xs leading-5 text-state-error">
          {generationError ||
            `Spec generation lost its run connection: ${realtimeError?.message}`}
        </p>
      ) : activeSpecRun ? (
        <p className="mt-3 rounded-xl border border-ai/35 bg-base px-3 py-2 text-xs leading-5 text-copy-secondary">
          Ghost AI is generating and saving this spec...
        </p>
      ) : null}

      <ScrollArea className="mt-4 min-h-0 flex-1 pr-1">
        {isLoadingList ? (
          <SpecsStatus icon="loading" text="Loading specs..." />
        ) : listError ? (
          <SpecsStatus icon="error" text={listError}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadSpecs()}
              className="mt-3 border-surface-border bg-base text-copy-primary hover:bg-subtle"
            >
              Try again
            </Button>
          </SpecsStatus>
        ) : specs.length === 0 ? (
          <SpecsStatus
            icon="empty"
            text="Generated specs will appear here after Ghost AI saves them."
          />
        ) : (
          <div className="space-y-2 py-1">
            {specs.map((spec) => (
              <SpecListItem
                key={spec.id}
                spec={spec}
                onSelect={() => openPreview(spec)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <SpecPreviewDialog
        isOpen={Boolean(selectedSpec)}
        isLoading={isLoadingPreview}
        error={previewError}
        spec={previewSpec ?? selectedSpec}
        content={previewSpec?.content ?? ""}
        onOpenChange={(open) => {
          if (!open) {
            closePreview();
          }
        }}
      />
    </>
  );
}

async function startSpecRun({
  chatMessages,
  edges,
  nodes,
  roomId,
}: {
  chatMessages: AiChatMessage[];
  edges: CanvasEdge[];
  nodes: CanvasNode[];
  roomId: string;
}): Promise<ActiveSpecRun> {
  const generationResponse = await postJson<SpecGenerationResponseBody>(
    "/api/ai/spec",
    {
      roomId,
      chatHistory: chatMessages.map((message) => ({
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
        },
      })),
      nodes,
      edges,
    }
  );
  const runId = readString(generationResponse.runId);

  if (!runId) {
    throw new Error("Spec API did not return a run ID.");
  }

  const inlineToken =
    readString(generationResponse.publicToken) ||
    readString(generationResponse.token);

  if (inlineToken) {
    return { runId, publicToken: inlineToken };
  }

  const tokenResponse = await postJson<SpecGenerationResponseBody>(
    "/api/ai/spec/token",
    { runId }
  );
  const publicToken =
    readString(tokenResponse.publicToken) || readString(tokenResponse.token);

  if (!publicToken) {
    throw new Error("Spec API did not return a public run token.");
  }

  return { runId, publicToken };
}

async function postJson<TResponse>(
  url: string,
  body: Record<string, unknown>
): Promise<TResponse> {
  const response = await fetch(url, {
    credentials: "same-origin",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => null)) as TResponse | null;

  if (!response.ok) {
    const errorMessage =
      data && typeof data === "object" && "error" in data
        ? readString((data as SpecGenerationResponseBody).error)
        : "";

    throw new Error(errorMessage || "Spec generation request failed.");
  }

  if (!data) {
    throw new Error("Spec generation returned an empty response.");
  }

  return data;
}

function SpecListItem({
  onSelect,
  spec,
}: {
  onSelect: () => void;
  spec: SpecSummary;
}) {
  return (
    <div className="group flex items-stretch overflow-hidden rounded-2xl border border-surface-border bg-elevated transition-colors hover:border-subtle-border hover:bg-subtle">
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-start gap-3 px-3 py-3 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-base">
          <FileText className="h-4 w-4 text-ai-text" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-copy-primary">
            {spec.filename}
          </span>
          <span className="mt-1 block text-xs text-copy-muted">
            {formatSpecDate(spec.createdAt)}
          </span>
        </span>
      </button>
      <Button
        asChild
        type="button"
        variant="ghost"
        size="icon-sm"
        className="m-2 shrink-0 self-center text-copy-muted hover:bg-base hover:text-copy-primary"
      >
        <a href={spec.downloadPath} aria-label={`Download ${spec.filename}`}>
          <Download className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}

function SpecPreviewDialog({
  content,
  error,
  isLoading,
  isOpen,
  onOpenChange,
  spec,
}: {
  content: string;
  error: string;
  isLoading: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  spec: SpecSummary | null;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(46rem,calc(100vh-2rem))] max-w-3xl grid-rows-[auto_minmax(0,1fr)_auto] rounded-3xl border border-surface-border bg-base p-0 text-copy-primary">
        <DialogHeader className="border-b border-surface-border px-5 py-4 pr-12">
          <DialogTitle className="truncate text-base text-copy-primary">
            {spec?.filename ?? "Technical spec"}
          </DialogTitle>
          <DialogDescription className="text-xs text-copy-muted">
            {spec ? formatSpecDate(spec.createdAt) : "Preview"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 px-5 py-4">
          {isLoading ? (
            <SpecsStatus icon="loading" text="Loading preview..." />
          ) : error ? (
            <SpecsStatus icon="error" text={error} />
          ) : (
            <MarkdownPreview content={content} />
          )}
        </ScrollArea>

        <DialogFooter className="mx-0 mb-0 rounded-b-3xl border-surface-border bg-surface px-5 py-4">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="border-surface-border bg-base text-copy-primary hover:bg-subtle"
            >
              Close
            </Button>
          </DialogClose>
          <Button
            asChild
            type="button"
            className="gap-2 bg-ai text-white hover:bg-ai/85"
            disabled={!spec}
          >
            <a href={spec?.downloadPath ?? "#"}>
              <Download className="h-4 w-4" />
              Download
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SpecsStatus({
  children,
  icon,
  text,
}: {
  children?: ReactNode;
  icon: "empty" | "error" | "loading";
  text: string;
}) {
  return (
    <div className="flex min-h-[12rem] flex-col items-center justify-center px-3 py-8 text-center">
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl border border-surface-border bg-elevated",
          icon === "error" && "border-state-error/40"
        )}
      >
        {icon === "loading" ? (
          <Loader2 className="h-5 w-5 animate-spin text-ai-text" />
        ) : (
          <FileText
            className={cn(
              "h-5 w-5",
              icon === "error" ? "text-state-error" : "text-ai-text"
            )}
          />
        )}
      </div>
      <p className="mt-3 max-w-xs text-sm leading-6 text-copy-muted">{text}</p>
      {children}
    </div>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

  if (blocks.length === 0) {
    return <p className="text-sm text-copy-muted">This spec is empty.</p>;
  }

  return (
    <div className="space-y-3 text-sm leading-6 text-copy-secondary">
      {blocks.map((block, index) => (
        <MarkdownBlock key={`${block.type}-${index}`} block={block} />
      ))}
    </div>
  );
}

type MarkdownBlock =
  | { type: "code"; text: string }
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "list"; items: string[] }
  | { type: "paragraph"; text: string };

function MarkdownBlock({ block }: { block: MarkdownBlock }) {
  if (block.type === "heading") {
    const HeadingTag = `h${block.level}` as "h1" | "h2" | "h3";

    return (
      <HeadingTag
        className={cn(
          "font-semibold text-copy-primary",
          block.level === 1 && "text-lg",
          block.level === 2 && "text-base",
          block.level === 3 && "text-sm"
        )}
      >
        {renderInlineMarkdown(block.text)}
      </HeadingTag>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="list-disc space-y-1 pl-5">
        {block.items.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
  }

  if (block.type === "code") {
    return (
      <pre className="overflow-x-auto rounded-2xl border border-surface-border bg-surface p-3 font-mono text-xs leading-5 text-copy-secondary">
        <code>{block.text}</code>
      </pre>
    );
  }

  return <p className="whitespace-pre-wrap">{renderInlineMarkdown(block.text)}</p>;
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: string[] = [];
  let code: string[] | null = null;

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join("\n") });
      paragraph = [];
    }
  }

  function flushList() {
    if (list.length > 0) {
      blocks.push({ type: "list", items: list });
      list = [];
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim().startsWith("```")) {
      if (code) {
        blocks.push({ type: "code", text: code.join("\n") });
        code = null;
      } else {
        flushParagraph();
        flushList();
        code = [];
      }
      continue;
    }

    if (code) {
      code.push(rawLine);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);

    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2],
      });
      continue;
    }

    const listMatch = /^\s*[-*]\s+(.+)$/.exec(line);

    if (listMatch) {
      flushParagraph();
      list.push(listMatch[1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  if (code) {
    blocks.push({ type: "code", text: code.join("\n") });
  }

  flushParagraph();
  flushList();

  return blocks;
}

function renderInlineMarkdown(text: string) {
  const segments = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return segments.map((segment, index) => {
    if (segment.startsWith("`") && segment.endsWith("`")) {
      return (
        <code
          key={`${segment}-${index}`}
          className="rounded-xl bg-surface px-1.5 py-0.5 font-mono text-xs text-ai-text"
        >
          {segment.slice(1, -1)}
        </code>
      );
    }

    if (segment.startsWith("**") && segment.endsWith("**")) {
      return (
        <strong key={`${segment}-${index}`} className="font-semibold text-copy-primary">
          {segment.slice(2, -2)}
        </strong>
      );
    }

    return segment;
  });
}

function readSpecSummaries(value: unknown): SpecSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isSpecSummary);
}

function readSpecWithContent(value: unknown): SpecWithContent | null {
  if (!isSpecSummary(value)) {
    return null;
  }

  if (
    typeof value !== "object" ||
    value === null ||
    !("content" in value) ||
    typeof value.content !== "string"
  ) {
    return null;
  }

  return {
    ...value,
    content: value.content,
  };
}

function readJsonSnapshot(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "toJSON" in value &&
    typeof value.toJSON === "function"
  ) {
    return value.toJSON();
  }

  return value;
}

function isCanvasNode(value: unknown): value is CanvasNode {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<CanvasNode>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.position === "object" &&
    candidate.position !== null &&
    typeof candidate.data === "object" &&
    candidate.data !== null
  );
}

function isCanvasEdge(value: unknown): value is CanvasEdge {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<CanvasEdge>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.source === "string" &&
    typeof candidate.target === "string"
  );
}

function isSpecSummary(value: unknown): value is SpecSummary {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "createdAt" in value &&
    typeof value.createdAt === "string" &&
    "filename" in value &&
    typeof value.filename === "string" &&
    "downloadPath" in value &&
    typeof value.downloadPath === "string"
  );
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : "";
}

function readError(
  data: SpecsResponseBody | SpecResponseBody | null,
  fallback: string
) {
  return data && typeof data.error === "string" && data.error.trim()
    ? data.error.trim()
    : fallback;
}

function readUnknownError(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim()
    ? error.message.trim()
    : fallback;
}

function formatSpecDate(value: string) {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}
