import * as RequestBodies from './dtos/messaging.request.body';
import * as Responses from './dtos/messaging.response';
import { createModuleSchemasRegistry } from '../../shared/docs/dtoDocumenter';
import {
  loadYamlFile,
  loadYamlFilesFromDir,
} from '../../shared/docs/ymlLoadingHelper';

const root = __dirname;
const messagingYmlPaths = loadYamlFilesFromDir(root, './docs/paths');
const messagingYmlSchemas = loadYamlFile(
  root,
  './docs/components/messaging.schemas.yml',
);
const messagingYmlParameters = loadYamlFile(
  root,
  './docs/components/messaging.parameters.yml',
);
const messagingYmlResponses = loadYamlFile(
  root,
  './docs/components/messaging.responses.yml',
);
const messagingSchemasRegistry = createModuleSchemasRegistry(
  RequestBodies,
  Responses,
);
const messagingDocsRegistry = {
  moduleName: 'messaging',
  registry: messagingSchemasRegistry,
  paths: messagingYmlPaths,
  schemas: messagingYmlSchemas,
  parameters: messagingYmlParameters,
  responses: messagingYmlResponses,
};
export default messagingDocsRegistry;
