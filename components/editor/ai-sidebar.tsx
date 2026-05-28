"use client";

import { Bot, FileText, SendHorizonal, Sparkles, X } from "lucide-react";
import {
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  projectId: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

const DEMO_SPEC_SNIPPET =
  "Checkout requests route through an API gateway, order service, payment integration, and async fulfillment queue with shared observability.";

const DEMO_ASSISTANT_REPLY =
  "I can turn that into a shared architecture plan with core services, data stores, integrations, and the first canvas nodes to place.";

const MIN_TEXTAREA_HEIGHT = 72;
const MAX_TEXTAREA_HEIGHT = 160;

function AiSidebar({
  isOpen,
  onClose,
  roomId,
  projectId,
}: AiSidebarProps) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const textareaId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  const submitPrompt = () => {
    const trimmedDraft = draft.trim();

    if (!trimmedDraft) {
      return;
    }

    const promptId = `user-${Date.now()}`;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: promptId,
        role: "user",
        content: trimmedDraft,
      },
      {
        id: `assistant-${promptId}`,
        role: "assistant",
        content: DEMO_ASSISTANT_REPLY,
      },
    ]);
    setDraft("");
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    submitPrompt();
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
            {messages.length === 0 ? (
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
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-3 text-sm leading-6",
                        message.role === "user"
                          ? "border-2 border-brand/50 bg-accent-dim text-copy-primary"
                          : "border border-surface-border bg-elevated text-ai-text"
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="mt-4 shrink-0 rounded-2xl border border-surface-border bg-surface/80 p-3">
            <label htmlFor={textareaId} className="sr-only">
              Message Ghost AI
            </label>
            <Textarea
              id={textareaId}
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Describe the system you want Ghost AI to help design..."
              className="min-h-[72px] max-h-[160px] resize-none border-surface-border bg-base text-copy-primary placeholder:text-copy-faint"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0 text-[11px] leading-5 text-copy-faint">
                <span className="font-mono">Room {roomId}</span>
                <span className="mx-2 text-copy-faint/60">•</span>
                <span className="font-mono">Project {projectId}</span>
              </div>
              <Button
                type="button"
                onClick={submitPrompt}
                disabled={draft.trim().length === 0}
                className="gap-2 bg-ai text-white hover:bg-ai/85"
              >
                <SendHorizonal className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="specs" className="mt-4 flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-copy-primary">
                Technical Specs
              </p>
              <p className="text-xs text-copy-muted">
                Generate and review project documentation.
              </p>
            </div>
            <Button type="button" className="bg-ai text-white hover:bg-ai/85">
              Generate Spec
            </Button>
          </div>

          <div className="mt-4 rounded-2xl border border-surface-border bg-elevated p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-base">
                <FileText className="h-5 w-5 text-ai-text" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-copy-primary">
                  Checkout Service Architecture.md
                </p>
                <p className="mt-1 text-sm leading-6 text-copy-muted">
                  {DEMO_SPEC_SNIPPET}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-surface-border pt-4">
              <p className="text-xs text-copy-faint">
                Demo preview only. Downloads unlock in a later feature.
              </p>
              <Button type="button" variant="outline" size="sm" disabled>
                Download
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}

export default AiSidebar;
