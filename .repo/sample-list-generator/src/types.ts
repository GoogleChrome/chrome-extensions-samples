import type { FolderTypes } from './constants';

export interface ApiItem {
  type: ApiTypeResult;
  namespace: string;
  name: string;
}

export interface ManifestMetadata {
  title: string;
  description: string;
  permissions: string[];
}

export type SampleItem = {
  type: 'API_SAMPLE' | 'FUNCTIONAL_SAMPLE';
  name: string;
  repo_link: string;
  apis: ApiItem[];
} & ManifestMetadata;

export interface AvailableFolderItem {
  path: string;
  type: FolderTypes;
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
