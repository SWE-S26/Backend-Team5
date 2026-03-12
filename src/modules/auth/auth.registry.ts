import * as RequestBodies from './dtos/auth.request.body';
import * as Responses from './dtos/auth.response';
import { createModuleSchemasRegistry } from '../../shared/docs/dtoDocumenter';
import {
  loadYamlFile,
  loadYamlFilesFromDir,
} from '../../shared/docs/ymlLoadingHelper';

const root = __dirname;
const authYmlPaths = loadYamlFilesFromDir(root, './docs/paths');
const authYmlSchemas = loadYamlFile(root, './docs/components/auth.schemas.yml');
const authYmlParameters = loadYamlFile(
  root,
  './docs/components/auth.parameters.yml',
);
const authYmlResponses = loadYamlFile(
  root,
  './docs/components/auth.responses.yml',
);
const authSchemasRegistry = createModuleSchemasRegistry(
  RequestBodies,
  Responses,
);
const authDocsRegistry = {
  moduleName: 'auth',
  registry: authSchemasRegistry,
  paths: authYmlPaths,
  schemas: authYmlSchemas,
  parameters: authYmlParameters,
  responses: authYmlResponses,
};
export default authDocsRegistry;
