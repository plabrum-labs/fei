import { loadPyodideOnce, type PyodideInterface } from "@/primitives/pyodideRuntime";

/**
 * A React-Suspense resource: `.read()` throws the in-flight promise while
 * pending (suspending the nearest <Suspense>), throws the error on failure
 * (caught by the nearest error boundary), and returns the value once settled.
 */
export interface Resource<T> {
  read(): T;
}

function createResource<T>(promise: Promise<T>): Resource<T> {
  let status: "pending" | "success" | "error" = "pending";
  let result: T;
  let error: unknown;

  const suspender = promise.then(
    (value) => {
      status = "success";
      result = value;
    },
    (err) => {
      status = "error";
      error = err;
    },
  );

  return {
    read() {
      if (status === "pending") throw suspender;
      if (status === "error") throw error;
      return result;
    },
  };
}

/** Loads the shared Pyodide runtime, then loads `packages` and runs `code` once. */
export function createPyodideResource(code: string, packages: string[]): Resource<PyodideInterface> {
  const promise = loadPyodideOnce().then(async (pyodide) => {
    if (packages.length > 0) await pyodide.loadPackage(packages);
    await pyodide.runPythonAsync(code);
    return pyodide;
  });
  return createResource(promise);
}
