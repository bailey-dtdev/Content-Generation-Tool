/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClientUsage } from './ClientUsage';
import type { CumulativeUsage } from './CumulativeUsage';
import type { UserUsage } from './UserUsage';
export type OrgUsage = {
  total: CumulativeUsage;
  by_client: Array<ClientUsage>;
  by_user: Array<UserUsage>;
};

