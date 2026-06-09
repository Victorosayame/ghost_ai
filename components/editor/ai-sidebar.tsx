"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { Bot, Loader2, SendHorizonal, Sparkles, X } from "lucide-react";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { SpecsPanel } from "@/components/editor/specs-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAiChatFeed } from "@/hooks/use-ai-chat-feed";
import { useAiStatusFeed } from "@/hooks/use-ai-status-feed";
import { cn } from "@/lib/utils";
import type { designAgent } from "@/trigger/design-agent";
import type { AiChatMessage, AiStatusMessage } from "@/types/tasks";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  projectId: string;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

const MIN_TEXTAREA_HEIGHT = 72;
const MAX_TEXTAREA_HEIGHT = 160;

interface ActiveRun {
  runId: string;
  publicToken: string;
}

interface DesignResponseBody {
  runId?: unknown;
  publicToken?: unknown;
  token?: unknown;
  error?: unknown;
}

function AiSidebar({
  isOpen,
  onClose,
  roomId,
  projectId,
}: AiSidebarProps) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const handledRunIdsRef = useRef<Set<string>>(new Set());
  const { isWorking: isSharedAiWorking, latestStatus } = useAiStatusFeed();
  const {
    chatMessages,
    error: chatError,
    isLoading: isChatLoading,
    sendAssistantMessage,
    sendMessage,
  } = useAiChatFeed();
  const isRunActive = Boolean(activeRun);
  const isComposerDisabled = isSending || isRunActive;
  const textareaId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const finishRun = useCallback(
    async (runId: string, message: string) => {
      if (handledRunIdsRef.current.has(runId)) {
        return;
      }

      handledRunIdsRef.current.add(runId);

      try {
        await sendAssistantMessage({ content: message });
      } catch {
        // The chat feed hook owns the visible feed error state.
      } finally {
        setActiveRun((currentRun) =>
          currentRun?.runId === runId ? null : currentRun
        );
      }
    },
    [sendAssistantMessage]
  );

  const { error: realtimeError } = useRealtimeRun<typeof designAgent>(
    activeRun?.runId,
    {
      accessToken: activeRun?.publicToken,
      enabled: Boolean(activeRun?.runId && activeRun.publicToken),
      onComplete: (run, error) => {
        const message = createFinalRunMessage(run, latestStatus, error);

        void finishRun(run.id, message);
      },
    }
  );

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";

    const nextHeight = Math.min(
      Math.max(textarea.scrollHeight, MIN_TEXTAREA_HEIGHT),
      MAX_TEXTAREA_HEIGHT
    );

    textarea.style.height = `${nextHeight}px`;
  }, [draft]);

  const submitPrompt = async () => {
    const trimmedDraft = draft.trim();

    if (!trimmedDraft || isComposerDisabled) {
      return;
    }

    setIsSending(true);

    try {
      await sendMessage({ content: trimmedDraft });
      setDraft("");
      const nextRun = await startDesignRun({
        prompt: trimmedDraft,
        projectId,
        roomId,
      });

      setActiveRun(nextRun);
    } catch (error) {
      try {
        await sendAssistantMessage({
          content: `Ghost AI could not start that design run: ${readErrorMessage(error)}`,
        });
      } catch {
        // The chat feed hook owns the visible feed error state.
      }
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!activeRun || !realtimeError) {
      return;
    }

    void finishRun(
      activeRun.runId,
      `Ghost AI lost the run connection: ${realtimeError.message}`
    );
  }, [activeRun, finishRun, realtimeError]);

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void submitPrompt();
  };

  return (
    <aside
      aria-hidden={!isOpen}
      className={cn(
        "fixed right-4 top-16 z-40 flex h-[calc(100vh-4.5rem)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-surface-border bg-base/95 shadow-xl backdrop-blur-md transition-all duration-200 ease-out",
        isOpen
          ? "translate-x-0 opacity-100"
          : "pointer-events-none invisible translate-x-[calc(100%+1rem)] opacity-0"
      )}
    >
      <div className="flex shrink-0 items-start gap-3 border-b border-surface-border px-5 py-4">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ai/15">
          <Bot className="h-4 w-4 text-ai-text" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-copy-primary">AI Workspace</p>
          <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
          <AiHeaderStatus
            isSending={isSending}
            isSharedAiWorking={isSharedAiWorking}
            status={latestStatus}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close AI sidebar"
          className="shrink-0 text-copy-muted hover:bg-subtle hover:text-copy-primary"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs
        defaultValue="architect"
        className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-4"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl bg-subtle p-1">
          <TabsTrigger
            value="architect"
            className="rounded-xl border-0 px-3 py-2 text-copy-muted data-active:bg-ai data-active:text-white"
          >
            AI Architect
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            className="rounded-xl border-0 px-3 py-2 text-copy-muted data-active:bg-ai data-active:text-white"
          >
            Specs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="architect" className="mt-4 flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1 pr-1">
            {isChatLoading ? (
              <div className="flex min-h-full items-center justify-center gap-2 text-sm text-copy-muted">
                <Loader2 className="h-4 w-4 animate-spin text-ai-text" />
                Loading chat...
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="flex min-h-full flex-col items-center justify-center px-3 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-surface-border bg-elevated">
                  <Sparkles className="h-5 w-5 text-ai-text" />
                </div>
                <h3 className="mt-4 text-sm font-medium text-copy-primary">
                  Start an architecture conversation
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-copy-muted">
                  Prompt Ghost AI to sketch services, data flows, and delivery
                  plans for this shared workspace.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setDraft(prompt)}
                      className="rounded-full bg-subtle px-3 py-2 text-xs font-medium text-ai-text transition-colors hover:bg-elevated"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-1">
                {chatMessages.map((message) => (
                  <AiChatMessageBubble key={message.id} message={message} />
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="mt-4 shrink-0 rounded-2xl border border-surface-border bg-surface/80 p-3">
            <AiRunStatusStrip
              isActive={isRunActive}
              status={latestStatus}
            />
            <label htmlFor={textareaId} className="sr-only">
              Message Ghost AI
            </label>
            <Textarea
              id={textareaId}
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              disabled={isComposerDisabled}
              placeholder="Describe the system you want Ghost AI to help design..."
              className="min-h-[72px] max-h-[160px] resize-none border-surface-border bg-base text-copy-primary placeholder:text-copy-faint"
            />
            {chatError ? (
              <p className="mt-2 text-xs leading-5 text-state-error">
                {chatError}
              </p>
            ) : null}
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0 text-[11px] leading-5 text-copy-faint">
                <span className="font-mono">Room {roomId}</span>
                <span className="mx-2 text-copy-faint/60">•</span>
                <span className="font-mono">Project {projectId}</span>
              </div>
              <Button
                type="button"
                onClick={() => void submitPrompt()}
                disabled={draft.trim().length === 0 || isComposerDisabled}
                className="gap-2 bg-state-success text-base hover:bg-state-success/85 disabled:bg-subtle disabled:text-copy-faint"
              >
                {isSending || isRunActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizonal className="h-4 w-4" />
                )}
                Send
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="specs" className="mt-4 flex min-h-0 flex-1 flex-col">
          <SpecsPanel
            chatMessages={chatMessages}
            projectId={projectId}
            roomId={roomId}
          />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function AiRunStatusStrip({
  isActive,
  status,
}: {
  isActive: boolean;
  status: AiStatusMessage | null;
}) {
  if (!isActive) {
    return null;
  }

  return (
    <div className="mb-3 flex items-center gap-2 rounded-xl border border-state-success/35 bg-base px-3 py-2 text-xs text-copy-secondary">
      <span
        className="h-2 w-2 shrink-0 rounded-full bg-state-success shadow-[0_0_0_4px_var(--accent-primary-dim)]"
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate">
        {status?.text || "Ghost AI is updating the shared canvas..."}
      </span>
    </div>
  );
}

function AiHeaderStatus({
  isSending,
  isSharedAiWorking,
  status,
}: {
  isSending: boolean;
  isSharedAiWorking: boolean;
  status: AiStatusMessage | null;
}) {
  const isWorking =
    isSharedAiWorking ||
    status?.phase === "start" ||
    status?.phase === "processing";

  if (!isSending && !isWorking && !status) {
    return null;
  }

  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-copy-muted">
      {isWorking ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-ai-text" />
      ) : (
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            status?.level === "error" ? "bg-state-error" : "bg-state-success"
          )}
          aria-hidden="true"
        />
      )}
      <span className="truncate">
        {isSending
          ? "Sending message..."
          : status?.text || fallbackStatusText(status)}
      </span>
    </div>
  );
}

