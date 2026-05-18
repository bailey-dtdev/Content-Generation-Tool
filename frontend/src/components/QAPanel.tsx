import type { QANote } from "@/api/generated";

const severityStyles: Record<string, string> = {
  error: "border-red-300 bg-red-50 text-red-800",
  warning: "border-amber-300 bg-amber-50 text-amber-800",
  info: "border-slate-300 bg-slate-50 text-slate-700",
};

const severityRank: Record<string, number> = { error: 0, warning: 1, info: 2 };

export function QAPanel({ notes }: { notes: QANote[] }) {
  if (notes.length === 0) {
    return (
      <aside className="rounded-lg border bg-white p-4 text-sm text-slate-500">
        No QA notes yet — run QA to review the content.
      </aside>
    );
  }

  const sorted = [...notes].sort(
    (a, b) => (severityRank[a.severity] ?? 3) - (severityRank[b.severity] ?? 3),
  );

  return (
    <aside className="space-y-2">
      <h2 className="text-sm font-semibold">QA notes ({notes.length})</h2>
      {sorted.map((note, index) => (
        <div
          key={index}
          className={`rounded-md border px-3 py-2 text-sm ${
            severityStyles[note.severity] ?? severityStyles.info
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold uppercase">{note.severity}</span>
            <span className="text-slate-500">{note.category}</span>
          </div>
          <p className="mt-0.5">{note.message}</p>
        </div>
      ))}
    </aside>
  );
}
