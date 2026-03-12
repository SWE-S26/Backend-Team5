import * as RequestBodies from './dtos/profile.request.body';
import * as Responses from './dtos/profile.response';
import { createModuleSchemasRegistry } from '../../shared/docs/dtoDocumenter';
import {
  loadYamlFile,
  loadYamlFilesFromDir,
} from '../../shared/docs/ymlLoadingHelper';

const root = __dirname;
const profileYmlPaths = loadYamlFilesFromDir(root, './docs/paths');
const profileYmlSchemas = loadYamlFile(
  root,
  './docs/components/profile.schemas.yml',
);
const profileYmlParameters = loadYamlFile(
  root,
  './docs/components/profile.parameters.yml',
);
const profileYmlResponses = loadYamlFile(
  root,
  './docs/components/profile.responses.yml',
);
const profileSchemasRegistry = createModuleSchemasRegistry(
  RequestBodies,
  Responses,
);
const profileDocsRegistry = {
  moduleName: 'profile',
  registry: profileSchemasRegistry,
  paths: profileYmlPaths,
  schemas: profileYmlSchemas,
  parameters: profileYmlParameters,
  responses: profileYmlResponses,
};
export default profileDocsRegistry;
