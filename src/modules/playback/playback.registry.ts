import * as RequestBodies from './dtos/playback.request.body';
import * as Responses from './dtos/playback.response';
import { createModuleSchemasRegistry } from '../../shared/docs/dtoDocumenter';
import {
  loadYamlFile,
  loadYamlFilesFromDir,
} from '../../shared/docs/ymlLoadingHelper';

const root = __dirname;
const playbackYmlPaths = loadYamlFilesFromDir(root, './docs/paths');
const playbackYmlSchemas = loadYamlFile(
  root,
  './docs/components/playback.schemas.yml',
);
const playbackYmlParameters = loadYamlFile(
  root,
  './docs/components/playback.parameters.yml',
);
const playbackYmlResponses = loadYamlFile(
  root,
  './docs/components/playback.responses.yml',
);
const playbackSchemasRegistry = createModuleSchemasRegistry(
  RequestBodies,
  Responses,
);
const playbackDocsRegistry = {
  moduleName: 'playback',
  registry: playbackSchemasRegistry,
  paths: playbackYmlPaths,
  schemas: playbackYmlSchemas,
  parameters: playbackYmlParameters,
  responses: playbackYmlResponses,
};
export default playbackDocsRegistry;
