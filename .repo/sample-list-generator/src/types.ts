import type { FolderTypes } from './constants';

export interface ApiItem {
  namespace: string;
  propertyName: string;
}

export interface ApiItemWithType extends ApiItem {
  type: ApiTypeResult;
}

export interface ManifestData {
  [key: string]: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface LocaleData {
  [key: string]: {
    message: string;
    description: string;
  };
}

export type SampleItem = {
  type: FolderTypes;
  name: string;
  repo_link: string;
  apis: ApiItem[];
  title: string;
  description: string;
  permissions: string[];
};

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

export type ExtensionApiMap = Record<string, Record<string, string[]>>
