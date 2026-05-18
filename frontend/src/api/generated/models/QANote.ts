/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QASpan } from './QASpan';
export type QANote = {
  severity: QANote.severity;
  category: string;
  message: string;
  section_id: string;
  span?: (QASpan | null);
};
export namespace QANote {
  export enum severity {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
  }
}

