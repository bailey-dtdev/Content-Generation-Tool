import { useEffect, useState } from "react";

import { type CumulativeUsage, type OrgUsage, UsageService } from "@/api/generated";

const money = (value: string | number): string => `$${Number(value).toFixed(2)}`;

function initials(text: string): string {
  return text
    .replace(/@.*/, "")
    .split(/[.\s]+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UsageDashboard() {
  const [mine, setMine] = useState<CumulativeUsage | null>(null);
  const [org, setOrg] = useState<OrgUsage | null>(null);

  useEffect(() => {
    UsageService.usageMyUsage()
      .then(setMine)
      .catch(() => setMine(null));
    UsageService.usageOrgUsage()
      .then(setOrg)
      .catch(() => setOrg(null));
  }, []);

  const clientMax = Math.max(
    1,
    ...(org?.by_client ?? []).map((c) => Number(c.total_cost_usd)),
  );
  const userMax = Math.max(
    1,
    ...(org?.by_user ?? []).map((u) => Number(u.total_cost_usd)),
  );

  return (
    <>
      <div className="main__head">
        <div className="page-head">
          <div>
            <div className="page-eyebrow">Workspace</div>
            <h1 className="page-title">Usage</h1>
            <p className="page-sub">Token spend across Content Studio.</p>
          </div>
        </div>
      </div>

      <div
        className="main__body"
        style={{ display: "flex", flexDirection: "column", gap: 22 }}
      >
        <div className="usage-grid">
          <div className="usage-card">
            <div className="usage-card__h">Your spend</div>
            <div className="usage-card__big">
              {mine ? money(mine.total_cost_usd) : "—"}
            </div>
            {mine ? (
              <div className="usage-card__big-sub">
                {mine.input_tokens.toLocaleString()} input ·{" "}
                {mine.output_tokens.toLocaleString()} output tokens
              </div>
            ) : null}
          </div>

          <div className="usage-card usage-card--dark">
            <div className="usage-card__h">Organisation</div>
            <div className="usage-card__big">
              {org ? money(org.total.total_cost_usd) : "—"}
            </div>
            {org ? (
              <div className="usage-card__big-sub">
                Across {org.by_user.length} user
                {org.by_user.length === 1 ? "" : "s"}
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card">
            <div className="card__head">
              <div>
                <div className="card__title">By client</div>
                <div className="card__sub">
                  {org?.by_client.length ?? 0} clients with activity
                </div>
              </div>
            </div>
            <div>
              {(org?.by_client ?? []).map((row, index) => (
                <div key={row.client_id}>
                  <div className="usage-bar-row">
                    <span className="usage-bar-row__rank">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="usage-bar-row__name">
                      <span className="swatch">{initials(row.client_name)}</span>
                      {row.client_name}
                    </span>
                    <span className="usage-bar-row__val">
                      {money(row.total_cost_usd)}
                    </span>
                  </div>
                  <div className="usage-bar-row__bar" style={{ marginBottom: 0 }}>
                    <div
                      style={{
                        width: `${(Number(row.total_cost_usd) / clientMax) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {org && org.by_client.length === 0 ? (
                <div style={{ padding: "16px 0", fontSize: 13, color: "var(--ink-5)" }}>
                  No client activity yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="card">
            <div className="card__head">
              <div>
                <div className="card__title">By user</div>
                <div className="card__sub">
                  {org?.by_user.length ?? 0} active members
                </div>
              </div>
            </div>
            <div>
              {(org?.by_user ?? []).map((row, index) => (
                <div key={row.user_id}>
                  <div className="usage-bar-row">
                    <span className="usage-bar-row__rank">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="usage-bar-row__name">
                      <span className="swatch" style={{ background: "var(--ink-2)" }}>
                        {initials(row.email)}
                      </span>
                      {row.email}
                    </span>
                    <span className="usage-bar-row__val">
                      {money(row.total_cost_usd)}
                    </span>
                  </div>
                  <div className="usage-bar-row__bar" style={{ marginBottom: 0 }}>
                    <div
                      style={{
                        width: `${(Number(row.total_cost_usd) / userMax) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {org && org.by_user.length === 0 ? (
                <div style={{ padding: "16px 0", fontSize: 13, color: "var(--ink-5)" }}>
                  No user activity yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
