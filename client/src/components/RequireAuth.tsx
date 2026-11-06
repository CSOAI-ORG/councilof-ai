import { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Redirect, useLocation } from "wouter";
import { councilLoginHref } from "@/lib/councilLoginReturn";

interface RequireAuthProps {
  children: ReactNode;
}

/** Get measured is free and needs no account. Other software routes stay gated. */
function isPublicMeasure(path: string): boolean {
  return path === "/assess" || path.startsWith("/assess/");
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (isPublicMeasure(location)) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div role="status" aria-label="Checking your session" className="flex min-h-[60vh] items-center justify-center">
        <div aria-hidden="true" className="animate-spin motion-reduce:animate-none rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to={councilLoginHref(location)} />;
  }

  return <>{children}</>;
}
