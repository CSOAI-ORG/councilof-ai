import type { ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { SectionLoader } from "./PageLoader";

/**
 * Gate authenticated app surfaces. Unauthed users go to /login with return path.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <SectionLoader />
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location || "/");
    return <Redirect to={`/login?next=${next}`} />;
  }

  return <>{children}</>;
}
