import * as RequestBodies from './dtos/tracks.request.body';
import * as Responses from './dtos/tracks.response';
import { createModuleSchemasRegistry } from '../../shared/docs/dtoDocumenter';
import {
  loadYamlFile,
  loadYamlFilesFromDir,
} from '../../shared/docs/ymlLoadingHelper';

const root = __dirname;
const tracksYmlPaths = loadYamlFilesFromDir(root, './docs/paths');
const tracksYmlSchemas = loadYamlFile(
  root,
  './docs/components/tracks.schemas.yml',
);
const tracksYmlParameters = loadYamlFile(
  root,
  './docs/components/tracks.parameters.yml',
);
const tracksYmlResponses = loadYamlFile(
  root,
  './docs/components/tracks.responses.yml',
);
const tracksSchemasRegistry = createModuleSchemasRegistry(
  RequestBodies,
  Responses,
);
const tracksDocsRegistry = {
  moduleName: 'tracks',
  registry: tracksSchemasRegistry,
  paths: tracksYmlPaths,
  schemas: tracksYmlSchemas,
  parameters: tracksYmlParameters,
  responses: tracksYmlResponses,
};
export default tracksDocsRegistry;
