"use client";

import { UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen, Share2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  className?: string;
  centerContent?: ReactNode;
  isAiSidebarOpen?: boolean;
  onToggleAiSidebar?: () => void;
  onOpenShareDialog?: () => void;
  actions?: ReactNode;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  className,
  centerContent,
  isAiSidebarOpen = false,
  onToggleAiSidebar,
  onOpenShareDialog,
}: EditorNavbarProps) {
  const SidebarIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <header
      className={cn(
        "relative z-30 grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-surface-border bg-surface px-4",
        className
      )}
    >
      <div className="flex min-w-0 items-center justify-start">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close project sidebar" : "Open project sidebar"}
          aria-pressed={isSidebarOpen}
          className="text-copy-secondary hover:bg-subtle hover:text-copy-primary"
        >
          <SidebarIcon className="h-5 w-5" />
        </Button>
      </div>

      {centerContent && (
        <div className="min-w-0 text-sm font-medium text-copy-primary">
          {centerContent} Workspace
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        {onToggleAiSidebar ? (
          <>
            {onOpenShareDialog ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onOpenShareDialog}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            ) : null}
            <Button
              variant={isAiSidebarOpen ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={onToggleAiSidebar}
            >
              <Sparkles className="h-4 w-4" />
              AI
            </Button>
          </>
        ) : null}

        {!onToggleAiSidebar ? <UserButton /> : null}
      </div>
    </header>
  );
}
