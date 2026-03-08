// user.registry.ts
import * as RequestBodies from './dtos/user.requet.body';
import * as Responses from './dtos/user.response';
import { createModuleSchemasRegistry } from '../../shared/docs/dtoDocumenter';
import {
  loadYamlFile,
  loadYamlFilesFromDir,
} from '../../shared/docs/ymlLoadingHelper';

const root = __dirname;

const userYmlPaths = loadYamlFilesFromDir(root, './docs/paths');
const userYmlSchemas = loadYamlFile(root, './docs/components/user.schemas.yml');
const userYmlParameters = loadYamlFile(
  root,
  './docs/components/user.parameters.yml',
);
const userYmlResponses = loadYamlFile(
  root,
  './docs/components/user.responses.yml',
);

const userSchemasRegistry = createModuleSchemasRegistry(
  RequestBodies,
  Responses,
);

const userDocsRegistry = {
  moduleName: 'user',
  registry: userSchemasRegistry,
  paths: userYmlPaths,
  schemas: userYmlSchemas,
  parameters: userYmlParameters,
  responses: userYmlResponses,
};

export default userDocsRegistry;
