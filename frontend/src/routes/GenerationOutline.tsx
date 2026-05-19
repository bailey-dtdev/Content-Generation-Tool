import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ApiError, GenerationsService } from "@/api/generated";
import { OutlineEditor } from "@/components/OutlineEditor";
import { Stepper } from "@/components/Stepper";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useGenerationStore } from "@/stores/generation";

export function GenerationOutline() {
  const { generationId } = useParams<{ generationId: string }>();
  const navigate = useNavigate();
  const generation = useGenerationStore((s) => s.generation);
  const outline = useGenerationStore((s) => s.outline);
  const setOutline = useGenerationStore((s) => s.setOutline);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const keyword = String(generation.input.primary_keyword ?? "Generation");
  const summaries = generation.competitor_summaries ?? [];
  const failed = summaries.filter((item) => "reason" in item).length;
  const sitemapCount = (generation.relevant_sitemap_urls ?? []).length;

  const runOutline = async (regenerate: boolean) => {
    setBusy(true);
    setError(null);
    setConflict(false);
    try {
      const sections = regenerate
        ? await GenerationsService.generationsRegenerateOutline({
            generationId: generation.id,
          })
        : await GenerationsService.generationsGenerateOutline({
            generationId: generation.id,
          });
      setOutline(sections);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        setConflict(true);
      } else {
        setError("Outline generation failed. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await GenerationsService.generationsSaveOutline({
        generationId: generation.id,
        requestBody: { sections: outline },
      });
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    setBusy(true);
    setError(null);
    try {
      await GenerationsService.generationsSaveOutline({
        generationId: generation.id,
        requestBody: { sections: outline },
      });
      await GenerationsService.generationsApproveOutline({
        generationId: generation.id,
      });
      navigate(`/generations/${generation.id}/content`);
    } catch {
      setError("Could not approve the outline. Please try again.");
    } finally {
      setBusy(false);
    }
  };

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
            <h1 className="page-title">Outline review</h1>
            <p className="page-sub">
              Review the section plan before we generate the full content.
            </p>
          </div>
          <Stepper current={1} />
        </div>
      </div>

      <div
        className="main__body"
        style={{ display: "flex", flexDirection: "column", gap: 20 }}
      >
        <div
          className="research"
          style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
        >
          <div className="research__stat">
            <div className="research__label">Competitors analysed</div>
            <div className="research__val">
              {summaries.length - failed}
              <span className="research__val-sub">
                of {summaries.length} submitted
              </span>
            </div>
            <div className={`research__detail ${failed > 0 ? "is-warn" : ""}`}>
              {failed > 0
                ? `${failed} page(s) failed to fetch`
                : "All competitor pages fetched"}
            </div>
          </div>
          <div className="research__stat">
            <div className="research__label">Internal links picked</div>
            <div className="research__val">
              {sitemapCount}
              <span className="research__val-sub">from the client sitemap</span>
            </div>
            <div className="research__detail">
              Ranked by topical match to the primary keyword
            </div>
          </div>
        </div>

        {conflict ? (
          <div
            style={{
              display: "flex",
              gap: 14,
              background: "rgba(198,56,56,0.05)",
              border: "1px solid rgba(198,56,56,0.25)",
              borderRadius: 12,
              padding: "16px 18px",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "var(--status-danger)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "0 0 auto",
              }}
            >
              <Icon name="alert" size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>
                Can't start — you have another generation in progress
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>
                Only one generation can run at a time per user. Finish or abort
                the active one, then try again here.
              </div>
            </div>
          </div>
        ) : null}
        {error ? (
          <p style={{ fontSize: 13, color: "var(--status-danger)" }}>{error}</p>
        ) : null}

        {outline.length === 0 ? (
          <div className="empty">
            <div className="empty__icon">
              <Icon name="sparkles" size={26} stroke={1.5} />
            </div>
            <div className="empty__h">Ready to draft the outline</div>
            <div className="empty__p">
              Content Studio will read the competitor pages and pick internal
              links, then propose a section plan you can edit.
            </div>
            <Button
              variant="primary"
              size="lg"
              icon="sparkles"
              disabled={busy}
              onClick={() => void runOutline(false)}
            >
              {busy ? "Generating…" : "Generate outline"}
            </Button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div>
                <div className="card__title" style={{ fontSize: 16 }}>
                  Proposed sections
                </div>
                <div className="card__sub" style={{ marginTop: 4 }}>
                  Drag to reorder · click any field to edit · {outline.length}{" "}
                  sections
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon="plus"
                  onClick={() =>
                    setOutline([
                      ...outline,
                      {
                        section_id: crypto.randomUUID(),
                        heading: "New section",
                        blurb: "",
                      },
                    ])
                  }
                >
                  Add section
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon="refresh"
                  disabled={busy}
                  onClick={() => void runOutline(true)}
                >
                  Regenerate
                </Button>
              </div>
            </div>

            <OutlineEditor sections={outline} onSectionsChange={setOutline} />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 18px",
                background: "var(--ink-10)",
                border: "1px solid var(--ink-7)",
                borderRadius: 14,
                position: "sticky",
                bottom: 16,
                boxShadow: "var(--shadow-2)",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--ink-4)" }}>
                {outline.length} sections ready
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="ghost" disabled={busy} onClick={() => void save()}>
                  Save edits
                </Button>
                <Button
                  variant="primary"
                  iconRight="arrow-right"
                  disabled={busy}
                  onClick={() => void approve()}
                >
                  Approve &amp; continue
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
