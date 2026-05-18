import { type ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";

import { useAuthStore } from "@/stores/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    if (status === "unknown") {
      void fetchMe();
    }
  }, [status, fetchMe]);

  if (status === "unknown") {
    return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  }
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
