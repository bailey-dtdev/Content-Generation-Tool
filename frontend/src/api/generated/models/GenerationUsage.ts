/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StageBreakdown } from './StageBreakdown';
export type GenerationUsage = {
  generation_id: string;
  total_cost_usd: string;
  input_tokens: number;
  output_tokens: number;
  by_stage: StageBreakdown;
};

