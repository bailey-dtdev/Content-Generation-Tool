import { API_BASE } from "@/lib/http";

export function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Content Generation Platform</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">
          Sign in with your digitaltreasury.com.au Google account.
        </p>
        <a
          href={`${API_BASE}/api/v1/auth/login`}
          className="block rounded-md bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-800"
        >
          Sign in with Google
        </a>
      </div>
    </div>
  );
}
