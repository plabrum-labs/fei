import type { ComponentType, ReactNode } from "react";

export interface ArticleModule {
  default: ComponentType;
}

export interface SlidesModule {
  slides: ReactNode[];
}
