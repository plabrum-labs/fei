import type { ReactNode } from "react";

export function Cite({ children }: { children: ReactNode }) {
  return <cite className="not-italic text-muted-foreground">({children})</cite>;
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 border-l-2 border-accent bg-accent/5 px-5 py-3">{children}</div>
  );
}
