/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserResponse } from '../models/UserResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
  /**
   * Login
   * @returns any Successful Response
   * @throws ApiError
   */
  public static authLogin(): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/auth/login',
    });
  }
  /**
   * Callback
   * @returns any Successful Response
   * @throws ApiError
   */
  public static authCallback({
    code,
    state,
  }: {
    code: string,
    state: string,
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/auth/callback',
      query: {
        'code': code,
        'state': state,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Me
   * @returns UserResponse Successful Response
   * @throws ApiError
   */
  public static authMe(): CancelablePromise<UserResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/auth/me',
    });
  }
  /**
   * Logout
   * @returns string Successful Response
   * @throws ApiError
   */
  public static authLogout(): CancelablePromise<Record<string, string>> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/auth/logout',
    });
  }
}
