import {
  ApiItem,
  ApiItemWithType,
  ApiTypeResult,
  ExtensionApiMap
} from '../types';
import * as babel from '@babel/core';
import { isIdentifier } from '@babel/types';
import fs from 'fs/promises';
import { getAllJsFiles } from '../utils/filesystem';
import { loadExtensionApis } from './api-loader';

let EXTENSION_API_MAP: ExtensionApiMap = loadExtensionApis();

/**
 * Gets the type of an api call.
 * @param namespace - The namespace of the api call.
 * @param propertyName - The property name of the api call.
 * @returns The type of the api call.
 * @example
 * getApiType('tabs', 'query')
 * // returns 'method'
 */
export const getApiType = (
  namespace: string,
  propertyName: string
): ApiTypeResult => {
  namespace = namespace.replace(/_/g, '.');

  const apiTypes = EXTENSION_API_MAP[namespace];
  if (apiTypes) {
    if (apiTypes.methods.includes(propertyName)) {
      return 'method';
    }
    if (apiTypes.events.includes(propertyName)) {
      return 'event';
    }
    if (apiTypes.properties.includes(propertyName)) {
      return 'property';
    }
    if (apiTypes.types.includes(propertyName)) {
      return 'type';
    }
  }
  return 'unknown';
};

/**
 * Gets all the api calls in a sample.
 * @param sampleFolderPath - The path to the sample folder.
 * @returns A promise that resolves to an array of apis the sample uses.
 */
export const getApiListForSample = async (
  sampleFolderPath: string
): Promise<ApiItemWithType[]> => {
  // get all js files in the folder
  const jsFiles = await getAllJsFiles(sampleFolderPath);

  const calls: ApiItemWithType[] = [];

  await Promise.all(
    jsFiles.map(async (file) => {
      const callsFromFile = await extractApiCalls((await fs.readFile(file)).toString('utf-8'));
      calls.push(...callsFromFile);
    })
  );

  return uniqueItems(calls);
};

/**
 * Gets the complete API call for the member expression.
 * @param path - The path to the MemberExpression node.
 * @returns The full member expression.
 * @example
 * getFullMemberExpression(path.node)
 * // returns ['chrome', 'tabs', 'query']
 */
export function getFullMemberExpression(
  path: babel.NodePath<babel.types.MemberExpression>
): string[] {
  const result: string[] = [];

  // Include the chrome. or browser. identifier
  if (isIdentifier(path.node.object)) {
    result.push(path.node.object.name);
  } else {
    // We don't support expressions
    return result;
  }

  while (path) {
    if (isIdentifier(path.node.property)) {
      result.push(path.node.property.name);
    } else {
      // We don't support expressions
      break;
    }

    const parentPath = path.parentPath;

    if (!parentPath || !parentPath.isMemberExpression()) {
      break;
    } else {
      path = parentPath;
    }
  }

  return result;
}

/**
 * Gets the namespace and property name of an api call.
 * @param parts - The parts of the api call.
 * @returns The namespace and property name of the api call.
 * @example
 * getApiItem(['chrome', 'tabs', 'query'])
 * // returns { namespace: 'tabs', propertyName: 'query' }
 * getApiItem(['chrome', 'devtools', 'inspectedWindow', 'eval'])
 * // returns { namespace: 'devtools.inspectedWindow', propertyName: 'eval' }
 */
export function getApiItem(parts: string[]): ApiItem {
  let namespace = '';
  let propertyName = '';

  // For some apis like `chrome.devtools.inspectedWindow.eval`,
  // the namespace is actually `devtools.inspectedWindow`.
  // So we need to check if the first two parts combined is a valid namespace.
  if (EXTENSION_API_MAP[`${parts[0]}.${parts[1]}`]) {
    namespace = `${parts[0]}.${parts[1]}`;
    propertyName = parts[2];
  } else {
    namespace = parts[0];
    propertyName = parts[1];
  }

  return { namespace, propertyName };
}

/**
 * Filters an array of ApiItemWithType to remove duplicates.
 * @param array - The array of ApiItemWithType to filter.
 */
function uniqueItems(array: ApiItemWithType[]) {
  const tmp = new Set<string>();
  return array.filter((item) => {
    const fullApiString = `${item.namespace}.${item.propertyName}`;
    return !tmp.has(fullApiString) && tmp.add(fullApiString);
  });
}

/**
 * Extracts all chrome and browser api calls from a file.
 * @param script - The script string to extract api calls from.
 * @returns A promise that resolves to an array of ApiItemWithType.
 * @example
 * extractApiCalls('chrome.tabs.query({})')
 * // returns [{ type: 'method', namespace: 'tabs', propertyName: 'query' }]
 */
export const extractApiCalls = (script: string): Promise<ApiItemWithType[]> => {
  return new Promise((resolve, reject) => {
    const calls: ApiItemWithType[] = [];

    babel.parse(
      script,
      { ast: true, compact: false },
      (err, result) => {
        if (err || !result) {
          reject(err);
          return;
        }

        babel.traverse(result, {
          MemberExpression(path) {
            const parts = getFullMemberExpression(path);

            // not a chrome or browser api
            if (!['chrome', 'browser'].includes(parts.shift() || '')) {
              return;
            }

            const { namespace, propertyName } = getApiItem(parts);
            let type = getApiType(namespace, propertyName);

            // api not found
            if (type === 'unknown') {
              console.warn('api not found', namespace, propertyName);
              return;
            }
            calls.push({ type, namespace, propertyName });
          }
        });

        resolve(calls);
      }
    );
  });
};
