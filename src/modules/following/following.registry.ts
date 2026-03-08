import * as RequestBodies from './dtos/following.request.body';
import * as Responses from './dtos/following.response';
import { createModuleSchemasRegistry } from '../../shared/docs/dtoDocumenter';
import {
  loadYamlFile,
  loadYamlFilesFromDir,
} from '../../shared/docs/ymlLoadingHelper';

const root = __dirname;
const followingYmlPaths = loadYamlFilesFromDir(root, './docs/paths');
const followingYmlSchemas = loadYamlFile(
  root,
  './docs/components/following.schemas.yml',
);
const followingYmlParameters = loadYamlFile(
  root,
  './docs/components/following.parameters.yml',
);
const followingYmlResponses = loadYamlFile(
  root,
  './docs/components/following.responses.yml',
);
const followingSchemasRegistry = createModuleSchemasRegistry(
  RequestBodies,
  Responses,
);
const followingDocsRegistry = {
  moduleName: 'following',
  registry: followingSchemasRegistry,
  paths: followingYmlPaths,
  schemas: followingYmlSchemas,
  parameters: followingYmlParameters,
  responses: followingYmlResponses,
};
export default followingDocsRegistry;
