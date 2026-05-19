import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ClientsService, UsageService, type ClientResponse } from "@/api/generated";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ClientList() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [spend, setSpend] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    ClientsService.clientsListClients()
      .then((list) => {
        setClients(list);
        return UsageService.usageOrgUsage();
      })
      .then((org) => {
        const map: Record<string, string> = {};
        for (const row of org.by_client) map[row.client_id] = row.total_cost_usd;
        setSpend(map);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    if (!window.confirm("Delete this client?")) return;
    await ClientsService.clientsDeleteClient({ clientId: id });
    load();
  };

  const filtered = useMemo(
    () =>
      clients.filter((c) =>
        c.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [clients, query],
  );

  const head = (
    <div className="client-list__head">
      <div>Client</div>
      <div>Industry</div>
      <div style={{ textAlign: "right" }}>Total spend</div>
      <div />
    </div>
  );

  return (
    <>
      <div className="main__head">
        <div className="page-head">
          <div>
            <div className="page-eyebrow">Workspace</div>
            <h1 className="page-title">Clients</h1>
            <p className="page-sub">
              {loading
                ? "Loading…"
                : clients.length
                  ? `${clients.length} client${clients.length === 1 ? "" : "s"}`
                  : "Add your first client to start generating content."}
            </p>
          </div>
          <div className="page-actions">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--ink-10)",
                border: "1px solid var(--ink-7)",
                borderRadius: 999,
                padding: "7px 12px",
                width: 280,
              }}
            >
              <Icon name="search" size={14} />
              <input
                className="input"
                style={{ border: 0, background: "transparent", padding: 0, fontSize: 13 }}
                placeholder="Search clients…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search clients"
              />
            </div>
            <Button
              variant="primary"
              icon="plus"
              onClick={() => navigate("/clients/new")}
            >
              New client
            </Button>
          </div>
        </div>
      </div>

      <div className="main__body">
        {loading ? (
          <div className="client-list">
            {head}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="loading-row" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="empty">
            <div className="empty__icon">
              <Icon name="users" size={26} stroke={1.5} />
            </div>
            <div className="empty__h">No clients yet</div>
            <div className="empty__p">
              Clients hold the voice, audience and sitemap that Content Studio
              uses to write SEO content. Add your first to get started.
            </div>
            <Button
              variant="primary"
              icon="plus"
              onClick={() => navigate("/clients/new")}
            >
              New client
            </Button>
          </div>
        ) : (
          <div className="client-list">
            {head}
            {filtered.map((client) => (
              <div
                key={client.id}
                className="client-row"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <div className="client-row__name">
                  <div className="client-row__avatar">{initials(client.name)}</div>
                  <div>{client.name}</div>
                </div>
                <div className="client-row__industry">{client.industry ?? "—"}</div>
                <div className="client-row__spend">
                  ${Number(spend[client.id] ?? 0).toFixed(2)}
                </div>
                <div className="client-row__actions">
                  <button
                    type="button"
                    className="icon-btn"
                    title="Edit"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/clients/${client.id}`);
                    }}
                  >
                    <Icon name="edit" size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    title="Delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      void remove(client.id);
                    }}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  fontSize: 13,
                  color: "var(--ink-5)",
                }}
              >
                No clients match “{query}”.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
