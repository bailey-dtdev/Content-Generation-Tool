/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GenerationInput = {
  client_id: string;
  content_type: GenerationInput.content_type;
  primary_keyword: string;
  secondary_keywords?: Array<string>;
  search_intent: GenerationInput.search_intent;
  competitor_urls?: Array<string>;
  target_url?: (string | null);
  target_word_count: number;
  additional_context?: string;
};
export namespace GenerationInput {
  export enum content_type {
    SERVICE_PAGE = 'service_page',
    PLP = 'plp',
    PDP = 'pdp',
    BLOG = 'blog',
  }
  export enum search_intent {
    INFORMATIONAL = 'informational',
    COMMERCIAL = 'commercial',
    TRANSACTIONAL = 'transactional',
    NAVIGATIONAL = 'navigational',
  }
}

