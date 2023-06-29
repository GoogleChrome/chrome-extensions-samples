import { ApiItem, ApiTypeResult, ExtensionApiMap } from '../types';
import * as babel from '@babel/core';
import fs from 'fs/promises';
import { getAllFiles } from '../utils/filesystem';
import { singularize } from '../utils/string';
import { loadExtensionApis } from './api-loader';
import os from 'os';
import { ParallelController } from '../utils/parallel';

const CPU_CORES = os.cpus().length;

let EXTENSION_API_MAP: ExtensionApiMap = loadExtensionApis();

export const getApiType = (
  namespace: string,
  propertyName: string
): ApiTypeResult => {
  namespace = namespace.replace(/_/g, '.');

  if (EXTENSION_API_MAP[namespace]) {
    const apiTypes = EXTENSION_API_MAP[namespace];

    for (let type of Object.keys(apiTypes)) {
      if (apiTypes[type].includes(propertyName)) {
        return type as ApiTypeResult;
      }
    }
  }
  console.log('api not found', namespace, propertyName);
  return 'unknown';
};

const getNextLevelProperty = (
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

  const apis: Record<string, Set<string>> = {};

  const parallelController = new ParallelController(CPU_CORES);
  const parallelHandler = jsFiles.map(async (file) => {
    await parallelController.start();
    const apiCalls = await extractApiCalls(await fs.readFile(file));
    parallelController.finish();
    Object.keys(apiCalls).forEach((apiType) => {
      if (!apis[apiType]) {
        apis[apiType] = new Set();
      }
      apiCalls[apiType].forEach((api) => {
        apis[apiType].add(api);
      });
    });
  });

  await Promise.all(parallelHandler);

  const result: ApiItem[] = [];

  Object.keys(apis).forEach((apiType) => {
    apis[apiType].forEach((api) => {
      result.push({
        type: singularize(apiType) as ApiTypeResult,
        namespace: api.split('.')[0],
        name: api.split('.')[1]
      });
    });
  });

  return result;
};

export const extractApiCalls = (
  file: Buffer
): Promise<Record<string, string[]>> => {
  return new Promise((resolve, reject) => {
    const calls: Record<string, string[]> = {};

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

            // get api category
            // e.g. chrome.tabs.sendMessage -> tabs
            const property = path.node.property;

            if (
              property.type !== 'Identifier' ||
              path.parentPath.node.type !== 'MemberExpression'
            ) {
              return;
            }

            const parentNode = path.parentPath.node;
            // get api name
            // e.g. chrome.tabs.sendMessage -> sendMessage
            const _property = parentNode.property;

            if (_property.type !== 'Identifier') {
              return;
            }

            let apiType = 'unknown';
            let apiFullName = '';

            if (
              EXTENSION_API_MAP['$special']?.includes(
                `${property.name}_${_property.name}`
              )
            ) {
              // special case such as devtools.network (apis with dot)
              const namespace = `${property.name}_${_property.name}`;
              const propetyName = getNextLevelProperty(
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
            if (!calls[apiType].includes(apiFullName)) {
              calls[apiType].push(apiFullName);
            }
          }
        });

        resolve(calls);
      }
    );
  });
};
