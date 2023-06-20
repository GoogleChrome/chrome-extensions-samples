import { IApiItem, TApiTypeResult, TExtensionApiMap } from './types';
import * as babel from '@babel/core';
import fs from 'fs/promises';
import { getAllFiles, loadExtensionApis, singularize } from './utils';

let EXTENSION_API_MAP: TExtensionApiMap = {};
(async () => {
  EXTENSION_API_MAP = await loadExtensionApis();
})();

export const getApiListForSample = async (
  folderPath: string
): Promise<IApiItem[]> => {
  // get all js files in the folder
  const jsFiles = (await getAllFiles(folderPath)).filter((file) =>
    file.endsWith('.js')
  );

  const apis: Record<string, Set<string>> = {};

  for (let file of jsFiles) {
    const apiCalls = await extractApiCalls(await fs.readFile(file));
    Object.keys(apiCalls).forEach((apiType) => {
      if (!apis[apiType]) {
        apis[apiType] = new Set();
      }
      apiCalls[apiType].forEach((api) => {
        apis[apiType].add(api);
      });
    });
  }

  const result: IApiItem[] = [];

  Object.keys(apis).forEach((apiType) => {
    apis[apiType].forEach((apiName) => {
      result.push({
        type: singularize(apiType) as TApiTypeResult,
        catagory: apiName.split('.')[0],
        name: apiName.split('.')[1]
      });
    });
  });

  return result;
};

export const extractApiCalls = (
  file: Buffer
): Promise<Record<string, string[]>> => {
  return new Promise((resolve) => {
    const calls: Record<string, string[]> = {};

    babel.parse(
      file.toString('utf8'),
      { ast: true, compact: false },
      (err, result) => {
        if (err || !result) {
          resolve(calls);
          return;
        }

        babel.traverse(result, {
          MemberExpression(path) {
            const object = path.node.object;

            if (
              object.type === 'Identifier' &&
              ['browser', 'chrome'].includes(object.name)
            ) {
              const property = path.node.property;

              if (property.type === 'Identifier') {
                const parentNode = path.parentPath.node;
                if (parentNode.type === 'MemberExpression') {
                  const _property = parentNode.property;
                  if (_property.type === 'Identifier') {
                    let apiType = 'unknown';
                    let apiFullName = '';
                    if (
                      EXTENSION_API_MAP['$special']?.includes(
                        `${property.name}_${_property.name}`
                      )
                    ) {
                      // special case such as devtools.network (apis with dot)
                      const apiCategory = `${property.name}_${_property.name}`;
                      const apiName = getNextLevelPropertyForSpecialCases(
                        path.parentPath as babel.NodePath<babel.types.MemberExpression>
                      );
                      apiFullName = `${apiCategory}.${apiName}`;
                      apiType = getApiType(apiCategory, apiName);
                    } else {
                      // normal case
                      apiFullName = `${property.name}.${_property.name}`;
                      apiType = getApiType(property.name, _property.name);
                    }

                    if (apiType !== 'unknown') {
                      if (!calls[apiType]) {
                        calls[apiType] = [];
                      }
                      if (!calls[apiType].includes(apiFullName)) {
                        calls[apiType].push(apiFullName);
                      }
                    }
                  }
                }
              }
            }
          }
        });

        resolve(calls);
      }
    );
  });
};

const getApiType = (apiCategory: string, apiName: string): TApiTypeResult => {
  if (EXTENSION_API_MAP[apiCategory]) {
    const apiTypes = EXTENSION_API_MAP[apiCategory];

    for (let type of Object.keys(apiTypes)) {
      if (apiTypes[type].includes(apiName)) {
        return type as TApiTypeResult;
      }
    }
  }
  console.log('api not found', apiCategory, apiName);
  return 'unknown';
};

const getNextLevelPropertyForSpecialCases = (
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
