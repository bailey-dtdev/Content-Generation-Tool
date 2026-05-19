import { useState } from "react";

import type { QANote } from "@/api/generated";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";

const SEVERITY_RANK: Record<string, number> = { error: 0, warning: 1, info: 2 };

type Filter = "all" | "error" | "warning" | "info";

export function QAPanel({
  notes,
  running,
}: {
  notes: QANote[];
  running?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  if (running) {
    return (
      <div className="qa-rail">
        <div className="qa-rail__head">
          <div className="qa-rail__title">QA</div>
          <Chip variant="aqua" dot>
            Running
          </Chip>
        </div>
        <div className="qa-rail__empty">
          Checking banned words, reading level, E-E-A-T, internal links and
          keyword usage…
        </div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="qa-rail">
        <div className="qa-rail__head">
          <div className="qa-rail__title">QA</div>
          <Chip variant="info">Not run</Chip>
        </div>
        <div className="qa-rail__empty">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--ink-8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              color: "var(--ink-4)",
            }}
          >
            <Icon name="check" size={20} stroke={2} />
          </div>
          <div style={{ fontWeight: 600, color: "var(--ink-2)", marginBottom: 4 }}>
            No QA notes yet
          </div>
          <div>
            Run QA once the content is generated to surface banned words,
            reading level, E-E-A-T and link issues.
          </div>
        </div>
      </div>
    );
  }

  const sorted = [...notes].sort(
    (a, b) =>
      (SEVERITY_RANK[String(a.severity)] ?? 3) -
      (SEVERITY_RANK[String(b.severity)] ?? 3),
  );
  const counts = notes.reduce<Record<string, number>>((acc, note) => {
    const key = String(note.severity);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const shown =
    filter === "all"
      ? sorted
      : sorted.filter((note) => String(note.severity) === filter);

  const filterButton = (key: Filter, label: string, count: number) => (
    <button
      type="button"
      className={`qa-rail__filter ${filter === key ? "is-active" : ""}`}
      onClick={() => setFilter(key)}
    >
      {key !== "all" ? <span className={`sev-dot sev-dot--${key}`} /> : null}
      {label} <span style={{ opacity: 0.6 }}>{count}</span>
    </button>
  );

  return (
    <div className="qa-rail">
      <div className="qa-rail__head">
        <div>
          <div className="qa-rail__title">QA</div>
          <div className="qa-rail__count">
            {notes.length} note{notes.length === 1 ? "" : "s"} · worst first
          </div>
        </div>
      </div>
      <div className="qa-rail__filters">
        {filterButton("all", "All", notes.length)}
        {filterButton("error", "Errors", counts.error ?? 0)}
        {filterButton("warning", "Warnings", counts.warning ?? 0)}
        {filterButton("info", "Info", counts.info ?? 0)}
      </div>
      <div className="qa-rail__list">
        {shown.map((note, index) => (
          <div key={index} className="qa-rail__item">
            <div className="qa-rail__item-head">
              <span className={`qa-rail__sev sev-${String(note.severity)}`}>
                {note.severity}
              </span>
              <span className="qa-rail__cat">{note.category}</span>
            </div>
            <div className="qa-rail__msg">{note.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
