import * as RequestBodies from './dtos/payment.request.body';
import * as Responses from './dtos/payment.response';
import { createModuleSchemasRegistry } from '../../shared/docs/dtoDocumenter';
import {
  loadYamlFile,
  loadYamlFilesFromDir,
} from '../../shared/docs/ymlLoadingHelper';

const root = __dirname;
const paymentYmlPaths = loadYamlFilesFromDir(root, './docs/paths');
const paymentYmlSchemas = loadYamlFile(
  root,
  './docs/components/payment.schemas.yml',
);
const paymentYmlParameters = loadYamlFile(
  root,
  './docs/components/payment.parameters.yml',
);
const paymentYmlResponses = loadYamlFile(
  root,
  './docs/components/payment.responses.yml',
);
const paymentSchemasRegistry = createModuleSchemasRegistry(
  RequestBodies,
  Responses,
);
const paymentDocsRegistry = {
  moduleName: 'payment',
  registry: paymentSchemasRegistry,
  paths: paymentYmlPaths,
  schemas: paymentYmlSchemas,
  parameters: paymentYmlParameters,
  responses: paymentYmlResponses,
};
export default paymentDocsRegistry;
