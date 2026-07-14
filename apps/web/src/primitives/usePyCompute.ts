import { useEffect, useMemo, useRef, useState } from "react";
import { createPyodideResource } from "@/primitives/pyodideResource";
import type { PyCallable, PyodideInterface } from "@/primitives/pyodideRuntime";

/** Excludes "loading"/"error": those are handled by <AsyncBoundary> around this hook. */
export type PyStatus = "ready" | "running";

export interface UsePyComputeOptions {
  /** Defines a `compute(...)` function whose keyword arguments match `params` and that returns a list of [x, y] pairs. */
  code: string;
  params: Record<string, number>;
  packages?: string[];
}

export interface UsePyComputeResult {
  source: string;
  setSource: (source: string) => void;
  data: Array<{ x: number; y: number }>;
  status: PyStatus;
  runError: string | null;
  isDirty: boolean;
  runCode: () => void;
  resetCode: () => void;
}

/** Suspends (via <AsyncBoundary>) until Pyodide is loaded and `code` has run once. */
export function usePyCompute({ code, params, packages = [] }: UsePyComputeOptions): UsePyComputeResult {
  const resource = useMemo(() => createPyodideResource(code, packages), [code, JSON.stringify(packages)]);
  const pyodide = resource.read();

  const [source, setSource] = useState(code);
  const pyodideRef = useRef<PyodideInterface>(pyodide);
  const [data, setData] = useState<Array<{ x: number; y: number }>>([]);
  const [status, setStatus] = useState<PyStatus>("ready");
  const [runError, setRunError] = useState<string | null>(null);

  const recompute = () => {
    try {
      const compute = pyodideRef.current.globals.get("compute") as PyCallable;
      const result = compute.callKwargs(params);
      const pairs = result.toJs() as Array<[number, number]>;
      setData(pairs.map(([x, y]) => ({ x, y })));
      setRunError(null);
    } catch (err) {
      setRunError(String(err));
    }
  };

  useEffect(() => {
    recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  const execute = async (src: string) => {
    setStatus("running");
    try {
      await pyodideRef.current.runPythonAsync(src);
      recompute();
    } catch (err) {
      setRunError(String(err));
    }
    setStatus("ready");
  };

  return {
    source,
    setSource,
    data,
    status,
    runError,
    isDirty: source !== code,
    runCode: () => execute(source),
    resetCode: () => {
      setSource(code);
      execute(code);
    },
  };
}
