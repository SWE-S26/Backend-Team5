import * as RequestBodies from './dtos/feed.request.body';
import * as Responses from './dtos/feed.response';
import { createModuleSchemasRegistry } from '../../shared/docs/dtoDocumenter';
import {
  loadYamlFile,
  loadYamlFilesFromDir,
} from '../../shared/docs/ymlLoadingHelper';

const root = __dirname;
const feedYmlPaths = loadYamlFilesFromDir(root, './docs/paths');
const feedYmlSchemas = loadYamlFile(root, './docs/components/feed.schemas.yml');
const feedYmlParameters = loadYamlFile(
  root,
  './docs/components/feed.parameters.yml',
);
const feedYmlResponses = loadYamlFile(
  root,
  './docs/components/feed.responses.yml',
);
const feedSchemasRegistry = createModuleSchemasRegistry(
  RequestBodies,
  Responses,
);
const feedDocsRegistry = {
  moduleName: 'feed',
  registry: feedSchemasRegistry,
  paths: feedYmlPaths,
  schemas: feedYmlSchemas,
  parameters: feedYmlParameters,
  responses: feedYmlResponses,
};
export default feedDocsRegistry;
