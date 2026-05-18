/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CumulativeUsage } from '../models/CumulativeUsage';
import type { OrgUsage } from '../models/OrgUsage';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsageService {
  /**
   * My Usage
   * @returns CumulativeUsage Successful Response
   * @throws ApiError
   */
  public static usageMyUsage(): CancelablePromise<CumulativeUsage> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/usage/me',
    });
  }
  /**
   * Org Usage
   * @returns OrgUsage Successful Response
   * @throws ApiError
   */
  public static usageOrgUsage(): CancelablePromise<OrgUsage> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/usage/org',
    });
  }
}
