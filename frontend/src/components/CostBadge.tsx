import { useEffect, useState } from "react";

import { GenerationsService, type GenerationUsage } from "@/api/generated";

const money = (value: number): string => `$${value.toFixed(4)}`;

export function CostBadge({
  generationId,
  refreshKey,
}: {
  generationId: string;
  refreshKey: number;
}) {
  const [usage, setUsage] = useState<GenerationUsage | null>(null);

  useEffect(() => {
    GenerationsService.generationsGenerationUsage({ generationId })
      .then(setUsage)
      .catch(() => setUsage(null));
  }, [generationId, refreshKey]);

  const stage = usage?.by_stage;

  return (
    <div className="cost">
      <span className="cost__label">Cost</span>
      <span className="cost__total">
        {money(Number(usage?.total_cost_usd ?? 0))}
      </span>
      <span className="cost__pill">
        <span className="cost__pill-label">Outline</span>
        <span className="cost__pill-val">{money(Number(stage?.outline ?? 0))}</span>
      </span>
      <span className="cost__pill">
        <span className="cost__pill-label">Content</span>
        <span className="cost__pill-val">{money(Number(stage?.content ?? 0))}</span>
      </span>
      <span className="cost__pill">
        <span className="cost__pill-label">QA</span>
        <span className="cost__pill-val">{money(Number(stage?.qa ?? 0))}</span>
      </span>
    </div>
  );
}
