import * as RequestBodies from './dtos/admin.request.body';
import * as Responses from './dtos/admin.response';
import { createModuleSchemasRegistry } from '../../shared/docs/dtoDocumenter';
import {
  loadYamlFile,
  loadYamlFilesFromDir,
} from '../../shared/docs/ymlLoadingHelper';

const root = __dirname;
const adminYmlPaths = loadYamlFilesFromDir(root, './docs/paths');
const adminYmlSchemas = loadYamlFile(
  root,
  './docs/components/admin.schemas.yml',
);
const adminYmlParameters = loadYamlFile(
  root,
  './docs/components/admin.parameters.yml',
);
const adminYmlResponses = loadYamlFile(
  root,
  './docs/components/admin.responses.yml',
);
const adminSchemasRegistry = createModuleSchemasRegistry(
  RequestBodies,
  Responses,
);
const adminDocsRegistry = {
  moduleName: 'admin',
  registry: adminSchemasRegistry,
  paths: adminYmlPaths,
  schemas: adminYmlSchemas,
  parameters: adminYmlParameters,
  responses: adminYmlResponses,
};
export default adminDocsRegistry;
