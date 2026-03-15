import * as RequestBodies from './dtos/notifications.request.body';
import * as Responses from './dtos/notifications.response';
import { createModuleSchemasRegistry } from '../../shared/docs/dtoDocumenter';
import {
  loadYamlFile,
  loadYamlFilesFromDir,
} from '../../shared/docs/ymlLoadingHelper';

const root = __dirname;
const notificationsYmlPaths = loadYamlFilesFromDir(root, './docs/paths');
const notificationsYmlSchemas = loadYamlFile(
  root,
  './docs/components/notifications.schemas.yml',
);
const notificationsYmlParameters = loadYamlFile(
  root,
  './docs/components/notifications.parameters.yml',
);
const notificationsYmlResponses = loadYamlFile(
  root,
  './docs/components/notifications.responses.yml',
);
const notificationsSchemasRegistry = createModuleSchemasRegistry(
  RequestBodies,
  Responses,
);
const notificationsDocsRegistry = {
  moduleName: 'notifications',
  registry: notificationsSchemasRegistry,
  paths: notificationsYmlPaths,
  schemas: notificationsYmlSchemas,
  parameters: notificationsYmlParameters,
  responses: notificationsYmlResponses,
};
export default notificationsDocsRegistry;
