import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm " +
  "focus:border-slate-500 focus:outline-none";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
