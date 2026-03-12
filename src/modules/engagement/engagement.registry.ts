import * as RequestBodies from './dtos/engagement.request.body';
import * as Responses from './dtos/engagement.response';
import { createModuleSchemasRegistry } from '../../shared/docs/dtoDocumenter';
import {
  loadYamlFile,
  loadYamlFilesFromDir,
} from '../../shared/docs/ymlLoadingHelper';

const root = __dirname;
const engagementYmlPaths = loadYamlFilesFromDir(root, './docs/paths');
const engagementYmlSchemas = loadYamlFile(
  root,
  './docs/components/engagement.schemas.yml',
);
const engagementYmlParameters = loadYamlFile(
  root,
  './docs/components/engagement.parameters.yml',
);
const engagementYmlResponses = loadYamlFile(
  root,
  './docs/components/engagement.responses.yml',
);
const engagementSchemasRegistry = createModuleSchemasRegistry(
  RequestBodies,
  Responses,
);
const engagementDocsRegistry = {
  moduleName: 'engagement',
  registry: engagementSchemasRegistry,
  paths: engagementYmlPaths,
  schemas: engagementYmlSchemas,
  parameters: engagementYmlParameters,
  responses: engagementYmlResponses,
};
export default engagementDocsRegistry;
