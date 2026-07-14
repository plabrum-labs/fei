import { Component, Suspense, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: (error: unknown) => ReactNode;
}

interface ErrorBoundaryState {
  error: unknown;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  render() {
    if (this.state.error) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}

export interface AsyncBoundaryProps {
  children: ReactNode;
  /** Defaults to a skeleton the height of a typical plot. */
  skeleton?: ReactNode;
}

/** Suspends until async children resolve and catches any load/run failure that escapes them. */
export function AsyncBoundary({ children, skeleton = <Skeleton className="h-[280px] w-full" /> }: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={(error) => <pre className="text-xs text-destructive">{String(error)}</pre>}>
      <Suspense fallback={skeleton}>{children}</Suspense>
    </ErrorBoundary>
  );
}
