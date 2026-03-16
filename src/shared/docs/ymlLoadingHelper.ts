import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';
import deepmerge from 'deepmerge';
import logger from '../logger/logger';
/**
 * @param callingDirectory - The directory where the function is called
 * @param relativeDirPath - The path of directory which contains the yml docs,
 * perfered to make the relativeDirPaths with value "./docs"
 * Loads YAML files from a directory, make sure
 */
export const loadYamlFilesFromDir = (
  callingDirectory: string,
  relativeDirPath: string,
): Object => {
  const absolutePath = path.resolve(callingDirectory, relativeDirPath);

  if (!fs.existsSync(absolutePath)) {
    console.warn(`Directory not found: ${absolutePath}, skipping...`);
    return {};
  }

  const files = fs
    .readdirSync(absolutePath)
    .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'));

  let merged: any = {};

  for (const file of files) {
    try {
      const fileContent = fs.readFileSync(
        path.join(absolutePath, file),
        'utf8',
      );
      const doc = YAML.parse(fileContent);

      if (doc) {
        merged = deepmerge(merged, doc);
      }
    } catch (error) {
      console.error(`YAML error in file: ${absolutePath}/${file} - ${error}`);
      throw error;
    }
  }

  return merged;
};

export const loadYamlFile = (
  callingDirectory: string,
  relativeDirPath: string,
): Object => {
  const absolutePath = path.resolve(callingDirectory, relativeDirPath);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`File not found: ${absolutePath}, skipping...`);
    return {};
  }
  const fileContent = fs.readFileSync(absolutePath, 'utf8');
  return YAML.parse(fileContent);
};

/**
 * Removes security requirements from auth endpoints
 */
export const removeSecurityFromAuthEndpoints = (
  paths: Record<string, any>,
): void => {
  for (const [route, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== 'object') continue;

    if (route === '/api/auth/v1/cross/mobile') {
      logger.info(`Checking route: ${route} for authentication tags...`);
      continue;
    }

    for (const [method, operationRaw] of Object.entries(methods)) {
      const operation = operationRaw as any;
      if (
        operation &&
        typeof operation === 'object' &&
        'tags' in operation &&
        Array.isArray(operation.tags) &&
        operation.tags.some((tag: string) => tag.includes('Authentication'))
      ) {
        operation.security = [];
      }
    }
  }
};
