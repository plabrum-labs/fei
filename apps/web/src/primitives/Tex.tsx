import katex from "katex";
import { useMemo } from "react";

export function Tex({ expr, block = false }: { expr: string; block?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(expr, { throwOnError: false, displayMode: block }),
    [expr, block],
  );

  const Tag = block ? "div" : "span";
  // katex.renderToString output is trusted markup, not user input.
  return <Tag dangerouslySetInnerHTML={{ __html: html }} />;
}
