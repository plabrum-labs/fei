import type { ReactNode } from "react";

export function Cite({ children }: { children: ReactNode }) {
  return <cite className="not-italic text-gray-500">({children})</cite>;
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="my-4 border-l-4 border-blue-400 bg-blue-50 px-4 py-2">{children}</div>
  );
}
