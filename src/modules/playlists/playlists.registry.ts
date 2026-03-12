import * as RequestBodies from './dtos/playlists.request.body';
import * as Responses from './dtos/playlists.response';
import { createModuleSchemasRegistry } from '../../shared/docs/dtoDocumenter';
import {
  loadYamlFile,
  loadYamlFilesFromDir,
} from '../../shared/docs/ymlLoadingHelper';

const root = __dirname;
const playlistsYmlPaths = loadYamlFilesFromDir(root, './docs/paths');
const playlistsYmlSchemas = loadYamlFile(
  root,
  './docs/components/playlists.schemas.yml',
);
const playlistsYmlParameters = loadYamlFile(
  root,
  './docs/components/playlists.parameters.yml',
);
const playlistsYmlResponses = loadYamlFile(
  root,
  './docs/components/playlists.responses.yml',
);
const playlistsSchemasRegistry = createModuleSchemasRegistry(
  RequestBodies,
  Responses,
);
const playlistsDocsRegistry = {
  moduleName: 'playlists',
  registry: playlistsSchemasRegistry,
  paths: playlistsYmlPaths,
  schemas: playlistsYmlSchemas,
  parameters: playlistsYmlParameters,
  responses: playlistsYmlResponses,
};
export default playlistsDocsRegistry;
