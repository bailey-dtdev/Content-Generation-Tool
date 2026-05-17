import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/components/RequireAuth";
import { Login } from "@/routes/Login";

function Placeholder() {
  return (
    <div className="rounded-lg border bg-white p-6">
      <h1 className="text-lg font-semibold">Welcome</h1>
      <p className="mt-1 text-sm text-slate-500">
        The client registry and generation flow arrive in later build phases.
      </p>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Placeholder />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
