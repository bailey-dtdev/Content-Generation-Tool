import { useCallback, useEffect, useRef, useState } from "react";

import { SitemapsService, type SitemapResponse } from "@/api/generated";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { uploadSitemap } from "@/lib/http";

export function SitemapUpload({ clientId }: { clientId: string }) {
  const [sitemap, setSitemap] = useState<SitemapResponse | null>(null);
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    <div className="card">
      <div className="card__head">
        <div>
          <div className="card__title">Sitemap</div>
          <div className="card__sub">
            Feeds the internal-link picker during outline &amp; content.
          </div>
        </div>
        {sitemap ? (
          <Chip variant="ok" icon="check">
            {sitemap.urls.length} URLs from {sitemap.source_type}
          </Chip>
        ) : null}
      </div>

      <div className="dropzone">
        <div className="dropzone__icon">
          <Icon name="upload" size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="dropzone__t">Upload sitemap.xml</div>
          <div className="dropzone__p">Replaces the existing URL list.</div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xml,application/xml,text/xml"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          Choose file
        </Button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "20px 0 10px",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "var(--ink-8)" }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--ink-5)",
          }}
        >
          or paste URLs
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--ink-8)" }} />
      </div>

      <Field label="Paste URLs" hint="One per line">
        <textarea
          className="textarea"
          rows={4}
          value={pasted}
          onChange={(event) => setPasted(event.target.value)}
        />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <Button
          variant="secondary"
          size="sm"
          icon="refresh"
          disabled={busy || !pasted.trim()}
          onClick={() => void uploadPasted()}
        >
          Save pasted URLs
        </Button>
      </div>
      {error ? (
        <p style={{ fontSize: 12, color: "var(--status-danger)", marginTop: 8 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
