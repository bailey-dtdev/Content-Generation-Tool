// Browser-side error tracking. Inert unless VITE_SENTRY_DSN is set, so local
// dev and tests report nothing. See architecture-design.md §13.2.
import * as Sentry from "@sentry/react";

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({ dsn, environment: "production" });
}

export { Sentry };
