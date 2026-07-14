import { useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { loadPyodideOnce, type PyodideInterface } from "@/primitives/pyodideRuntime";
import { editorTheme } from "@/primitives/codeMirrorTheme";
import { Button } from "@/components/ui/button";

export interface PyReplProps {
  code: string;
}

export function PyRepl({ code: initialCode }: PyReplProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "running">("loading");
  const pyodideRef = useRef<PyodideInterface | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadPyodideOnce().then((pyodide) => {
      if (cancelled) return;
      pyodide.setStdout({ batched: (msg) => setOutput((prev) => [...prev, msg]) });
      pyodide.setStderr({ batched: (msg) => setOutput((prev) => [...prev, msg]) });
      pyodideRef.current = pyodide;
      setStatus("ready");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const run = async () => {
    const pyodide = pyodideRef.current;
    if (!pyodide) return;
    setOutput([]);
    setStatus("running");
    try {
      await pyodide.runPythonAsync(code);
    } catch (err) {
      setOutput((prev) => [...prev, String(err)]);
    }
    setStatus("ready");
  };

  const reset = () => {
    setCode(initialCode);
    setOutput([]);
  };

  return (
    <div className="rounded-lg border border-border font-mono text-sm">
      <CodeMirror
        value={code}
        height="auto"
        extensions={[python(), editorTheme]}
        onChange={setCode}
      />
      <div className="flex items-center gap-3 border-t border-border bg-muted px-3 py-2">
        <Button size="sm" onClick={run} disabled={status !== "ready"}>
          {status === "loading" ? "Loading Python…" : status === "running" ? "Running…" : "Run"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={reset}
          disabled={status === "running" || (code === initialCode && output.length === 0)}
        >
          Reset
        </Button>
      </div>
      {output.length > 0 && (
        <pre className="whitespace-pre-wrap border-t border-border px-3 py-2 text-xs text-muted-foreground">
          {output.join("\n")}
        </pre>
      )}
    </div>
  );
}
