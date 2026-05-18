import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { GenerationsService } from "@/api/generated";
import { ContentEditor } from "@/components/ContentEditor";
import { QAPanel } from "@/components/QAPanel";
import { streamPost } from "@/lib/sse";
import { htmlToText, textToHtml } from "@/lib/utils";
import { useGenerationStore } from "@/stores/generation";

type Mode = "sequential" | "single_call";

interface StreamEventData {
  section_id?: string;
  heading?: string;
  text?: string;
  message?: string;
  total_cost_usd?: string;
}

const severityColor: Record<string, string> = {
  error: "text-red-600",
  warning: "text-amber-600",
  info: "text-slate-500",
};

export function GenerationContent() {
  const { generationId } = useParams<{ generationId: string }>();
  const generation = useGenerationStore((s) => s.generation);
  const content = useGenerationStore((s) => s.content);
  const qaNotes = useGenerationStore((s) => s.qaNotes);
  const startSection = useGenerationStore((s) => s.startSection);
  const appendDelta = useGenerationStore((s) => s.appendDelta);
  const setSectionHtml = useGenerationStore((s) => s.setSectionHtml);
  const setQaNotes = useGenerationStore((s) => s.setQaNotes);

  const [mode, setMode] = useState<Mode>("sequential");
  const [streaming, setStreaming] = useState(false);
  const [qaRunning, setQaRunning] = useState(false);
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});
  const [totalCost, setTotalCost] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (!generation || generation.id !== generationId) {
    return (
      <p className="text-sm text-slate-500">
        No active generation in this session.{" "}
        <Link to="/generations/new" className="text-blue-600 hover:underline">
          Start a new one
        </Link>
        .
      </p>
    );
  }

  const handleEvent = (event: string, data: unknown) => {
    const payload = data as StreamEventData;
    const sectionId = payload.section_id ?? "";
    if (event === "section_start") {
      startSection(sectionId, payload.heading ?? "Section");
      setSectionErrors((prev) => {
        const next = { ...prev };
        delete next[sectionId];
        return next;
      });
    } else if (event === "delta") {
      appendDelta(sectionId, payload.text ?? "");
    } else if (event === "error") {
      setSectionErrors((prev) => ({
        ...prev,
        [sectionId]: payload.message ?? "Section generation failed.",
      }));
    } else if (event === "generation_complete") {
      setTotalCost(payload.total_cost_usd ?? null);
    }
  };

  const run = (path: string, body: unknown) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    void streamPost(
      path,
      body,
      {
        onEvent: handleEvent,
        onError: () => setStreaming(false),
        onDone: () => setStreaming(false),
      },
      controller.signal,
    );
  };

  const generate = () => {
    setTotalCost(null);
    setQaNotes([]);
    run(`/api/v1/generations/${generation.id}/content/stream`, { mode });
  };

  const retrySection = (sectionId: string) => {
    run(`/api/v1/generations/${generation.id}/content/retry-section`, {
      section_id: sectionId,
    });
  };

  const runQa = async () => {
    setQaRunning(true);
    try {
      const result = await GenerationsService.generationsRunQa({
        generationId: generation.id,
        requestBody: {
          sections: Object.entries(content).map(([sectionId, section]) => ({
            section_id: sectionId,
            content: section.html ? htmlToText(section.html) : section.text,
          })),
        },
      });
      setQaNotes(result.notes);
    } finally {
      setQaRunning(false);
    }
  };

  const sections = Object.entries(content);

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold">Content</h1>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1 text-sm">
          <input
            type="radio"
            name="mode"
            checked={mode === "sequential"}
            onChange={() => setMode("sequential")}
          />
          Sequential (per section)
        </label>
        <label className="flex items-center gap-1 text-sm">
          <input
            type="radio"
            name="mode"
            checked={mode === "single_call"}
            onChange={() => setMode("single_call")}
          />
          Single call
        </label>
        <button
          type="button"
          onClick={generate}
          disabled={streaming}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {streaming
            ? "Generating…"
            : sections.length
              ? "Regenerate"
              : "Generate content"}
        </button>
        <button
          type="button"
          onClick={() => void runQa()}
          disabled={streaming || qaRunning || sections.length === 0}
          className="rounded-md border px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
        >
          {qaRunning ? "Running QA…" : "Run QA"}
        </button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 space-y-4">
          {sections.map(([sectionId, section]) => {
            const sectionNotes = qaNotes.filter((n) => n.section_id === sectionId);
            return (
              <section key={sectionId} className="space-y-2">
                <h2 className="font-medium">{section.heading}</h2>
                {streaming ? (
                  <div className="whitespace-pre-wrap rounded-lg border bg-white p-4 text-sm text-slate-700">
                    {section.text || <span className="text-slate-400">…</span>}
                  </div>
                ) : (
                  <ContentEditor
                    initialHtml={section.html ?? textToHtml(section.text)}
                    onChange={(html) => setSectionHtml(sectionId, html)}
                  />
                )}
                {sectionErrors[sectionId] ? (
                  <div className="flex items-center gap-3 text-sm text-red-600">
                    <span>{sectionErrors[sectionId]}</span>
                    <button
                      type="button"
                      onClick={() => retrySection(sectionId)}
                      disabled={streaming}
                      className="rounded border px-2 py-0.5 text-slate-700 hover:bg-slate-100"
                    >
                      Retry section
                    </button>
                  </div>
                ) : null}
                {sectionNotes.length > 0 ? (
                  <ul className="space-y-0.5 text-xs">
                    {sectionNotes.map((note, index) => (
                      <li key={index} className={severityColor[note.severity] ?? ""}>
                        [{note.severity}] {note.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
          {totalCost !== null ? (
            <p className="text-sm text-slate-500">
              Generation complete — estimated cost ${totalCost}.
            </p>
          ) : null}
        </div>

        <div className="w-72 shrink-0">
          <QAPanel notes={qaNotes} />
        </div>
      </div>
    </div>
  );
}
