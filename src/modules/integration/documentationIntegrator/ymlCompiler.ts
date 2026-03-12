import deepmerge from 'deepmerge';

import { removeSecurityFromAuthEndpoints } from '../../../shared/docs/ymlLoadingHelper';
import { OpenAPIObject } from '@asteasolutions/zod-to-openapi/dist/types';

import baseDoc from './ymlCompiler/ymlCompiler.configurations';
import allPaths from './ymlCompiler/ymlCompiler.paths';
import allResponses from './ymlCompiler/ymlCompiler.responses';
import allSchemas from './ymlCompiler/ymlCompiler.schemas';
import allParameters from './ymlCompiler/ymlCompiler.parameters';

removeSecurityFromAuthEndpoints(allPaths);

// Deep merge everything into final Swagger doc
const finalSwaggerDoc: OpenAPIObject = deepmerge.all([
  baseDoc,
  { paths: allPaths },
  {
    components: {
      responses: allResponses,
      schemas: allSchemas,
      parameters: allParameters,
    },
  },
]) as OpenAPIObject;

export default finalSwaggerDoc;