function AiChatMessageBubble({ message }: { message: AiChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-3 text-sm leading-6",
          isUser
            ? "border border-state-success/45 bg-state-success text-base"
            : "border border-surface-border bg-elevated text-copy-primary"
        )}
      >
        <div
          className={cn(
            "mb-1 flex items-center gap-2 text-[11px] leading-4",
            isUser ? "text-base/70" : "text-copy-muted"
          )}
        >
          <span className="max-w-[9rem] truncate font-medium">
            {message.sender.name}
          </span>
          <span className="text-copy-faint">{formatChatTimestamp(message)}</span>
        </div>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
}

function formatChatTimestamp(message: AiChatMessage) {
  const timestamp = Date.parse(message.timestamp);

  if (Number.isNaN(timestamp)) {
    return new Date(message.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fallbackStatusText(status: AiStatusMessage | null) {
  if (!status) {
    return "Ghost AI is ready.";
  }

  if (status.phase === "complete") {
    return "Ghost AI finished updating the canvas.";
  }

  if (status.phase === "error") {
    return "Ghost AI could not finish the current update.";
  }

  return "Ghost AI is working in this room.";
}

async function startDesignRun({
  prompt,
  projectId,
  roomId,
}: {
  prompt: string;
  projectId: string;
  roomId: string;
}): Promise<ActiveRun> {
  const designResponse = await postJson<DesignResponseBody>("/api/ai/design", {
    prompt,
    projectId,
    roomId,
  });
  const runId = readString(designResponse.runId);

  if (!runId) {
    throw new Error("Design API did not return a run ID.");
  }

  const inlineToken =
    readString(designResponse.publicToken) || readString(designResponse.token);

  if (inlineToken) {
    return { runId, publicToken: inlineToken };
  }

  const tokenResponse = await postJson<DesignResponseBody>(
    "/api/ai/design/token",
    { runId }
  );
  const publicToken =
    readString(tokenResponse.publicToken) || readString(tokenResponse.token);

  if (!publicToken) {
    throw new Error("Design API did not return a public run token.");
  }

  return { runId, publicToken };
}

async function postJson<TResponse>(
  url: string,
  body: Record<string, string>
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
        ? readString((data as DesignResponseBody).error)
        : "";

    throw new Error(errorMessage || "Ghost AI request failed.");
  }

  if (!data) {
    throw new Error("Ghost AI returned an empty response.");
  }

  return data;
}

function createFinalRunMessage(
  run: NonNullable<ReturnType<typeof useRealtimeRun<typeof designAgent>>["run"]>,
  status: AiStatusMessage | null,
  error?: Error
) {
  if (error) {
    return `Ghost AI could not finish the design run: ${error.message}`;
  }

  if (run.isSuccess) {
    const output = run.output;
    const summary =
      output && typeof output === "object" && "summary" in output
        ? readString(output.summary)
        : "";

    return summary
      ? `Done. ${summary}`
      : status?.text || "Done. Ghost AI updated the shared canvas.";
  }

  const runErrorMessage = run.error?.message || status?.text;

  return runErrorMessage
    ? `Ghost AI could not finish the design run: ${runErrorMessage}`
    : `Ghost AI finished with status ${run.status}.`;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : "";
}

function readErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  return "Please try again.";
}

export default AiSidebar;
