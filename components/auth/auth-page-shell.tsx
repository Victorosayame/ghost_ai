import { BrainCircuit, ScrollText, Share2 } from "lucide-react";
import type { ReactNode } from "react";

interface AuthPageShellProps {
  children: ReactNode;
  mode: "sign-in" | "sign-up";
}

const authCopy = {
  "sign-in": {
    tagline: "Return to your architecture workspace.",
    body: "Map systems, collaborate in real time, and turn canvas decisions into durable technical specs.",
  },
  "sign-up": {
    tagline: "Start designing systems with Ghost AI.",
    body: "Create shared architecture projects, import starter designs, and guide AI-assisted system planning from one focused workspace.",
  },
};

const features = [
  {
    icon: BrainCircuit,
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Share2,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: ScrollText,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export function AuthPageShell({ children, mode }: AuthPageShellProps) {
  const copy = authCopy[mode];

  return (
    <main className="flex min-h-screen bg-base">
      <div className="hidden w-1/2 flex-col border-r border-surface-border bg-surface lg:flex">
        <div className="px-12 pt-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand">
              <span
                className="text-xs font-bold leading-none text-primary-foreground"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                G
              </span>
            </div>
            <span className="text-sm font-semibold text-copy-primary">
              Ghost AI
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-12 py-16">
          <h1 className="mb-5 text-4xl font-bold leading-tight text-copy-primary">
            {copy.tagline}
          </h1>
          <p className="mb-12 max-w-sm text-base leading-relaxed text-copy-secondary">
            {copy.body}
          </p>

          <ul className="space-y-7">
            {features.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-dim">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-snug text-copy-primary">
                    {title}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-copy-muted">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="px-12 pb-10 text-xs text-copy-faint">
          Collaborative system design.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-base p-8 lg:w-1/2">
        {children}
      </div>
    </main>
  );
}
