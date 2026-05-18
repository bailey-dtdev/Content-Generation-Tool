import { useCallback, useEffect, useState } from "react";

import { SitemapsService, type SitemapResponse } from "@/api/generated";
import { inputClass } from "@/components/ui/Field";
import { uploadSitemap } from "@/lib/http";

export function SitemapUpload({ clientId }: { clientId: string }) {
  const [sitemap, setSitemap] = useState<SitemapResponse | null>(null);
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSitemap = useCallback(() => {
    SitemapsService.sitemapsGetSitemap({ clientId })
      .then(setSitemap)
      .catch(() => setSitemap(null));
  }, [clientId]);

  useEffect(() => {
    loadSitemap();
  }, [loadSitemap]);

  const uploadFile = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      setSitemap(await uploadSitemap(clientId, { file }));
    } catch {
      setError("Could not parse that file as an XML sitemap.");
    } finally {
      setBusy(false);
    }
  };

  const uploadPasted = async () => {
    if (!pasted.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setSitemap(await uploadSitemap(clientId, { pastedUrls: pasted }));
      setPasted("");
    } catch {
      setError("Could not save those URLs.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-lg border bg-white p-4">
      <h2 className="text-sm font-semibold">Sitemap</h2>
      <p className="text-sm text-slate-500">
        {sitemap
          ? `${sitemap.urls.length} URL(s) from the ${sitemap.source_type} upload.`
          : "No sitemap uploaded yet."}
      </p>

      <div>
        <span className="block text-sm font-medium text-slate-700">
          Upload XML sitemap
        </span>
        <input
          type="file"
          accept=".xml,application/xml,text/xml"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadFile(file);
          }}
          className="mt-1 text-sm"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-slate-700">
          Or paste URLs (one per line)
        </span>
        <textarea
          rows={4}
          value={pasted}
          onChange={(event) => setPasted(event.target.value)}
          className={`mt-1 ${inputClass}`}
        />
        <button
          type="button"
          onClick={() => void uploadPasted()}
          disabled={busy || !pasted.trim()}
          className="mt-2 rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-50"
        >
          Save pasted URLs
        </button>
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </section>
  );
}
