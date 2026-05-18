import { useEffect, useState } from "react";

import { GenerationsService, type GenerationUsage } from "@/api/generated";

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

  if (!usage || Number(usage.total_cost_usd) === 0) return null;

  const stage = usage.by_stage;
  return (
    <div className="rounded-md border bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <span className="font-semibold">
        Generation cost ${Number(usage.total_cost_usd).toFixed(4)}
      </span>
      <span className="ml-2">
        (outline ${Number(stage.outline).toFixed(4)}, content $
        {Number(stage.content).toFixed(4)}, QA ${Number(stage.qa).toFixed(4)})
      </span>
    </div>
  );
}
