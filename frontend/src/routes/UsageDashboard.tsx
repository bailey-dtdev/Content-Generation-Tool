import { useEffect, useState } from "react";

import {
  type CumulativeUsage,
  type OrgUsage,
  UsageService,
} from "@/api/generated";

const money = (value: string): string => `$${Number(value).toFixed(4)}`;

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

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Usage</h1>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold">Your spend</h2>
        <p className="mt-1 text-2xl font-semibold">
          {mine ? money(mine.total_cost_usd) : "—"}
        </p>
        {mine ? (
          <p className="text-xs text-slate-500">
            {mine.input_tokens.toLocaleString()} input /{" "}
            {mine.output_tokens.toLocaleString()} output tokens
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold">Organisation spend</h2>
        <p className="mt-1 text-2xl font-semibold">
          {org ? money(org.total.total_cost_usd) : "—"}
        </p>

        {org && org.by_client.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase text-slate-500">
              By client
            </h3>
            <ul className="mt-1 divide-y text-sm">
              {org.by_client.map((row) => (
                <li key={row.client_id} className="flex justify-between py-1">
                  <span>{row.client_name}</span>
                  <span>{money(row.total_cost_usd)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {org && org.by_user.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase text-slate-500">
              By user
            </h3>
            <ul className="mt-1 divide-y text-sm">
              {org.by_user.map((row) => (
                <li key={row.user_id} className="flex justify-between py-1">
                  <span>{row.email}</span>
                  <span>{money(row.total_cost_usd)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
