/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClientCreate } from '../models/ClientCreate';
import type { ClientResponse } from '../models/ClientResponse';
import type { ClientUpdate } from '../models/ClientUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ClientsService {
  /**
   * List Clients
   * @returns ClientResponse Successful Response
   * @throws ApiError
   */
  public static clientsListClients(): CancelablePromise<Array<ClientResponse>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/clients',
    });
  }
  /**
   * Create Client
   * @returns ClientResponse Successful Response
   * @throws ApiError
   */
  public static clientsCreateClient({
    requestBody,
  }: {
    requestBody: ClientCreate,
  }): CancelablePromise<ClientResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/clients',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Get Client
   * @returns ClientResponse Successful Response
   * @throws ApiError
   */
  public static clientsGetClient({
    clientId,
  }: {
    clientId: string,
  }): CancelablePromise<ClientResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/clients/{client_id}',
      path: {
        'client_id': clientId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Update Client
   * @returns ClientResponse Successful Response
   * @throws ApiError
   */
  public static clientsUpdateClient({
    clientId,
    requestBody,
  }: {
    clientId: string,
    requestBody: ClientUpdate,
  }): CancelablePromise<ClientResponse> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/v1/clients/{client_id}',
      path: {
        'client_id': clientId,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Delete Client
   * @returns void
   * @throws ApiError
   */
  public static clientsDeleteClient({
    clientId,
  }: {
    clientId: string,
  }): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/v1/clients/{client_id}',
      path: {
        'client_id': clientId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
}
