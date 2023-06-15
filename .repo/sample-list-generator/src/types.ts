export interface IApiItem {
  type: TApiTypeResult;
  catagory: string;
  name: string;
}

export interface ISampleItem {
  type: number;
  name: string;
  title: string;
  description: string;
  repo_link: string;
  apis: IApiItem[];
  permissions: string[];
}

export interface IAvailableFolderItem {
  path: string;
  type: number;
}

export type TApiTypeResult =
  | 'event'
  | 'method'
  | 'property'
  | 'type'
  | 'unknown';

export type TExtensionApiMap = Record<string, Record<string, string[]>> & {
  $special?: string[];
};
