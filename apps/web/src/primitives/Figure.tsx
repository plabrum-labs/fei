import type { ReactNode } from "react";

export interface FigureProps {
  caption: ReactNode;
  children: ReactNode;
}

export function Figure({ caption, children }: FigureProps) {
  return (
    <figure className="my-10">
      {children}
      <figcaption className="mt-3 text-center font-mono text-xs text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}
