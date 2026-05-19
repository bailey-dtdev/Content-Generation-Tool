import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { GenerationsService } from "@/api/generated";
import { ContentEditor } from "@/components/ContentEditor";
import { CostBadge } from "@/components/CostBadge";
import { QAPanel } from "@/components/QAPanel";
import { Stepper } from "@/components/Stepper";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
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

const TYPE_LABEL: Record<string, string> = {
  service_page: "Service page",
  plp: "Product listing page",
  pdp: "Product detail page",
  blog: "Blog post",
};

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

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
  const [streamingSectionId, setStreamingSectionId] = useState<string | null>(null);
  const [qaRunning, setQaRunning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [usageVersion, setUsageVersion] = useState(0);
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (!generation || generation.id !== generationId) {
    return (
      <div className="main__body">
        <p style={{ fontSize: 13, color: "var(--ink-5)" }}>
          No active generation in this session.{" "}
          <Link to="/generations/new" style={{ color: "var(--ink-1)" }}>
            Start a new one
          </Link>
          .
        </p>
      </div>
    );
  }

  const keyword = String(generation.input.primary_keyword ?? "");
  const intent = String(generation.input.search_intent ?? "");
  const wordTarget = String(generation.input.target_word_count ?? "");

  const handleEvent = (event: string, data: unknown) => {
    const payload = data as StreamEventData;
    const sectionId = payload.section_id ?? "";
    if (event === "section_start") {
      startSection(sectionId, payload.heading ?? "Section");
      setStreamingSectionId(sectionId);
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
      setStreamingSectionId(null);
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
        onError: () => {
          setStreaming(false);
          setStreamingSectionId(null);
        },
        onDone: () => {
          setStreaming(false);
          setStreamingSectionId(null);
          setUsageVersion((version) => version + 1);
        },
      },
      controller.signal,
    );
  };

  const generate = () => {
    setDocUrl(null);
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
      setUsageVersion((version) => version + 1);
    } finally {
      setQaRunning(false);
    }
  };

  const exportDoc = async () => {
    setExporting(true);
    try {
      const result = await GenerationsService.generationsExportGeneration({
        generationId: generation.id,
        requestBody: {
          sections: Object.entries(content).map(([sectionId, section]) => ({
            section_id: sectionId,
            heading: section.heading,
            content_html: section.html ?? textToHtml(section.text),
          })),
        },
      });
      setDocUrl(result.doc_url);
    } finally {
      setExporting(false);
    }
  };

  const sections = Object.entries(content);
  const hasContent = sections.length > 0;

  return (
    <>
      <div className="main__head">
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-5)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>Generations</span>
          <Icon name="chevron-right" size={12} />
          <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>{keyword}</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 className="page-title">Content</h1>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              <Chip variant="dark">
                {TYPE_LABEL[generation.content_type] ?? generation.content_type}
              </Chip>
              {intent ? <Chip variant="outline">{intent} intent</Chip> : null}
              {wordTarget ? (
                <Chip variant="outline">{wordTarget} words target</Chip>
              ) : null}
            </div>
          </div>
          <Stepper current={2} />
        </div>
      </div>

      <div
        className="main__body"
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div className="control-bar">
          <div className="control-bar__group">
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: "var(--ink-5)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Mode
            </span>
            <div className="radio-seg">
              <button
                type="button"
                className={mode === "sequential" ? "is-active" : ""}
                onClick={() => setMode("sequential")}
              >
                <Icon name="list" size={13} />
                Sequential
              </button>
              <button
                type="button"
                className={mode === "single_call" ? "is-active" : ""}
                onClick={() => setMode("single_call")}
              >
                <Icon name="send" size={13} />
                Single call
              </button>
            </div>
          </div>
          <div className="control-bar__sep" />
          <div className="control-bar__group">
            <Button
              variant="primary"
              size="sm"
              icon={streaming ? "circle-dot" : "sparkles"}
              disabled={streaming}
              onClick={generate}
            >
              {streaming
                ? "Generating…"
                : hasContent
                  ? "Regenerate"
                  : "Generate content"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={qaRunning ? "circle-dot" : "check"}
              disabled={!hasContent || streaming || qaRunning}
              onClick={() => void runQa()}
            >
              {qaRunning ? "Running QA…" : "Run QA"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={exporting ? "circle-dot" : "google-docs"}
              disabled={!hasContent || streaming || exporting}
              onClick={() => void exportDoc()}
            >
              {exporting ? "Exporting…" : "Export to Docs"}
            </Button>
          </div>
          <div className="control-bar__spacer" />
          <CostBadge generationId={generation.id} refreshKey={usageVersion} />
        </div>

        {docUrl ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 18px",
              background: "var(--aqua-soft)",
              border: "1px solid var(--aqua)",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--ink-10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "0 0 auto",
              }}
            >
              <Icon name="check" size={16} stroke={2.5} />
            </div>
            <div style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>
              Exported to Google Docs
            </div>
            <a
              href={docUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn--primary btn--sm"
              style={{ textDecoration: "none" }}
            >
              Open the Google Doc
              <Icon name="external" />
            </a>
          </div>
        ) : null}

        {streaming ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 18px",
              background: "var(--ink-1)",
              borderRadius: 12,
              color: "var(--ink-10)",
            }}
          >
            <span className="section-status__pulse" />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
              Streaming content…
            </div>
          </div>
        ) : null}

        <div className="ws">
          <div className="ws__main">
            {!hasContent ? (
              <div className="empty" style={{ padding: "90px 24px" }}>
                <div className="empty__icon">
                  <Icon name="sparkles" size={26} stroke={1.5} />
                </div>
                <div className="empty__h">Ready to generate</div>
                <div className="empty__p">
                  Sequential mode streams each section in turn so you can spot
                  drift early. Single call returns the whole draft at once.
                </div>
                <Button variant="primary" size="lg" icon="sparkles" onClick={generate}>
                  Generate content
                </Button>
              </div>
            ) : (
              sections.map(([sectionId, section], index) => {
                const plain = section.html
                  ? htmlToText(section.html)
                  : section.text;
                const sectionNotes = qaNotes.filter(
                  (note) => note.section_id === sectionId,
                );
                const errored = Boolean(sectionErrors[sectionId]);
                const isStreaming = streamingSectionId === sectionId;
                const status = errored
                  ? "error"
                  : isStreaming
                    ? "streaming"
                    : "done";
                return (
                  <div key={sectionId} className="section-card">
                    <div className="section-card__head">
                      <div className="section-card__h-left">
                        <div className="section-card__num">{index + 1}</div>
                        <div>
                          <div className="section-card__h">{section.heading}</div>
                          <div className="section-card__meta">
                            <span>
                              <strong>{wordCount(plain)}</strong> words
                            </span>
                            {sectionNotes.length ? (
                              <>
                                <span>·</span>
                                <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>
                                  {sectionNotes.length} QA note
                                  {sectionNotes.length === 1 ? "" : "s"}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className={`section-status section-status--${status}`}>
                        <span className="section-status__pulse" />
                        <span>
                          {status === "streaming"
                            ? "Streaming"
                            : status === "error"
                              ? "Failed"
                              : "Done"}
                        </span>
                      </div>
                    </div>

                    {errored ? (
                      <div
                        style={{
                          padding: "18px 24px",
                          display: "flex",
                          gap: 14,
                          alignItems: "flex-start",
                          background: "rgba(198,56,56,0.04)",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: "rgba(198,56,56,0.12)",
                            color: "var(--status-danger)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: "0 0 auto",
                          }}
                        >
                          <Icon name="alert" size={15} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              marginBottom: 4,
                            }}
                          >
                            {sectionErrors[sectionId]}
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon="refresh"
                            disabled={streaming}
                            onClick={() => retrySection(sectionId)}
                          >
                            Retry section
                          </Button>
                        </div>
                      </div>
                    ) : streaming ? (
                      <div className="prose">
                        {section.text || (
                          <span className="placeholder">Waiting…</span>
                        )}
                        {isStreaming ? <span className="caret" /> : null}
                      </div>
                    ) : (
                      <ContentEditor
                        initialHtml={section.html ?? textToHtml(section.text)}
                        onChange={(html) => setSectionHtml(sectionId, html)}
                      />
                    )}

                    {sectionNotes.length > 0 ? (
                      <div className="section-qa">
                        {sectionNotes.map((note, noteIndex) => (
                          <div
                            key={noteIndex}
                            className={`section-qa__row sev-${String(note.severity)}`}
                          >
                            <div
                              className={`section-qa__sev-bar sev-${String(note.severity)}`}
                            />
                            <div style={{ flex: 1 }}>
                              <div className="section-qa__cat">
                                {note.severity} · {note.category}
                              </div>
                              <div className="section-qa__msg">{note.message}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          {hasContent ? (
            <div className="ws__qa">
              <QAPanel notes={qaNotes} running={qaRunning} />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
