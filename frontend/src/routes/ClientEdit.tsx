import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ClientsService,
  type ClientCreate,
  type ClientResponse,
  type CumulativeUsage,
} from "@/api/generated";
import { CLIENT_FORM_ID, ClientForm } from "@/components/ClientForm";
import { SitemapUpload } from "@/components/SitemapUpload";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function ClientEdit() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientResponse | undefined>();
  const [usage, setUsage] = useState<CumulativeUsage | null>(null);
  const [loading, setLoading] = useState(Boolean(clientId));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    ClientsService.clientsGetClient({ clientId })
      .then(setClient)
      .finally(() => setLoading(false));
    ClientsService.clientsClientUsage({ clientId })
      .then(setUsage)
      .catch(() => setUsage(null));
  }, [clientId]);

  const save = async (payload: ClientCreate) => {
    setSubmitting(true);
    try {
      if (clientId) {
        setClient(
          await ClientsService.clientsUpdateClient({ clientId, requestBody: payload }),
        );
      } else {
        const created = await ClientsService.clientsCreateClient({
          requestBody: payload,
        });
        navigate(`/clients/${created.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="main__body">
        <div style={{ fontSize: 13, color: "var(--ink-5)" }}>Loading…</div>
      </div>
    );
  }

  const title = clientId ? (client?.name ?? "Client") : "New client";

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
          <span>Clients</span>
          <Icon name="chevron-right" size={12} />
          <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>{title}</span>
        </div>
        <div className="page-head">
          <div>
            <h1 className="page-title">{title}</h1>
            <p className="page-sub">
              {clientId
                ? "Update voice, audience and sitemap."
                : "Set up the client's voice, audience and sitemap so generations are on-brand."}
            </p>
          </div>
          <div className="page-actions">
            <Button variant="ghost" onClick={() => navigate("/clients")}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon="check"
              type="submit"
              form={CLIENT_FORM_ID}
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Save client"}
            </Button>
          </div>
        </div>
      </div>

      <div
        className="main__body"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <ClientForm client={client} onSubmit={save} />
          {clientId ? <SitemapUpload clientId={clientId} /> : null}
        </div>

        <aside
          style={{
            position: "sticky",
            top: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {clientId && usage ? (
            <div className="card" style={{ padding: 18 }}>
              <div className="page-eyebrow" style={{ marginBottom: 8 }}>
                Lifetime spend
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>
                ${Number(usage.total_cost_usd).toFixed(2)}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-5)", marginTop: 6 }}>
                {usage.input_tokens.toLocaleString()} input ·{" "}
                {usage.output_tokens.toLocaleString()} output tokens
              </div>
            </div>
          ) : null}
          <div className="card" style={{ padding: 18 }}>
            <div className="page-eyebrow" style={{ marginBottom: 8 }}>
              How this is used
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>
              Voice, audience and style rules anchor every generation for this
              client. The sitemap feeds internal-link suggestions during outline
              and content.
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
