import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ApiError, GenerationsService } from "@/api/generated";
import { OutlineEditor } from "@/components/OutlineEditor";
import { useGenerationStore } from "@/stores/generation";

export function GenerationOutline() {
  const { generationId } = useParams<{ generationId: string }>();
  const navigate = useNavigate();
  const generation = useGenerationStore((s) => s.generation);
  const outline = useGenerationStore((s) => s.outline);
  const setOutline = useGenerationStore((s) => s.setOutline);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const summaries = generation.competitor_summaries ?? [];
  const failedCount = summaries.filter((item) => "reason" in item).length;
  const sitemapCount = (generation.relevant_sitemap_urls ?? []).length;

  const runOutline = async (regenerate: boolean) => {
    setBusy(true);
    setError(null);
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
      setError(
        caught instanceof ApiError && caught.status === 409
          ? "You already have another active generation."
          : "Outline generation failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError(null);
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
    <div className="space-y-5">
      <h1 className="text-lg font-semibold">Outline</h1>

      <section className="rounded-lg border bg-white p-4 text-sm text-slate-600">
        <p>
          {summaries.length} competitor page(s) analysed
          {failedCount > 0 ? `, ${failedCount} could not be fetched` : ""}.
        </p>
        <p>{sitemapCount} internal link(s) selected from the sitemap.</p>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {outline.length === 0 ? (
        <button
          type="button"
          onClick={() => void runOutline(false)}
          disabled={busy}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {busy ? "Generating outline…" : "Generate outline"}
        </button>
      ) : (
        <OutlineEditor
          sections={outline}
          onSectionsChange={setOutline}
          onSave={() => void save()}
          onRegenerate={() => void runOutline(true)}
          onApprove={() => void approve()}
          busy={busy}
        />
      )}
    </div>
  );
}
