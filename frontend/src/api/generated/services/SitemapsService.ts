/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_sitemaps_upload_sitemap } from '../models/Body_sitemaps_upload_sitemap';
import type { SitemapResponse } from '../models/SitemapResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SitemapsService {
  /**
   * Upload Sitemap
   * @returns SitemapResponse Successful Response
   * @throws ApiError
   */
  public static sitemapsUploadSitemap({
    clientId,
    formData,
  }: {
    clientId: string,
    formData?: Body_sitemaps_upload_sitemap,
  }): CancelablePromise<SitemapResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/clients/{client_id}/sitemap',
      path: {
        'client_id': clientId,
      },
      formData: formData,
      mediaType: 'multipart/form-data',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Get Sitemap
   * @returns SitemapResponse Successful Response
   * @throws ApiError
   */
  public static sitemapsGetSitemap({
    clientId,
  }: {
    clientId: string,
  }): CancelablePromise<SitemapResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/clients/{client_id}/sitemap',
      path: {
        'client_id': clientId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
}
