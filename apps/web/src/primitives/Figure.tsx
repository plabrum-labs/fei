import type { ReactNode } from "react";

export interface FigureProps {
  caption: ReactNode;
  children: ReactNode;
}

export function Figure({ caption, children }: FigureProps) {
  return (
    <figure className="my-6">
      {children}
      <figcaption className="mt-2 text-sm text-gray-500">{caption}</figcaption>
    </figure>
  );
}
