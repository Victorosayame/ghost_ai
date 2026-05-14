import { EditorLayout } from "@/components/editor/editor-layout";

export default function EditorPage() {
  return (
    <EditorLayout navbarCenterContent="Untitled architecture">
      <div className="flex h-full items-center justify-center px-6 text-center">
        <p className="max-w-sm text-sm text-copy-muted">
          Project canvas will appear here as the editor workspace comes online.
        </p>
      </div>
    </EditorLayout>
  );
}
