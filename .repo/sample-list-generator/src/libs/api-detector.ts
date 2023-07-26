import {
  ApiItem,
  ApiItemWithType,
  ApiTypeResult,
  ExtensionApiMap
} from '../types';
import * as babel from '@babel/core';
import { isIdentifier } from '@babel/types';
import fs from 'fs/promises';
import { getAllFiles } from '../utils/filesystem';
import { loadExtensionApis } from './api-loader';

let EXTENSION_API_MAP: ExtensionApiMap = loadExtensionApis();

export const getApiType = (
  namespace: string,
  propertyName: string
): ApiTypeResult => {
  namespace = namespace.replace(/_/g, '.');

  if (EXTENSION_API_MAP[namespace]) {
    const apiTypes = EXTENSION_API_MAP[namespace];

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

export const getApiListForSample = async (
  sampleFolderPath: string
): Promise<ApiItemWithType[]> => {
  // get all js files in the folder
  const jsFiles = (await getAllFiles(sampleFolderPath)).filter((file) =>
    file.endsWith('.js')
  );

  const calls: ApiItemWithType[] = [];

  await Promise.all(
    jsFiles.map(async (file) => {
      const callsFromFile = await extractApiCalls(await fs.readFile(file));
      calls.push(...callsFromFile);
    })
  );

  return uniqueItems(calls);
};

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

export function getApiItem(parts: string[]): ApiItem {
  // special case for `chrome.storage`
  if (parts[0] === 'storage') {
    return {
      namespace: 'storage',
      propertyName: parts.includes('onChanged') ? 'onChanged' : parts[1]
    };
  }

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

function uniqueItems(array: ApiItemWithType[]) {
  const tmp = new Set<string>();
  return array.filter((item) => {
    const fullApiString = `${item.namespace}.${item.propertyName}`;
    return !tmp.has(fullApiString) && tmp.add(fullApiString);
  });
}

export const extractApiCalls = (file: Buffer): Promise<ApiItemWithType[]> => {
  return new Promise((resolve, reject) => {
    const calls: ApiItemWithType[] = [];

    babel.parse(
      file.toString('utf8'),
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
