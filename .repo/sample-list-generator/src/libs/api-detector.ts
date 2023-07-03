import {
  ApiItem,
  ApiItemWithType,
  ApiTypeResult,
  ExtensionApiMap
} from '../types';
import * as babel from '@babel/core';
import { isMemberExpression } from '@babel/types';
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
  console.log('api not found', namespace, propertyName);
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

  const parallelHandler = jsFiles.map(async (file) => {
    const _calls = await extractApiCalls(await fs.readFile(file));
    calls.push(..._calls);
  });
  await Promise.all(parallelHandler);

  return uniqueItems(calls);
};

export function getFullMemberExpression(
  path: babel.NodePath<babel.types.MemberExpression>
): string[] {
  const result: string[] = [];
  const property = path.node.property;

  if (property.type === 'Identifier') {
    result.push(property.name);
  }

  const parentNode = path.parentPath.node;

  if (isMemberExpression(parentNode)) {
    result.push(
      ...getFullMemberExpression(
        path.parentPath as babel.NodePath<babel.types.MemberExpression>
      )
    );
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
  const tmp = new Map();
  return array.filter((item) => {
    const fullApiString = `${item.namespace}.${item.propertyName}`;
    return !tmp.has(fullApiString) && tmp.set(fullApiString, 1);
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
            const object = path.node.object;

            // check if expression isn't browser.xxx or chrome.xxx
            if (
              object.type !== 'Identifier' ||
              !['browser', 'chrome'].includes(object.name)
            ) {
              return;
            }

            const parts = getFullMemberExpression(path);

            const { namespace, propertyName } = getApiItem(parts);
            let apiType = getApiType(namespace, propertyName);

            // api not found
            if (apiType === 'unknown') {
              return;
            }
            calls.push({ type: apiType, namespace, propertyName });
          }
        });

        resolve(uniqueItems(calls));
      }
    );
  });
};
