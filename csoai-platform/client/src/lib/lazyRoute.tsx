import { lazy, Suspense, ComponentType } from "react";

/**
 * Lazy route helper — wraps a dynamic import in React.lazy + a small default
 * skeleton fallback. Use as a drop-in for `component={Foo}` in wouter <Route>.
 *
 * `importPath` should be a path RELATIVE to /client/src (vite resolves
 * via the @/pages alias).
 */
export function lazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const Lazy = lazy(importFn);
  const Wrapped: ComponentType<any> = (props) => (
    <Suspense fallback={<RouteSkeleton />}>
      <Lazy {...props} />
    </Suspense>
  );
  Wrapped.displayName = `LazyRoute(${(importFn as any).name || "anonymous"})`;
  return Wrapped;
}

export function RouteSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "hsl(var(--background))",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid hsl(var(--muted))",
            borderTopColor: "hsl(var(--primary))",
            borderRadius: "50%",
            animation: "sov-spin 0.8s linear infinite",
          }}
        />
        <div style={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }}>
          Loading sovereign route…
        </div>
        <style>{`@keyframes sov-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
