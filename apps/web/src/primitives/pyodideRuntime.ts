const PYODIDE_VERSION = "0.26.4";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// Pyodide ships a large wasm runtime; loading it from a script tag pointed at
// the matching CDN version avoids bundling it (and its data files) through Vite.
declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

export interface PyProxy {
  toJs: (opts?: { create_proxies?: boolean }) => unknown;
}

export interface PyCallable {
  callKwargs: (kwargs: Record<string, unknown>) => PyProxy;
}

export interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackage: (names: string | string[]) => Promise<void>;
  setStdout: (opts: { batched: (msg: string) => void }) => void;
  setStderr: (opts: { batched: (msg: string) => void }) => void;
  globals: {
    get: (name: string) => unknown;
    set: (name: string, value: unknown) => void;
  };
}

let pyodidePromise: Promise<PyodideInterface> | null = null;

export function loadPyodideOnce(): Promise<PyodideInterface> {
  if (!pyodidePromise) {
    pyodidePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${PYODIDE_CDN}pyodide.js`;
      script.onload = () => {
        window.loadPyodide!({ indexURL: PYODIDE_CDN }).then(resolve, reject);
      };
      script.onerror = () => reject(new Error("Failed to load Pyodide from CDN"));
      document.head.appendChild(script);
    });
  }
  return pyodidePromise;
}
