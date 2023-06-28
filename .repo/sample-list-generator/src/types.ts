import type { AvailableFolderTypes } from "./constants";

export interface ApiItem {
  type: ApiTypeResult;
  catagory: string;
  name: string;
}

export interface SampleItem {
  type: 'API_SAMPLE' | 'FUNCTIONAL_SAMPLE';
  name: string;
  title: string;
  description: string;
  repo_link: string;
  apis: ApiItem[];
  permissions: string[];
}

export interface AvailableFolderItem {
  path: string;
  type: AvailableFolderTypes;
}

export type ApiTypeResult =
  | 'event'
  | 'method'
  | 'property'
  | 'type'
  | 'unknown';

export type ExtensionApiMap = Record<string, Record<string, string[]>> & {
  $special?: string[];
};
