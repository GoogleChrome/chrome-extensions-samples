import { ApiItem, ApiTypeResult, ExtensionApiMap } from '../types';
import * as babel from '@babel/core';
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

/**
 * Given a path to a MemberExpression node, returns the name of the next level property.
 * e.g. For `chrome.devtools.network.sendHAR`, given the path to `chrome.devtools`, returns `sendHAR`.
 */
const getNextLevelPropertyName = (
  path: babel.NodePath<babel.types.MemberExpression>
) => {
  const parentNode = path.parentPath.node;
  if (parentNode.type === 'MemberExpression') {
    const property = parentNode.property;
    if (property.type === 'Identifier') {
      return property.name;
    }
  }
  return '';
};

export const getApiListForSample = async (
  sampleFolderPath: string
): Promise<ApiItem[]> => {
  // get all js files in the folder
  const jsFiles = (await getAllFiles(sampleFolderPath)).filter((file) =>
    file.endsWith('.js')
  );

  const apis: Partial<Record<ApiTypeResult, Set<string>>> = {};

  const parallelHandler = jsFiles.map(async (file) => {
    const apiCalls = await extractApiCalls(await fs.readFile(file));
    (Object.keys(apis) as ApiTypeResult[]).forEach((apiType) => {
      if (!apis[apiType]) {
        apis[apiType] = new Set<string>();
      }
      apiCalls[apiType]?.forEach((api: string) => {
        apis[apiType]?.add(api);
      });
    });
  });

  await Promise.all(parallelHandler);

  const result: ApiItem[] = [];

  (Object.keys(apis) as ApiTypeResult[]).forEach((apiType) => {
    apis[apiType]?.forEach((api: string) => {
      result.push({
        type: apiType,
        namespace: api.split('.')[0],
        name: api.split('.')[1]
      });
    });
  });

  return result;
};

export const extractApiCalls = (
  file: Buffer
): Promise<Partial<Record<ApiTypeResult, string[]>>> => {
  return new Promise((resolve, reject) => {
    const calls: Partial<Record<ApiTypeResult, string[]>> = {};

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

            // get api namespace
            // e.g. chrome.tabs.sendMessage -> tabs
            // NOTE: for special cases such as `chrome.devtools.network.getHAR`, the namespace is `devtools.network`, but now it's `devtools`
            const property = path.node.property;

            if (
              property.type !== 'Identifier' ||
              path.parentPath.node.type !== 'MemberExpression'
            ) {
              return;
            }

            const parentNode = path.parentPath.node;
            // get api propertyName
            // e.g. chrome.tabs.sendMessage -> sendMessage
            // NOTE: for special cases such as `chrome.devtools.network.getHAR`, the propertyName is `network`, but now it's `network`
            const _property = parentNode.property;

            if (_property.type !== 'Identifier') {
              return;
            }

            let apiType: ApiTypeResult = 'unknown';
            let apiFullName: string = '';

            if (
              EXTENSION_API_MAP['$special']?.includes(
                `${property.name}_${_property.name}`
              )
            ) {
              // special case such as chrome.devtools.network (apis with dot)
              const namespace = `${property.name}_${_property.name}`;
              const propetyName = getNextLevelPropertyName(
                path.parentPath as babel.NodePath<babel.types.MemberExpression>
              );
              apiFullName = `${namespace}.${propetyName}`;
              apiType = getApiType(namespace, propetyName);
            } else {
              // normal case
              apiFullName = `${property.name}.${_property.name}`;
              apiType = getApiType(property.name, _property.name);
            }

            // api not found
            if (apiType === 'unknown') {
              return;
            }

            if (!calls[apiType]) {
              calls[apiType] = [];
            }

            if (!calls[apiType]?.includes(apiFullName)) {
              calls[apiType]?.push(apiFullName);
            }
          }
        });

        resolve(calls);
      }
    );
  });
};
