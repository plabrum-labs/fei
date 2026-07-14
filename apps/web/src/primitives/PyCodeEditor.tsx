import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { ChevronRight } from "lucide-react";
import { editorTheme } from "@/primitives/codeMirrorTheme";
import type { PyStatus } from "@/primitives/usePyCompute";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PyCodeEditorProps {
  source: string;
  onSourceChange: (source: string) => void;
  status: PyStatus;
  runError: string | null;
  isDirty: boolean;
  onRun: () => void;
  onReset: () => void;
}

export function PyCodeEditor({
  source,
  onSourceChange,
  status,
  runError,
  isDirty,
  onRun,
  onReset,
}: PyCodeEditorProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setShowCode((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className={cn("size-3.5 transition-transform", showCode && "rotate-90")} />
        Code
      </button>
      {showCode && (
        <div className="overflow-hidden rounded-lg border border-border font-mono text-sm">
          <CodeMirror
            value={source}
            height="auto"
            onChange={onSourceChange}
            extensions={[python(), editorTheme]}
          />
          <div className="flex items-center gap-3 border-t border-border bg-muted px-3 py-2">
            <Button size="sm" onClick={onRun} disabled={status === "running"}>
              {status === "running" ? "Running…" : "Run"}
            </Button>
            <Button size="sm" variant="outline" onClick={onReset} disabled={status === "running" || !isDirty}>
              Reset
            </Button>
          </div>
        </div>
      )}
      {runError && <pre className="whitespace-pre-wrap text-xs text-destructive">{runError}</pre>}
    </div>
  );
}
