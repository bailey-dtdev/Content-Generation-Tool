/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentStreamRequest } from '../models/ContentStreamRequest';
import type { ExportRequest } from '../models/ExportRequest';
import type { ExportResponse } from '../models/ExportResponse';
import type { GenerationInput } from '../models/GenerationInput';
import type { GenerationResponse } from '../models/GenerationResponse';
import type { OutlineSection } from '../models/OutlineSection';
import type { OutlineUpdate } from '../models/OutlineUpdate';
import type { QARequest } from '../models/QARequest';
import type { QAResponse } from '../models/QAResponse';
import type { RetrySectionRequest } from '../models/RetrySectionRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GenerationsService {
  /**
   * Create Generation
   * @returns GenerationResponse Successful Response
   * @throws ApiError
   */
  public static generationsCreateGeneration({
    requestBody,
  }: {
    requestBody: GenerationInput,
  }): CancelablePromise<GenerationResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/generations',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Get Active Generation
   * @returns any Successful Response
   * @throws ApiError
   */
  public static generationsGetActiveGeneration(): CancelablePromise<(GenerationResponse | null)> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/generations/active',
    });
  }
  /**
   * Generate Outline
   * @returns OutlineSection Successful Response
   * @throws ApiError
   */
  public static generationsGenerateOutline({
    generationId,
  }: {
    generationId: string,
  }): CancelablePromise<Array<OutlineSection>> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/generations/{generation_id}/outline',
      path: {
        'generation_id': generationId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Save Outline
   * @returns OutlineSection Successful Response
   * @throws ApiError
   */
  public static generationsSaveOutline({
    generationId,
    requestBody,
  }: {
    generationId: string,
    requestBody: OutlineUpdate,
  }): CancelablePromise<Array<OutlineSection>> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/v1/generations/{generation_id}/outline',
      path: {
        'generation_id': generationId,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Regenerate Outline
   * @returns OutlineSection Successful Response
   * @throws ApiError
   */
  public static generationsRegenerateOutline({
    generationId,
  }: {
    generationId: string,
  }): CancelablePromise<Array<OutlineSection>> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/generations/{generation_id}/outline/regenerate',
      path: {
        'generation_id': generationId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Approve Outline
   * @returns GenerationResponse Successful Response
   * @throws ApiError
   */
  public static generationsApproveOutline({
    generationId,
  }: {
    generationId: string,
  }): CancelablePromise<GenerationResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/generations/{generation_id}/approve-outline',
      path: {
        'generation_id': generationId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Abort Generation
   * @returns GenerationResponse Successful Response
   * @throws ApiError
   */
  public static generationsAbortGeneration({
    generationId,
  }: {
    generationId: string,
  }): CancelablePromise<GenerationResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/generations/{generation_id}/abort',
      path: {
        'generation_id': generationId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Stream Content
   * @returns any Successful Response
   * @throws ApiError
   */
  public static generationsStreamContent({
    generationId,
    requestBody,
  }: {
    generationId: string,
    requestBody: ContentStreamRequest,
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/generations/{generation_id}/content/stream',
      path: {
        'generation_id': generationId,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Retry Section
   * @returns any Successful Response
   * @throws ApiError
   */
  public static generationsRetrySection({
    generationId,
    requestBody,
  }: {
    generationId: string,
    requestBody: RetrySectionRequest,
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/generations/{generation_id}/content/retry-section',
      path: {
        'generation_id': generationId,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Run Qa
   * @returns QAResponse Successful Response
   * @throws ApiError
   */
  public static generationsRunQa({
    generationId,
    requestBody,
  }: {
    generationId: string,
    requestBody: QARequest,
  }): CancelablePromise<QAResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/generations/{generation_id}/qa',
      path: {
        'generation_id': generationId,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Export Generation
   * @returns ExportResponse Successful Response
   * @throws ApiError
   */
  public static generationsExportGeneration({
    generationId,
    requestBody,
  }: {
    generationId: string,
    requestBody: ExportRequest,
  }): CancelablePromise<ExportResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/generations/{generation_id}/export',
      path: {
        'generation_id': generationId,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
}
