import { LockKeyhole } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-6 text-center">
      <div className="flex max-w-md flex-col items-center gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-border bg-surface text-copy-secondary">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-normal text-copy-primary">
            Access denied
          </h1>
          <p className="text-sm leading-6 text-copy-muted">
            This project does not exist or you do not have permission to open
            it.
          </p>
        </div>
        <Button asChild>
          <Link href="/editor">Back to editor</Link>
        </Button>
      </div>
    </main>
  );
}
