import { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Redirect, useLocation } from "wouter";

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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}
