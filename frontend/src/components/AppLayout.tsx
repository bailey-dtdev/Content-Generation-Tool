import { Link, Outlet } from "react-router-dom";

import { useAuthStore } from "@/stores/auth";

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <span className="font-semibold">Content Generation Platform</span>
          <nav className="flex gap-3 text-sm text-slate-600">
            <Link to="/clients" className="hover:text-slate-900">
              Clients
            </Link>
            <Link to="/generations/new" className="hover:text-slate-900">
              New generation
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">{user?.email}</span>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-md border px-3 py-1 hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
