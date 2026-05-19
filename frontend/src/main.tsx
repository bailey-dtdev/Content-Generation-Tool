import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./lib/http";
import { App } from "./App";
import { initSentry, Sentry } from "./lib/sentry";
import "./index.css";

initSentry();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={<p className="p-8 text-sm text-slate-600">Something went wrong.</p>}
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
